/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

export { GenericInstanceFilter } from "@szewtwin/core-common";

export {
  DefineHierarchyLevelProps,
  HierarchyLevelDefinition,
  HierarchyDefinition,
  HierarchyNodesDefinition,
  NodeParser,
  NodePostProcessor,
  NodePreProcessor,
} from "./hierarchies/ivault/IVaultHierarchyDefinition.js";
export {
  DefineGenericNodeChildHierarchyLevelProps,
  DefineInstanceNodeChildHierarchyLevelProps,
  DefineRootHierarchyLevelProps,
  createPredicateBasedHierarchyDefinition,
} from "./hierarchies/ivault/PredicateBasedHierarchyDefinition.js";
export {
  LimitingDMSqlQueryExecutor,
  createLimitingDMSqlQueryExecutor,
} from "./hierarchies/ivault/LimitingDMSqlQueryExecutor.js";
export {
  NodeSelectClauseColumnNames,
  NodesQueryClauseFactory,
  createNodesQueryClauseFactory,
} from "./hierarchies/ivault/NodeSelectQueryFactory.js";
export { createIVaultHierarchyProvider } from "./hierarchies/ivault/IVaultHierarchyProvider.js";
export { SourceHierarchyNode, ProcessedHierarchyNode } from "./hierarchies/ivault/IVaultHierarchyNode.js";

export { RowsLimitExceededError } from "./hierarchies/HierarchyErrors.js";
export { GroupingHierarchyNode, HierarchyNode, NonGroupingHierarchyNode } from "./hierarchies/HierarchyNode.js";
export { HierarchyNodeIdentifier, HierarchyNodeIdentifiersPath } from "./hierarchies/HierarchyNodeIdentifier.js";
export {
  GenericNodeKey,
  GroupingNodeKey,
  HierarchyNodeKey,
  InstancesNodeKey,
  ClassGroupingNodeKey,
  LabelGroupingNodeKey,
  PropertyGroupingNodeKey,
  PropertyOtherValuesGroupingNodeKey,
  PropertyValueGroupingNodeKey,
  PropertyValueRangeGroupingNodeKey,
  IVaultHierarchyNodeKey,
} from "./hierarchies/HierarchyNodeKey.js";
export { GetHierarchyNodesProps, HierarchyProvider, mergeProviders } from "./hierarchies/HierarchyProvider.js";
export {
  createHierarchyFilteringHelper,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  extractFilteringProps,
  HierarchyFilteringPath,
  HierarchyFilteringPathOptions,
} from "./hierarchies/HierarchyFiltering.js";
export { getLogger, setLogger } from "./hierarchies/Logging.js";
