/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { createAsyncIterator } from "presentation-test-utilities";
import { beforeEach, describe, expect, it, Mocked, vi } from "vitest";
import { BeUiEvent } from "@szewtwin/core-szewec";
import { FormattingUnitSystemChangedArgs, IVaultApp, IVaultConnection, QuantityFormatter } from "@szewtwin/core-frontend";
import { InstanceKey, Item, KeySet } from "@szewtwin/presentation-common";
import { Presentation, PresentationManager, SelectionManager } from "@szewtwin/presentation-frontend";
import { createStorage, Selectables, SelectionStorage } from "@szewtwin/unified-selection";
import { TableColumnDefinition, TableRowDefinition } from "../../presentation-components/table/Types.js";
import {
  usePresentationTable,
  UsePresentationTableProps,
  usePresentationTableWithUnifiedSelection,
  UsePresentationTableWithUnifiedSelectionProps,
} from "../../presentation-components/table/UsePresentationTable.js";
import { createTestDMInstanceKey, createTestPropertyInfo } from "../_helpers/Common.js";
import {
  createTestContentDescriptor,
  createTestContentItem,
  createTestPropertiesContentField,
} from "../_helpers/Content.js";
import { createTestDMClassGroupingNodeKey, createTestDMInstancesNodeKey } from "../_helpers/Hierarchy.js";
import { act, createMocked, renderHook, waitFor } from "../TestUtils.js";

/* eslint-disable @typescript-eslint/no-deprecated */

describe("usePresentationTable", () => {
  const ivault = { key: "ivault_key" } as IVaultConnection;
  const initialProps: UsePresentationTableProps<TableColumnDefinition, TableRowDefinition> = {
    ivault,
    keys: new KeySet([createTestDMInstanceKey()]),
    ruleset: "ruleset_id",
    columnMapper: (col) => col,
    rowMapper: (row) => row,
    pageSize: 10,
  };

  let presentationManager: Mocked<PresentationManager>;

  beforeEach(() => {
    presentationManager = createMocked(PresentationManager);
    vi.spyOn(Presentation, "presentation", "get").mockReturnValue(presentationManager);
    vi.spyOn(IVaultApp, "quantityFormatter", "get").mockReturnValue({
      onActiveFormattingUnitSystemChanged: new BeUiEvent<FormattingUnitSystemChangedArgs>(),
    } as unknown as QuantityFormatter);
  });

  it("loads columns and rows", async () => {
    const propertiesField = createTestPropertiesContentField({
      name: "first_field",
      label: "First Field",
      properties: [{ property: createTestPropertyInfo() }],
    });
    const descriptor = createTestContentDescriptor({ fields: [propertiesField] });
    const item = createTestContentItem({
      values: { [propertiesField.name]: "test_value" },
      displayValues: { [propertiesField.name]: "Test value" },
    });

    presentationManager.getContentDescriptor.mockResolvedValue(descriptor);
    presentationManager.getContentIterator.mockImplementation(async () => ({
      descriptor,
      items: createAsyncIterator([item]),
      total: 1,
    }));

    const { result } = renderHook(
      (props: UsePresentationTableProps<TableColumnDefinition, TableRowDefinition>) => usePresentationTable(props),
      { initialProps },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.columns).toMatchObject([
      { name: propertiesField.name, label: propertiesField.label, field: propertiesField },
    ]);
    expect(result.current.rows[0].cells).toMatchObject([{ key: propertiesField.name }]);
  });
});

describe("usePresentationTableWithUnifiedSelection", () => {
  const ivault = { key: "ivault_key" } as IVaultConnection;
  const initialProps: UsePresentationTableWithUnifiedSelectionProps<TableColumnDefinition, TableRowDefinition> = {
    ivault,
    ruleset: "ruleset_id",
    columnMapper: (col) => col,
    rowMapper: (row) => row,
    pageSize: 10,
  };
  const selectionSource = "TestSource";

  let presentationManager: Mocked<PresentationManager>;

  beforeEach(() => {
    presentationManager = createMocked(PresentationManager);
    vi.spyOn(Presentation, "presentation", "get").mockReturnValue(presentationManager);
    vi.spyOn(IVaultApp, "quantityFormatter", "get").mockReturnValue({
      onActiveFormattingUnitSystemChanged: new BeUiEvent<FormattingUnitSystemChangedArgs>(),
    } as unknown as QuantityFormatter);
    IVaultConnection.onOpen.raiseEvent(ivault);
  });

  it("loads columns and rows with keys from unified selection", async () => {
    const propertiesField = createTestPropertiesContentField({
      name: "first_field",
      label: "First Field",
      properties: [{ property: createTestPropertyInfo() }],
    });
    const descriptor = createTestContentDescriptor({ fields: [propertiesField] });
    const item = createTestContentItem({
      values: { [propertiesField.name]: "test_value" },
      displayValues: { [propertiesField.name]: "Test value" },
    });

    presentationManager.getContentDescriptor.mockResolvedValue(descriptor);
    presentationManager.getContentIterator.mockImplementation(async () => ({
      descriptor,
      items: createAsyncIterator([item]),
      total: 1,
    }));

    const selectedKey = createTestDMInstanceKey();
    const selectionStorage = createStorage();
    selectionStorage.addToSelection({ ivaultKey: ivault.key, source: selectionSource, selectables: [selectedKey] });

    const { result } = renderHook(() =>
      usePresentationTableWithUnifiedSelection({ ...initialProps, selectionStorage }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.columns).toMatchObject([
      { name: propertiesField.name, label: propertiesField.label, field: propertiesField },
    ]);
    expect(result.current.rows[0].cells).toMatchObject([{ key: propertiesField.name }]);

    expect(presentationManager.getContentDescriptor).toHaveBeenCalled();
    expect(presentationManager.getContentDescriptor.mock.lastCall![0].keys.has(selectedKey)).toBe(true);
    expect(presentationManager.getContentIterator).toHaveBeenCalled();
    expect(presentationManager.getContentIterator.mock.lastCall![0].keys.has(selectedKey)).toBe(true);
  });

  it("loads columns and rows with no keys when unified selection is empty", async () => {
    presentationManager.getContentDescriptor.mockResolvedValue(undefined);
    presentationManager.getContentIterator.mockImplementation(async () => undefined);

    const { result } = renderHook((props) => usePresentationTableWithUnifiedSelection(props), {
      initialProps: { ...initialProps, selectionStorage: createStorage() },
    });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.columns).toHaveLength(0);
    expect(result.current.rows).toHaveLength(0);
  });

  describe("with deprecated `SelectionManager` from `presentation-frontend` package", () => {
    beforeEach(() => {
      const selectionManager = new SelectionManager({ scopes: undefined as any });
      vi.spyOn(Presentation, "selection", "get").mockReturnValue(selectionManager);
    });

    it("loads data when grouping node is selected", async () => {
      const groupingKey = createTestDMClassGroupingNodeKey();
      const keys = new KeySet([groupingKey]);

      vi.spyOn(Presentation.selection, "getSelection").mockReturnValue(keys);

      setupPresentationManager();

      const { result } = renderHook(() => usePresentationTableWithUnifiedSelection(initialProps));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.rows).toHaveLength(1);
      });

      expect(presentationManager.getContentDescriptor).toHaveBeenCalled();
      expect(presentationManager.getContentDescriptor.mock.lastCall![0].keys.hasAll(keys)).toBe(true);
      expect(presentationManager.getContentIterator).toHaveBeenCalled();
      expect(presentationManager.getContentIterator.mock.lastCall![0].keys.hasAll(keys)).toBe(true);
    });

    describe("updating unified selection on table selection changes (`onSelect` calls)", () => {
      it("adds passed keys to `SelectionManager`", async () => {
        const keys = new KeySet([createTestDMInstanceKey()]);
        const stringifiedKeys: string[] = [];

        keys.forEach((key) => {
          stringifiedKeys.push(JSON.stringify(key));
        });

        vi.spyOn(Presentation.selection, "getSelection").mockReturnValue(keys);

        setupPresentationManager();

        const { result } = renderHook(() => usePresentationTableWithUnifiedSelection(initialProps));

        const replaceSpy = vi.spyOn(Presentation.selection, "replaceSelection");
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const expectedKeys = result.current.rows.map((row) => JSON.parse(row.key));
        act(() => {
          result.current.onSelect(stringifiedKeys);
        });
        expect(replaceSpy).toHaveBeenCalledExactlyOnceWith(
          expect.stringContaining("UnifiedSelectionTable"),
          ivault,
          expectedKeys,
          1,
        );
      });

      it("gets invalid keys and does not pass any to `SelectionManager`", async () => {
        const keys = ["this is not a valid key", ""];
        const { result } = renderHook(() => usePresentationTableWithUnifiedSelection(initialProps));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const replaceSpy = vi.spyOn(Presentation.selection, "replaceSelection");
        act(() => {
          result.current.onSelect(keys);
        });

        expect(replaceSpy).toHaveBeenCalledExactlyOnceWith(
          expect.stringContaining("UnifiedSelectionTable"),
          ivault,
          [],
          1,
        );
      });

      it("gets valid keys for rows that are not loaded and does not pass any to `SelectionManager`", async () => {
        const stringifiedKeys = [createTestDMInstanceKey()].map((key) => JSON.stringify(key));

        const { result } = renderHook(() => usePresentationTableWithUnifiedSelection(initialProps));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const replaceSpy = vi.spyOn(Presentation.selection, "replaceSelection");
        act(() => {
          result.current.onSelect(stringifiedKeys);
        });

        await waitFor(() => {
          expect(replaceSpy).toHaveBeenCalledExactlyOnceWith(
            expect.stringContaining("UnifiedSelectionTable"),
            ivault,
            [],
            1,
          );
        });
      });
    });

    describe("reacting to unified selection changes", () => {
      it("loads rows when unified selection changes", async () => {
        const { result } = renderHook(() => usePresentationTableWithUnifiedSelection(initialProps));
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.rows).toHaveLength(0);
        });
        setupPresentationManager([createTestDMInstanceKey()]);

        const selectionChangeInstanceKeys = [
          createTestDMInstanceKey({ id: "0x123" }),
          createTestDMInstanceKey({ id: "0x456" }),
          createTestDMInstanceKey({ id: "0x789" }),
        ];

        const keySet = new KeySet([
          selectionChangeInstanceKeys[0],
          { classFullName: selectionChangeInstanceKeys[1].className, id: selectionChangeInstanceKeys[1].id },
          createTestDMInstancesNodeKey({ instanceKeys: [selectionChangeInstanceKeys[2]] }),
        ]);

        act(() => {
          // select the row to get loaded onto the component
          Presentation.selection.addToSelection(selectionSource, ivault, keySet, 0);
        });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.rows).toHaveLength(1);
        });
        expect(presentationManager.getContentDescriptor).toHaveBeenCalled();
        expect(presentationManager.getContentDescriptor.mock.lastCall![0].keys.hasAll(keySet)).toBe(true);
        expect(presentationManager.getContentIterator).toHaveBeenCalled();
        expect(presentationManager.getContentIterator.mock.lastCall![0].keys.hasAll(keySet)).toBe(true);
      });

      it("ignores selection changes on different ivault", async () => {
        const { result } = renderHook(() => usePresentationTableWithUnifiedSelection(initialProps));
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.rows).toHaveLength(0);
        });
        const instanceKey = createTestDMInstanceKey();
        setupPresentationManager([instanceKey]);

        const otherIVault = { key: "other_ivault" } as IVaultConnection;
        IVaultConnection.onOpen.raiseEvent(otherIVault);
        act(() => {
          // select the row to get loaded onto the component
          Presentation.selection.addToSelection(selectionSource, otherIVault, new KeySet([instanceKey]), 0);
        });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.rows).toHaveLength(0);
          expect(presentationManager.getContentDescriptor).not.toHaveBeenCalled();
        });
      });

      it("returns an array of selectedRows when keys are passed before the table is loaded", async () => {
        const keys = new KeySet([createTestDMInstanceKey()]);
        setupPresentationManager();

        // select the row to get loaded onto the component
        Presentation.selection.addToSelection(selectionSource, ivault, keys, 0);
        // add the instance to level 1 to make the row selected
        Presentation.selection.addToSelection(selectionSource, ivault, keys, 1);

        // wait for selection to be setup
        await waitFor(() => {
          expect(Presentation.selection.getSelection(ivault, 0).size).toBe(keys.size);
          expect(Presentation.selection.getSelection(ivault, 1).size).toBe(keys.size);
        });

        const { result } = renderHook(() => usePresentationTableWithUnifiedSelection(initialProps));

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          const resultAfterLoading = result.current.selectedRows;
          expect(resultAfterLoading).toHaveLength(1);
        });
      });

      it("returns an array of selectedRows when keys are added on selectionChange event", async () => {
        const instanceKey1 = createTestDMInstanceKey({ id: "0x1" });
        const instanceKey2 = createTestDMInstanceKey({ id: "0x2" });

        setupPresentationManager([instanceKey1, instanceKey2]);

        // select both instances at level 0 to get them displayed in the component
        Presentation.selection.addToSelection(selectionSource, ivault, new KeySet([instanceKey1, instanceKey2]), 0);
        // select instanceKey1 at level 1 to get its row selected
        Presentation.selection.addToSelection(selectionSource, ivault, new KeySet([instanceKey1]), 1);

        // wait for selection to be setup
        await waitFor(() => {
          expect(Presentation.selection.getSelection(ivault, 0).size).toBe(2);
          expect(Presentation.selection.getSelection(ivault, 1).size).toBe(1);
        });

        const { result } = renderHook(() => usePresentationTableWithUnifiedSelection(initialProps));

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          const selectedRowsAfterLoading = result.current.selectedRows;
          expect(selectedRowsAfterLoading).toHaveLength(1);
        });

        act(() => {
          Presentation.selection.addToSelection(selectionSource, ivault, new KeySet([instanceKey2]), 1);
        });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          const selectedRowsAfterAdding = result.current.selectedRows;
          expect(selectedRowsAfterAdding).toHaveLength(2);
        });
      });

      it("returns new array of selectedRows when keys are replaced on selectionChange event", async () => {
        const instanceKey1 = createTestDMInstanceKey({ id: "0x1" });
        const instanceKey2 = createTestDMInstanceKey({ id: "0x2" });

        setupPresentationManager([instanceKey1, instanceKey2]);

        // select both instances at level 0 to get them displayed in the component
        Presentation.selection.addToSelection(selectionSource, ivault, new KeySet([instanceKey1, instanceKey2]), 0);
        // select instanceKey1 at level 1 to get its row selected
        Presentation.selection.addToSelection(selectionSource, ivault, new KeySet([instanceKey1]), 1);

        // wait for selection to be setup
        await waitFor(() => {
          expect(Presentation.selection.getSelection(ivault, 0).size).toBe(2);
          expect(Presentation.selection.getSelection(ivault, 1).size).toBe(1);
        });

        const { result } = renderHook(() => usePresentationTableWithUnifiedSelection(initialProps));

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          const selectedRowsAfterLoading = result.current.selectedRows;
          expect(selectedRowsAfterLoading).toHaveLength(1);
          expect(selectedRowsAfterLoading[0].key).toEqual(JSON.stringify(instanceKey1));
        });

        act(() => {
          Presentation.selection.replaceSelection(selectionSource, ivault, new KeySet([instanceKey2]), 1);
        });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          const selectedRowsAfterReplacing = result.current.selectedRows;
          expect(selectedRowsAfterReplacing).toHaveLength(1);
          expect(selectedRowsAfterReplacing[0].key).toEqual(JSON.stringify(instanceKey2));
        });
      });

      it("returns smaller array of selectedRows when keys are removed on selectionChange event", async () => {
        const instanceKey1 = createTestDMInstanceKey({ id: "0x1" });
        const instanceKey2 = createTestDMInstanceKey({ id: "0x2" });

        setupPresentationManager([instanceKey1, instanceKey2]);

        // select both instances on both levels to make sure rows are loaded onto the component and selected on initial load.
        Presentation.selection.addToSelection(selectionSource, ivault, new KeySet([instanceKey1, instanceKey2]), 0);
        Presentation.selection.addToSelection(selectionSource, ivault, new KeySet([instanceKey1, instanceKey2]), 1);

        // wait for selection to be setup
        await waitFor(() => {
          expect(Presentation.selection.getSelection(ivault, 0).size).toBe(2);
          expect(Presentation.selection.getSelection(ivault, 1).size).toBe(2);
        });

        const { result } = renderHook(() => usePresentationTableWithUnifiedSelection(initialProps));

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          const selectedRowsAfterLoading = result.current.selectedRows;
          expect(selectedRowsAfterLoading).toHaveLength(2);
        });

        act(() => {
          Presentation.selection.removeFromSelection(selectionSource, ivault, new KeySet([instanceKey1]), 1);
        });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          const selectedRowsAfterRemoving = result.current.selectedRows;
          expect(selectedRowsAfterRemoving).toHaveLength(1);
          expect(selectedRowsAfterRemoving[0].key).toEqual(JSON.stringify(instanceKey2));
        });
      });

      it("returns new array of selectedRows when keys are cleared on selectionChange event", async () => {
        const instanceKey1 = createTestDMInstanceKey({ id: "0x1" });
        const instanceKey2 = createTestDMInstanceKey({ id: "0x2" });

        setupPresentationManager([instanceKey1, instanceKey2]);

        // select both instances on both levels to make sure rows are loaded onto the component and selected on initial load.
        Presentation.selection.addToSelection(selectionSource, ivault, new KeySet([instanceKey1, instanceKey2]), 0);
        Presentation.selection.addToSelection(selectionSource, ivault, new KeySet([instanceKey1, instanceKey2]), 1);

        // wait for selection to be setup
        await waitFor(() => {
          expect(Presentation.selection.getSelection(ivault, 0).size).toBe(2);
          expect(Presentation.selection.getSelection(ivault, 1).size).toBe(2);
        });

        const { result } = renderHook(() => usePresentationTableWithUnifiedSelection(initialProps));

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          const selectedRowsAfterLoading = result.current.selectedRows;
          expect(selectedRowsAfterLoading).toHaveLength(2);
        });

        act(() => {
          Presentation.selection.clearSelection(selectionSource, ivault, 1);
        });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          const selectedRowsAfterClearing = result.current.selectedRows;
          expect(selectedRowsAfterClearing).toHaveLength(0);
        });
      });

      it("clears selected rows when selection in 0 level changes", async () => {
        const instanceKey1 = createTestDMInstanceKey({ id: "0x1" });
        const instanceKey2 = createTestDMInstanceKey({ id: "0x2" });

        setupPresentationManager([instanceKey1]);

        // select both instances on both levels to make sure rows are loaded onto the component and selected on initial load.
        Presentation.selection.addToSelection(selectionSource, ivault, new KeySet([instanceKey1]), 0);
        Presentation.selection.addToSelection(selectionSource, ivault, new KeySet([instanceKey1]), 1);

        // wait for selection to be setup
        await waitFor(() => {
          expect(Presentation.selection.getSelection(ivault, 0).size).toBe(1);
          expect(Presentation.selection.getSelection(ivault, 1).size).toBe(1);
        });

        const { result } = renderHook(() => usePresentationTableWithUnifiedSelection(initialProps));

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.rows).toHaveLength(1);
          expect(result.current.selectedRows).toHaveLength(1);
        });

        setupPresentationManager([instanceKey1, instanceKey2]);
        act(() => {
          Presentation.selection.addToSelection(selectionSource, ivault, new KeySet([instanceKey2]), 0);
        });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.rows).toHaveLength(2);
          expect(result.current.selectedRows).toHaveLength(0);
        });
      });

      it("returns an empty array of selectedRows when keys are passed from the wrong level on selectionChange event", async () => {
        const { result } = renderHook(() => usePresentationTableWithUnifiedSelection(initialProps));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
          Presentation.selection.addToSelection(
            selectionSource,
            initialProps.ivault,
            new KeySet([createTestDMInstanceKey()]),
            3,
          );
        });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          const selectedRowsAfterAdding = result.current.selectedRows;
          expect(selectedRowsAfterAdding).toHaveLength(0);
        });
      });
    });
  });

  describe("with unified selection storage from `unified-selection` package", () => {
    let selectionStorage: SelectionStorage;

    beforeEach(() => {
      selectionStorage = createStorage();
      initialProps.selectionStorage = selectionStorage;
    });

    describe("updating unified selection on table selection changes (`onSelect` calls)", () => {
      it("adds passed keys to storage", async () => {
        setupPresentationManager();

        const selectionLevel0 = [createTestDMInstanceKey()];
        selectionStorage.addToSelection({
          ivaultKey: ivault.key,
          source: "UnifiedSelectionTable",
          selectables: selectionLevel0,
          level: 0,
        });
        expect(Selectables.isEmpty(selectionStorage.getSelection({ ivaultKey: ivault.key, level: 1 }))).toBe(true);

        const { result } = renderHook(() => usePresentationTableWithUnifiedSelection(initialProps));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
          const stringifiedKeys: string[] = [];
          selectionLevel0.forEach((key) => {
            stringifiedKeys.push(JSON.stringify(key));
          });
          result.current.onSelect(stringifiedKeys);
        });
        await waitFor(() => {
          expect(
            Selectables.hasAll(selectionStorage.getSelection({ ivaultKey: ivault.key, level: 1 }), selectionLevel0),
          ).toBe(true);
        });
      });

      it("gets invalid keys and does not pass any to storage", async () => {
        const { result } = renderHook(() => usePresentationTableWithUnifiedSelection(initialProps));
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(Selectables.isEmpty(selectionStorage.getSelection({ ivaultKey: ivault.key, level: 1 }))).toBe(true);

        act(() => {
          result.current.onSelect(["this is not a valid key", ""]);
        });
        expect(Selectables.isEmpty(selectionStorage.getSelection({ ivaultKey: ivault.key, level: 1 }))).toBe(true);
      });

      it("gets valid keys for rows that are not loaded and does not pass any to storage", async () => {
        const { result } = renderHook(() => usePresentationTableWithUnifiedSelection(initialProps));
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(Selectables.isEmpty(selectionStorage.getSelection({ ivaultKey: ivault.key, level: 1 }))).toBe(true);

        act(() => {
          const stringifiedKeys = [createTestDMInstanceKey()].map((key) => JSON.stringify(key));
          result.current.onSelect(stringifiedKeys);
        });
        expect(Selectables.isEmpty(selectionStorage.getSelection({ ivaultKey: ivault.key, level: 1 }))).toBe(true);
      });
    });

    describe("reacting to unified selection changes", () => {
      it("loads rows when unified selection changes", async () => {
        const { result } = renderHook(() => usePresentationTableWithUnifiedSelection(initialProps));
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.rows).toHaveLength(0);
        });
        setupPresentationManager([createTestDMInstanceKey()]);

        const selectablesInstanceKeys = [
          createTestDMInstanceKey({ id: "0x123" }),
          createTestDMInstanceKey({ id: "0x456" }),
        ];

        act(() => {
          // select the row to get loaded onto the component
          selectionStorage.addToSelection({
            ivaultKey: ivault.key,
            source: selectionSource,
            selectables: [
              selectablesInstanceKeys[0],
              {
                identifier: "custom",
                loadInstanceKeys: () => createAsyncIterator([selectablesInstanceKeys[1]]),
                data: undefined,
              },
            ],
            level: 0,
          });
        });
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.rows).toHaveLength(1);
        });
        expect(presentationManager.getContentDescriptor).toHaveBeenCalled();
        expect(presentationManager.getContentDescriptor.mock.lastCall![0].keys.hasAll(selectablesInstanceKeys)).toBe(
          true,
        );
        expect(presentationManager.getContentIterator).toHaveBeenCalled();
        expect(presentationManager.getContentIterator.mock.lastCall![0].keys.hasAll(selectablesInstanceKeys)).toBe(
          true,
        );
      });

      it("ignores selection changes on different ivault", async () => {
        const { result } = renderHook(() => usePresentationTableWithUnifiedSelection(initialProps));
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.rows).toHaveLength(0);
        });
        const instanceKey = createTestDMInstanceKey();
        setupPresentationManager([instanceKey]);

        const otherIVault = { key: "other_ivault" } as IVaultConnection;
        IVaultConnection.onOpen.raiseEvent(otherIVault);
        act(() => {
          // select the row to get loaded onto the component
          selectionStorage.addToSelection({
            ivaultKey: otherIVault.key,
            source: selectionSource,
            selectables: [instanceKey],
            level: 0,
          });
        });
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.rows).toHaveLength(0);
          expect(presentationManager.getContentDescriptor).not.toHaveBeenCalled();
        });
      });

      it("returns an array of selectedRows when keys are passed before the table is loaded", async () => {
        const instanceKey = createTestDMInstanceKey();
        setupPresentationManager();

        // select the row to get loaded onto the component
        selectionStorage.addToSelection({
          ivaultKey: ivault.key,
          source: selectionSource,
          selectables: [instanceKey],
          level: 0,
        });
        // add the instance to level 1 to make the row selected
        selectionStorage.addToSelection({
          ivaultKey: ivault.key,
          source: selectionSource,
          selectables: [instanceKey],
          level: 1,
        });
        // wait for selection to be setup
        await waitFor(() => {
          expect(Selectables.size(selectionStorage.getSelection({ ivaultKey: ivault.key, level: 0 }))).toBe(1);
          expect(Selectables.size(selectionStorage.getSelection({ ivaultKey: ivault.key, level: 1 }))).toBe(1);
        });

        const { result } = renderHook(() => usePresentationTableWithUnifiedSelection(initialProps));
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          const resultAfterLoading = result.current.selectedRows;
          expect(resultAfterLoading).toHaveLength(1);
        });
      });

      it("returns an array of selectedRows when keys are added on selectionChange event", async () => {
        const instanceKey1 = createTestDMInstanceKey({ id: "0x1" });
        const instanceKey2 = createTestDMInstanceKey({ id: "0x2" });
        setupPresentationManager([instanceKey1, instanceKey2]);

        // select both instances at level 0 to get them displayed in the component
        selectionStorage.addToSelection({
          ivaultKey: ivault.key,
          source: selectionSource,
          selectables: [instanceKey1, instanceKey2],
          level: 0,
        });
        // select instanceKey1 at level 1 to get its row selected
        selectionStorage.addToSelection({
          ivaultKey: ivault.key,
          source: selectionSource,
          selectables: [instanceKey1],
          level: 1,
        });
        // wait for selection to be setup
        await waitFor(() => {
          expect(Selectables.size(selectionStorage.getSelection({ ivaultKey: ivault.key, level: 0 }))).toBe(2);
          expect(Selectables.size(selectionStorage.getSelection({ ivaultKey: ivault.key, level: 1 }))).toBe(1);
        });

        const { result } = renderHook(() => usePresentationTableWithUnifiedSelection(initialProps));
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          const selectedRowsAfterLoading = result.current.selectedRows;
          expect(selectedRowsAfterLoading).toHaveLength(1);
        });

        act(() => {
          selectionStorage.addToSelection({
            ivaultKey: ivault.key,
            source: selectionSource,
            selectables: [instanceKey2],
            level: 1,
          });
        });
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          const selectedRowsAfterAdding = result.current.selectedRows;
          expect(selectedRowsAfterAdding).toHaveLength(2);
        });
      });

      it("returns new array of selectedRows when keys are replaced on selectionChange event", async () => {
        const instanceKey1 = createTestDMInstanceKey({ id: "0x1" });
        const instanceKey2 = createTestDMInstanceKey({ id: "0x2" });
        setupPresentationManager([instanceKey1, instanceKey2]);

        // select both instances at level 0 to get them displayed in the component
        selectionStorage.addToSelection({
          ivaultKey: ivault.key,
          source: selectionSource,
          selectables: [instanceKey1, instanceKey2],
          level: 0,
        });
        // select instanceKey1 at level 1 to get its row selected
        selectionStorage.addToSelection({
          ivaultKey: ivault.key,
          source: selectionSource,
          selectables: [instanceKey1],
          level: 1,
        });
        // wait for selection to be setup
        await waitFor(() => {
          expect(Selectables.size(selectionStorage.getSelection({ ivaultKey: ivault.key, level: 0 }))).toBe(2);
          expect(Selectables.size(selectionStorage.getSelection({ ivaultKey: ivault.key, level: 1 }))).toBe(1);
        });

        const { result } = renderHook(() => usePresentationTableWithUnifiedSelection(initialProps));
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          const selectedRowsAfterLoading = result.current.selectedRows;
          expect(selectedRowsAfterLoading).toHaveLength(1);
          expect(selectedRowsAfterLoading[0].key).toEqual(JSON.stringify(instanceKey1));
        });

        act(() => {
          selectionStorage.replaceSelection({
            ivaultKey: ivault.key,
            source: selectionSource,
            selectables: [instanceKey2],
            level: 1,
          });
        });
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          const selectedRowsAfterReplacing = result.current.selectedRows;
          expect(selectedRowsAfterReplacing).toHaveLength(1);
          expect(selectedRowsAfterReplacing[0].key).toEqual(JSON.stringify(instanceKey2));
        });
      });

      it("returns smaller array of selectedRows when keys are removed on selectionChange event", async () => {
        const instanceKey1 = createTestDMInstanceKey({ id: "0x1" });
        const instanceKey2 = createTestDMInstanceKey({ id: "0x2" });
        setupPresentationManager([instanceKey1, instanceKey2]);

        // select both instances on both levels to make sure rows are loaded onto the component and selected on initial load.
        selectionStorage.addToSelection({
          ivaultKey: ivault.key,
          source: selectionSource,
          selectables: [instanceKey1, instanceKey2],
          level: 0,
        });
        selectionStorage.addToSelection({
          ivaultKey: ivault.key,
          source: selectionSource,
          selectables: [instanceKey1, instanceKey2],
          level: 1,
        });
        // wait for selection to be setup
        await waitFor(() => {
          expect(Selectables.size(selectionStorage.getSelection({ ivaultKey: ivault.key, level: 0 }))).toBe(2);
          expect(Selectables.size(selectionStorage.getSelection({ ivaultKey: ivault.key, level: 1 }))).toBe(2);
        });

        const { result } = renderHook(() => usePresentationTableWithUnifiedSelection(initialProps));
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          const selectedRowsAfterLoading = result.current.selectedRows;
          expect(selectedRowsAfterLoading).toHaveLength(2);
        });

        act(() => {
          selectionStorage.removeFromSelection({
            ivaultKey: ivault.key,
            source: selectionSource,
            selectables: [instanceKey1],
            level: 1,
          });
        });
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          const selectedRowsAfterRemoving = result.current.selectedRows;
          expect(selectedRowsAfterRemoving).toHaveLength(1);
          expect(selectedRowsAfterRemoving[0].key).toEqual(JSON.stringify(instanceKey2));
        });
      });

      it("returns new array of selectedRows when keys are cleared on selectionChange event", async () => {
        const instanceKey1 = createTestDMInstanceKey({ id: "0x1" });
        const instanceKey2 = createTestDMInstanceKey({ id: "0x2" });
        setupPresentationManager([instanceKey1, instanceKey2]);

        // select both instances on both levels to make sure rows are loaded onto the component and selected on initial load.
        selectionStorage.addToSelection({
          ivaultKey: ivault.key,
          source: selectionSource,
          selectables: [instanceKey1, instanceKey2],
          level: 0,
        });
        selectionStorage.addToSelection({
          ivaultKey: ivault.key,
          source: selectionSource,
          selectables: [instanceKey1, instanceKey2],
          level: 1,
        });
        // wait for selection to be setup
        await waitFor(() => {
          expect(Selectables.size(selectionStorage.getSelection({ ivaultKey: ivault.key, level: 0 }))).toBe(2);
          expect(Selectables.size(selectionStorage.getSelection({ ivaultKey: ivault.key, level: 1 }))).toBe(2);
        });

        const { result } = renderHook(() => usePresentationTableWithUnifiedSelection(initialProps));
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          const selectedRowsAfterLoading = result.current.selectedRows;
          expect(selectedRowsAfterLoading).toHaveLength(2);
        });

        act(() => {
          selectionStorage.clearSelection({ ivaultKey: ivault.key, source: selectionSource, level: 1 });
        });
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          const selectedRowsAfterClearing = result.current.selectedRows;
          expect(selectedRowsAfterClearing).toHaveLength(0);
        });
      });

      it("clears selected rows when selection in 0 level changes", async () => {
        const instanceKey1 = createTestDMInstanceKey({ id: "0x1" });
        const instanceKey2 = createTestDMInstanceKey({ id: "0x2" });
        setupPresentationManager([instanceKey1]);

        // select both instances on both levels to make sure rows are loaded onto the component and selected on initial load.
        selectionStorage.addToSelection({
          ivaultKey: ivault.key,
          source: selectionSource,
          selectables: [instanceKey1],
          level: 0,
        });
        selectionStorage.addToSelection({
          ivaultKey: ivault.key,
          source: selectionSource,
          selectables: [instanceKey1],
          level: 1,
        });
        // wait for selection to be setup
        await waitFor(() => {
          expect(Selectables.size(selectionStorage.getSelection({ ivaultKey: ivault.key, level: 0 }))).toBe(1);
          expect(Selectables.size(selectionStorage.getSelection({ ivaultKey: ivault.key, level: 1 }))).toBe(1);
        });

        const { result } = renderHook(() => usePresentationTableWithUnifiedSelection(initialProps));
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.rows).toHaveLength(1);
          expect(result.current.selectedRows).toHaveLength(1);
        });

        setupPresentationManager([instanceKey1, instanceKey2]);
        act(() => {
          selectionStorage.addToSelection({
            ivaultKey: ivault.key,
            source: selectionSource,
            selectables: [instanceKey2],
            level: 0,
          });
        });
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.rows).toHaveLength(2);
          expect(result.current.selectedRows).toHaveLength(0);
        });
      });

      it("returns an empty array of selectedRows when keys are passed from the wrong level on selectionChange event", async () => {
        const { result } = renderHook(() => usePresentationTableWithUnifiedSelection(initialProps));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
          selectionStorage.addToSelection({
            ivaultKey: ivault.key,
            source: selectionSource,
            selectables: [createTestDMInstanceKey()],
            level: 3,
          });
        });
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
          const selectedRowsAfterAdding = result.current.selectedRows;
          expect(selectedRowsAfterAdding).toHaveLength(0);
        });
      });
    });
  });

  /** Creates rows for the provided keys */
  function setupPresentationManager(keys: InstanceKey[] = [createTestDMInstanceKey()]) {
    presentationManager.getContentDescriptor.mockReset();
    presentationManager.getContentIterator.mockReset();

    const propertiesField = createTestPropertiesContentField({
      name: "first_field",
      label: "First Field",
      properties: [{ property: createTestPropertyInfo() }],
    });
    const descriptor = createTestContentDescriptor({ fields: [propertiesField] });

    const items: Item[] = [];
    keys.forEach((key) => {
      items.push(
        createTestContentItem({
          values: { [propertiesField.name]: "test_value" },
          displayValues: { [propertiesField.name]: "Test value" },
          primaryKeys: [key] as InstanceKey[],
        }),
      );
    });

    presentationManager.getContentDescriptor.mockResolvedValue(descriptor);
    presentationManager.getContentIterator.mockImplementation(async () => ({
      descriptor,
      items: createAsyncIterator(items),
      total: keys.length,
    }));
  }
});
