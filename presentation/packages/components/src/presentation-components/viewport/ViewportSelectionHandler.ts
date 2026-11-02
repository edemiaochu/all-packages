/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import "../common/DisposePolyfill.js";

import { from, Subject, takeUntil } from "rxjs";
import { IVaultConnection } from "@szewtwin/core-frontend";
import { KeySet } from "@szewtwin/presentation-common";
import {
  HiliteSet,
  HiliteSetProvider,
  Presentation,
  SelectionChangeEventArgs,
  SelectionChangeType,
  SelectionHandler,
} from "@szewtwin/presentation-frontend";
import { safeDispose } from "../common/Utils.js";

/* eslint-disable @typescript-eslint/no-deprecated */

/** @internal */
export interface ViewportSelectionHandlerProps {
  ivault: IVaultConnection;
}

/**
 * A handler that syncs selection between unified selection
 * manager (`Presentation.selection`) and a viewport (`ivault.hilited`).
 * It has nothing to do with the viewport component itself - the
 * viewport updates its highlighted elements when `ivault.hilited`
 * changes.
 *
 * @internal
 */
export class ViewportSelectionHandler implements Disposable {
  private _ivault: IVaultConnection;
  private _selectionHandler: SelectionHandler;
  private _cancelOngoingChanges = new Subject<void>();

  public constructor(props: ViewportSelectionHandlerProps) {
    this._ivault = props.ivault;

    // handles changing and listening to unified selection
    this._selectionHandler = new SelectionHandler({
      manager: Presentation.selection,
      name: `Viewport_${counter++}`,
      ivault: props.ivault,
      onSelect: this.onUnifiedSelectionChanged,
    });
    this._selectionHandler.manager.setSyncWithIVaultToolSelection(props.ivault, true);

    // stop ivault from syncing tool selection with hilited list - we want
    // to override that behavior
    props.ivault.hilited.wantSyncWithSelectionSet = false;
  }

  public [Symbol.dispose]() {
    this._cancelOngoingChanges.next();
    this._selectionHandler.manager.setSyncWithIVaultToolSelection(this._ivault, false);
    safeDispose(this._selectionHandler);
  }

  public get ivault() {
    return this._ivault;
  }
  public set ivault(value: IVaultConnection) {
    if (this._ivault === value) {
      return;
    }

    this._selectionHandler.manager.setSyncWithIVaultToolSelection(this._ivault, false);
    this._selectionHandler.manager.setSyncWithIVaultToolSelection(value, true);
    this._ivault = value;
    this._ivault.hilited.wantSyncWithSelectionSet = false;
    this._selectionHandler.ivault = value;

    this.applyCurrentSelection();
  }

  public applyCurrentSelection() {
    this._cancelOngoingChanges.next();
    this.applyCurrentHiliteSet(this._ivault);
  }

  private handleUnifiedSelectionChange(
    ivault: IVaultConnection,
    changeType: SelectionChangeType,
    keys: Readonly<KeySet>,
    source: string,
  ) {
    if (changeType === SelectionChangeType.Clear || changeType === SelectionChangeType.Replace) {
      this.applyCurrentHiliteSet(
        ivault,
        changeType === SelectionChangeType.Replace && source === "Tool" ? "onlyHilited" : "all",
      );
      return;
    }

    const hiliteSetProvider = HiliteSetProvider.create({ ivault });
    if (changeType === SelectionChangeType.Add) {
      from(hiliteSetProvider.getHiliteSetIterator(keys))
        .pipe(takeUntil(this._cancelOngoingChanges))
        .subscribe({
          next: (set) => {
            this.applyHiliteSet(ivault, set);
          },
        });
      return;
    }

    from(hiliteSetProvider.getHiliteSetIterator(keys))
      .pipe(takeUntil(this._cancelOngoingChanges))
      .subscribe({
        next: (set) => {
          this.removeHiliteSet(ivault, set);
        },
        complete: () => {
          this.applyCurrentHiliteSet(ivault, "none");
        },
      });
  }

  private onUnifiedSelectionChanged = (args: SelectionChangeEventArgs) => {
    // this component only cares about its own ivault
    if (args.ivault !== this._ivault) {
      return;
    }

    // viewports are only interested in top-level selection changes
    // wip: may want to handle different selection levels?
    if (0 !== args.level) {
      return;
    }

    this._cancelOngoingChanges.next();
    this.handleUnifiedSelectionChange(args.ivault, args.changeType, args.keys, args.source);
  };

  private applyCurrentHiliteSet(ivault: IVaultConnection, clearAction: "all" | "onlyHilited" | "none" = "all") {
    if (clearAction !== "none") {
      using _ = toDisposable(Presentation.selection.suspendIVaultToolSelectionSync(this._ivault));

      ivault.hilited.clear();
      if (clearAction === "all") {
        ivault.selectionSet.emptyAll();
      }
    }

    from(Presentation.selection.getHiliteSetIterator(ivault))
      .pipe(takeUntil(this._cancelOngoingChanges))
      .subscribe({
        next: (ids) => {
          this.applyHiliteSet(ivault, ids);
        },
      });
  }

  private applyHiliteSet(ivault: IVaultConnection, set: HiliteSet) {
    using _ = toDisposable(Presentation.selection.suspendIVaultToolSelectionSync(this._ivault));
    if (set.models && set.models.length) {
      ivault.hilited.models.addIds(set.models);
    }
    if (set.subCategories && set.subCategories.length) {
      ivault.hilited.subcategories.addIds(set.subCategories);
    }
    if (set.elements && set.elements.length) {
      ivault.hilited.elements.addIds(set.elements);
      ivault.selectionSet.add(set.elements);
    }
  }

  private removeHiliteSet(ivault: IVaultConnection, set: HiliteSet) {
    using _ = toDisposable(Presentation.selection.suspendIVaultToolSelectionSync(this._ivault));
    if (set.models?.length) {
      ivault.hilited.models.deleteIds(set.models);
    }
    if (set.subCategories?.length) {
      ivault.hilited.subcategories.deleteIds(set.subCategories);
    }
    if (set.elements?.length) {
      ivault.hilited.elements.deleteIds(set.elements);
      ivault.selectionSet.remove(set.elements);
    }
  }
}

let counter = 1;

function toDisposable(resource: {} | { [Symbol.dispose]: () => void } | { dispose: () => void }): {
  [Symbol.dispose]: () => void;
} {
  return {
    [Symbol.dispose]: () => {
      safeDispose(resource);
    },
  };
}
