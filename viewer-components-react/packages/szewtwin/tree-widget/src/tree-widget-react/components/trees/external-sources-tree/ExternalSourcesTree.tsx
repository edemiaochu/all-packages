/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { useCallback } from "react";
import { SvgDetails, SvgDocument, SvgItem } from "@szewtwin/szewtwinui-icons-react";
import { Tree } from "../common/components/Tree.js";
import { TreeRenderer } from "../common/components/TreeRenderer.js";
import { useGuid } from "../common/useGuid.js";
import { ExternalSourcesTreeComponent } from "./ExternalSourcesTreeComponent.js";
import { ExternalSourcesTreeDefinition } from "./ExternalSourcesTreeDefinition.js";

import type { ReactElement } from "react";
import type { GuidString } from "@szewtwin/core-szewec";
import type { HierarchyDefinition } from "@szewtwin/presentation-hierarchies";
import type { PresentationHierarchyNode } from "@szewtwin/presentation-hierarchies-react";
import type { TreeProps } from "../common/components/Tree.js";

/** @beta */
export type ExternalSourcesTreeProps = Pick<TreeProps, "ivault" | "getSchemaContext" | "selectionStorage" | "density" | "selectionMode"> & {
  hierarchyLevelConfig?: {
    sizeLimit?: number;
  };
};

/** @beta */
export function ExternalSourcesTree(props: ExternalSourcesTreeProps) {
  const componentId = useGuid();
  return (
    <Tree
      {...props}
      treeName={ExternalSourcesTreeComponent.id}
      getHierarchyDefinition={useCallback((definitionProps) => getDefinitionsProvider({ ...definitionProps, componentId }), [componentId])}
      selectionMode={props.selectionMode ?? "none"}
      treeRenderer={(treeProps) => <TreeRenderer {...treeProps} getIcon={getIcon} />}
    />
  );
}

const getDefinitionsProvider = (props: Parameters<TreeProps["getHierarchyDefinition"]>[0] & { componentId: GuidString }): HierarchyDefinition => {
  return new ExternalSourcesTreeDefinition(props);
};

function getIcon(node: PresentationHierarchyNode): ReactElement | undefined {
  if (node.extendedData?.imageId === undefined) {
    return undefined;
  }

  switch (node.extendedData.imageId) {
    case "icon-item":
      return <SvgItem />;
    case "icon-dm-class":
      return <SvgItem />;
    case "icon-document":
      return <SvgDocument />;
    case "icon-dm-schema":
      return <SvgDetails />;
  }

  return undefined;
}
