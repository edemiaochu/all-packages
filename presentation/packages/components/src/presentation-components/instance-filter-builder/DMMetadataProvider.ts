/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Internal
 */

import { compareStrings, Guid, GuidString, Id64, Id64String, LRUDictionary } from "@szewtwin/core-szewec";
import { DMSqlReader, QueryBinder, QueryOptions, QueryRowFormat } from "@szewtwin/core-common";
import { IVaultConnection } from "@szewtwin/core-frontend";

/* v8 ignore start -- @preserve */

/** @internal */
export class DMClassInfo {
  constructor(
    public readonly id: Id64String,
    public readonly name: string,
    public readonly label: string,
    private _baseClasses: Set<Id64String>,
    private _derivedClasses: Set<Id64String>,
  ) {}

  public get baseClassIds(): Array<Id64String> {
    return Array.from(this._baseClasses);
  }
  public get derivedClassIds(): Array<Id64String> {
    return Array.from(this._derivedClasses);
  }

  public isBaseOf(idOrInfo: Id64String | DMClassInfo): boolean {
    if (typeof idOrInfo === "string") {
      return idOrInfo === this.id || this._derivedClasses.has(idOrInfo);
    }
    return idOrInfo.id === this.id || this._derivedClasses.has(idOrInfo.id);
  }

  public isDerivedFrom(idOrInfo: Id64String | DMClassInfo): boolean {
    if (typeof idOrInfo === "string") {
      return idOrInfo === this.id || this._baseClasses.has(idOrInfo);
    }
    return idOrInfo.id === this.id || this._baseClasses.has(idOrInfo.id);
  }
}

/** @internal */
export class DMMetadataProvider {
  private _classInfoCache = new LRUDictionary<CacheKey, DMClassInfo>(50, compareKeys);
  #componentId: GuidString;
  #componentName: string;
  constructor(
    private _queryReaderFactory: (dmsql: string, params?: QueryBinder, config?: QueryOptions) => DMSqlReader,
  ) {
    this.#componentId = Guid.createValue();
    this.#componentName = "DMMetadataProvider";
  }

  public async getDMClassInfo(idOrFullName: Id64String | string): Promise<DMClassInfo | undefined>;
  public async getDMClassInfo(schemaName: string, className: string): Promise<DMClassInfo | undefined>;
  public async getDMClassInfo(
    idNameOrSchema: Id64String | string,
    className?: string,
  ): Promise<DMClassInfo | undefined> {
    // load class info using class id
    if (Id64.isId64(idNameOrSchema)) {
      return this.getClassInfoById(idNameOrSchema);
    }

    // load class info using class full name: <schemaName>:<className>
    const fullName = className ? `${idNameOrSchema}:${className}` : idNameOrSchema;
    return this.getClassInfoByFullName(fullName);
  }

  private async getClassInfoById(id: Id64String): Promise<DMClassInfo | undefined> {
    let classInfo = this._classInfoCache.get({ id, name: "" });
    if (!classInfo) {
      const classQuery = `
        ${classQueryBase}
        WHERE classDef.DMInstanceId = :id
      `;
      classInfo = await this.createDMClassInfo(
        this._queryReaderFactory(classQuery, QueryBinder.from({ id }), {
          rowFormat: QueryRowFormat.UseJsPropertyNames,
          restartToken: `${this.#componentName}/${this.#componentId}/class-by-id/${id}`,
        }),
      );
      classInfo && this._classInfoCache.set({ id: classInfo.id, name: classInfo.name }, classInfo);
    }
    return classInfo;
  }

  private async getClassInfoByFullName(name: string): Promise<DMClassInfo | undefined> {
    let classInfo = this._classInfoCache.get({ id: "", name });
    if (!classInfo) {
      const classQuery = `
        ${classQueryBase}
        WHERE classDef.Name = :className AND schemaDef.Name = :schemaName
      `;
      const [schemaName, className] = this.splitFullClassName(name);
      classInfo = await this.createDMClassInfo(
        this._queryReaderFactory(classQuery, QueryBinder.from({ schemaName, className }), {
          rowFormat: QueryRowFormat.UseJsPropertyNames,
          restartToken: `${this.#componentName}/${this.#componentId}/class-by-name/${name}`,
        }),
      );
      classInfo && this._classInfoCache.set({ id: classInfo.id, name: classInfo.name }, classInfo);
    }
    return classInfo;
  }

  private async createDMClassInfo(reader: DMSqlReader) {
    while (await reader.step()) {
      const classHierarchy = await this.queryClassHierarchyInfo(reader.current.id);
      return new DMClassInfo(
        reader.current.id,
        reader.current.name,
        reader.current.label,
        classHierarchy.baseClasses,
        classHierarchy.derivedClasses,
      );
    }
    return undefined;
  }

  private async queryClassHierarchyInfo(
    id: Id64String,
  ): Promise<{ baseClasses: Set<Id64String>; derivedClasses: Set<Id64String> }> {
    const classHierarchyQuery = `
      SELECT chc.TargetDMInstanceId baseId, chc.SourceDMInstanceId derivedId
      FROM meta.ClassHasAllBaseClasses chc
      WHERE chc.SourceDMInstanceId = :id OR chc.TargetDMInstanceId = :id
    `;

    const hierarchy = { baseClasses: new Set<Id64String>(), derivedClasses: new Set<Id64String>() };
    const reader = this._queryReaderFactory(classHierarchyQuery, QueryBinder.from({ id }), {
      rowFormat: QueryRowFormat.UseJsPropertyNames,
      restartToken: `${this.#componentName}/${this.#componentId}/class-hierarchy/${id}`,
    });
    while (await reader.step()) {
      if (reader.current.baseId === id) {
        hierarchy.derivedClasses.add(reader.current.derivedId);
      }
      if (reader.current.derivedId === id) {
        hierarchy.baseClasses.add(reader.current.baseId);
      }
    }
    return hierarchy;
  }

  private splitFullClassName(fullName: string): [string, string] {
    const [schemaName, className] = fullName.split(fullName.includes(".") ? "." : ":");
    return [schemaName, className];
  }
}

const classQueryBase = `
  SELECT classDef.DMInstanceId id, (schemaDef.Name || ':' || classDef.Name) name, COALESCE(classDef.DisplayLabel, classDef.name) label
  FROM meta.DMClassDef classDef
  JOIN meta.DMSchemaDef schemaDef ON classDef.Schema.Id = schemaDef.DMInstanceId
`;

const metadataProviders = new Map<string, DMMetadataProvider>();
/** @internal */
export function getIVaultMetadataProvider(ivault: IVaultConnection) {
  let metadataProvider = metadataProviders.get(ivault.key);
  if (!metadataProvider) {
    metadataProvider = new DMMetadataProvider((dmsql: string, params?: QueryBinder, config?: QueryOptions) =>
      ivault.createQueryReader(dmsql, params, config),
    );
    metadataProviders.set(ivault.key, metadataProvider);
    /* v8 ignore next 3 -- @preserve */
    ivault.onClose.addOnce(() => {
      metadataProviders.delete(ivault.key);
    });
  }
  return metadataProvider;
}

interface CacheKey {
  id: Id64String;
  name: string;
}

function compareKeys(lhs: CacheKey, rhs: CacheKey) {
  if (lhs.id.length !== 0 && rhs.id.length !== 0) {
    return compareStrings(lhs.id, rhs.id);
  }
  return compareStrings(lhs.name, rhs.name);
}
