/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import "./DisposePolyfill.js";

import { EMPTY, firstValueFrom, from, map, merge, Subject, takeUntil, toArray } from "rxjs";
import { Guid, GuidString, Id64Arg, Id64Set } from "@szewtwin/core-szewec";
import { DMClassHierarchyInspector, DMSqlQueryExecutor } from "@szewtwin/presentation-shared";
import { CachingHiliteSetProvider } from "./CachingHiliteSetProvider.js";
import { createHiliteSetProvider, HiliteSet, HiliteSetProvider } from "./HiliteSetProvider.js";
import { createIVaultHiliteSetProvider, IVaultHiliteSetProvider } from "./IVaultHiliteSetProvider.js";
import { SelectableInstanceKey, Selectables } from "./Selectable.js";
import { StorageSelectionChangeEventArgs, StorageSelectionChangeType } from "./SelectionChangeEvent.js";
import { computeSelection, SelectionScope } from "./SelectionScope.js";
import { SelectionStorage } from "./SelectionStorage.js";
import {
  CoreIVaultHiliteSet,
  CoreIVaultSelectionSet,
  CoreSelectableIds,
  CoreSelectionSetEventType,
  CoreSelectionSetEventUnsafe,
} from "./types/IVault.js";
import { safeDispose } from "./Utils.js";

/**
 * Props for `enableUnifiedSelectionSyncWithIVault`.
 * @public
 */
export interface EnableUnifiedSelectionSyncWithIVaultProps {
  /**
   * Provides access to different iVault's features: query executing, class hierarchy, selection and hilite sets.
   *
   * It's recommended to use `@szewtwin/presentation-core-interop` to create `key`, `DMSqlQueryExecutor` and `DMSchemaProvider` from
   * [IVaultConnection](https://www.szewtwinjs.org/reference/core-frontend/ivaultconnection/ivaultconnection/), and map its
   * `hilited` and `selectionSet` attributes like this:
   *
   * ```ts
   * import { createDMSqlQueryExecutor, createDMSchemaProvider, createIVaultKey } from "@szewtwin/presentation-core-interop";
   * import { createCachingDMClassHierarchyInspector } from "@szewtwin/presentation-shared";
   * import { IVaultConnection } from "@szewtwin/core-frontend";
   *
   * const ivault: IVaultConnection = ...
   * const ivaultAccess = {
   *   ...createDMSqlQueryExecutor(ivault),
   *   ...createCachingDMClassHierarchyInspector({ schemaProvider: createDMSchemaProvider(MyAppFrontend.getSchemaContext(ivault)) }),
   *   key: createIVaultKey(ivault),
   *   hiliteSet: ivault.hilited,
   *   selectionSet: ivault.selectionSet,
   * };
   * ```
   */
  ivaultAccess: DMSqlQueryExecutor &
    DMClassHierarchyInspector & {
      /** Key of the iVault. Generally taken from `IVaultConnection.key`. */
      readonly key: string;
      /** The set of currently hilited elements taken from `IVaultConnection.hilited`. */
      readonly hiliteSet: CoreIVaultHiliteSet;
      /** The set of currently selected elements taken from `IVaultConnection.selectionSet`. */
      readonly selectionSet: CoreIVaultSelectionSet;
    };

  /**
   * Unified selection storage to synchronize IVault's tool selection with. The storage should be shared
   * across all components in the application to ensure unified selection experience.
   */
  selectionStorage: SelectionStorage;

  /** Active selection scope provider. */
  activeScopeProvider: () => SelectionScope;

  /**
   * An iVault hilite set provider used to retrieve hilite sets for different iVaults. If not provided, a new `IVaultHiliteSetProvider`
   * will be created for the given iVault using the provided `ivaultAccess`.
   * If the consuming application already has a `IVaultHiliteSetProvider` defined, it should be provided instead
   * to reuse the cache and avoid creating new providers for each iVault.
   *
   * @see `createIVaultHiliteSetProvider`
   */
  ivaultHiliteSetProvider?: IVaultHiliteSetProvider;

  /**
   * A caching hilite set provider used to retrieve hilite sets for an iVault. If not provided, a new `CachingHiliteSetProvider`
   * will be created for the given iVault using the provided `ivaultAccess`.
   * If the consuming application already has a `CachingHiliteSetProvider` defined, it should be provided instead
   * to reuse the cache and avoid creating new providers for each iVault.
   *
   * The type is defined in a way that makes it required for provider to have either the deprecated `dispose` or the
   * new `Symbol.dispose` method.
   *
   * **Warning:** When the given `CachingHiliteSetProvider` internally uses a custom `HiliteSetProvider`, the synchronization has
   * no access to it, and thus uses its own, default, `HiliteSetProvider`. As a result, the synchronization may not work as expected.
   * To alleviate this, the `ivaultHiliteSetProvider` prop should be used instead.
   *
   * @deprecated in 1.5. Use `ivaultHiliteSetProvider` prop instead.
   */
  cachingHiliteSetProvider?:
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    | CachingHiliteSetProvider
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    | (Omit<CachingHiliteSetProvider, "dispose"> & { [Symbol.dispose]: () => void });
}

/**
 * Enables synchronization between iVault selection and unified selection.
 * @returns function for disposing the synchronization.
 * @public
 */
export function enableUnifiedSelectionSyncWithIVault(props: EnableUnifiedSelectionSyncWithIVaultProps): () => void {
  const selectionHandler = new IVaultSelectionHandler(props);
  return () => selectionHandler[Symbol.dispose]();
}

/**
 * A handler that syncs selection between unified selection storage (`SelectionStorage`) and
 * an iVault (`iVault.selectionSet`, `iVault.hilited`).
 *
 * @internal
 */
export class IVaultSelectionHandler {
  private _selectionSourceName = "Tool";

  private _ivaultAccess: EnableUnifiedSelectionSyncWithIVaultProps["ivaultAccess"];
  private _selectionStorage: SelectionStorage;
  private _ivaultHiliteSetProvider: NonNullable<EnableUnifiedSelectionSyncWithIVaultProps["ivaultHiliteSetProvider"]>;
  private _activeScopeProvider: () => SelectionScope;

  private _isSuspended: boolean;
  private _selectionStorageChangeTracker = 0;
  private _cancelOngoingChanges = new Subject<void>();
  private _unregisterUnifiedSelectionListener: () => void;
  private _unregisterIVaultSelectionSetListener: () => void;
  private _disposeInternalHiliteSetProvider: () => void;

  #componentId: GuidString;

  public constructor(props: EnableUnifiedSelectionSyncWithIVaultProps & { hiliteSetProvider?: HiliteSetProvider }) {
    this.#componentId = Guid.createValue();
    this._ivaultAccess = props.ivaultAccess;
    this._selectionStorage = props.selectionStorage;
    this._activeScopeProvider = props.activeScopeProvider;
    this._isSuspended = false;
    [this._ivaultHiliteSetProvider, this._disposeInternalHiliteSetProvider] = (() => {
      if (props.ivaultHiliteSetProvider) {
        return [props.ivaultHiliteSetProvider, () => {}];
      }

      /* eslint-disable @typescript-eslint/no-deprecated */
      /* v8 ignore else -- @preserve */
      if (props.cachingHiliteSetProvider) {
        return [
          createIVaultHiliteSetProviderFromCachingProvider(
            props.cachingHiliteSetProvider,
            props.hiliteSetProvider ?? createHiliteSetProvider({ ivaultAccess: props.ivaultAccess }),
          ),
          // don't need to dispose anything, because our wrapper has no dispose logic, and `cachingHiliteSetProvider` should be disposed
          // by whoever owns it
          () => {},
        ];
      }
      /* eslint-enable @typescript-eslint/no-deprecated */

      /* v8 ignore start */
      const internalProvider = createIVaultHiliteSetProvider({
        selectionStorage: this._selectionStorage,
        ivaultProvider: () => this._ivaultAccess,
        createHiliteSetProvider: () =>
          props.hiliteSetProvider ?? createHiliteSetProvider({ ivaultAccess: props.ivaultAccess }),
      });
      return [internalProvider, () => safeDispose(internalProvider)];
      /* v8 ignore stop */
    })();

    this._unregisterIVaultSelectionSetListener = this._ivaultAccess.selectionSet.onChanged.addListener(
      this.onIVaultSelectionChanged,
    );
    this._unregisterUnifiedSelectionListener = this._selectionStorage.selectionChangeEvent.addListener(
      this.onUnifiedSelectionChanged,
    );

    if (!is5xSelectionSet(this._ivaultAccess.selectionSet)) {
      // szewtwinjs-core@4: stop ivault from syncing tool selection with hilited list - we want to manage that sync ourselves
      this._ivaultAccess.hiliteSet.wantSyncWithSelectionSet = false;
    }

    this.applyCurrentHiliteSet({ activeSelectionAction: "clearAll" });
  }

  public [Symbol.dispose]() {
    this._cancelOngoingChanges.next();
    this._unregisterIVaultSelectionSetListener();
    this._unregisterUnifiedSelectionListener();
    this._disposeInternalHiliteSetProvider();
  }

  /** Temporarily suspends tool selection synchronization until the returned disposable object is disposed. */
  public suspendIVaultToolSelectionSync() {
    const wasSuspended = this._isSuspended;
    this._isSuspended = true;
    return {
      [Symbol.dispose]: () => {
        this._isSuspended = wasSuspended;
      },
    };
  }

  private syncHiliteSet(props: {
    changeType: StorageSelectionChangeType;
    selectables: Selectables;
    source: string;
  }): void {
    const { changeType, selectables, source } = props;
    switch (changeType) {
      case "clear":
        return this.applyCurrentHiliteSet({ activeSelectionAction: "clearAll" });
      case "replace":
        return this.applyCurrentHiliteSet({
          activeSelectionAction:
            source === this._selectionSourceName
              ? is5xSelectionSet(this._ivaultAccess.selectionSet)
                ? // with 5x core we don't need to clear anything when event is triggered by a Tool (hilite and selection sets are in sync already)
                  "keep"
                : // with 4x core we need to clear hilite set, because it's not synced with selection set
                  "clearHilited"
              : // when event is triggered not by a Tool, we need to clear everything
                "clearAll",
        });
      case "add":
        return void from(
          this._ivaultHiliteSetProvider
            .getHiliteSetProvider({ ivaultKey: this._ivaultAccess.key })
            .getHiliteSet({ selectables }),
        )
          .pipe(takeUntil(this._cancelOngoingChanges))
          .subscribe({
            next: (set) => {
              this.addHiliteSet(set);
            },
          });
      case "remove":
        return void from(
          this._ivaultHiliteSetProvider
            .getHiliteSetProvider({ ivaultKey: this._ivaultAccess.key })
            .getHiliteSet({ selectables }),
        )
          .pipe(takeUntil(this._cancelOngoingChanges))
          .subscribe({
            next: (set) => {
              this.removeHiliteSet(set);
            },
            complete: () => {
              this.applyCurrentHiliteSet({ activeSelectionAction: "keep" });
            },
          });
    }
  }

  private onUnifiedSelectionChanged = (args: StorageSelectionChangeEventArgs) => {
    // iVaults are only interested in top-level selection changes
    if (args.ivaultKey !== this._ivaultAccess.key || args.level !== 0) {
      return;
    }

    // update the selection storage change tracker so we know the selection storage changed
    this._selectionStorageChangeTracker = (this._selectionStorageChangeTracker + 1) % Number.MAX_SAFE_INTEGER;

    if (args.changeType === "replace" || args.changeType === "clear") {
      this._cancelOngoingChanges.next();
    }
    this.syncHiliteSet(args);
  };

  private applyCurrentHiliteSet({
    activeSelectionAction,
  }: {
    activeSelectionAction: "clearAll" | "clearHilited" | "keep";
  }) {
    if (activeSelectionAction !== "keep") {
      using _dispose = this.suspendIVaultToolSelectionSync();
      if (!is5xSelectionSet(this._ivaultAccess.selectionSet)) {
        this._ivaultAccess.hiliteSet.clear();
      }
      if (activeSelectionAction === "clearAll") {
        this._ivaultAccess.selectionSet.emptyAll();
      }
    }

    from(this._ivaultHiliteSetProvider.getCurrentHiliteSet({ ivaultKey: this._ivaultAccess.key }))
      .pipe(takeUntil(this._cancelOngoingChanges))
      .subscribe({
        next: (ids) => {
          this.addHiliteSet(ids);
        },
      });
  }

  private addHiliteSet(set: HiliteSet) {
    using _dispose = this.suspendIVaultToolSelectionSync();
    if (is5xSelectionSet(this._ivaultAccess.selectionSet)) {
      // with 5.x core we can simply add the set as a whole
      this._ivaultAccess.selectionSet.add({
        models: set.models,
        subcategories: set.subCategories,
        elements: set.elements,
      });
    } else {
      // pre-5.0 core requires adding models and subcategories to hilite set separately
      /* v8 ignore else -- @preserve */
      if (set.models.length) {
        this._ivaultAccess.hiliteSet.models.addIds(set.models);
      }
      /* v8 ignore else -- @preserve */
      if (set.subCategories.length) {
        this._ivaultAccess.hiliteSet.subcategories.addIds(set.subCategories);
      }
      /* v8 ignore else -- @preserve */
      if (set.elements.length) {
        this._ivaultAccess.hiliteSet.elements.addIds(set.elements);
        this._ivaultAccess.selectionSet.add(set.elements);
      }
    }
  }

  private removeHiliteSet(set: HiliteSet) {
    using _dispose = this.suspendIVaultToolSelectionSync();
    if (is5xSelectionSet(this._ivaultAccess.selectionSet)) {
      // with 5.x core we can simply remove the set as a whole
      this._ivaultAccess.selectionSet.remove({
        models: set.models,
        subcategories: set.subCategories,
        elements: set.elements,
      });
    } else {
      /* v8 ignore else -- @preserve */
      if (set.models.length) {
        this._ivaultAccess.hiliteSet.models.deleteIds(set.models);
      }
      /* v8 ignore else -- @preserve */
      if (set.subCategories.length) {
        this._ivaultAccess.hiliteSet.subcategories.deleteIds(set.subCategories);
      }
      /* v8 ignore else -- @preserve */
      if (set.elements.length) {
        this._ivaultAccess.hiliteSet.elements.deleteIds(set.elements);
        this._ivaultAccess.selectionSet.remove(set.elements);
      }
    }
  }

  private onIVaultSelectionChanged = async (event: CoreSelectionSetEventUnsafe): Promise<void> => {
    if (this._isSuspended) {
      return;
    }

    if (CoreSelectionSetEventType.Clear === event.type) {
      this._selectionStorage.clearSelection({ ivaultKey: this._ivaultAccess.key, source: this._selectionSourceName });
      return;
    }

    const ids = getSelectionSetChangeIds(event);
    const scopedSelection = merge(
      ids.elements
        ? from(
            computeSelection({
              queryExecutor: this._ivaultAccess,
              elementIds: ids.elements,
              scope: this._activeScopeProvider(),
              componentId: this.#componentId,
            }),
          )
        : /* v8 ignore next */ EMPTY,
      ids.models
        ? from(ids.models).pipe(map((id): SelectableInstanceKey => ({ className: "BisCore.Model", id })))
        : /* v8 ignore next */ EMPTY,
      ids.subcategories
        ? from(ids.subcategories).pipe(map((id): SelectableInstanceKey => ({ className: "BisCore.SubCategory", id })))
        : /* v8 ignore next */ EMPTY,
    );

    const selectionStorageVersion = this._selectionStorageChangeTracker;
    const changeSelectionStorageProps = {
      ivaultKey: this._ivaultAccess.key,
      source: this._selectionSourceName,
      selectables: await firstValueFrom(scopedSelection.pipe(toArray())),
    };
    try {
      switch (event.type) {
        case CoreSelectionSetEventType.Add:
          return this._selectionStorage.addToSelection(changeSelectionStorageProps);
        case CoreSelectionSetEventType.Remove:
          return this._selectionStorage.removeFromSelection(changeSelectionStorageProps);
        case CoreSelectionSetEventType.Replace:
          return this._selectionStorage.replaceSelection(changeSelectionStorageProps);
      }
    } finally {
      if (this._selectionStorageChangeTracker === selectionStorageVersion) {
        // if the storage wasn't changed while we were processing the selection change, we have to re-sync the
        // hilite set (otherwise it's done by the selection storage change handler)
        this.syncHiliteSet({
          ...changeSelectionStorageProps,
          selectables: Selectables.create(changeSelectionStorageProps.selectables),
          changeType: getUnifiedSelectionChangeType(event.type),
        });
      }
    }
  };
}

function getSelectionSetChangeIds(
  event: Omit<CoreSelectionSetEventUnsafe, "type"> & {
    type: CoreSelectionSetEventType.Add | CoreSelectionSetEventType.Remove | CoreSelectionSetEventType.Replace;
  },
): CoreSelectableIds {
  switch (event.type) {
    case CoreSelectionSetEventType.Add:
      return event.additions ?? (event.added ? { elements: event.added } : /* v8 ignore next */ {});
    case CoreSelectionSetEventType.Remove:
      return event.removals ?? (event.removed ? { elements: event.removed } : /* v8 ignore next */ {});
    case CoreSelectionSetEventType.Replace:
      return "active" in event.set ? event.set.active : { elements: event.set.elements };
  }
}

function getUnifiedSelectionChangeType(coreChangeType: CoreSelectionSetEventType): StorageSelectionChangeType {
  switch (coreChangeType) {
    case CoreSelectionSetEventType.Add:
      return "add";
    case CoreSelectionSetEventType.Remove:
      return "remove";
    case CoreSelectionSetEventType.Replace:
      return "replace";
    /* v8 ignore next -- @preserve */
    case CoreSelectionSetEventType.Clear:
      return "clear";
  }
}

function is5xSelectionSet(
  selectionSet: CoreIVaultSelectionSet,
): selectionSet is Omit<CoreIVaultSelectionSet, "add" | "remove"> & {
  readonly active: { [P in keyof CoreSelectableIds]-?: Id64Set };
  add: (ids: Id64Arg | CoreSelectableIds) => boolean;
  remove: (ids: Id64Arg | CoreSelectableIds) => boolean;
} {
  return "active" in selectionSet;
}

/* v8 ignore start */
function createIVaultHiliteSetProviderFromCachingProvider(
  cachingHiliteSetProvider: NonNullable<EnableUnifiedSelectionSyncWithIVaultProps["cachingHiliteSetProvider"]>,
  hiliteSetProvider: HiliteSetProvider,
): IVaultHiliteSetProvider {
  return {
    getHiliteSetProvider: () => hiliteSetProvider,
    getCurrentHiliteSet: (props) => cachingHiliteSetProvider.getHiliteSet(props),
    [Symbol.dispose]: () => {},
  };
}
/* v8 ignore stop */
