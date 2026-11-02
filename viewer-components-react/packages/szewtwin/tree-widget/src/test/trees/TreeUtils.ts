/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Code, ColorDef, IVault, RenderMode } from "@szewtwin/core-common";
import { IVaultApp, SpatialViewState } from "@szewtwin/core-frontend";

import type { Id64Array } from "@szewtwin/core-szewec";
import type { IVaultConnection } from "@szewtwin/core-frontend";
import type { NonGroupingHierarchyNode } from "@szewtwin/presentation-hierarchies";
import type { PresentationHierarchyNode } from "@szewtwin/presentation-hierarchies-react";

export function createPresentationHierarchyNode(partial?: Partial<PresentationHierarchyNode>): PresentationHierarchyNode {
  return {
    id: "test-node",
    label: "test-node",
    isExpanded: false,
    isLoading: false,
    isFilterable: false,
    isFiltered: false,
    nodeData: createNonGroupingHierarchyNode(),
    children: [],
    ...partial,
  };
}

export function createNonGroupingHierarchyNode(partial?: Partial<NonGroupingHierarchyNode>): NonGroupingHierarchyNode {
  return {
    label: "test-node",
    key: { type: "instances", instanceKeys: [] },
    parentKeys: [],
    children: false,
    ...partial,
  };
}

export async function createViewState(iVault: IVaultConnection, categoryIds: Id64Array, modelIds: Id64Array) {
  const model = IVault.dictionaryId;
  const viewState = SpatialViewState.createFromProps(
    {
      categorySelectorProps: { categories: categoryIds, model, code: Code.createEmpty(), classFullName: "BisCore:CategorySelector" },
      displayStyleProps: { model, code: Code.createEmpty(), classFullName: "BisCore:DisplayStyle3d" },
      viewDefinitionProps: {
        model,
        code: Code.createEmpty(),
        categorySelectorId: "",
        classFullName: "BisCore:SpatialViewDefinition",
        displayStyleId: "",
      },
      modelSelectorProps: {
        models: modelIds,
        code: Code.createEmpty(),
        model,
        classFullName: "BisCore:ModelSelector",
      },
    },
    iVault,
  );

  viewState.setAllow3dManipulations(true);

  viewState.displayStyle.backgroundColor = ColorDef.white;
  const flags = viewState.viewFlags.copy({
    grid: false,
    renderMode: RenderMode.SmoothShade,
    backgroundMap: false,
  });
  viewState.displayStyle.viewFlags = flags;

  IVaultApp.viewManager.onViewOpen.addOnce((vp) => {
    if (vp.view.hasSameCoordinates(viewState)) {
      vp.applyViewState(viewState);
    }
  });
  await viewState.load();
  return viewState;
}
