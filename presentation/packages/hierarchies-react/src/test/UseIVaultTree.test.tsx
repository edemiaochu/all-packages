/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { createAsyncIterator } from "presentation-test-utilities";
import { beforeAll, describe, expect, it, vi } from "vitest";
import * as presentationHierarchiesModule from "@szewtwin/presentation-hierarchies";
import { createIVaultHierarchyProvider } from "@szewtwin/presentation-hierarchies";
import { Props } from "@szewtwin/presentation-shared";
import { useIVaultTree, useIVaultUnifiedSelectionTree } from "../presentation-hierarchies-react/UseIVaultTree.js";
import { createHierarchyProviderStub, renderHook, waitFor } from "./TestUtils.js";

vi.mock("@szewtwin/presentation-hierarchies", async (importOriginal) => {
  const original = await importOriginal<typeof presentationHierarchiesModule>();
  return { ...original, createIVaultHierarchyProvider: vi.fn() };
});

describe("useIVaultTree hooks", () => {
  describe("useIVaultTree", () => {
    type UseIVaultTreeProps = Props<typeof useIVaultTree>;
    const hierarchyDefinition = {} as presentationHierarchiesModule.HierarchyDefinition;
    const initialProps: UseIVaultTreeProps = {
      ivaultAccess: {} as UseIVaultTreeProps["ivaultAccess"],
      getHierarchyDefinition: () => hierarchyDefinition,
      localizedStrings: {} as UseIVaultTreeProps["localizedStrings"],
    };

    beforeAll(() => {
      const hierarchyProvider = createHierarchyProviderStub();
      vi.mocked(createIVaultHierarchyProvider).mockImplementation(() => hierarchyProvider as any);
    });

    it("creates ivault hierarchy provider using given ivault and hierarchy definition", async () => {
      const hierarchyProvider = createHierarchyProviderStub();
      hierarchyProvider.getNodes.mockImplementation(() => createAsyncIterator([]));
      vi.mocked(createIVaultHierarchyProvider).mockImplementation(() => hierarchyProvider as any);

      const { result } = renderHook(useIVaultTree, { initialProps });
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(vi.mocked(createIVaultHierarchyProvider)).toHaveBeenCalledWith(
        expect.objectContaining({
          ivaultAccess: initialProps.ivaultAccess,
          hierarchyDefinition,
          localizedStrings: initialProps.localizedStrings,
        }),
      );
    });

    it("forwards `getFilteredPaths` call", async () => {
      const hierarchyProvider = createHierarchyProviderStub();
      hierarchyProvider.getNodes.mockImplementation(() => createAsyncIterator([]));
      vi.mocked(createIVaultHierarchyProvider).mockImplementation(() => hierarchyProvider as any);

      let signal;
      const getFilteredPaths = vi.fn().mockImplementation(async ({ abortSignal }: { abortSignal: AbortSignal }) => {
        signal = abortSignal;
        return undefined;
      });
      const { result } = renderHook(useIVaultTree, { initialProps: { ...initialProps, getFilteredPaths } });
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(getFilteredPaths).toHaveBeenCalledWith({ ivaultAccess: initialProps.ivaultAccess, abortSignal: signal });
    });
  });

  describe("useIVaultUnifiedSelectionTree", () => {
    type UseIVaultTreeProps = Props<typeof useIVaultUnifiedSelectionTree>;
    const hierarchyDefinition = {} as presentationHierarchiesModule.HierarchyDefinition;
    const initialProps: UseIVaultTreeProps = {
      ivaultAccess: {} as UseIVaultTreeProps["ivaultAccess"],
      getHierarchyDefinition: () => hierarchyDefinition,
      localizedStrings: {} as UseIVaultTreeProps["localizedStrings"],
      sourceName: "test-component",
    };

    beforeAll(() => {
      const hierarchyProvider = createHierarchyProviderStub();
      vi.mocked(createIVaultHierarchyProvider).mockImplementation(() => hierarchyProvider as any);
    });

    it("creates ivault hierarchy provider using given ivault and hierarchy definition", async () => {
      const hierarchyProvider = createHierarchyProviderStub();
      hierarchyProvider.getNodes.mockImplementation(() => createAsyncIterator([]));
      vi.mocked(createIVaultHierarchyProvider).mockImplementation(() => hierarchyProvider as any);

      const { result } = renderHook(useIVaultUnifiedSelectionTree, { initialProps });
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(vi.mocked(createIVaultHierarchyProvider)).toHaveBeenCalledWith(
        expect.objectContaining({
          ivaultAccess: initialProps.ivaultAccess,
          hierarchyDefinition,
          localizedStrings: initialProps.localizedStrings,
        }),
      );
    });

    it("forwards `getFilteredPaths` call", async () => {
      const hierarchyProvider = createHierarchyProviderStub();
      hierarchyProvider.getNodes.mockImplementation(() => createAsyncIterator([]));
      vi.mocked(createIVaultHierarchyProvider).mockImplementation(() => hierarchyProvider as any);

      let signal;
      const getFilteredPaths = vi.fn().mockImplementation(async ({ abortSignal }: { abortSignal: AbortSignal }) => {
        signal = abortSignal;
        return undefined;
      });
      const { result } = renderHook(useIVaultUnifiedSelectionTree, {
        initialProps: { ...initialProps, getFilteredPaths },
      });
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(getFilteredPaths).toHaveBeenCalledWith({ ivaultAccess: initialProps.ivaultAccess, abortSignal: signal });
    });
  });
});
