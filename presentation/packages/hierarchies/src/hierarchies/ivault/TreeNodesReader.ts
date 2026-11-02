/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { from, mergeMap, Observable, of } from "rxjs";
import { Guid, Id64String } from "@szewtwin/core-szewec";
import { DMSqlQueryDef, parseInstanceLabel } from "@szewtwin/presentation-shared";
import { RxjsNodeParser } from "../internal/RxjsHierarchyDefinition.js";
import { InstanceHierarchyNodeProcessingParams, SourceInstanceHierarchyNode } from "./IVaultHierarchyNode.js";
import { LimitingDMSqlQueryExecutor } from "./LimitingDMSqlQueryExecutor.js";
import { NodeSelectClauseColumnNames } from "./NodeSelectQueryFactory.js";

interface ReadNodesProps {
  queryExecutor: LimitingDMSqlQueryExecutor;
  query: DMSqlQueryDef;
  limit?: number | "unbounded";
  parser?: RxjsNodeParser;
}

/** @internal */
export function readNodes(props: ReadNodesProps): Observable<SourceInstanceHierarchyNode> {
  const { queryExecutor, query, limit } = props;
  const parser: RxjsNodeParser = props?.parser ?? ((row) => of(defaultNodesParser(row)));
  const config: Parameters<LimitingDMSqlQueryExecutor["createQueryReader"]>[1] = {
    rowFormat: "DMSqlPropertyNames",
    restartToken: `readNodes/${Guid.createValue()}`,
    ...(limit !== undefined ? { limit } : undefined),
  };

  return from(queryExecutor.createQueryReader(query, config)).pipe(mergeMap((row) => parser(row)));
}

/**
 * The interface should contain a member for each `NodeSelectClauseColumnNames` value.
 * @internal
 */
export interface RowDef {
  [NodeSelectClauseColumnNames.FullClassName]: string;
  [NodeSelectClauseColumnNames.DMInstanceId]: Id64String;
  [NodeSelectClauseColumnNames.DisplayLabel]: string;
  [NodeSelectClauseColumnNames.HasChildren]?: boolean;
  [NodeSelectClauseColumnNames.HideIfNoChildren]?: boolean;
  [NodeSelectClauseColumnNames.HideNodeInHierarchy]?: boolean;
  [NodeSelectClauseColumnNames.Grouping]?: string;
  [NodeSelectClauseColumnNames.ExtendedData]?: string;
  [NodeSelectClauseColumnNames.AutoExpand]?: boolean;
  [NodeSelectClauseColumnNames.SupportsFiltering]?: boolean;
}

/** @internal */
export function defaultNodesParser(row: { [columnName: string]: any }): SourceInstanceHierarchyNode {
  const typedRow = row as RowDef;
  const processingParams: InstanceHierarchyNodeProcessingParams = {
    ...(typedRow.HideIfNoChildren ? { hideIfNoChildren: true } : undefined),
    ...(typedRow.HideNodeInHierarchy ? { hideInHierarchy: true } : undefined),
    ...(typedRow.Grouping ? { grouping: JSON.parse(typedRow.Grouping) } : undefined),
  };
  return {
    // don't format the label here - we're going to do that at node pre-processing step to handle both - instance and generic nodes
    label: parseInstanceLabel(typedRow.DisplayLabel),
    key: {
      type: "instances",
      instanceKeys: [{ className: typedRow.FullClassName.replace(":", "."), id: typedRow.DMInstanceId }],
    },
    ...(typedRow.HasChildren !== undefined ? { children: !!typedRow.HasChildren } : undefined),
    ...(typedRow.AutoExpand ? { autoExpand: true } : undefined),
    ...(typedRow.SupportsFiltering ? { supportsFiltering: true } : undefined),
    ...(typedRow.ExtendedData ? { extendedData: JSON.parse(typedRow.ExtendedData) } : undefined),
    ...(Object.keys(processingParams).length > 0 ? { processingParams } : undefined),
  };
}
