/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Hooks
 */

import { useSyncExternalStore } from "react";
import type { ScreenViewport } from "@szewtwin/core-frontend";
import { IVaultApp } from "@szewtwin/core-frontend";

const subscribe = (onStoreChange: () => void) => {
  return IVaultApp.viewManager.onSelectedViewportChanged.addListener(
    onStoreChange
  );
};

const getSnapshot = () => {
  return IVaultApp.viewManager.selectedView;
};

/** React hook that maintains the active viewport.
 * @public
 */
export function useActiveViewport(): ScreenViewport | undefined {
  const activeViewport = useSyncExternalStore(subscribe, getSnapshot);
  return activeViewport;
}
