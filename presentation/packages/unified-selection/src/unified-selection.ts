/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

export {
  TRANSIENT_ELEMENT_CLASSNAME,
  CustomSelectable,
  Selectable,
  SelectableIdentifier,
  SelectableInstanceKey,
  Selectables,
} from "./unified-selection/Selectable.js";
export { SelectionStorage, createStorage } from "./unified-selection/SelectionStorage.js";
export { createHiliteSetProvider, HiliteSet, HiliteSetProvider } from "./unified-selection/HiliteSetProvider.js";
export {
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  createCachingHiliteSetProvider,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  CachingHiliteSetProvider,
} from "./unified-selection/CachingHiliteSetProvider.js";
export { createIVaultHiliteSetProvider, IVaultHiliteSetProvider } from "./unified-selection/IVaultHiliteSetProvider.js";
export { computeSelection, SelectionScope } from "./unified-selection/SelectionScope.js";
export { enableUnifiedSelectionSyncWithIVault } from "./unified-selection/EnableUnifiedSelectionSyncWithIVault.js";
export {
  StorageSelectionChangeType,
  StorageSelectionChangeEventArgs,
  StorageSelectionChangesListener,
} from "./unified-selection/SelectionChangeEvent.js";
