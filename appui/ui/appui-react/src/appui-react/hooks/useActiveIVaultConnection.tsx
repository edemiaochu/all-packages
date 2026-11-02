/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Hooks
 */

import * as React from "react";
import type { IVaultConnection } from "@szewtwin/core-frontend";
import { UiFramework } from "../UiFramework.js";

const subscribe = (onStoreChange: () => void) => {
  return UiFramework.onIVaultConnectionChanged.addListener(onStoreChange);
};

const getSnapshot = () => {
  return UiFramework.getIVaultConnection();
};

/** React hook that maintains the active IVaultConnection. For this hook to work properly the
 * IVaultConnection must be set using {@link UiFramework.setIVaultConnection} method.
 * @public
 */
export function useActiveIVaultConnection(): IVaultConnection | undefined {
  return React.useSyncExternalStore(subscribe, getSnapshot);
}
