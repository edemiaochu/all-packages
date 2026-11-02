/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import {
  DMClassGroupingNodeKey,
  DMInstancesNodeKey,
  Node,
  NodePathElement,
  StandardNodeTypes,
} from "@szewtwin/presentation-common";
import { createTestDMInstanceKey } from "./Common.js";
import { createTestLabelDefinition } from "./LabelDefinition.js";

/* eslint-disable @typescript-eslint/no-deprecated */

export function createTestDMInstancesNodeKey(key?: Partial<DMInstancesNodeKey>): DMInstancesNodeKey {
  return {
    type: StandardNodeTypes.DMInstancesNode,
    version: 2,
    pathFromRoot: key?.pathFromRoot ?? ["parentHash", "childHash"],
    instanceKeys: key?.instanceKeys ?? [createTestDMInstanceKey(), createTestDMInstanceKey()],
  };
}

export function createTestDMClassGroupingNodeKey(key?: Partial<DMClassGroupingNodeKey>): DMClassGroupingNodeKey {
  return {
    type: StandardNodeTypes.DMClassGroupingNode,
    version: 2,
    pathFromRoot: key?.pathFromRoot ?? ["hash"],
    className: key?.className ?? "TestSchema:GroupedClass",
    groupedInstancesCount: key?.groupedInstancesCount ?? 2,
  };
}

export function createTestDMInstancesNode(props?: Partial<Node>): Node {
  return {
    key: props?.key ?? createTestDMInstancesNodeKey(),
    label: props?.label ?? createTestLabelDefinition(),
    description: props?.description ?? "testDescription",
    hasChildren: props?.hasChildren ?? false,
    isSelectionDisabled: props?.isSelectionDisabled ?? false,
    isEditable: props?.isEditable ?? false,
    isExpanded: props?.isExpanded ?? false,
    supportsFiltering: props?.supportsFiltering,
  };
}

export function createTestNodePathElement(element?: Partial<NodePathElement>): NodePathElement {
  return {
    node: element?.node ?? createTestDMInstancesNode(),
    index: element?.index ?? 0,
    children: element?.children ?? [],
    isMarked: element?.isMarked,
    filteringData: element?.filteringData,
  };
}
