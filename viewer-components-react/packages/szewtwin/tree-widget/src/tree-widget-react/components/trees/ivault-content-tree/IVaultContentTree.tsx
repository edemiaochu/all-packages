/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { useCallback } from "react";
import { SvgFolder, SvgGroup, SvgHierarchyTree, SvgIvaultHollow, SvgItem, SvgLayers, SvgModel } from "@szewtwin/szewtwinui-icons-react";
import { Tree } from "../common/components/Tree.js";
import { TreeRenderer } from "../common/components/TreeRenderer.js";
import { useGuid } from "../common/useGuid.js";
import { IVaultContentTreeComponent } from "./IVaultContentTreeComponent.js";
import { defaultHierarchyConfiguration, IVaultContentTreeDefinition } from "./IVaultContentTreeDefinition.js";
import { IVaultContentTreeIdsCache } from "./internal/IVaultContentTreeIdsCache.js";

import type { ReactElement } from "react";
import type { PresentationHierarchyNode } from "@szewtwin/presentation-hierarchies-react";
import type { TreeProps } from "../common/components/Tree.js";
import type { IVaultContentTreeHierarchyConfiguration } from "./IVaultContentTreeDefinition.js";

/** @beta */
export type IVaultContentTreeProps = Pick<TreeProps, "ivault" | "getSchemaContext" | "selectionStorage" | "density" | "selectionMode"> & {
  hierarchyLevelConfig?: {
    sizeLimit?: number;
  };
  hierarchyConfig?: Partial<IVaultContentTreeHierarchyConfiguration>;
};

/** @beta */
export function IVaultContentTree({ hierarchyConfig: hierarchyConfigProp, ...props }: IVaultContentTreeProps) {
  const componentId = useGuid();
  const getHierarchyDefinition = useCallback<TreeProps["getHierarchyDefinition"]>(
    ({ ivaultAccess }) => {
      const hierarchyConfig = {
        ...defaultHierarchyConfiguration,
        ...hierarchyConfigProp,
      };
      return new IVaultContentTreeDefinition({ ivaultAccess, idsCache: new IVaultContentTreeIdsCache(ivaultAccess, componentId), hierarchyConfig });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    Object.values({ ...(hierarchyConfigProp ?? {}), componentId }),
  );

  return (
    <Tree
      {...props}
      treeName={IVaultContentTreeComponent.id}
      getHierarchyDefinition={getHierarchyDefinition}
      selectionMode={props.selectionMode ?? "extended"}
      treeRenderer={(treeProps) => <TreeRenderer {...treeProps} getIcon={getIcon} />}
    />
  );
}

function getIcon(node: PresentationHierarchyNode): ReactElement | undefined {
  if (node.extendedData?.imageId === undefined) {
    return undefined;
  }

  switch (node.extendedData.imageId) {
    case "icon-layers":
      return <SvgLayers />;
    case "icon-item":
      return <SvgItem />;
    case "icon-dm-class":
      return <SvgItem />;
    case "icon-ivault-hollow-2":
      return <SvgIvaultHollow />;
    case "icon-folder":
      return <SvgFolder />;
    case "icon-model":
      return <SvgModel />;
    case "icon-hierarchy-tree":
      return <SvgHierarchyTree />;
    case "icon-group":
      return <SvgGroup />;
  }

  return undefined;
}
