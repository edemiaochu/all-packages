/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { VisibilityTree } from "../common/components/VisibilityTree.js";
import { VisibilityTreeRenderer } from "../common/components/VisibilityTreeRenderer.js";
import { useModelsTree } from "./UseModelsTree.js";

import type { VisibilityTreeProps } from "../common/components/VisibilityTree.js";
import type { UseModelsTreeProps } from "./UseModelsTree.js";

/** @beta */
export type ModelsTreeProps = Pick<VisibilityTreeProps, "ivault" | "getSchemaContext" | "selectionStorage" | "density" | "selectionMode"> &
  UseModelsTreeProps & {
    hierarchyLevelConfig?: {
      sizeLimit?: number;
    };
  };

/** @beta */
export function ModelsTree({
  ivault,
  getSchemaContext,
  selectionStorage,
  activeView,
  filter,
  density,
  hierarchyLevelConfig,
  hierarchyConfig,
  selectionMode,
  selectionPredicate,
  visibilityHandlerOverrides,
  getFilteredPaths,
  onModelsFiltered,
  getSubTreePaths,
}: ModelsTreeProps) {
  const { modelsTreeProps, rendererProps } = useModelsTree({
    activeView,
    filter,
    hierarchyConfig,
    visibilityHandlerOverrides,
    getFilteredPaths,
    onModelsFiltered,
    selectionPredicate,
    getSubTreePaths,
  });

  return (
    <VisibilityTree
      {...modelsTreeProps}
      ivault={ivault}
      selectionStorage={selectionStorage}
      getSchemaContext={getSchemaContext}
      hierarchyLevelSizeLimit={hierarchyLevelConfig?.sizeLimit}
      density={density}
      selectionMode={selectionMode}
      treeRenderer={(treeProps) => <VisibilityTreeRenderer {...treeProps} {...rendererProps} />}
    />
  );
}
