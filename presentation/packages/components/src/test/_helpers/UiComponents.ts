/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/no-deprecated */

import { PrimitiveValue, PropertyDescription, PropertyRecord, PropertyValueFormat } from "@szewtwin/appui-abstract";
import { DelayLoadedTreeNodeItem } from "@szewtwin/components-react";
import { NodeKey } from "@szewtwin/presentation-common";
import { PresentationTreeNodeItem } from "../../presentation-components/tree/PresentationTreeNodeItem.js";
import { createTestDMInstancesNodeKey } from "./Hierarchy.js";

export function createTestTreeNodeItem(
  key?: NodeKey,
  partialNode?: Partial<DelayLoadedTreeNodeItem>,
): PresentationTreeNodeItem {
  const node = {
    id: partialNode?.id ?? "node_id",
    parentId: partialNode?.parentId,
    label: partialNode?.label ?? PropertyRecord.fromString("Node Label"),
    description: partialNode?.description ?? "Test Node Description",
    hasChildren: partialNode?.hasChildren ?? false,
    key: key ? key : createTestDMInstancesNodeKey(),
  };
  return node;
}

export function createTestPropertyRecord(value?: Partial<PrimitiveValue>, property?: Partial<PropertyDescription>) {
  const recordValue: PrimitiveValue = {
    valueFormat: PropertyValueFormat.Primitive,
    value: "test_prop_value",
    displayValue: "test_prop_displayValue",
    ...value,
  };
  const description: PropertyDescription = {
    typename: "string",
    name: "test_prop",
    displayLabel: "TestProp",
    ...property,
  };
  return new PropertyRecord(recordValue, description);
}
