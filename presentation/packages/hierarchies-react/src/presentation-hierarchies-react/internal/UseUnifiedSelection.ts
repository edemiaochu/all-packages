/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";
import { assert } from "@szewtwin/core-szewec";
import {
  GenericNodeKey,
  HierarchyNode,
  InstancesNodeKey,
  NonGroupingHierarchyNode,
} from "@szewtwin/presentation-hierarchies";
import { InstanceKey } from "@szewtwin/presentation-shared";
import { Selectable, Selectables, SelectionStorage } from "@szewtwin/unified-selection";
import { useUnifiedSelectionStorage } from "../UnifiedSelectionContext.js";
import { SelectionChangeType } from "../UseSelectionHandler.js";
import { isTreeModelHierarchyNode, TreeModelHierarchyNode, TreeModelNode, TreeModelRootNode } from "./TreeModel.js";

/** @internal */
export interface TreeSelectionOptions {
  isNodeSelected: (nodeId: string) => boolean;
  selectNodes: (nodeIds: Array<string>, changeType: SelectionChangeType) => void;
}

/** @public */
export interface UseUnifiedTreeSelectionProps {
  /**
   * Identifier to distinguish this source of changes to the unified selection from another ones in the application.
   */
  sourceName: string;

  /**
   * An optional function that allows customizing the `Selectable` object that gets created for generic hierarchy nodes. When
   * not supplied, the `Selectable` is created using the following signature:
   * ```ts
   * {
   *   identifier: treeModelNodeId,
   *   data: node,
   *   async *loadInstanceKeys() {},
   * }
   * ```
   *
   * @param node Hierarchy node to create a selectable for.
   * @param treeModelNodeId ID of the hierarchy node in the internal tree model. This ID uniquely identifies the node in the whole hierarchy, as opposed to `GenericNodeKey.id` contained within the `node`, which may not be unique.
   */
  createSelectableForGenericNode?: (
    node: NonGroupingHierarchyNode & { key: GenericNodeKey },
    treeModelNodeId: string,
  ) => Selectable;

  /**
   * Unified selection storage to use for listening, getting and changing active selection.
   *
   * When not specified, the deprecated unified selection React context is used to access the
   * selection storage (see `UnifiedSelectionProvider`). This prop will be made required in the
   * next major release, where the deprecated context will also be removed.
   */
  selectionStorage?: SelectionStorage;
}

/** @internal */
export function useUnifiedTreeSelection({
  sourceName,
  selectionStorage,
  getTreeModelNode,
  createSelectableForGenericNode,
}: UseUnifiedTreeSelectionProps & {
  getTreeModelNode: (nodeId: string) => TreeModelNode | TreeModelRootNode | undefined;
}): TreeSelectionOptions {
  /* v8 ignore next -- @preserve */
  const [options, setOptions] = useState<TreeSelectionOptions>(() => ({
    isNodeSelected: () => false,
    selectNodes: () => {},
  }));

  const deprecatedSelectionStorage = useUnifiedSelectionStorage();
  selectionStorage ??= deprecatedSelectionStorage;

  createSelectableForGenericNode ??= defaultCreateSelectableForGenericNode;

  useEffect(() => {
    if (!selectionStorage) {
      // TODO: make selectionStorage prop required
      setOptions({ isNodeSelected: () => false, selectNodes: () => {} });
      return;
    }

    setOptions(createOptions(sourceName, selectionStorage, createSelectableForGenericNode, getTreeModelNode));
    return selectionStorage.selectionChangeEvent.addListener((args) => {
      if (args.level > 0) {
        return;
      }
      setOptions(createOptions(sourceName, selectionStorage, createSelectableForGenericNode, getTreeModelNode));
    });
  }, [selectionStorage, createSelectableForGenericNode, getTreeModelNode, sourceName]);

  return options;
}

const defaultCreateSelectableForGenericNode: NonNullable<
  UseUnifiedTreeSelectionProps["createSelectableForGenericNode"]
> = (node, treeModelNodeId): Selectable => ({ identifier: treeModelNodeId, data: node, async *loadInstanceKeys() {} });

function createOptions(
  source: string,
  storage: SelectionStorage,
  createSelectableForGenericNode: NonNullable<UseUnifiedTreeSelectionProps["createSelectableForGenericNode"]>,
  getNode: (nodeId: string) => TreeModelNode | TreeModelRootNode | undefined,
): TreeSelectionOptions {
  return {
    isNodeSelected: (nodeId: string) => {
      const node = getNode(nodeId);
      if (!node || !isTreeModelHierarchyNode(node)) {
        return false;
      }
      return Object.entries(groupNodeSelectablesByIVaultKey(node, createSelectableForGenericNode)).some(
        ([ivaultKey, nodeSelectables]) => {
          const storageSelectables = storage.getSelection({ ivaultKey, level: 0 });
          return Selectables.hasAny(storageSelectables, nodeSelectables);
        },
      );
    },

    selectNodes: (nodeIds: Array<string>, changeType: SelectionChangeType) => {
      const ivaultSelectables: { [ivaultKey: string]: Selectable[] } = {};
      for (const nodeId of nodeIds) {
        const node = getNode(nodeId);
        if (!node || !isTreeModelHierarchyNode(node)) {
          return;
        }
        Object.entries(groupNodeSelectablesByIVaultKey(node, createSelectableForGenericNode)).forEach(
          ([ivaultKey, nodeSelectables]) => {
            let selectablesList = ivaultSelectables[ivaultKey];
            /* v8 ignore else -- @preserve */
            if (!selectablesList) {
              selectablesList = [];
              ivaultSelectables[ivaultKey] = selectablesList;
            }
            nodeSelectables.forEach((selectable) => selectablesList.push(selectable));
          },
        );
      }
      Object.entries(ivaultSelectables).forEach(([ivaultKey, selectables]) => {
        const actionProps = { ivaultKey, source, selectables, level: 0 };
        switch (changeType) {
          case "add":
            storage.addToSelection(actionProps);
            return;
          case "remove":
            storage.removeFromSelection(actionProps);
            return;
          case "replace":
            storage.replaceSelection(actionProps);
            return;
        }
      });
    },
  };
}

function groupNodeSelectablesByIVaultKey(
  modelNode: TreeModelHierarchyNode,
  createSelectableForGenericNode: NonNullable<UseUnifiedTreeSelectionProps["createSelectableForGenericNode"]>,
): { [ivaultKey: string]: Selectable[] } {
  const hierarchyNode = modelNode.nodeData;
  if (HierarchyNode.isInstancesNode(hierarchyNode)) {
    return groupIVaultInstanceKeys(hierarchyNode.key.instanceKeys);
  }
  if (HierarchyNode.isGroupingNode(hierarchyNode)) {
    return Object.entries(groupIVaultInstanceKeys(hierarchyNode.groupedInstanceKeys)).reduce(
      (ivaultSelectables, [ivaultKey, instanceKeys]) => ({
        ...ivaultSelectables,
        [ivaultKey]: [
          {
            identifier: modelNode.id,
            data: hierarchyNode,
            async *loadInstanceKeys() {
              for (const key of instanceKeys) {
                yield key;
              }
            },
          },
        ],
      }),
      {} as { [ivaultKey: string]: Selectable[] },
    );
  }
  assert(HierarchyNode.isGeneric(hierarchyNode));
  return {
    // note: generic nodes aren't associated with an ivault
    [""]: [createSelectableForGenericNode(hierarchyNode, modelNode.id)],
  };
}

function groupIVaultInstanceKeys(instanceKeys: InstancesNodeKey["instanceKeys"]) {
  return instanceKeys.reduce(
    (ivaultSelectables, key) => {
      const ivaultKey = key.ivaultKey ?? "";
      let selectablesList = ivaultSelectables[ivaultKey];
      /* v8 ignore else -- @preserve */
      if (!selectablesList) {
        selectablesList = [];
        ivaultSelectables[ivaultKey] = selectablesList;
      }
      selectablesList.push(key);
      return ivaultSelectables;
    },
    {} as { [ivaultKey: string]: InstanceKey[] },
  );
}
