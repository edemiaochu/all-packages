/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { beforeEach, describe, expect, it, vi } from "vitest";
import { SelectableInstanceKey, Selectables } from "../unified-selection/Selectable.js";
import { createStorage, SelectionStorage } from "../unified-selection/SelectionStorage.js";
import { createSelectableInstanceKey } from "./_helpers/SelectablesCreator.js";

const generateSelection = (): SelectableInstanceKey[] => {
  return [
    createSelectableInstanceKey(1, "base.Class1"),
    createSelectableInstanceKey(2, "base.Class2"),
    createSelectableInstanceKey(3, "base.Class3"),
  ];
};

describe("SelectionStorage", () => {
  let selectionStorage: SelectionStorage;
  let baseSelection: SelectableInstanceKey[];
  const ivaultKey = "iVaultKey";
  const source = "test";

  beforeEach(() => {
    selectionStorage = createStorage();
    baseSelection = generateSelection();
  });

  describe("clearStorage", () => {
    it("clears iVaultKey selection", () => {
      selectionStorage.addToSelection({ ivaultKey, source, selectables: [createSelectableInstanceKey()] });
      expect(Selectables.isEmpty(selectionStorage.getSelection({ ivaultKey }))).toBe(false);
      const listenerSpy = vi.fn();
      selectionStorage.selectionChangeEvent.addListener(listenerSpy);
      selectionStorage.clearStorage({ ivaultKey });
      expect(Selectables.isEmpty(selectionStorage.getSelection({ ivaultKey }))).toBe(true);
      expect(listenerSpy, "Expected selectionChange.onSelectionChange to be called").toHaveBeenCalledOnce();
    });
  });

  describe("getSelectionLevels", () => {
    it("returns empty list when there're no selection levels", () => {
      expect(selectionStorage.getSelectionLevels({ ivaultKey })).toHaveLength(0);
    });

    it("returns available selection levels", () => {
      selectionStorage.addToSelection({
        ivaultKey,
        source: "",
        selectables: [createSelectableInstanceKey(1, "schema.class1")],
      });
      selectionStorage.addToSelection({
        ivaultKey,
        source: "",
        selectables: [createSelectableInstanceKey(2, "schema.class2")],
        level: 3,
      });
      expect(selectionStorage.getSelectionLevels({ ivaultKey })).toEqual([0, 3]);
    });

    it("doesn't include empty selection levels", () => {
      selectionStorage.addToSelection({
        ivaultKey,
        source: "",
        selectables: [createSelectableInstanceKey(1, "schema.class1")],
      });
      selectionStorage.addToSelection({
        ivaultKey,
        source: "",
        selectables: [createSelectableInstanceKey(2, "schema.class2")],
        level: 1,
      });
      selectionStorage.addToSelection({ ivaultKey, source: "", selectables: [], level: 2 });
      expect(selectionStorage.getSelectionLevels({ ivaultKey })).toEqual([0, 1]);
    });

    it("returns available selection levels with deprecated `iVaultKey` prop", () => {
      selectionStorage.addToSelection({
        iVaultKey: ivaultKey,
        source: "",
        selectables: [createSelectableInstanceKey(1, "schema.class1")],
      });
      selectionStorage.addToSelection({
        iVaultKey: ivaultKey,
        source: "",
        selectables: [createSelectableInstanceKey(2, "schema.class2")],
        level: 3,
      });
      expect(selectionStorage.getSelectionLevels({ iVaultKey: ivaultKey })).toEqual([0, 3]);
    });
  });

  describe("addToSelection", () => {
    it("adds selection on an empty selection", () => {
      selectionStorage.addToSelection({ ivaultKey, source, selectables: baseSelection });
      const selectables = selectionStorage.getSelection({ ivaultKey });
      expect(Selectables.size(selectables)).toBe(baseSelection.length);

      for (const selectable of baseSelection) {
        expect(Selectables.has(selectables, selectable)).toBe(true);
      }
    });

    it("adds selection on non empty selection", () => {
      selectionStorage.addToSelection({ ivaultKey, source, selectables: [baseSelection[0]] });
      selectionStorage.addToSelection({ ivaultKey, source, selectables: [baseSelection[1], baseSelection[2]] });
      const selectables = selectionStorage.getSelection({ ivaultKey });
      expect(Selectables.size(selectables)).toBe(baseSelection.length);

      for (const selectable of baseSelection) {
        expect(Selectables.has(selectables, selectable)).toBe(true);
      }
    });

    it("adds selection on different iVaults", () => {
      const ivault2 = "iVault2";
      selectionStorage.addToSelection({ ivaultKey, source, selectables: baseSelection });
      selectionStorage.addToSelection({ ivaultKey: ivault2, source, selectables: baseSelection });

      for (const ivaultToken of [ivaultKey, ivault2]) {
        const selectables = selectionStorage.getSelection({ ivaultKey: ivaultToken });
        expect(Selectables.size(selectables)).toBe(baseSelection.length);

        for (const selectable of baseSelection) {
          expect(Selectables.has(selectables, selectable)).toBe(true);
        }
      }
    });

    it("adds selection on different levels", () => {
      selectionStorage.addToSelection({ ivaultKey, source, selectables: baseSelection });
      selectionStorage.addToSelection({ ivaultKey, source, selectables: baseSelection, level: 1 });
      for (let i = 0; i <= 1; i++) {
        const selectables = selectionStorage.getSelection({ ivaultKey, level: i });
        expect(Selectables.size(selectables)).toBe(baseSelection.length);
        for (const selectable of baseSelection) {
          expect(Selectables.has(selectables, selectable)).toBe(true);
        }
      }
    });

    it("clears higher level selection when adding items to lower level selection", () => {
      selectionStorage.addToSelection({ ivaultKey, source, selectables: baseSelection });
      selectionStorage.addToSelection({
        ivaultKey,
        source,
        selectables: [createSelectableInstanceKey(1, "schema.class1")],
        level: 1,
      });
      selectionStorage.addToSelection({
        ivaultKey,
        source,
        selectables: [createSelectableInstanceKey(2, "schema.class2")],
        level: 0,
      });
      const selectables = selectionStorage.getSelection({ ivaultKey, level: 1 });
      expect(Selectables.isEmpty(selectables)).toBe(true);
    });

    it("doesn't clear higher level selection when adding same items to lower level selection", () => {
      selectionStorage.addToSelection({ ivaultKey, source, selectables: baseSelection, level: 0 });
      selectionStorage.addToSelection({ ivaultKey, source, selectables: [createSelectableInstanceKey(1)], level: 1 });
      selectionStorage.addToSelection({ ivaultKey, source, selectables: baseSelection, level: 0 });
      const selectables = selectionStorage.getSelection({ ivaultKey, level: 1 });
      expect(Selectables.isEmpty(selectables)).toBe(false);
    });
  });

  describe("replaceSelection", () => {
    it("replaces selection on an empty selection", () => {
      selectionStorage.replaceSelection({ ivaultKey, source, selectables: baseSelection });
      const selectables = selectionStorage.getSelection({ ivaultKey });
      expect(Selectables.size(selectables)).toBe(baseSelection.length);

      for (const selectable of baseSelection) {
        expect(Selectables.has(selectables, selectable)).toBe(true);
      }
    });

    it("replaces on an non empty selection", () => {
      selectionStorage.addToSelection({ ivaultKey, source, selectables: [baseSelection[0]] });
      selectionStorage.replaceSelection({ ivaultKey, source, selectables: [baseSelection[1], baseSelection[2]] });
      const selectables = selectionStorage.getSelection({ ivaultKey });
      expect(Selectables.size(selectables)).toBe(baseSelection.length - 1);
      expect(Selectables.has(selectables, baseSelection[0])).toBe(false);
      expect(Selectables.has(selectables, baseSelection[1])).toBe(true);
      expect(Selectables.has(selectables, baseSelection[2])).toBe(true);
    });

    it("replaces on different iVaults", () => {
      const ivault2 = "iVault2";
      selectionStorage.replaceSelection({ ivaultKey, source, selectables: baseSelection });
      selectionStorage.replaceSelection({ ivaultKey: ivault2, source, selectables: baseSelection });

      for (const ivaultToken of [ivaultKey, ivault2]) {
        const selectables = selectionStorage.getSelection({ ivaultKey: ivaultToken });
        expect(Selectables.size(selectables)).toBe(baseSelection.length);

        for (const selectable of baseSelection) {
          expect(Selectables.has(selectables, selectable)).toBe(true);
        }
      }
    });

    it("replaces with different levels", () => {
      selectionStorage.replaceSelection({ ivaultKey, source, selectables: baseSelection, level: 0 });
      selectionStorage.replaceSelection({ ivaultKey, source, selectables: baseSelection, level: 1 });
      for (let i = 0; i <= 1; i++) {
        const selectables = selectionStorage.getSelection({ ivaultKey, level: i });
        expect(Selectables.size(selectables)).toBe(baseSelection.length);
        for (const selectable of baseSelection) {
          expect(Selectables.has(selectables, selectable)).toBe(true);
        }
      }
    });

    it("clears higher level selection when replacing lower level selection", () => {
      selectionStorage.addToSelection({ ivaultKey, source, selectables: baseSelection, level: 0 });
      selectionStorage.addToSelection({
        ivaultKey,
        source,
        selectables: [createSelectableInstanceKey(1, "schema.class1")],
        level: 1,
      });
      selectionStorage.replaceSelection({
        ivaultKey,
        source,
        selectables: [createSelectableInstanceKey(2, "schema.class2")],
        level: 0,
      });
      const selectables = selectionStorage.getSelection({ ivaultKey, level: 1 });
      expect(Selectables.isEmpty(selectables)).toBe(true);
    });

    it("doesn't clear higher level selection when replacing lower level selection with same items", () => {
      selectionStorage.addToSelection({ ivaultKey, source, selectables: baseSelection, level: 0 });
      selectionStorage.addToSelection({ ivaultKey, source, selectables: [createSelectableInstanceKey(1)], level: 1 });
      selectionStorage.replaceSelection({ ivaultKey, source, selectables: baseSelection, level: 0 });
      const selectables = selectionStorage.getSelection({ ivaultKey, level: 1 });
      expect(Selectables.isEmpty(selectables)).toBe(false);
    });
  });

  describe("clearSelection", () => {
    it("clears empty selection", () => {
      selectionStorage.clearSelection({ ivaultKey, source });
      const selectables = selectionStorage.getSelection({ ivaultKey });
      expect(Selectables.size(selectables)).toBe(0);
    });

    it("clears non empty selection", () => {
      selectionStorage.addToSelection({ ivaultKey, source, selectables: baseSelection });
      selectionStorage.clearSelection({ ivaultKey, source });
      expect(Selectables.isEmpty(selectionStorage.getSelection({ ivaultKey }))).toBe(true);
    });

    it("clears on different iVaults", () => {
      const ivault2 = "iVault2";
      selectionStorage.addToSelection({ ivaultKey, source, selectables: baseSelection });
      selectionStorage.addToSelection({ ivaultKey: ivault2, source, selectables: baseSelection });

      selectionStorage.clearSelection({ ivaultKey: ivault2, source });

      let selectables = selectionStorage.getSelection({ ivaultKey: ivault2 });
      expect(Selectables.size(selectables)).toBe(0);

      selectables = selectionStorage.getSelection({ ivaultKey });
      expect(Selectables.size(selectables)).toBe(baseSelection.length);

      for (const selectable of baseSelection) {
        expect(Selectables.has(selectables, selectable)).toBe(true);
      }
    });

    it("clears with different levels", () => {
      selectionStorage.addToSelection({ ivaultKey, source, selectables: baseSelection, level: 0 });
      selectionStorage.addToSelection({ ivaultKey, source, selectables: baseSelection, level: 1 });

      selectionStorage.clearSelection({ ivaultKey, source, level: 1 });
      const selectablesAtLevel1 = selectionStorage.getSelection({ ivaultKey, level: 1 });
      expect(Selectables.size(selectablesAtLevel1)).toBe(0);

      const selectablesAtLevel0 = selectionStorage.getSelection({ ivaultKey, level: 0 });
      expect(Selectables.size(selectablesAtLevel0)).toBe(baseSelection.length);

      for (const selectable of baseSelection) {
        expect(Selectables.has(selectablesAtLevel0, selectable)).toBe(true);
      }
    });

    it("clears higher level selection when clearing items in lower level selection", () => {
      selectionStorage.addToSelection({ ivaultKey, source, selectables: baseSelection, level: 0 });
      selectionStorage.addToSelection({ ivaultKey, source, selectables: [createSelectableInstanceKey(1)], level: 1 });
      selectionStorage.clearSelection({ ivaultKey, source, level: 0 });
      const selectables = selectionStorage.getSelection({ ivaultKey, level: 1 });
      expect(Selectables.isEmpty(selectables)).toBe(true);
    });

    it("doesn't clear higher level selection when clearing empty lower level selection", () => {
      selectionStorage.addToSelection({ ivaultKey, source, selectables: [createSelectableInstanceKey(1)], level: 1 });
      selectionStorage.clearSelection({ ivaultKey, source, level: 0 });
      const selectables = selectionStorage.getSelection({ ivaultKey, level: 1 });
      expect(Selectables.isEmpty(selectables)).toBe(false);
    });
  });

  describe("removeFromSelection", () => {
    it("removes part of the selection", () => {
      selectionStorage.addToSelection({ ivaultKey, source, selectables: baseSelection });
      selectionStorage.removeFromSelection({ ivaultKey, source, selectables: [baseSelection[1], baseSelection[2]] });
      const selectables = selectionStorage.getSelection({ ivaultKey });
      expect(Selectables.size(selectables)).toBe(baseSelection.length - 2);
      expect(Selectables.has(selectables, baseSelection[0])).toBe(true);
      expect(Selectables.has(selectables, baseSelection[1])).toBe(false);
      expect(Selectables.has(selectables, baseSelection[2])).toBe(false);
    });

    it("removes whole selection", () => {
      selectionStorage.addToSelection({ ivaultKey, source, selectables: baseSelection });
      selectionStorage.removeFromSelection({ ivaultKey, source, selectables: baseSelection });
      const selectables = selectionStorage.getSelection({ ivaultKey });
      expect(Selectables.size(selectables)).toBe(0);
    });

    it("removes on different iVaults", () => {
      const ivault2 = "iVault2";
      selectionStorage.addToSelection({ ivaultKey, source, selectables: baseSelection });
      selectionStorage.addToSelection({ ivaultKey: ivault2, source, selectables: baseSelection });

      selectionStorage.removeFromSelection({ ivaultKey, source, selectables: [baseSelection[0]] });
      selectionStorage.removeFromSelection({
        ivaultKey: ivault2,
        source,
        selectables: [baseSelection[1], baseSelection[2]],
      });
      let selectables = selectionStorage.getSelection({ ivaultKey });
      expect(Selectables.size(selectables)).toBe(baseSelection.length - 1);
      expect(Selectables.has(selectables, baseSelection[0])).toBe(false);
      expect(Selectables.has(selectables, baseSelection[1])).toBe(true);
      expect(Selectables.has(selectables, baseSelection[2])).toBe(true);

      selectables = selectionStorage.getSelection({ ivaultKey: ivault2 });
      expect(Selectables.size(selectables)).toBe(baseSelection.length - 2);
      expect(Selectables.has(selectables, baseSelection[0])).toBe(true);
      expect(Selectables.has(selectables, baseSelection[1])).toBe(false);
      expect(Selectables.has(selectables, baseSelection[2])).toBe(false);
    });

    it("removes with different levels", () => {
      selectionStorage.addToSelection({ ivaultKey, source, selectables: baseSelection, level: 0 });
      selectionStorage.addToSelection({ ivaultKey, source, selectables: baseSelection, level: 1 });
      selectionStorage.removeFromSelection({ ivaultKey, source, selectables: [baseSelection[0]], level: 1 });

      const selectablesAtLevel0 = selectionStorage.getSelection({ ivaultKey, level: 0 });
      expect(Selectables.size(selectablesAtLevel0)).toBe(baseSelection.length);
      expect(Selectables.has(selectablesAtLevel0, baseSelection[0])).toBe(true);
      expect(Selectables.has(selectablesAtLevel0, baseSelection[1])).toBe(true);
      expect(Selectables.has(selectablesAtLevel0, baseSelection[2])).toBe(true);

      const selectablesAtLevel1 = selectionStorage.getSelection({ ivaultKey, level: 1 });
      expect(Selectables.size(selectablesAtLevel1)).toBe(baseSelection.length - 1);
      expect(Selectables.has(selectablesAtLevel1, baseSelection[0])).toBe(false);
      expect(Selectables.has(selectablesAtLevel1, baseSelection[1])).toBe(true);
      expect(Selectables.has(selectablesAtLevel1, baseSelection[2])).toBe(true);
    });

    it("clears higher level selection when removing items from lower level selection", () => {
      selectionStorage.addToSelection({ ivaultKey, source, selectables: baseSelection, level: 0 });
      selectionStorage.addToSelection({ ivaultKey, source, selectables: [createSelectableInstanceKey(1)], level: 1 });
      selectionStorage.removeFromSelection({ ivaultKey, source, selectables: baseSelection, level: 0 });
      const selectables = selectionStorage.getSelection({ ivaultKey, level: 1 });
      expect(Selectables.isEmpty(selectables)).toBe(true);
    });

    it("doesn't clear higher level selection when removing non-existing items from lower level selection", () => {
      selectionStorage.addToSelection({ ivaultKey, source, selectables: baseSelection, level: 0 });
      selectionStorage.addToSelection({
        ivaultKey,
        source,
        selectables: [createSelectableInstanceKey(1, "schema.class1")],
        level: 1,
      });
      selectionStorage.removeFromSelection({
        ivaultKey,
        source,
        selectables: [createSelectableInstanceKey(2, "schema.class2")],
      });
      const selectables = selectionStorage.getSelection({ ivaultKey, level: 1 });
      expect(Selectables.isEmpty(selectables)).toBe(false);
    });
  });

  describe("selectionChange", () => {
    it("fires `selectionChange` event after `addToSelection`, `replaceSelection`, `clearSelection`, `removeFromSelection`", () => {
      const listenerSpy = vi.fn();
      selectionStorage.selectionChangeEvent.addListener(listenerSpy);
      selectionStorage.addToSelection({ ivaultKey, source, selectables: baseSelection });
      selectionStorage.removeFromSelection({ ivaultKey, source, selectables: baseSelection });
      selectionStorage.replaceSelection({ ivaultKey, source, selectables: baseSelection });
      selectionStorage.clearSelection({ ivaultKey, source });
      expect(listenerSpy, "Expected selectionChange.raiseEvent to be called").toHaveBeenCalledTimes(4);
    });

    it("doesn't fire `selectionChange` event after addToSelection, replaceSelection, clearSelection, removeFromSelection if nothing changes", () => {
      const listenerSpy = vi.fn();
      selectionStorage.selectionChangeEvent.addListener(listenerSpy);
      selectionStorage.addToSelection({ ivaultKey, source, selectables: [] });
      selectionStorage.clearSelection({ ivaultKey, source });
      selectionStorage.removeFromSelection({ ivaultKey, source, selectables: baseSelection });
      selectionStorage.replaceSelection({ ivaultKey, source, selectables: [] });
      expect(listenerSpy, "Expected selectionChange.raiseEvent to not be called").not.toHaveBeenCalled();
    });

    it("fires `selectionChange` event with empty `ivaultKey` when triggered without an iVault key", () => {
      const listenerSpy = vi.fn();
      selectionStorage.selectionChangeEvent.addListener(listenerSpy);
      selectionStorage.replaceSelection({ source, selectables: baseSelection });
      expect(listenerSpy).toHaveBeenCalledWith(expect.objectContaining({ ivaultKey: "" }), selectionStorage);
    });
  });
});
