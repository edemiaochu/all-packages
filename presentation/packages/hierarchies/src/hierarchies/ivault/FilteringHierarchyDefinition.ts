/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { defer, filter, from, map, merge, mergeAll, mergeMap, Observable, of, toArray } from "rxjs";
import { Id64String } from "@szewtwin/core-szewec";
import { DMClassHierarchyInspector, InstanceKey } from "@szewtwin/presentation-shared";
import {
  createHierarchyFilteringHelper,
  HierarchyFilteringPath,
  HierarchyFilteringPathOptions,
} from "../HierarchyFiltering.js";
import { HierarchyNodeIdentifier } from "../HierarchyNodeIdentifier.js";
import { HierarchyNodeKey, IVaultInstanceKey } from "../HierarchyNodeKey.js";
import {
  DefineHierarchyLevelProps,
  GenericHierarchyNodeDefinition,
  HierarchyLevelDefinition,
  HierarchyNodesDefinition,
  InstanceNodesQueryDefinition,
} from "../ivault/IVaultHierarchyDefinition.js";
import { ProcessedGroupingHierarchyNode, ProcessedHierarchyNode } from "../ivault/IVaultHierarchyNode.js";
import { NodeSelectClauseColumnNames } from "../ivault/NodeSelectQueryFactory.js";
import { defaultNodesParser } from "../ivault/TreeNodesReader.js";
import { partition } from "../internal/operators/Partition.js";
import {
  RxjsHierarchyDefinition,
  RxjsNodeParser,
  RxjsNodePostProcessor,
  RxjsNodePreProcessor,
} from "../internal/RxjsHierarchyDefinition.js";

interface FilteringHierarchyDefinitionProps {
  ivaultAccess: DMClassHierarchyInspector & { ivaultKey: string };
  source: RxjsHierarchyDefinition;
  nodeIdentifierPaths: HierarchyFilteringPath[];
  nodesParser?: RxjsNodeParser;
}

/** @internal */
export class FilteringHierarchyDefinition implements RxjsHierarchyDefinition {
  private _ivaultAccess: DMClassHierarchyInspector & { ivaultKey: string };
  private _source: RxjsHierarchyDefinition;
  private _nodeIdentifierPaths: HierarchyFilteringPath[];
  private _nodesParser: RxjsNodeParser;

  public constructor(props: FilteringHierarchyDefinitionProps) {
    this._ivaultAccess = props.ivaultAccess;
    this._source = props.source;
    this._nodeIdentifierPaths = props.nodeIdentifierPaths;
    this._nodesParser = props.nodesParser ?? this._source.parseNode ?? ((row) => of(defaultNodesParser(row)));
  }

  public get preProcessNode(): RxjsNodePreProcessor {
    return (node) => {
      return (this._source.preProcessNode ? this._source.preProcessNode(node) : of(node)).pipe(
        filter((processedNode) => {
          if (
            processedNode.processingParams?.hideInHierarchy &&
            processedNode.filtering?.isFilterTarget &&
            !processedNode.filtering.hasFilterTargetAncestor
          ) {
            // we want to hide target nodes if they have `hideInHierarchy` param, but only if they're not under another filter target
            return false;
          }
          return true;
        }),
      );
    };
  }

  public get postProcessNode(): RxjsNodePostProcessor {
    return (node) => {
      return (this._source.postProcessNode ? this._source.postProcessNode(node) : of(node)).pipe(
        map((processedNode) => {
          // instance nodes get the auto-expand flag in `parseNode`, but grouping ones need to be handled during post-processing
          if (ProcessedHierarchyNode.isGroupingNode(node) && shouldExpandGroupingNode(node)) {
            Object.assign(processedNode, { autoExpand: true });
          }
          return processedNode;
        }),
      );
    };
  }

  public get parseNode(): RxjsNodeParser {
    return (row, parentNode) => {
      return this._nodesParser(row).pipe(
        mergeMap((parsedNode) => {
          if (!row[DMSQL_COLUMN_NAME_FilterDMInstanceId] || !row[DMSQL_COLUMN_NAME_FilterClassName]) {
            return of(parsedNode);
          }
          const rowInstanceKey = {
            className: row[DMSQL_COLUMN_NAME_FilterClassName],
            id: row[DMSQL_COLUMN_NAME_FilterDMInstanceId],
          };
          const filteringHelper = createHierarchyFilteringHelper(this._nodeIdentifierPaths, parentNode);
          const nodeExtraPropsPossiblyPromise = filteringHelper.createChildNodePropsAsync({
            pathMatcher: (identifier): boolean | Promise<boolean> => {
              if (identifier.id !== rowInstanceKey.id) {
                return false;
              }
              if (!HierarchyNodeIdentifier.isInstanceNodeIdentifier(identifier)) {
                return false;
              }
              if (identifier.ivaultKey && identifier.ivaultKey !== this._ivaultAccess.ivaultKey) {
                return false;
              }
              if (identifier.className === rowInstanceKey.className) {
                return true;
              }
              return Promise.all([
                this._ivaultAccess.classDerivesFrom(identifier.className, rowInstanceKey.className),
                this._ivaultAccess.classDerivesFrom(rowInstanceKey.className, identifier.className),
              ]).then(([isDerivedFrom, isDerivedTo]) => isDerivedFrom || isDerivedTo);
            },
          });
          return (
            nodeExtraPropsPossiblyPromise instanceof Promise
              ? from(nodeExtraPropsPossiblyPromise)
              : of(nodeExtraPropsPossiblyPromise)
          ).pipe(
            map((nodeExtraProps) => {
              if (nodeExtraProps?.autoExpand) {
                parsedNode.autoExpand = true;
              }
              if (nodeExtraProps?.filtering) {
                parsedNode.filtering = nodeExtraProps.filtering;
              }
              return parsedNode;
            }),
          );
        }),
      );
    };
  }

  public defineHierarchyLevel(props: DefineHierarchyLevelProps): Observable<HierarchyLevelDefinition> {
    const sourceDefinitions = this._source.defineHierarchyLevel(props);

    const filteringHelper = createHierarchyFilteringHelper(this._nodeIdentifierPaths, props.parentNode);
    const childNodeFilteringIdentifiers = filteringHelper.getChildNodeFilteringIdentifiers();
    if (!childNodeFilteringIdentifiers) {
      return sourceDefinitions;
    }

    const [genericNodeDefinitions, instanceNodeDefinitions] = partition(
      sourceDefinitions.pipe(mergeAll()),
      HierarchyNodesDefinition.isGenericNode,
    );
    return merge(
      genericNodeDefinitions.pipe(
        map((definition) => {
          if (
            filteringHelper.hasFilterTargetAncestor ||
            childNodeFilteringIdentifiers.some(
              (identifier) =>
                HierarchyNodeIdentifier.isGenericNodeIdentifier(identifier) &&
                (!identifier.source || identifier.source === this._ivaultAccess.ivaultKey) &&
                identifier.id === definition.node.key,
            )
          ) {
            return {
              ...definition,
              node: {
                ...definition.node,
                ...filteringHelper.createChildNodeProps({ pathMatcher: ({ id }) => id === definition.node.key }),
              },
            };
          }
          return undefined;
        }),
        filter((def): def is GenericHierarchyNodeDefinition => !!def),
      ),

      instanceNodeDefinitions.pipe(
        mergeMap((definition) => {
          if (filteringHelper.hasFilterTargetAncestor) {
            // if we have a filter target ancestor, we don't need to filter the definitions - we use all of them
            return of(applyDMInstanceIdsSelector(definition));
          }
          return defer(async () => {
            const ivaultAccess = this._ivaultAccess;
            const matches = new Map<Id64String, IVaultInstanceKey[]>();
            async function getEntries(x: IVaultInstanceKey) {
              let entries = matches.get(x.id);
              if (!entries) {
                entries = [];
                matches.set(x.id, entries);
              }
              // make sure that we don't have path identifiers that only differ by class name, where
              // class names are in the same class hierarchy, e.g.:
              // [{ className: "bis.Element", id: "0x1" }, { className: "bis.Subject", id: "0x1" }]
              // are actually the same instance, so we only need to keep one of them, or otherwise the query will
              // duplicate it
              for (const entry of entries) {
                // TODO: MISSING_COVERAGE
                /* v8 ignore if -- @preserve */
                if (
                  entry.className === x.className ||
                  (await ivaultAccess.classDerivesFrom(entry.className, x.className)) ||
                  (await ivaultAccess.classDerivesFrom(x.className, entry.className))
                ) {
                  return undefined;
                }
              }
              return entries;
            }
            for (const id of childNodeFilteringIdentifiers) {
              // take only identifiers that match the definition by type, source and class
              if (!HierarchyNodeIdentifier.isInstanceNodeIdentifier(id)) {
                continue;
              }
              if (id.ivaultKey && id.ivaultKey !== ivaultAccess.ivaultKey) {
                continue;
              }
              if (
                id.className !== definition.fullClassName &&
                !(await Promise.all([
                  ivaultAccess.classDerivesFrom(id.className, definition.fullClassName),
                  ivaultAccess.classDerivesFrom(definition.fullClassName, id.className),
                ]).then(([isDerivedFrom, isDerivedTo]) => isDerivedFrom || isDerivedTo))
              ) {
                continue;
              }
              const entriesTargetForPathIdentifier = await getEntries(id);
              if (entriesTargetForPathIdentifier) {
                entriesTargetForPathIdentifier.push(id);
              }
            }
            return Array.from(matches.values()).flat();
          }).pipe(
            // only take definitions that have matching path identifiers
            filter((pathIdentifiers) => pathIdentifiers.length > 0),

            // for each definition that we're going to use, apply query-level filter
            map((pathIdentifiers) => applyDMInstanceIdsFilter(definition, pathIdentifiers)),
          );
        }),
      ),
    ).pipe(toArray());
  }
}

/** @internal */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const DMSQL_COLUMN_NAME_FilterDMInstanceId = "FilterDMInstanceId";

/** @internal */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const DMSQL_COLUMN_NAME_FilterClassName = "FilterClassName";

function getClassDMInstanceIds(filteredInstanceKeys: InstanceKey[]) {
  const classNameDMInstanceIds = new Map<string, Id64String[]>();
  for (const key of filteredInstanceKeys) {
    const entry = classNameDMInstanceIds.get(key.className);
    if (entry === undefined) {
      classNameDMInstanceIds.set(key.className, [key.id]);
      continue;
    }
    entry.push(key.id);
  }
  return classNameDMInstanceIds;
}

/** @internal */
export function applyDMInstanceIdsFilter(
  def: InstanceNodesQueryDefinition,
  filteredInstanceKeys: InstanceKey[],
): InstanceNodesQueryDefinition {
  const instanceIdsByClass = getClassDMInstanceIds(filteredInstanceKeys);
  return {
    ...def,
    query: {
      ...def.query,
      ctes: [
        ...(def.query.ctes ?? []),
        `FilteringInfo(DMInstanceId, FilterClassName) AS (
          ${Array.from(instanceIdsByClass)
            .map(
              ([className, dmInstanceIds]) => `
                SELECT DMInstanceId, '${className}' AS FilterClassName
                FROM ${className}
                WHERE DMInstanceId IN (${dmInstanceIds.join(", ")})
              `,
            )
            .join(" UNION ALL ")}
        )`,
      ],
      dmsql: `
        SELECT
          [q].*,
          IdToHex([f].[DMInstanceId]) AS [${DMSQL_COLUMN_NAME_FilterDMInstanceId}],
          [f].[FilterClassName] AS [${DMSQL_COLUMN_NAME_FilterClassName}]
        FROM (
          ${def.query.dmsql}
        ) [q]
        JOIN FilteringInfo [f] ON [f].[DMInstanceId] = [q].[DMInstanceId]
      `,
    },
  };
}

/** @internal */
export function applyDMInstanceIdsSelector(def: InstanceNodesQueryDefinition): InstanceNodesQueryDefinition {
  return {
    ...def,
    query: {
      ...def.query,
      dmsql: `
        SELECT
          [q].*,
          IdToHex([q].[DMInstanceId]) AS [${DMSQL_COLUMN_NAME_FilterDMInstanceId}],
          [q].[${NodeSelectClauseColumnNames.FullClassName}] AS [${DMSQL_COLUMN_NAME_FilterClassName}]
        FROM (${def.query.dmsql}) [q]
      `,
    },
  };
}

function shouldExpandGroupingNode(node: ProcessedGroupingHierarchyNode) {
  const numberOfNonGroupingParentNodes = node.parentKeys.filter((key) => !HierarchyNodeKey.isGrouping(key)).length;
  for (const child of node.children) {
    if (!child.filtering) {
      continue;
    }

    if (
      child.filtering.isFilterTarget &&
      getAutoExpandAsTrueFalse(
        child.filtering.filterTargetOptions?.autoExpand,
        numberOfNonGroupingParentNodes,
        node.parentKeys.length,
      )
    ) {
      return true;
    }

    if (!child.filtering.filteredChildrenIdentifierPaths) {
      continue;
    }

    for (const path of child.filtering.filteredChildrenIdentifierPaths) {
      if (
        "path" in path &&
        getAutoExpandAsTrueFalse(path.options?.autoExpand, numberOfNonGroupingParentNodes, node.parentKeys.length)
      ) {
        return true;
      }
    }
  }
  return false;
}

function getAutoExpandAsTrueFalse(
  autoExpand: HierarchyFilteringPathOptions["autoExpand"],
  numberOfNonGroupingParentNodes: number,
  numberOfParentNodes: number,
): boolean {
  if (!autoExpand) {
    return false;
  }
  if (autoExpand === true) {
    return true;
  }

  // If grouping node's child has `autoExpandUntil` flag,
  // auto-expand the grouping node only if it's depth is lower than that of the grouping node in associated with the target.
  const nodeDepth =
    "key" in autoExpand ||
    "depthInHierarchy" in autoExpand ||
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    (!("depthInPath" in autoExpand) && autoExpand.includeGroupingNodes)
      ? numberOfParentNodes
      : numberOfNonGroupingParentNodes;
  const filterTargetDepth =
    "depth" in autoExpand
      ? // eslint-disable-next-line @typescript-eslint/no-deprecated
        autoExpand.depth
      : "depthInPath" in autoExpand
        ? autoExpand.depthInPath
        : autoExpand.depthInHierarchy;
  if (nodeDepth < filterTargetDepth) {
    return true;
  }
  return false;
}
