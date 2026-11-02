/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import {
  EMPTY,
  filter,
  forkJoin,
  from,
  map,
  merge,
  mergeMap,
  Observable,
  scan,
  shareReplay,
  Subject,
  toArray,
} from "rxjs";
import { eachValueFrom } from "rxjs-for-await";
import { Guid, GuidString, Id64String } from "@szewtwin/core-szewec";
import {
  DMClassHierarchyInspector,
  DMSqlBinding,
  DMSqlQueryDef,
  DMSqlQueryExecutor,
  DMSqlQueryReaderOptions,
  DMSqlQueryRow,
  normalizeFullClassName,
} from "@szewtwin/presentation-shared";
import { SelectableInstanceKey, Selectables } from "./Selectable.js";
import { formIdBindings, genericExecuteQuery, releaseMainThreadOnItemsCount } from "./Utils.js";

const HILITE_SET_EMIT_FREQUENCY = 20;

/**
 * A set of model, subcategory and element ids that can be used for specifying hilite.
 *
 * **Warning:** Used in public API as a return value. Not expected to be created / extended by package
 * consumers, may be supplemented with required attributes any time.
 *
 * @see https://www.szewtwinjs.org/reference/core-frontend/selectionset/hiliteset/
 * @see `HiliteSetProvider`
 * @see `createHiliteSetProvider`
 * @public
 */
export interface HiliteSet {
  models: Id64String[];
  subCategories: Id64String[];
  elements: Id64String[];
}

/**
 * Props for creating a `HiliteSetProvider` instance.
 * @public
 */
export interface HiliteSetProviderProps {
  /** An object that provides access to iVault's metadata and allows running DMSQL queries on it. */
  ivaultAccess: DMClassHierarchyInspector & DMSqlQueryExecutor;
}

/**
 * Defines return value of `createHiliteSetProvider`.
 *
 * **Warning:** Used in public API as a return value. Not expected to be created / extended by package
 * consumers, may be supplemented with required attributes any time.
 *
 * @see `createHiliteSetProvider`
 * @public
 */
export interface HiliteSetProvider {
  /** Get the current hilite set iterator for the specified ivault */
  getHiliteSet(props: { selectables: Selectables }): AsyncIterableIterator<HiliteSet>;
}

/**
 * Creates a hilite set provider that returns a `HiliteSet` for given selectables.
 * @public
 */
export function createHiliteSetProvider(props: HiliteSetProviderProps): HiliteSetProvider {
  return new HiliteSetProviderImpl(props);
}

class HiliteSetProviderImpl implements HiliteSetProvider {
  private _ivaultAccess: DMClassHierarchyInspector & DMSqlQueryExecutor;
  // Map between a class name and its type
  private _classRelationCache: Map<string, InstanceIdType | Promise<InstanceIdType>>;
  #componentId: GuidString;
  #componentName: string;

  constructor(props: HiliteSetProviderProps) {
    this._ivaultAccess = props.ivaultAccess;
    this._classRelationCache = new Map();
    this.#componentId = Guid.createValue();
    this.#componentName = "HiliteSetProvider";
  }

  /**
   * Get hilite set iterator for supplied `Selectables`.
   */
  public getHiliteSet(props: { selectables: Selectables }): AsyncIterableIterator<HiliteSet> {
    const obs = this.getHiliteSetObservable(props);
    return eachValueFrom(obs);
  }

  /**
   * Returns a "hot" observable of hilite sets.
   */
  private getHiliteSetObservable({ selectables }: { selectables: Selectables }): Subject<HiliteSet> {
    const instancesByType = this.getInstancesByType(selectables);
    const observables: { [key in keyof HiliteSet]?: Observable<string> } = {
      models: this.getHilitedModels(instancesByType),
      subCategories: this.getHilitedSubCategories(instancesByType),
      elements: this.getHilitedElements(instancesByType),
    };

    let hiliteSet: HiliteSet = { models: [], subCategories: [], elements: [] };
    let lastEmitTime = performance.now();
    const subject = new Subject<HiliteSet>();
    const subscriptions = (["models", "subCategories", "elements"] as const).map((key) =>
      observables[key]!.subscribe({
        next(val) {
          hiliteSet[key].push(val);
          if (performance.now() - lastEmitTime < HILITE_SET_EMIT_FREQUENCY) {
            return;
          }
          subject.next(hiliteSet);
          hiliteSet = { models: [], subCategories: [], elements: [] };
          lastEmitTime = performance.now();
        },
        complete() {
          observables[key] = undefined;
          if (observables.models || observables.subCategories || observables.elements) {
            return;
          }
          // Emit last batch before completing the observable.
          if (hiliteSet.elements.length || hiliteSet.models.length || hiliteSet.subCategories.length) {
            subject.next(hiliteSet);
          }
          subject.complete();
        },
        error(err) {
          subscriptions.forEach((x) => x.unsubscribe());
          subscriptions.length = 0;
          subject.error(err);
        },
      }),
    );

    return subject;
  }

  private async getType(key: SelectableInstanceKey): Promise<InstanceIdType> {
    const normalizedClassName = normalizeFullClassName(key.className);
    const cachedType = this._classRelationCache.get(normalizedClassName);
    if (cachedType) {
      return cachedType;
    }

    const promise = this.getTypeImpl(normalizedClassName).then((res) => {
      // Update the cache with the result of the promise.
      this._classRelationCache.set(normalizedClassName, res);
      return res;
    });

    // Add the promise to cache to prevent `getTypeImpl` being called multiple times.
    this._classRelationCache.set(normalizedClassName, promise);
    return promise;
  }

  private async getTypeImpl(fullClassName: string): Promise<InstanceIdType> {
    return (
      (await this.checkType(fullClassName, "BisCore.Subject", "subject")) ??
      (await this.checkType(fullClassName, "BisCore.Model", "model")) ??
      (await this.checkType(fullClassName, "BisCore.Category", "category")) ??
      (await this.checkType(fullClassName, "BisCore.SubCategory", "subCategory")) ??
      (await this.checkType(fullClassName, "Functional.FunctionalElement", "functionalElement")) ??
      (await this.checkType(fullClassName, "BisCore.GroupInformationElement", "groupInformationElement")) ??
      (await this.checkType(fullClassName, "BisCore.GeometricElement", "geometricElement")) ??
      (await this.checkType(fullClassName, "BisCore.Element", "element")) ??
      "unknown"
    );
  }

  private async checkType(keyClassName: string, checkClassName: string, type: InstanceIdType) {
    try {
      const res = this._ivaultAccess.classDerivesFrom(keyClassName, checkClassName);
      const isOfType = typeof res === "boolean" ? res : await res;
      return isOfType ? type : undefined;
    } catch (e) {
      // we may be checking against a non-existing schema (e.g. Functional), in which case we should
      // return undefined instead of throwing an error
      if (e instanceof Error && e.message.match(/Schema "[\w\d_]+" not found/)) {
        return undefined;
      }
      throw e;
    }
  }

  private getInstancesByType(selectables: Selectables): InstancesByType {
    const keyTypeObs = merge(
      from(selectables.custom.values()).pipe(mergeMap((selectable) => selectable.loadInstanceKeys())),
      from(selectables.instanceKeys).pipe(
        mergeMap(([className, idSet]) => from(idSet).pipe(map((id) => ({ className, id })))),
      ),
    ).pipe(
      releaseMainThreadOnItemsCount(500),
      // Get types for each instance key
      mergeMap((instanceKey) =>
        from(this.getType(instanceKey)).pipe(map((instanceIdType) => ({ instanceId: instanceKey.id, instanceIdType }))),
      ),
      // Cache the results
      shareReplay(),
    );

    return Object.fromEntries(
      INSTANCE_TYPES.map((type) => [
        type,
        keyTypeObs.pipe(
          filter(({ instanceIdType }) => instanceIdType === type),
          map(({ instanceId }) => instanceId),
          unique(),
        ),
      ]),
    ) as InstancesByType;
  }

  private getHilitedModels(instancesByType: InstancesByType): Observable<string> {
    return forkJoin({
      modelKeys: instancesByType.model.pipe(toArray()),
      subjectKeys: instancesByType.subject.pipe(toArray()),
    }).pipe(
      mergeMap(({ modelKeys, subjectKeys }) => {
        if (!modelKeys.length && !subjectKeys.length) {
          return EMPTY;
        }

        const bindings: DMSqlBinding[] = [];
        const ctes = [
          `
            ChildSubjects(DMInstanceId, JsonProperties) AS (
              SELECT DMInstanceId, JsonProperties
              FROM BisCore.Subject
              WHERE ${formIdBindings("DMInstanceId", subjectKeys, bindings)}
              UNION ALL
              SELECT r.DMInstanceId, r.JsonProperties
              FROM ChildSubjects s
              JOIN BisCore.Subject r ON r.Parent.Id = s.DMInstanceId
            )
          `,
          `
            Models(DMInstanceId) AS (
              SELECT s.DMInstanceId AS DMInstanceId
              FROM BisCore.Model s
              WHERE ${formIdBindings("DMInstanceId", modelKeys, bindings)}
            )
          `,
        ];
        const dmsql = [
          `
            SELECT r.DMInstanceId AS DMInstanceId
            FROM ChildSubjects s
            JOIN BisCore.PhysicalPartition r ON r.Parent.Id = s.DMInstanceId OR json_extract(s.JsonProperties,'$.Subject.Model.TargetPartition') = printf('0x%x', r.DMInstanceId)
          `,
          `
            SELECT DMInstanceId FROM Models
          `,
        ].join(" UNION ");
        return from(
          executeQuery({
            queryExecutor: this._ivaultAccess,
            query: { ctes, dmsql, bindings },
            config: { restartToken: `${this.#componentName}/${this.#componentId}/models/${Guid.createValue()}` },
          }),
        );
      }),
    );
  }

  private getHilitedSubCategories(instancesByType: InstancesByType): Observable<string> {
    return forkJoin({
      subCategoryKeys: instancesByType.subCategory.pipe(toArray()),
      categoryKeys: instancesByType.category.pipe(toArray()),
    }).pipe(
      mergeMap(({ subCategoryKeys, categoryKeys }) => {
        if (!subCategoryKeys.length && !categoryKeys.length) {
          return EMPTY;
        }

        const bindings: DMSqlBinding[] = [];
        const ctes = [
          `
            CategorySubCategories(DMInstanceId) AS (
              SELECT r.DMInstanceId AS DMInstanceId
              FROM BisCore.Category s
              JOIN BisCore.SubCategory r ON r.Parent.Id = s.DMInstanceId
              WHERE ${formIdBindings("s.DMInstanceId", categoryKeys, bindings)}
            )
          `,
          `
            SubCategories(DMInstanceId) AS (
              SELECT s.DMInstanceId AS DMInstanceId
              FROM BisCore.SubCategory s
              WHERE ${formIdBindings("s.DMInstanceId", subCategoryKeys, bindings)}
            )
          `,
        ];
        const dmsql = [`SELECT DMInstanceId FROM CategorySubCategories`, `SELECT DMInstanceId FROM SubCategories`].join(
          " UNION ",
        );
        return from(
          executeQuery({
            queryExecutor: this._ivaultAccess,
            query: { ctes, dmsql, bindings },
            config: {
              restartToken: `${this.#componentName}/${this.#componentId}/sub-categories/${Guid.createValue()}`,
            },
          }),
        );
      }),
    );
  }

  private getHilitedElements(instancesByType: InstancesByType): Observable<string> {
    return forkJoin({
      groupInformationElementKeys: instancesByType.groupInformationElement.pipe(toArray()),
      geometricElementKeys: instancesByType.geometricElement.pipe(toArray()),
      functionalElements: instancesByType.functionalElement.pipe(toArray()),
      elementKeys: instancesByType.element.pipe(toArray()),
    }).pipe(
      mergeMap(({ groupInformationElementKeys, geometricElementKeys, functionalElements, elementKeys }) => {
        const hasFunctionalElements = !!functionalElements.length;
        if (
          !groupInformationElementKeys.length &&
          !geometricElementKeys.length &&
          !elementKeys.length &&
          !hasFunctionalElements
        ) {
          return EMPTY;
        }

        const bindings: DMSqlBinding[] = [];
        const ctes = [
          ...(hasFunctionalElements ? this.getHilitedFunctionalElementsQueryCTEs(functionalElements, bindings) : []),
          `
            GroupMembers(DMInstanceId, DMClassId) AS (
              SELECT TargetDMInstanceId, TargetDMClassId
              FROM BisCore.ElementGroupsMembers
              WHERE ${formIdBindings("SourceDMInstanceId", groupInformationElementKeys, bindings)}
            )
          `,
          `
            GroupGeometricElements(DMInstanceId, DMClassId) AS (
              SELECT DMInstanceId, DMClassId FROM GroupMembers
              UNION ALL
              SELECT r.DMInstanceId, r.DMClassId
              FROM GroupGeometricElements s
              JOIN BisCore.Element r ON r.Parent.Id = s.DMInstanceId
            )
          `,
          `
            ElementGeometricElements(DMInstanceId, DMClassId) AS (
              SELECT DMInstanceId, DMClassId
              FROM BisCore.Element
              WHERE ${formIdBindings("DMInstanceId", elementKeys, bindings)}
              UNION ALL
              SELECT r.DMInstanceId, r.DMClassId
              FROM ElementGeometricElements s
              JOIN BisCore.Element r ON r.Parent.Id = s.DMInstanceId
            )
          `,
          `
            GeometricElementGeometricElements(DMInstanceId, DMClassId) AS (
              SELECT DMInstanceId, DMClassId
              FROM BisCore.GeometricElement
              WHERE ${formIdBindings("DMInstanceId", geometricElementKeys, bindings)}
              UNION ALL
              SELECT r.DMInstanceId, r.DMClassId
              FROM GeometricElementGeometricElements s
              JOIN BisCore.Element r ON r.Parent.Id = s.DMInstanceId
            )
          `,
        ];
        const dmsql = [
          ...(hasFunctionalElements
            ? [
                "SELECT DMInstanceId FROM FunctionalElementChildGeometricElements WHERE DMClassId IS (BisCore.GeometricElement)",
              ]
            : []),
          "SELECT DMInstanceId FROM GeometricElementGeometricElements WHERE DMClassId IS (BisCore.GeometricElement)",
          "SELECT DMInstanceId FROM GroupGeometricElements WHERE DMClassId IS (BisCore.GeometricElement)",
          "SELECT DMInstanceId FROM ElementGeometricElements WHERE DMClassId IS (BisCore.GeometricElement)",
        ].join(" UNION ");
        return from(
          executeQuery({
            queryExecutor: this._ivaultAccess,
            query: { ctes, dmsql, bindings },
            config: { restartToken: `${this.#componentName}/${this.#componentId}/elements/${Guid.createValue()}` },
          }),
        );
      }),
    );
  }

  private getHilitedFunctionalElementsQueryCTEs(functionalElements: string[], bindings: DMSqlBinding[]): string[] {
    return [
      `
        ChildFunctionalElements(DMInstanceId, DMClassId) AS (
          SELECT DMInstanceId, DMClassId
          FROM Functional.FunctionalElement
          WHERE ${formIdBindings("DMInstanceId", functionalElements, bindings)}
          UNION ALL
          SELECT r.DMInstanceId, r.DMClassId
          FROM ChildFunctionalElements s
          JOIN Functional.FunctionalElement r ON r.Parent.Id = s.DMInstanceId
        )
      `,
      `
        PhysicalElements(DMInstanceId, DMClassId) AS (
          SELECT r.SourceDMInstanceId, r.SourceDMClassId
          FROM ChildFunctionalElements s
          JOIN Functional.PhysicalElementFulfillsFunction r ON r.TargetDMInstanceId = s.DMInstanceId
        )
      `,
      `
        DrawingGraphicElements(DMInstanceId, DMClassId) AS (
          SELECT r.SourceDMInstanceId, r.SourceDMClassId
          FROM ChildFunctionalElements s
          JOIN Functional.DrawingGraphicRepresentsFunctionalElement r ON r.TargetDMInstanceId = s.DMInstanceId
        )
      `,
      `
        PhysicalElementGeometricElements(DMInstanceId, DMClassId) AS (
          SELECT DMInstanceId, DMClassId FROM PhysicalElements
          UNION ALL
          SELECT r.DMInstanceId, r.DMClassId
          FROM PhysicalElementGeometricElements s
          JOIN BisCore.Element r ON r.Parent.Id = s.DMInstanceId
        )
      `,
      `
        DrawingGraphicElementGeometricElements(DMInstanceId, DMClassId) AS (
          SELECT DMInstanceId, DMClassId FROM DrawingGraphicElements
          UNION ALL
          SELECT r.DMInstanceId, r.DMClassId
          FROM DrawingGraphicElementGeometricElements s
          JOIN BisCore.Element r ON r.Parent.Id = s.DMInstanceId
        )
      `,
      `
        FunctionalElementChildGeometricElements(DMInstanceId, DMClassId) AS (
          SELECT DMInstanceId, DMClassId FROM PhysicalElementGeometricElements
          UNION
          SELECT DMInstanceId, DMClassId FROM DrawingGraphicElementGeometricElements
        )
      `,
    ];
  }
}

const INSTANCE_TYPES = [
  "subject",
  "model",
  "category",
  "subCategory",
  "functionalElement",
  "groupInformationElement",
  "geometricElement",
  "element",
  "unknown",
] as const;

type InstanceIdType = (typeof INSTANCE_TYPES)[number];

type InstancesByType = {
  [idType in InstanceIdType]: Observable<string>;
};

function unique<T>() {
  return function (obs: Observable<T>): Observable<T> {
    return obs.pipe(
      scan(
        (acc, val) => {
          if (acc.set.has(val)) {
            delete acc.val;
            return acc;
          }

          acc.set.add(val);
          acc.val = val;
          return acc;
        },
        { set: new Set<T>() } as { set: Set<T>; val?: T },
      ),
      map(({ val }) => val),
      filter((x): x is T => !!x),
    );
  };
}

async function* executeQuery(props: {
  queryExecutor: DMSqlQueryExecutor;
  query: DMSqlQueryDef;
  config?: DMSqlQueryReaderOptions;
}): AsyncIterableIterator<string> {
  yield* genericExecuteQuery({ ...props, parseQueryRow: (row: DMSqlQueryRow) => row.DMInstanceId });
}
