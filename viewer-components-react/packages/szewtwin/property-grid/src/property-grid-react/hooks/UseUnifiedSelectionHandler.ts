/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { useCallback, useEffect, useState } from "react";
import { assert, BeEvent } from "@szewtwin/core-szewec";
import { Key, NodeKey } from "@szewtwin/presentation-common";
import { createIVaultKey } from "@szewtwin/presentation-core-interop";
import { Presentation } from "@szewtwin/presentation-frontend";
import { Selectable, Selectables } from "@szewtwin/unified-selection";

import type { IVaultConnection } from "@szewtwin/core-frontend";
import type { BaseNodeKey, KeySet } from "@szewtwin/presentation-common";
import type { SelectableInstanceKey, SelectionStorage as UnifiedSelectionStorage } from "@szewtwin/unified-selection";

/** @public */
export type SelectionStorage = Pick<UnifiedSelectionStorage, "getSelection" | "replaceSelection" | "selectionChangeEvent">;

/** @internal */
export function useSelectionHandler({ selectionStorage }: { selectionStorage?: SelectionStorage }) {
  const [selectionChange] = useState(
    () => new BeEvent<(args: { ivaultKey: string; source: string; level: number; getSelection: () => Selectables }) => void>(),
  );
  useEffect(() => {
    if (selectionStorage) {
      return selectionStorage.selectionChangeEvent.addListener((args) => {
        selectionChange.raiseEvent({ ...args, getSelection: () => selectionStorage.getSelection({ ivaultKey: args.ivaultKey, level: args.level }) });
      });
    }
    // eslint-disable-next-line deprecation/deprecation
    return Presentation.selection.selectionChange.addListener((args) => {
      selectionChange.raiseEvent({
        level: args.level,
        ivaultKey: createIVaultKey(args.ivault),
        source: args.source,
        // eslint-disable-next-line deprecation/deprecation
        getSelection: () => createSelectablesFromKeySet(Presentation.selection.getSelection(args.ivault, args.level)),
      });
    });
  }, [selectionStorage, selectionChange]);

  const getSelection = useCallback(
    (args: { ivault: IVaultConnection; level: number }): Selectables => {
      return selectionStorage
        ? selectionStorage.getSelection({ ivaultKey: createIVaultKey(args.ivault), level: args.level })
        : // eslint-disable-next-line deprecation/deprecation
          createSelectablesFromKeySet(Presentation.selection.getSelection(args.ivault, args.level));
    },
    [selectionStorage],
  );

  const replaceSelection = useCallback(
    (args: { source: string; ivault: IVaultConnection; level: number; selectables: SelectableInstanceKey[] }) => {
      if (selectionStorage) {
        selectionStorage.replaceSelection({
          ivaultKey: createIVaultKey(args.ivault),
          source: args.source,
          level: args.level,
          selectables: args.selectables,
        });
        return;
      }
      void (async () => {
        const keys = await createKeysFromSelectablesArray(args.selectables);
        // eslint-disable-next-line deprecation/deprecation
        Presentation.selection.replaceSelection(args.source, args.ivault, keys, args.level);
      })();
    },
    [selectionStorage],
  );

  return {
    getSelection,
    replaceSelection,
    selectionChange,
  };
}

function createSelectablesFromKeySet(keySet: Readonly<KeySet>) {
  const selectables = Selectables.create([]);
  keySet.forEach((key) => {
    if (Key.isInstanceKey(key)) {
      Selectables.add(selectables, [key]);
    } else if (NodeKey.isInstancesNodeKey(key)) {
      Selectables.add(selectables, key.instanceKeys);
    } else {
      Selectables.add(selectables, [
        {
          identifier: key.pathFromRoot.join("/"),
          data: key,
          // `loadInstanceKeys` doesn't need an implementation, because we add the node key into selectable as `data`
          // and we later extract it from there (see `createKeysFromSelectable`)
          /* c8 ignore next */
          async *loadInstanceKeys() {},
        },
      ]);
    }
  });
  return selectables;
}

async function createKeysFromSelectablesArray(selectables: SelectableInstanceKey[]) {
  const keys: Key[] = [];
  for (const selectable of selectables) {
    keys.push(...(await createKeysFromSelectable(selectable)));
  }
  return keys;
}

/** @internal */
export async function createKeysFromSelectable(selectable: Selectable): Promise<Key[]> {
  if (Selectable.isInstanceKey(selectable)) {
    return [selectable];
  }
  if (isNodeKey(selectable.data)) {
    return [selectable.data];
  }
  /* c8 ignore next 4 */
  // should never get here, since input selectables come from `createSelectablesFromKeySet`, where they can only be
  // either instance keys or node keys
  assert(false, "Unexpected selectable type");
}

function isNodeKey(data: unknown): data is NodeKey {
  const key = data as BaseNodeKey;
  return key.pathFromRoot !== undefined && key.type !== undefined;
}
