/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { createAsyncIterator } from "presentation-test-utilities";
import { CustomSelectable, SelectableInstanceKey } from "../../unified-selection/Selectable.js";

/**
 * Generates a random DM instance ID`
 * @internal Used for testing only.
 */
export const createDMInstanceId = (id: number = 1): string => {
  return `0x${id}`;
};

/**
 * Generates a random `SelectableInstanceKey`
 * @internal Used for testing only.
 */
export const createSelectableInstanceKey = (
  id: number = 1,
  className: string = "TestSchema.TestClass",
): SelectableInstanceKey => {
  return { className, id: createDMInstanceId(id) };
};

/**
 * Generates a random `CustomSelectable`
 * @internal Used for testing only.
 */
export const createCustomSelectable = (id: number = 1, instanceKeys?: SelectableInstanceKey[]): CustomSelectable => {
  return {
    identifier: createDMInstanceId(id),
    loadInstanceKeys: () => createAsyncIterator(instanceKeys ?? []),
    data: {},
  };
};
