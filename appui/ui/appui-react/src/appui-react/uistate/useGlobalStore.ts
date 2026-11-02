/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Utilities
 */

import type { IVaultConnection, ViewState } from "@szewtwin/core-frontend";
import { createStore } from "zustand";
import type { CursorMenuPayload } from "../redux/SessionState.js";

interface GlobalState {
  numItemsSelected: number;
  iVaultConnection: IVaultConnection | undefined;
  viewState: ViewState | undefined;
  cursorMenuPayload: CursorMenuPayload | undefined;
}

/** Replacement for static APIs that were dependent on redux store.
 * @internal
 */
export const useGlobalStore = createStore<GlobalState>(() => ({
  numItemsSelected: 0,
  iVaultConnection: undefined,
  viewState: undefined,
  cursorMenuPayload: undefined,
}));
