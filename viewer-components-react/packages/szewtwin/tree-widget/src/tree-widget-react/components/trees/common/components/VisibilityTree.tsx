/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { useCallback } from "react";
import { useHierarchyVisibility } from "../UseHierarchyVisibility.js";
import { useIVaultAccess } from "../UseIVaultAccess.js";
import { TreeBase } from "./Tree.js";

import type { ReactNode } from "react";
import type { DMClassHierarchyInspector } from "@szewtwin/presentation-shared";
import type { HierarchyVisibilityHandler } from "../UseHierarchyVisibility.js";
import type { FunctionProps } from "../Utils.js";
import type { TreeProps } from "./Tree.js";
import type { VisibilityTreeRendererProps } from "./VisibilityTreeRenderer.js";

/** @beta */
export type VisibilityTreeProps = Omit<TreeProps, "treeRenderer" | "ivaultAccess"> & {
  /** Callback for creating visibility handler used to control visibility of instances represented by tree nodes. */
  visibilityHandlerFactory: (props: { ivaultAccess: DMClassHierarchyInspector }) => HierarchyVisibilityHandler;
  /** Tree renderer that should be used to render tree data. */
  treeRenderer: (
    treeProps: FunctionProps<TreeProps["treeRenderer"]> & Pick<VisibilityTreeRendererProps, "getCheckboxState" | "onCheckboxClicked">,
  ) => ReactNode;
};

/**
 * Tree component that can control visibility of instances represented by tree nodes.
 * @beta
 */
export function VisibilityTree({ visibilityHandlerFactory, treeRenderer, hierarchyLevelSizeLimit, ...props }: VisibilityTreeProps) {
  const { ivault, getSchemaContext } = props;
  const { ivaultAccess, currentHierarchyLevelSizeLimit } = useIVaultAccess({
    ivault,
    getSchemaContext,
    hierarchyLevelSizeLimit,
  });

  const { getCheckboxState, onCheckboxClicked, triggerRefresh } = useHierarchyVisibility({
    visibilityHandlerFactory: useCallback(() => visibilityHandlerFactory({ ivaultAccess }), [visibilityHandlerFactory, ivaultAccess]),
  });

  return (
    <TreeBase
      {...props}
      onReload={triggerRefresh}
      ivaultAccess={ivaultAccess}
      currentHierarchyLevelSizeLimit={currentHierarchyLevelSizeLimit}
      treeRenderer={(treeProps) => treeRenderer({ ...treeProps, getCheckboxState, onCheckboxClicked })}
    />
  );
}
