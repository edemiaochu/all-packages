/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module iVaults
 */

import { Logger, TupleKeyedMap } from "@szewtwin/core-szewec";
import { ConcreteEntityTypes, RelTypeInfo } from "@szewtwin/core-common";
import {
  DMClass,
  Mixin,
  RelationshipClass,
  RelationshipConstraint,
  Schema,
  SchemaKey,
  StrengthDirection,
} from "@szewtwin/dmschema-metadata";
import * as assert from "assert";
import { IVaultDb } from "@szewtwin/core-backend";
import { TransformerLoggerCategory } from "./TransformerLoggerCategory";

/** The context for transforming a *source* Element to a *target* Element and remapping internal identifiers to the target iVault.
 * @internal
 */
export class SchemaNotInCacheErr extends Error {
  public constructor() {
    super("Schema was not in cache, initialize that schema");
  }
}

/**
 * A cache of the entity types referenced by navprops in dmchemas, as well as the source and target entity types of
 * The transformer needs the referenced type to determine how to resolve references.
 *
 * Using multiple of these usually performs redundant computation, for static schemas at least. A possible future optimization
 * would be to seed the computation from a global cache of non-dynamic schemas, but dynamic schemas can collide willy-nilly
 * @internal
 */
export class DMReferenceTypesCache {
  /** nesting based tuple map keyed by qualified property path tuple [schemaName, className, propName] */
  private _propQualifierToRefType = new TupleKeyedMap<
    [string, string, string],
    ConcreteEntityTypes
  >();
  private _relClassNameEndToRefTypes = new TupleKeyedMap<
    [string, string],
    RelTypeInfo
  >();
  private _initedSchemas = new Map<string, SchemaKey>();

  // Performance optimization caches
  private _rootBisClassCache = new Map<string, DMClass>();
  private _relationshipInfoCache = new Map<string, RelTypeInfo | undefined>();
  private _constraintClassCache = new Map<string, DMClass>();

  private static bisRootClassToRefType: Record<
    string,
    ConcreteEntityTypes | undefined
  > = {
    /* eslint-disable quote-props, @typescript-eslint/naming-convention */
    Element: ConcreteEntityTypes.Element,
    Model: ConcreteEntityTypes.Model,
    ElementAspect: ConcreteEntityTypes.ElementAspect,
    ElementRefersToElements: ConcreteEntityTypes.Relationship,
    ElementDrivesElement: ConcreteEntityTypes.Relationship,
    // code spec is technically a potential root class but it is ignored currently
    // see [ConcreteEntityTypes]($common)
    /* eslint-enable quote-props, @typescript-eslint/naming-convention */
  };

  private async getRootBisClass(dmclass: DMClass) {
    const cacheKey = dmclass.fullName;
    const cached = this._rootBisClassCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    let bisRootForConstraint: DMClass = dmclass;
    await dmclass.traverseBaseClasses((baseClass) => {
      // The depth first traversal will descend all the way to the root class before making any lateral traversal
      // of mixin hierarchies, (or if the constraint is a mixin, it will traverse to the root of the mixin hierarchy)
      // Once we see that we've moved laterally, we can terminate early
      const isFirstTest = bisRootForConstraint === dmclass;
      const traversalSwitchedRootPath =
        baseClass.name !== bisRootForConstraint.baseClass?.name;
      const stillTraversingRootPath = isFirstTest || !traversalSwitchedRootPath;
      if (!stillTraversingRootPath) return true; // stop traversal early
      bisRootForConstraint = baseClass;
      return false;
    });
    // if the root class of the constraint was a mixin, use its AppliesToEntityClass
    if (bisRootForConstraint instanceof Mixin) {
      assert(
        bisRootForConstraint.appliesTo !== undefined,
        "The referenced AppliesToEntityClass could not be found, how did it pass schema validation?"
      );
      bisRootForConstraint = await this.getRootBisClass(
        await bisRootForConstraint.appliesTo
      );
    }

    this._rootBisClassCache.set(cacheKey, bisRootForConstraint);
    return bisRootForConstraint;
  }

  private async getAbstractConstraintClass(
    constraint: RelationshipConstraint
  ): Promise<DMClass> {
    const cacheKey = `${constraint.relationshipClass.fullName}:${constraint.isSource ? "Source" : "Target"}`;
    const cached = this._constraintClassCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // constraint classes must share a base so we can get the root from any of them, just use the first
    const dmclass = await (constraint.constraintClasses?.[0] ||
      constraint.abstractConstraint);
    assert(
      dmclass !== undefined,
      "At least one constraint class or an abstract constraint must have been defined, the constraint is not valid"
    );

    this._constraintClassCache.set(cacheKey, dmclass);
    return dmclass;
  }

  /** initialize from an ivault with metadata */
  public async initAllSchemasInIVault(ivault: IVaultDb): Promise<void> {
    let schemaCount = 0;

    const initStartTime = performance.now();

    const query = `
      WITH RECURSIVE refs(SchemaId) AS (
        SELECT DMInstanceId FROM DMDbMeta.DMSchemaDef WHERE Name='BisCore'
        UNION
        SELECT sr.SourceDMInstanceId
        FROM DMDbMeta.SchemaHasSchemaReferences sr
        JOIN refs ON sr.TargetDMInstanceId = refs.SchemaId
      )
      SELECT s.Name as name
      FROM refs
      JOIN DMDbMeta.DMSchemaDef s ON refs.SchemaId=s.DMInstanceId
      -- ensure schema dependency order
      ORDER BY s.DMInstanceId
    `;

    for await (const row of ivault.createQueryReader(query, undefined, {
      usePrimaryConn: true,
    })) {
      const schemaName = row.name;
      const startTime = performance.now();
      Logger.logTrace(
        TransformerLoggerCategory.DMReferenceTypesCache,
        `Loading schema: ${schemaName}`
      );
      const schemaItemKey = new SchemaKey(schemaName);
      const schema = await ivault.schemaContext.getSchema(schemaItemKey);
      if (!schema) {
        throw new Error(`Failed to load schema: ${schemaName}`);
      }
      await this.considerInitSchema(schema);
      const endTime = performance.now();
      Logger.logTrace(
        TransformerLoggerCategory.DMReferenceTypesCache,
        `Completed schema: ${schemaName} in ${(endTime - startTime).toFixed(2)}ms`
      );
      schemaCount++;
    }

    const initEndTime = performance.now();
    Logger.logTrace(
      TransformerLoggerCategory.DMReferenceTypesCache,
      `Completed ${schemaCount} schemas in ${(initEndTime - initStartTime).toFixed(2)}ms`
    );
  }

  private async considerInitSchema(schema: Schema): Promise<void> {
    if (this._initedSchemas.has(schema.name)) {
      const cachedSchemaKey = this._initedSchemas.get(schema.name);
      assert(cachedSchemaKey !== undefined);
      const incomingSchemaIsEqualOrOlder =
        schema.schemaKey.compareByVersion(cachedSchemaKey) <= 0;
      if (incomingSchemaIsEqualOrOlder) {
        return;
      }
    }
    return this.initSchema(schema);
  }

  private async initSchema(schema: Schema): Promise<void> {
    Logger.logInfo(
      TransformerLoggerCategory.DMReferenceTypesCache,
      `Init Schema: ${schema.name}`
    );
    const schemaNameLower = schema.name.toLowerCase();

    // Pre-collect all items to reduce iterator overhead
    const allItems = Array.from(schema.getItems());
    const dmClasses: DMClass[] = [];
    const relationshipClasses: RelationshipClass[] = [];

    // Single pass through items with type checking
    for (const item of allItems) {
      // eslint-disable-next-line @szewtwin/no-internal
      if (!DMClass.isDMClass(item)) continue;
      dmClasses.push(item);
      if (item instanceof RelationshipClass) {
        relationshipClasses.push(item);
      }
    }

    // Process relationship classes in parallel and populate global cache
    const relInfoPromises = relationshipClasses.map(async (relClass) => {
      const relInfo = await this.relInfoFromRelClass(relClass);
      this._relationshipInfoCache.set(relClass.fullName, relInfo);
      if (relInfo) {
        this._relClassNameEndToRefTypes.set(
          [schemaNameLower, relClass.name.toLowerCase()],
          relInfo
        );
      }
      return relInfo;
    });

    // Wait for all relationship info to be cached
    await Promise.all(relInfoPromises);

    // Process navigation properties with optimized batching
    const propertyBatchSize = 25;
    for (let i = 0; i < dmClasses.length; i += propertyBatchSize) {
      const classBatch = dmClasses.slice(i, i + propertyBatchSize);

      const classPromises = classBatch.map(async (dmclass) => {
        const properties = await dmclass.getProperties();
        if (!properties) return;

        const classNameLower = dmclass.name.toLowerCase();

        // Efficiently filter navigation properties
        const navProps = Array.from(properties).filter((prop) =>
          prop.isNavigation()
        );
        if (navProps.length === 0) return;

        const navPropPromises = navProps.map(async (prop) => {
          const relClass = await prop.relationshipClass;

          // Use cached relation info
          let relInfo = this._relationshipInfoCache.get(relClass.fullName);
          if (
            relInfo === undefined &&
            !this._relationshipInfoCache.has(relClass.fullName)
          ) {
            relInfo = await this.relInfoFromRelClass(relClass);
            this._relationshipInfoCache.set(relClass.fullName, relInfo);
          }

          if (relInfo === undefined) return;

          const navPropRefType =
            prop.direction === StrengthDirection.Forward
              ? // eslint-disable-next-line @szewtwin/no-internal
                relInfo.target
              : // eslint-disable-next-line @szewtwin/no-internal
                relInfo.source;

          this._propQualifierToRefType.set(
            [schemaNameLower, classNameLower, prop.name.toLowerCase()],
            navPropRefType
          );
        });

        await Promise.all(navPropPromises);
      });

      await Promise.all(classPromises);
    }

    this._initedSchemas.set(schema.name, schema.schemaKey);
  }

  private async relInfoFromRelClass(
    dmclass: RelationshipClass
  ): Promise<RelTypeInfo | undefined> {
    assert(dmclass.source.constraintClasses !== undefined);
    assert(dmclass.target.constraintClasses !== undefined);
    const [
      [sourceClass, sourceRootBisClass],
      [targetClass, targetRootBisClass],
    ] = await Promise.all([
      this.getAbstractConstraintClass(dmclass.source).then(
        async (constraintClass) => [
          constraintClass,
          await this.getRootBisClass(constraintClass),
        ]
      ),
      this.getAbstractConstraintClass(dmclass.target).then(
        async (constraintClass) => [
          constraintClass,
          await this.getRootBisClass(constraintClass),
        ]
      ),
    ]);

    if (
      sourceRootBisClass.name === "CodeSpec" ||
      targetRootBisClass.name === "CodeSpec"
    )
      return undefined;
    const sourceType =
      DMReferenceTypesCache.bisRootClassToRefType[sourceRootBisClass.name];
    const targetType =
      DMReferenceTypesCache.bisRootClassToRefType[targetRootBisClass.name];
    if (
      (!sourceType &&
        sourceRootBisClass.customAttributes?.has("DMDbMap.QueryView")) ||
      (!targetType &&
        targetRootBisClass.customAttributes?.has("DMDbMap.QueryView"))
    ) {
      // DMView elements are not "real" data and transformer does not need to process them.
      // Relationships that point to DMView elements can only be used in DMViews so the mapping is not needed.
      return undefined;
    }

    const makeAssertMsg = (root: DMClass, cls: DMClass) =>
      [
        `An unknown root class '${root.fullName}' was encountered while populating`,
        `the nav prop reference type cache for ${cls.fullName}.`,
        "This is a bug.",
      ].join("\n");
    assert(
      sourceType !== undefined,
      makeAssertMsg(sourceRootBisClass, sourceClass)
    );
    assert(
      targetType !== undefined,
      makeAssertMsg(targetRootBisClass, targetClass)
    );
    return { source: sourceType, target: targetType };
  }

  public getNavPropRefType(
    schemaName: string,
    className: string,
    propName: string
  ): undefined | ConcreteEntityTypes {
    if (!this._initedSchemas.has(schemaName)) throw new SchemaNotInCacheErr();
    return this._propQualifierToRefType.get([
      schemaName.toLowerCase(),
      className.toLowerCase(),
      propName.toLowerCase(),
    ]);
  }

  public getRelationshipEndType(
    schemaName: string,
    className: string
  ): undefined | RelTypeInfo {
    if (!this._initedSchemas.has(schemaName)) throw new SchemaNotInCacheErr();
    return this._relClassNameEndToRefTypes.get([
      schemaName.toLowerCase(),
      className.toLowerCase(),
    ]);
  }

  public clear() {
    this._initedSchemas.clear();
    this._propQualifierToRefType.clear();
    this._relClassNameEndToRefTypes.clear();
    this._rootBisClassCache.clear();
    this._relationshipInfoCache.clear();
    this._constraintClassCache.clear();
  }
}
