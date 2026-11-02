/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { BeEvent } from "@szewtwin/core-szewec";
import { Event } from "@szewtwin/presentation-shared";
import { Selectable, Selectables } from "./Selectable.js";
import {
  StorageSelectionChangeEventArgs,
  StorageSelectionChangesListener,
  StorageSelectionChangeType,
} from "./SelectionChangeEvent.js";

/** @public */
type IVaultKeyProp =
  | {
      /**
       * Key of the iVault. It's recommended to use `createIVaultKey` function from `@szewtwin/presentation-core-interop`
       * package to create the key for an iVault.
       *
       * Defaults to an empty string when not supplied.
       */
      ivaultKey?: string;
      iVaultKey?: never;
    }
  | {
      ivaultKey?: never;
      /**
       * Key of the iVault. It's recommended to use `createIVaultKey` function from `@szewtwin/presentation-core-interop`
       * package to create the key for an iVault.
       *
       * Defaults to an empty string when not supplied.
       *
       * @deprecated in 0.2. Use `ivaultKey` instead.
       */
      iVaultKey?: string;
    };

/**
 * Defines return value of `createStorage`.
 *
 * **Warning:** Used in public API as a return value. Not expected to be created / extended by package
 * consumers, may be supplemented with required attributes any time.
 *
 * @see `createStorage`
 * @public
 */
export interface SelectionStorage {
  /** An event that is raised when selection changes. */
  selectionChangeEvent: Event<StorageSelectionChangesListener>;

  /** Get the selection levels currently stored for the specified iVault. */
  getSelectionLevels(props: IVaultKeyProp): number[];

  /** Get the selection stored in the storage. */
  getSelection(
    props: IVaultKeyProp & {
      /** Level of the selection. Defaults to `0`. */
      level?: number;
    },
  ): Selectables;

  /** Add keys to the selection. */
  addToSelection(
    props: IVaultKeyProp & {
      /** Name of the selection source. Generally, this identifies the component that makes the selection change. */
      source: string;
      /** The selectables to add to selection. */
      selectables: Selectable[];
      /** Level of the selection. Defaults to `0`. */
      level?: number;
    },
  ): void;

  /** Remove keys from current selection. */
  removeFromSelection(
    props: IVaultKeyProp & {
      /** Name of the selection source. Generally, this identifies the component that makes the selection change. */
      source: string;
      /** The selectables to remove from selection. */
      selectables: Selectable[];
      /** Level of the selection. Defaults to `0`. */
      level?: number;
    },
  ): void;

  /** Replace current selection. */
  replaceSelection(
    props: IVaultKeyProp & {
      /** Name of the selection source. Generally, this identifies the component that makes the selection change. */
      source: string;
      /** The selectables to add to selection. */
      selectables: Selectable[];
      /** Level of the selection. Defaults to `0`. */
      level?: number;
    },
  ): void;

  /** Clear current selection. */
  clearSelection(
    props: IVaultKeyProp & {
      /** Name of the selection source. Generally, this identifies the component that makes the selection change. */
      source: string;
      /** Level of the selection. Defaults to `0`. */
      level?: number;
    },
  ): void;

  /** Clear storage for an iVault. This function should be called when iVault is closed. */
  clearStorage(props: IVaultKeyProp): void;
}

/**
 * Creates a selection storage which stores and allows managing application-level selection.
 *
 * **Note:** `clearSelection` should be called upon iVault close to free-up memory:
 *
 * ```ts
 * import { IVaultConnection } from "@szewtwin/core-frontend";
 * import { createIVaultKey } from "@szewtwin/presentation-core-interop";
 *
 * IVaultConnection.onClose.addListener((ivault) => {
 *   storage.clearStorage(createIVaultKey(ivault));
 * });
 * ```
 *
 * @public
 */
export function createStorage(): SelectionStorage {
  return new SelectionStorageImpl();
}

/** @internal */
export const IVAULT_CLOSE_SELECTION_CLEAR_SOURCE = "Unified selection storage: clear";

class SelectionStorageImpl implements SelectionStorage {
  private _storage = new Map<string, MultiLevelSelectablesContainer>();
  public selectionChangeEvent: BeEvent<StorageSelectionChangesListener>;

  constructor() {
    this.selectionChangeEvent = new BeEvent();
  }

  public getSelectionLevels(props: IVaultKeyProp): number[] {
    return this.getContainer(getIVaultKey(props)).getSelectionLevels();
  }

  public getSelection(props: IVaultKeyProp & { level?: number }): Selectables {
    return this.getContainer(getIVaultKey(props)).getSelection(props.level ?? 0);
  }

  public addToSelection(props: IVaultKeyProp & { source: string; selectables: Selectable[]; level?: number }): void {
    this.handleChange({ ...props, changeType: "add" });
  }

  public removeFromSelection(
    props: IVaultKeyProp & { source: string; selectables: Selectable[]; level?: number },
  ): void {
    this.handleChange({ ...props, changeType: "remove" });
  }

  public replaceSelection(props: IVaultKeyProp & { source: string; selectables: Selectable[]; level?: number }): void {
    this.handleChange({ ...props, changeType: "replace" });
  }

  public clearSelection(props: IVaultKeyProp & { source: string; level?: number }): void {
    this.handleChange({ ...props, changeType: "clear", selectables: [] });
  }

  public clearStorage(props: IVaultKeyProp): void {
    const ivaultKey = getIVaultKey(props);
    this.clearSelection({ source: IVAULT_CLOSE_SELECTION_CLEAR_SOURCE, ivaultKey });
    this._storage.delete(ivaultKey);
  }

  private getContainer(ivaultKey: string): MultiLevelSelectablesContainer {
    let selectionContainer = this._storage.get(ivaultKey);
    if (!selectionContainer) {
      selectionContainer = new MultiLevelSelectablesContainer();
      this._storage.set(ivaultKey, selectionContainer);
    }
    return selectionContainer;
  }

  private handleChange(
    props: IVaultKeyProp & {
      source: string;
      level?: number;
      changeType: StorageSelectionChangeType;
      selectables: Selectable[];
    },
  ) {
    const { source, level: inLevel, changeType, selectables: change } = props;
    const ivaultKey = getIVaultKey(props);
    const container = this.getContainer(ivaultKey);
    const level = inLevel ?? 0;
    const selectables = container.getSelection(level);
    const selected = Selectables.create(change);
    switch (changeType) {
      case "add":
        if (!Selectables.add(selectables, change)) {
          return;
        }
        break;
      case "remove":
        if (!Selectables.remove(selectables, change)) {
          return;
        }
        break;
      case "replace":
        if (Selectables.size(selectables) === Selectables.size(selected) && Selectables.hasAll(selectables, change)) {
          return;
        }
        Selectables.clear(selectables);
        Selectables.add(selectables, change);
        break;
      case "clear":
        if (!Selectables.clear(selectables)) {
          return;
        }
        break;
    }
    container.clear(level + 1);
    const event: StorageSelectionChangeEventArgs = {
      source,
      level,
      ivaultKey,
      iVaultKey: ivaultKey,
      changeType,
      selectables: selected,
      timestamp: new Date(),
      storage: this,
    };
    this.selectionChangeEvent.raiseEvent(event, this);
  }
}

function getIVaultKey(props: IVaultKeyProp): string {
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  return ("ivaultKey" in props ? props.ivaultKey : props.iVaultKey) ?? "";
}

class MultiLevelSelectablesContainer {
  private readonly _selectablesContainers: Map<number, Selectables>;

  constructor() {
    this._selectablesContainers = new Map<number, Selectables>();
  }

  public getSelection(level: number): Selectables {
    let selectables = this._selectablesContainers.get(level);
    if (!selectables) {
      selectables = Selectables.create([]);
      this._selectablesContainers.set(level, selectables);
    }
    return selectables;
  }

  public getSelectionLevels(): number[] {
    const levels = new Array<number>();
    for (const entry of this._selectablesContainers.entries()) {
      if (!Selectables.isEmpty(entry[1])) {
        levels.push(entry[0]);
      }
    }
    return levels.sort();
  }

  public clear(level: number) {
    const storedLevels = this._selectablesContainers.keys();
    for (const storedLevel of storedLevels) {
      if (storedLevel >= level) {
        const selectables = this._selectablesContainers.get(storedLevel)!;
        Selectables.clear(selectables);
      }
    }
  }
}
