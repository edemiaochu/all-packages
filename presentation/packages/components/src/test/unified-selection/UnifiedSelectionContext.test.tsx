/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/no-deprecated */

import { PropsWithChildren, useEffect } from "react";
import { beforeEach, describe, expect, it, MockInstance, vi } from "vitest";
import { IVaultConnection } from "@szewtwin/core-frontend";
import { KeySet } from "@szewtwin/presentation-common";
import { Presentation, SelectionManager } from "@szewtwin/presentation-frontend";
import {
  UnifiedSelectionContext,
  UnifiedSelectionContextProvider,
  useUnifiedSelectionContext,
} from "../../presentation-components/unified-selection/UnifiedSelectionContext.js";
import { act, render, renderHook, RenderHookResult, waitFor } from "../TestUtils.js";

describe("UnifiedSelectionContext", () => {
  const testIVault = { key: "" } as IVaultConnection;

  function renderUnifiedSelectionContextHook(
    ivault = {} as IVaultConnection,
    selectionLevel?: number,
  ): RenderHookResult<UnifiedSelectionContext, unknown> {
    const Wrapper = ({ children }: PropsWithChildren<unknown>) => {
      return (
        <UnifiedSelectionContextProvider ivault={ivault} selectionLevel={selectionLevel}>
          {children}
        </UnifiedSelectionContextProvider>
      );
    };

    return renderHook(() => useUnifiedSelectionContext()!, { wrapper: Wrapper });
  }

  beforeEach(() => {
    const selectionManager = new SelectionManager({ scopes: undefined as any });
    vi.spyOn(Presentation, "selection", "get").mockReturnValue(selectionManager);
    IVaultConnection.onOpen.raiseEvent(testIVault);
  });

  it("uses selection level 0 by default", () => {
    const { result } = renderUnifiedSelectionContextHook();
    expect(result.current.selectionLevel).toBe(0);
  });

  it("updates context when selection changes on one level above", async () => {
    const { result } = renderUnifiedSelectionContextHook(testIVault, 1);
    const firstResult = result.current;

    act(() => {
      Presentation.selection.addToSelection("", testIVault, [{ className: "schema:test", id: "1" }], 0);
    });

    await waitFor(() => {
      const secondResult = result.current;
      expect(firstResult).not.toBe(secondResult);
      expect(firstResult.getSelection).not.toBe(secondResult.getSelection);
      expect(firstResult.replaceSelection).toBe(secondResult.replaceSelection);
      expect(firstResult.addToSelection).toBe(secondResult.addToSelection);
      expect(firstResult.clearSelection).toBe(secondResult.clearSelection);
      expect(firstResult.removeFromSelection).toBe(secondResult.removeFromSelection);
    });
  });

  it("does not update context when selection changes one level deeper", () => {
    const { result } = renderUnifiedSelectionContextHook(testIVault);
    const firstResult = result.current;

    act(() => {
      Presentation.selection.addToSelection("", testIVault, [{ className: "schema:test", id: "1" }], 1);
    });
    const secondResult = result.current;

    expect(firstResult.getSelection).toBe(secondResult.getSelection);
  });

  it("updates context when receives different ivault connection", async () => {
    function TestComponent({ onChange }: { onChange: (context: UnifiedSelectionContext | undefined) => void }) {
      const context = useUnifiedSelectionContext();
      useEffect(() => {
        onChange(context);
      }, [context, onChange]);
      return <></>;
    }

    const spy = vi.fn<(context: UnifiedSelectionContext | undefined) => void>();
    const { rerender } = render(
      <UnifiedSelectionContextProvider ivault={testIVault}>
        <TestComponent onChange={spy} />
      </UnifiedSelectionContextProvider>,
    );

    await waitFor(() => expect(spy).toHaveBeenCalled());
    const firstResult = spy.mock.calls[spy.mock.calls.length - 1][0] as UnifiedSelectionContext;

    spy.mockReset();
    const newIvault = {} as IVaultConnection;
    rerender(
      <UnifiedSelectionContextProvider ivault={newIvault}>
        <TestComponent onChange={spy} />
      </UnifiedSelectionContextProvider>,
    );

    await waitFor(() => expect(spy).toHaveBeenCalled());
    const secondResult = spy.mock.calls[spy.mock.calls.length - 1][0] as UnifiedSelectionContext;

    expect(firstResult).not.toBe(secondResult);
    expect(firstResult.getSelection).not.toBe(secondResult.getSelection);
    expect(firstResult.replaceSelection).not.toBe(secondResult.replaceSelection);
    expect(firstResult.addToSelection).not.toBe(secondResult.addToSelection);
    expect(firstResult.clearSelection).not.toBe(secondResult.clearSelection);
    expect(firstResult.removeFromSelection).not.toBe(secondResult.removeFromSelection);
  });

  describe("context", () => {
    const keys = new KeySet();

    describe("getSelection", () => {
      let stubGetSelection: MockInstance;

      beforeEach(() => {
        stubGetSelection = vi.spyOn(Presentation.selection, "getSelection").mockReturnValue(keys);
      });

      it("gets current selection", () => {
        const { result } = renderUnifiedSelectionContextHook(testIVault);
        result.current.getSelection(10);
        expect(stubGetSelection).toHaveBeenCalledExactlyOnceWith(testIVault, 10);
      });

      it("makes KeySet reference be different from global KeySet", () => {
        const { result } = renderUnifiedSelectionContextHook(testIVault);
        const returnedKeySet = result.current.getSelection();
        expect(returnedKeySet).not.toBe(keys);
      });

      it("returns same KeySet reference for same selection level", () => {
        const { result } = renderUnifiedSelectionContextHook(testIVault);
        const firstKeySet = result.current.getSelection(10);
        const secondKeySet = result.current.getSelection(10);
        expect(firstKeySet).toBe(secondKeySet);
      });

      it("returns different KeySet reference for different selection level", () => {
        const { result } = renderUnifiedSelectionContextHook(testIVault);
        const firstKeySet = result.current.getSelection(10);
        const secondKeySet = result.current.getSelection(9);
        expect(firstKeySet).not.toBe(secondKeySet);
      });

      it("returns different KeySet reference after selection changes", async () => {
        const { result } = renderUnifiedSelectionContextHook(testIVault);
        const firstKeySet = result.current.getSelection();

        act(() => result.current.addToSelection([{ className: "schema:test", id: "1" }]));

        await waitFor(() => {
          const secondKeySet = result.current.getSelection();
          expect(firstKeySet).not.toBe(secondKeySet);
        });
      });

      it("returns a working KeySet", async () => {
        stubGetSelection.mockRestore();
        const { result } = renderUnifiedSelectionContextHook(testIVault);

        const key = { className: "schema:test", id: "1" };
        act(() => result.current.addToSelection([key]));

        await waitFor(() => {
          const returnedKeySet = result.current.getSelection();
          expect(returnedKeySet.has(key)).toBe(true);
        });
      });
    });

    it("replaces current selection", () => {
      const { result } = renderUnifiedSelectionContextHook(testIVault);
      const stub = vi.spyOn(Presentation.selection, "replaceSelection").mockReturnValue();
      result.current.replaceSelection(keys, 10);
      expect(stub).toHaveBeenCalledExactlyOnceWith("UnifiedSelectionContext", testIVault, keys, 10);
    });

    it("adds to current selection", () => {
      const { result } = renderUnifiedSelectionContextHook(testIVault);
      const stub = vi.spyOn(Presentation.selection, "addToSelection").mockReturnValue();
      result.current.addToSelection(keys, 10);
      expect(stub).toHaveBeenCalledExactlyOnceWith("UnifiedSelectionContext", testIVault, keys, 10);
    });

    it("clears current selection", () => {
      const { result } = renderUnifiedSelectionContextHook(testIVault);
      const stub = vi.spyOn(Presentation.selection, "clearSelection").mockReturnValue();
      result.current.clearSelection(10);
      expect(stub).toHaveBeenCalledExactlyOnceWith("UnifiedSelectionContext", testIVault, 10);
    });

    it("removes from current selection", () => {
      const { result } = renderUnifiedSelectionContextHook(testIVault);
      const stub = vi.spyOn(Presentation.selection, "removeFromSelection").mockReturnValue();
      result.current.removeFromSelection(keys, 10);
      expect(stub).toHaveBeenCalledExactlyOnceWith("UnifiedSelectionContext", testIVault, keys, 10);
    });

    it("uses default selection level when one is not specified", () => {
      const { result } = renderUnifiedSelectionContextHook(testIVault, 4);

      const stubGetSelection = vi.spyOn(Presentation.selection, "getSelection").mockReturnValue(keys);
      result.current.getSelection();
      expect(stubGetSelection).toHaveBeenCalledExactlyOnceWith(testIVault, 4);

      const stubReplaceSelection = vi.spyOn(Presentation.selection, "replaceSelection").mockReturnValue();
      result.current.replaceSelection(keys);
      expect(stubReplaceSelection).toHaveBeenCalledExactlyOnceWith("UnifiedSelectionContext", testIVault, keys, 4);

      const stubAddToSelection = vi.spyOn(Presentation.selection, "addToSelection").mockReturnValue();
      result.current.addToSelection(keys);
      expect(stubAddToSelection).toHaveBeenCalledExactlyOnceWith("UnifiedSelectionContext", testIVault, keys, 4);

      const stubClearSelection = vi.spyOn(Presentation.selection, "clearSelection").mockReturnValue();
      result.current.clearSelection();
      expect(stubClearSelection).toHaveBeenCalledExactlyOnceWith("UnifiedSelectionContext", testIVault, 4);

      const stubRemoveFromSelection = vi.spyOn(Presentation.selection, "removeFromSelection").mockReturnValue();
      result.current.removeFromSelection(keys);
      expect(stubRemoveFromSelection).toHaveBeenCalledExactlyOnceWith("UnifiedSelectionContext", testIVault, keys, 4);
    });
  });

  describe("useUnifiedSelectionContext", () => {
    it("returns `undefined` context when there is no unified selection context", () => {
      const { result } = renderHook(() => useUnifiedSelectionContext());
      expect(result.current).toBeUndefined();
    });
  });
});
