/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Guid, Id64, Id64Arg, Id64Array } from "@szewtwin/core-szewec";
import {
  DMSqlBinding,
  DMSqlQueryDef,
  DMSqlQueryExecutor,
  DMSqlQueryReaderOptions,
  DMSqlQueryRow,
} from "@szewtwin/presentation-shared";
import { SelectableInstanceKey } from "./Selectable.js";
import { formIdBindings, genericExecuteQuery } from "./Utils.js";

/**
 * Available selection scopes.
 * @public
 */
type SelectionScopeIdentifier = "element" | "model" | "category" | "functional";

/**
 * Props for computing element selection.
 * @public
 */
export interface ElementSelectionScopeProps {
  /** Identifies this as either "element" or "functional" selection scope */
  id: "element" | "functional";
  /**
   * Specifies how far "up" we should walk to find the target element. When not specified or `0`,
   * the target element matches the request element. When set to `1`, the target element matches the direct parent element.
   * When set to `2`, the target element is parent of the parent element and so on. In all situations when this is `> 0`,
   * we're not walking further than the last existing element, for example when `ancestorLevel = 1` (direct parent
   * element is requested), but the request element doesn't have a parent, the request element is returned as the result.
   * A negative value would result in the top-most element to be returned.
   */
  ancestorLevel?: number;
}

/**
 * A union of types that can be used to define a selection scope.
 * @public
 * @since 1.4.0
 */
export type SelectionScope = ElementSelectionScopeProps | { id: SelectionScopeIdentifier } | SelectionScopeIdentifier;

/**
 * Props for `computeSelection`.
 * @public
 */
export interface ComputeSelectionProps {
  /** iVault query executor. */
  queryExecutor: DMSqlQueryExecutor;
  /** IDs of elements to compute selection for. */
  elementIds: Id64Arg;
  /** Selection scope to compute selection with. */
  scope: SelectionScope;
  /** Optional unique id of the component that consumes this function. It can be any string, as long as it is not shared across different components. */
  componentId?: string;
}

/**
 * Computes selection from given element IDs.
 * @public
 */
export async function* computeSelection(props: ComputeSelectionProps): AsyncIterableIterator<SelectableInstanceKey> {
  const { queryExecutor, elementIds, scope } = props;
  const componentId = props.componentId ?? Guid.createValue();
  const componentName = "computeSelection";
  if (typeof scope === "string") {
    yield* computeSelection({ queryExecutor, elementIds, scope: { id: scope }, componentId });
    return;
  }

  const nonTransientIds: Id64Array = [];
  for (const id of Id64.iterable(elementIds)) {
    if (!Id64.isTransient(id)) {
      nonTransientIds.push(id);
    }
  }

  switch (scope.id) {
    case "element":
      yield* computeElementSelection(
        queryExecutor,
        nonTransientIds,
        (scope as ElementSelectionScopeProps).ancestorLevel ?? 0,
        componentId,
        componentName,
      );
      return;
    case "category":
      yield* computeCategorySelection(queryExecutor, nonTransientIds, componentId, componentName);
      return;
    case "model":
      yield* computeModelSelection(queryExecutor, nonTransientIds, componentId, componentName);
      return;
    case "functional":
      yield* computeFunctionalElementSelection(
        queryExecutor,
        nonTransientIds,
        (scope as ElementSelectionScopeProps).ancestorLevel ?? 0,
        componentId,
        componentName,
      );
      return;
  }
}

async function* computeElementSelection(
  queryExecutor: DMSqlQueryExecutor,
  elementIds: string[],
  ancestorLevel: number,
  componentId: string,
  componentName: string,
): AsyncIterableIterator<SelectableInstanceKey> {
  const bindings: DMSqlBinding[] = [];
  const recurseUntilRoot = ancestorLevel < 0;
  const ctes = [
    `
      AncestorElements(DMInstanceId, DMClassId, Depth, ParentId) AS (
        SELECT DMInstanceId, DMClassId, ${formAncestorLevelBinding(ancestorLevel, bindings)}, Parent.Id
        FROM BisCore.Element
        WHERE ${formIdBindings("DMInstanceId", elementIds, bindings)}
        UNION ALL
        SELECT pe.DMInstanceId, pe.DMClassId, a.Depth - 1, pe.Parent.Id
        FROM AncestorElements a
        JOIN BisCore.Element pe ON pe.DMInstanceId = a.ParentId
        WHERE ${recurseUntilRoot ? "" : "Depth > 0 AND"} ParentId IS NOT NULL
      )
    `,
  ];
  const dmsql = `
    SELECT DISTINCT DMInstanceId, dm_classname(DMClassId, 's.c') AS ClassName
    FROM AncestorElements
    WHERE ${recurseUntilRoot ? "" : "Depth = 0 OR"} ParentId IS NULL
  `;
  yield* executeQuery({
    queryExecutor,
    query: { ctes, dmsql, bindings },
    config: { restartToken: `${componentName}/${componentId}/element/${Guid.createValue()}` },
  });
}

async function* computeCategorySelection(
  queryExecutor: DMSqlQueryExecutor,
  ids: string[],
  componentId: string,
  componentName: string,
): AsyncIterableIterator<SelectableInstanceKey> {
  const bindings: DMSqlBinding[] = [];
  const dmsql = [
    `
      SELECT DISTINCT c.DMInstanceId, dm_classname(c.DMClassId, 's.c') AS ClassName
      FROM BisCore.Category c
      JOIN BisCore.GeometricElement2d ge ON ge.Category.Id = c.DMInstanceId
      WHERE ${formIdBindings("ge.DMInstanceId", ids, bindings)}
    `,
    `
      SELECT DISTINCT c.DMInstanceId, dm_classname(c.DMClassId, 's.c') AS ClassName
      FROM BisCore.Category c
      JOIN BisCore.GeometricElement3d ge ON ge.Category.Id = c.DMInstanceId
      WHERE ${formIdBindings("ge.DMInstanceId", ids, bindings)}
    `,
  ].join(" UNION ALL ");
  yield* executeQuery({
    queryExecutor,
    query: { dmsql, bindings },
    config: { restartToken: `${componentName}/${componentId}/category/${Guid.createValue()}` },
  });
}

async function* computeModelSelection(
  queryExecutor: DMSqlQueryExecutor,
  ids: string[],
  componentId: string,
  componentName: string,
): AsyncIterableIterator<SelectableInstanceKey> {
  const bindings: DMSqlBinding[] = [];
  const dmsql = `
    SELECT DISTINCT m.DMInstanceId, dm_classname(m.DMClassId, 's.c') AS ClassName
    FROM BisCore.Model m
    JOIN BisCore.Element e ON e.Model.Id = m.DMInstanceId
    WHERE ${formIdBindings("e.DMInstanceId", ids, bindings)}
  `;
  yield* executeQuery({
    queryExecutor,
    query: { dmsql, bindings },
    config: { restartToken: `${componentName}/${componentId}/model/${Guid.createValue()}` },
  });
}

async function* computeFunctionalElementSelection(
  queryExecutor: DMSqlQueryExecutor,
  ids: string[],
  ancestorLevel: number,
  componentId: string,
  componentName: string,
): AsyncIterableIterator<SelectableInstanceKey> {
  const bindings: DMSqlBinding[] = [];
  const recurseUntilRoot = ancestorLevel < 0;
  // cspell:disable
  const ctes = [
    `
      Elements2dOrNearestFunctionalElements(OriginalDMInstanceId, OriginalDMClassId, DMInstanceId, DMClassId, ParentId) AS (
        SELECT DMInstanceId, DMClassId, DMInstanceId, DMClassId, Parent.Id
        FROM BisCore.Element
        WHERE ${formIdBindings("DMInstanceId", ids, bindings)} AND DMClassId IS NOT (BisCore.GeometricElement3d)
        UNION ALL
        SELECT
          e2onfe.OriginalDMInstanceId,
          e2onfe.OriginalDMClassId,
          COALESCE(dgrfe.TargetDMInstanceId, pe.DMInstanceId),
          COALESCE(dgrfe.TargetDMClassId, pe.DMClassId),
          pe.Parent.Id
        FROM Elements2dOrNearestFunctionalElements e2onfe
        LEFT JOIN BisCore.Element pe ON pe.DMInstanceId = e2onfe.ParentId
        LEFT JOIN Functional.DrawingGraphicRepresentsFunctionalElement dgrfe ON dgrfe.SourceDMInstanceId = e2onfe.DMInstanceId
        WHERE e2onfe.DMClassId IS NOT (Functional.FunctionalElement) AND (e2onfe.ParentId IS NOT NULL OR dgrfe.TargetDMInstanceId IS NOT NULL)
      )
    `,
    `
      Element2dNearestFunctionalElements(OriginalDMInstanceId, DMInstanceId, DMClassId) AS (
        SELECT OriginalDMInstanceId, DMInstanceId, DMClassId
        FROM Elements2dOrNearestFunctionalElements
        WHERE DMClassId IS (Functional.FunctionalElement)
      )
    `,
    `
      Elements2dWithoutFunctionalElement(DMInstanceId, DMClassId) AS (
        SELECT e2wfe.OriginalDMInstanceId, OriginalDMClassId
        FROM Elements2dOrNearestFunctionalElements e2wfe
        LEFT JOIN Element2dNearestFunctionalElements e2nfe ON e2nfe.OriginalDMInstanceId = e2wfe.OriginalDMInstanceId
        WHERE e2wfe.ParentId IS NULL AND e2nfe.DMInstanceId IS NULL
      )
    `,
    `
      Elements2d(DMInstanceId, DMClassId) AS (
        SELECT DMInstanceId, DMClassId FROM Element2dNearestFunctionalElements
        UNION
        SELECT DMInstanceId, DMClassId FROM Elements2dWithoutFunctionalElement
      )
    `,
    `
      Element2dAncestorElements(DMInstanceId, DMClassId, Depth, ParentId) AS (
        SELECT e.DMInstanceId, e.DMClassId, ${formAncestorLevelBinding(ancestorLevel, bindings)}, e.Parent.Id
        FROM BisCore.Element e
        JOIN Elements2d e2d ON e2d.DMInstanceId = e.DMInstanceId
        UNION ALL
        SELECT pe.DMInstanceId, pe.DMClassId, e2ae.Depth - 1, pe.Parent.Id
        FROM Element2dAncestorElements e2ae
        JOIN BisCore.Element pe ON pe.DMInstanceId = e2ae.ParentId
        WHERE ${recurseUntilRoot ? "" : "Depth > 0 AND"} ParentId IS NOT NULL
      )
    `,
    `
      Element3dAncestorElements(DMInstanceId, DMClassId, Depth, ParentId) AS (
        SELECT ge.DMInstanceId, ge.DMClassId, ${formAncestorLevelBinding(ancestorLevel, bindings)}, ge.Parent.Id
        FROM BisCore.GeometricElement3d ge
        WHERE ${formIdBindings("ge.DMInstanceId", ids, bindings)}
        UNION ALL
        SELECT pe.DMInstanceId, pe.DMClassId, e3ae.Depth - 1, pe.Parent.Id
        FROM Element3dAncestorElements e3ae
        JOIN BisCore.Element pe ON pe.DMInstanceId = e3ae.ParentId
        WHERE ${recurseUntilRoot ? "" : "Depth > 0 AND"} ParentId IS NOT NULL
      )
    `,
    `
      Element3dAncestorRelatedFunctionalElement(DMInstanceId, ClassName) AS (
        SELECT
          COALESCE(peff.TargetDMInstanceId, e3ae.DMInstanceId),
          dm_classname(COALESCE(peff.TargetDMClassId, e3ae.DMClassId), 's.c')
        FROM Element3dAncestorElements e3ae
        LEFT JOIN Functional.PhysicalElementFulfillsFunction peff ON peff.SourceDMInstanceId = e3ae.DMInstanceId
        WHERE ${recurseUntilRoot ? "" : "e3ae.Depth = 0 OR"} e3ae.ParentId IS NULL
      )
    `,
  ];
  const dmsql = [
    `
      SELECT DISTINCT DMInstanceId, dm_classname(DMClassId, 's.c') AS ClassName
        FROM Element2dAncestorElements
       WHERE ${recurseUntilRoot ? "" : "Depth = 0 OR"} ParentId IS NULL
    `,
    `
      SELECT DISTINCT DMInstanceId, ClassName FROM Element3dAncestorRelatedFunctionalElement
    `,
  ].join(" UNION ");
  // cspell:enable
  yield* executeQuery({
    queryExecutor,
    query: { ctes, dmsql, bindings },
    config: { restartToken: `${componentName}/${componentId}/functional-element/${Guid.createValue()}` },
  });
}

function formAncestorLevelBinding(ancestorLevel: number, bindings: DMSqlBinding[]) {
  bindings.push({ type: "int", value: ancestorLevel });
  return "?";
}

async function* executeQuery(props: {
  queryExecutor: DMSqlQueryExecutor;
  query: DMSqlQueryDef;
  config?: DMSqlQueryReaderOptions;
}): AsyncIterableIterator<SelectableInstanceKey> {
  yield* genericExecuteQuery({
    ...props,
    parseQueryRow: (row: DMSqlQueryRow) => ({ className: row.ClassName, id: row.DMInstanceId }),
  });
}
