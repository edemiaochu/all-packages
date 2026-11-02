/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import "./SelectableTree.scss";

import { useEffect, useState } from "react";
import { useActiveIVaultConnection } from "@szewtwin/appui-react";
import { Flex, ProgressLinear } from "@szewtwin/szewtwinui-react";
import { TreeWidget } from "../TreeWidget.js";
import { TreeSelector } from "./TreeSelector.js";

import type { PropsWithChildren } from "react";
import type { IVaultConnection } from "@szewtwin/core-frontend";
import type { TreeContentDefinition, TreeSelectorProps } from "./TreeSelector.js";

/**
 * Props for rendering trees
 * @public
 */
export interface SelectableTreeRenderProps {
  density?: "enlarged" | "default";
  onPerformanceMeasured?: (featureId: string, elapsedTime: number) => void;
  onFeatureUsed?: (feature: string) => void;
}

/**
 * Definition of a tree component displayed in `SelectableTree`.
 * @public
 */
export interface SelectableTreeDefinition {
  /** Id of the tree */
  id: string;
  /** Callback that is used to get tree label */
  getLabel: () => string;
  /** Callback that is used to render tree component */
  render: (props: SelectableTreeRenderProps) => React.ReactNode;
  /**
   * Callback that is used to determine if tree should be shown for current active iVault connection.
   * If callback is `undefined` tree is shown for all iVault connections.
   */
  shouldShow?: (ivault: IVaultConnection) => Promise<boolean>;
  /** Icon to render before tree label in tree selector */
  startIcon?: React.ReactNode;
}

/**
 * Props for `SelectableTree`
 * @public
 */
export interface SelectableTreeProps {
  trees: SelectableTreeDefinition[];
  density?: "enlarged" | "default";
  onPerformanceMeasured?: (feature: string, elapsedTime: number) => void;
  onFeatureUsed?: (feature: string) => void;
}

/**
 * A component that renders a tree (combo box) selector and the selected tree component.
 * @public
 */
export function SelectableTree(props: SelectableTreeProps) {
  const ivault = useActiveIVaultConnection();
  if (!ivault) {
    return null;
  }
  return <SelectableTreeContent {...props} ivault={ivault} />;
}

function SelectableTreeContent(props: SelectableTreeProps & { ivault: IVaultConnection }) {
  const { trees: treeDefinitions, ivault } = props;
  const trees = useActiveTrees(treeDefinitions, ivault);

  return (
    <div className="tree-widget-selectable-tree">
      <TreeSelector
        {...getTreeSelectorProps(trees)}
        density={props.density}
        onPerformanceMeasured={props.onPerformanceMeasured}
        onFeatureUsed={props.onFeatureUsed}
      />
    </div>
  );
}

function useActiveTrees(treeDefinitions: SelectableTreeDefinition[], ivault: IVaultConnection) {
  const [trees, setTrees] = useState<TreeContentDefinition[]>();

  useEffect(() => {
    let disposed = false;
    void (async () => {
      const visibleTrees = await getActiveTrees(treeDefinitions, ivault);
      if (!disposed) {
        setTrees(visibleTrees);
      }
    })();

    return () => {
      disposed = true;
    };
  }, [treeDefinitions, ivault]);

  return trees;
}

async function getActiveTrees(treeDefinitions: SelectableTreeDefinition[], ivault: IVaultConnection): Promise<TreeContentDefinition[]> {
  const handleDefinition = async (treeDef: SelectableTreeDefinition) => {
    if (treeDef.shouldShow !== undefined && !(await treeDef.shouldShow(ivault))) {
      return undefined;
    }
    return {
      id: treeDef.id,
      label: treeDef.getLabel(),
      render: treeDef.render,
      startIcon: treeDef.startIcon,
    };
  };

  return (await Promise.all(treeDefinitions.map(handleDefinition))).filter((tree) => tree !== undefined) as TreeContentDefinition[];
}

function getTreeSelectorProps(trees?: TreeContentDefinition[]): TreeSelectorProps {
  if (trees === undefined) {
    return {
      defaultSelectedContentId: "loading",
      trees: [
        {
          id: "loading",
          label: "",
          render: () => (
            <Delayed>
              <ProgressLinear indeterminate={true} />
            </Delayed>
          ),
        },
      ],
    };
  }

  if (trees.length === 0) {
    return {
      defaultSelectedContentId: "no-trees",
      trees: [
        {
          id: "no-trees",
          label: "",
          render: () => (
            <Flex justifyContent="center" alignItems="center" className="tree-widget-no-trees-container">
              {TreeWidget.translate("selectableTree.noTrees")}
            </Flex>
          ),
        },
      ],
    };
  }

  return {
    defaultSelectedContentId: trees[0].id,
    trees,
  };
}

function Delayed({ delay = 200, children }: PropsWithChildren<{ delay?: number }>) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      setShow(true);
    }, delay);
    return () => {
      clearTimeout(id);
    };
  }, [delay]);

  if (!show) {
    return null;
  }

  return <>{children}</>;
}
