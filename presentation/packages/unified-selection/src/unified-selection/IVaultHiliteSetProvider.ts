/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import "./DisposePolyfill.js";

import { from, Observable, shareReplay } from "rxjs";
import { eachValueFrom } from "rxjs-for-await";
import { DMClassHierarchyInspector, DMSqlQueryExecutor } from "@szewtwin/presentation-shared";
import { createHiliteSetProvider, HiliteSet, HiliteSetProvider } from "./HiliteSetProvider.js";
import { StorageSelectionChangeEventArgs } from "./SelectionChangeEvent.js";
import { IVAULT_CLOSE_SELECTION_CLEAR_SOURCE, SelectionStorage } from "./SelectionStorage.js";

/**
 * Props for creating an `IVaultHiliteSetProvider` instance.
 * @public
 */
export interface IVaultHiliteSetProviderProps {
  /** Selection storage to use for retrieving the hilite set. */
  selectionStorage: SelectionStorage;

  /** A callback that should return iVault access by iVault key. */
  ivaultProvider: (ivaultKey: string) => DMClassHierarchyInspector & DMSqlQueryExecutor;

  /** An optional hilite set provider factory. If not provided, defaults to `createHiliteSetProvider` from this package. */
  createHiliteSetProvider?: typeof createHiliteSetProvider;
}

/**
 * Defines return value of `createIVaultHiliteSetProvider`.
 *
 * **Warning:** Used in public API as a return value. Not expected to be created / extended by package
 * consumers, may be supplemented with required attributes any time.
 *
 * @see `createIVaultHiliteSetProvider`
 * @public
 */
export interface IVaultHiliteSetProvider {
  /** Get the hilite set provider for the specified iVault. */
  getHiliteSetProvider(props: {
    /** iVault to get hilite set provider for */
    ivaultKey: string;
  }): HiliteSetProvider;

  /** Get the hilite set iterator for active selection in the specified iVault. */
  getCurrentHiliteSet(props: {
    /** iVault to get hilite set for */
    ivaultKey: string;
  }): AsyncIterableIterator<HiliteSet>;

  /**
   * Disposes the cache.
   */
  [Symbol.dispose]: () => void;
}

/**
 * Creates a hilite set provider that can efficiently get a hilite set for the "active" selection in an iVault.
 *
 * This specific implementation caches the hilite set for the current selection, so subsequent hilite set
 * requests for the same iVault, don't cost until selection changes.
 *
 * @public
 */
export function createIVaultHiliteSetProvider(props: IVaultHiliteSetProviderProps): IVaultHiliteSetProvider {
  return new IVaultHiliteSetProviderImpl(props);
}

class IVaultHiliteSetProviderImpl implements IVaultHiliteSetProvider {
  private _selectionStorage: SelectionStorage;
  private _hiliteSetProviders = new Map<string, HiliteSetProvider>();
  private _cache = new Map<string, Observable<HiliteSet>>();
  private _removeListener: () => void;
  private _ivaultProvider: (ivaultKey: string) => DMClassHierarchyInspector & DMSqlQueryExecutor;
  private _createHiliteSetProvider: typeof createHiliteSetProvider;

  constructor(props: IVaultHiliteSetProviderProps) {
    this._selectionStorage = props.selectionStorage;
    this._ivaultProvider = props.ivaultProvider;
    this._removeListener = this._selectionStorage.selectionChangeEvent.addListener(
      (args: StorageSelectionChangeEventArgs) => {
        this._cache.delete(args.ivaultKey);
        if (args.changeType === "clear" && args.source === IVAULT_CLOSE_SELECTION_CLEAR_SOURCE) {
          this._hiliteSetProviders.delete(args.ivaultKey);
        }
      },
    );
    /* v8 ignore next -- @preserve */
    this._createHiliteSetProvider = props.createHiliteSetProvider ?? createHiliteSetProvider;
  }

  public getHiliteSetProvider({ ivaultKey }: { ivaultKey: string }): HiliteSetProvider {
    let provider = this._hiliteSetProviders.get(ivaultKey);
    if (!provider) {
      provider = this._createHiliteSetProvider({ ivaultAccess: this._ivaultProvider(ivaultKey) });
      this._hiliteSetProviders.set(ivaultKey, provider);
    }
    return provider;
  }

  public getCurrentHiliteSet({ ivaultKey }: { ivaultKey: string }): AsyncIterableIterator<HiliteSet> {
    let hiliteSet = this._cache.get(ivaultKey);
    if (!hiliteSet) {
      const selectables = this._selectionStorage.getSelection({ ivaultKey });
      hiliteSet = from(this.getHiliteSetProvider({ ivaultKey }).getHiliteSet({ selectables })).pipe(
        shareReplay({ refCount: true }),
      );
      this._cache.set(ivaultKey, hiliteSet);
    }
    return eachValueFrom(hiliteSet);
  }

  public [Symbol.dispose](): void {
    this._removeListener();
    this._hiliteSetProviders = new Map();
    this._cache = new Map();
  }
}
