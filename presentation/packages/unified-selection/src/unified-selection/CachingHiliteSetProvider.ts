/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/no-deprecated */

import "./DisposePolyfill.js";

import { DMClassHierarchyInspector, DMSqlQueryExecutor } from "@szewtwin/presentation-shared";
import { createHiliteSetProvider, HiliteSet } from "./HiliteSetProvider.js";
import { createIVaultHiliteSetProvider } from "./IVaultHiliteSetProvider.js";
import { SelectionStorage } from "./SelectionStorage.js";

/**
 * Props for creating a `CachingHiliteSetProvider` instance.
 * @public
 * @deprecated in 1.5. Use `IVaultHiliteSetProviderProps` instead.
 */
export interface CachingHiliteSetProviderProps {
  /** Selection storage to use for retrieving the hilite set. */
  selectionStorage: SelectionStorage;

  /** A callback that should return iVault access by iVault key. */
  ivaultProvider: (ivaultKey: string) => DMClassHierarchyInspector & DMSqlQueryExecutor;

  /** An optional hilite set provider factory. If not provided, defaults to `createHiliteSetProvider` from this package. */
  createHiliteSetProvider?: typeof createHiliteSetProvider;
}

/**
 * Defines return value of `createCachingHiliteSetProvider`.
 *
 * **Warning:** Used in public API as a return value. Not expected to be created / extended by package
 * consumers, may be supplemented with required attributes any time.
 *
 * @see `createCachingHiliteSetProvider`
 * @public
 * @deprecated in 1.5. Use `IVaultHiliteSetProvider` instead.
 */
export interface CachingHiliteSetProvider {
  /** Get the current hilite set iterator for the specified ivault */
  getHiliteSet(props: {
    /** iVault to get hilite set for */
    ivaultKey: string;
  }): AsyncIterableIterator<HiliteSet>;

  /**
   * Disposes the cache.
   *
   * Optional to avoid breaking the API. Will be made required when the deprecated
   * `dispose` is removed.
   */
  [Symbol.dispose]?: () => void;

  /**
   * Disposes the cache.
   * @deprecated in 1.2. Use `[Symbol.dispose]` instead.
   */
  dispose(): void;
}

/**
 * Creates a hilite set provider that caches hilite set for current selection for given iVault so any subsequent
 * hilite set requests for the same iVault don't cost until selection in given selection storage changes.
 * @public
 * @deprecated in 1.5. Use `createIVaultHiliteSetProvider` instead.
 */
/* v8 ignore start */
export function createCachingHiliteSetProvider(
  props: CachingHiliteSetProviderProps,
): CachingHiliteSetProvider & { [Symbol.dispose]: () => void } {
  const provider = createIVaultHiliteSetProvider(props);
  return {
    getHiliteSet: (hiliteSetProps: { ivaultKey: string }) => provider.getCurrentHiliteSet(hiliteSetProps),
    [Symbol.dispose]: () => provider[Symbol.dispose](),
    dispose: () => provider[Symbol.dispose](),
  };
}
/* v8 ignore stop */
