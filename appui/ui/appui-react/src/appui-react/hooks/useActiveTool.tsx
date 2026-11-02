/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Hooks
 */

import { useSyncExternalStore } from "react";
import { IVaultApp } from "@szewtwin/core-frontend";
import type { InteractiveTool } from "@szewtwin/core-frontend";

const subscribe = (onStoreChange: () => void) => {
  return IVaultApp.toolAdmin.activeToolChanged.addListener(onStoreChange);
};

const getSnapshot = () => {
  return IVaultApp.toolAdmin.activeTool;
};

/** React hook that maintains the active tool.
 * @internal
 */
export function useActiveTool(): InteractiveTool | undefined {
  const activeTool = useSyncExternalStore(subscribe, getSnapshot);
  return activeTool;
}
