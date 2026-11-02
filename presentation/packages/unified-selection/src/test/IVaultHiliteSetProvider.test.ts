/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { createAsyncIterator } from "presentation-test-utilities";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { DMClassHierarchyInspector, DMSqlQueryExecutor } from "@szewtwin/presentation-shared";
import { HiliteSet, HiliteSetProvider, HiliteSetProviderProps } from "../unified-selection/HiliteSetProvider.js";
import { createIVaultHiliteSetProvider } from "../unified-selection/IVaultHiliteSetProvider.js";
import { SelectableInstanceKey } from "../unified-selection/Selectable.js";
import { createStorage, SelectionStorage } from "../unified-selection/SelectionStorage.js";
import { createSelectableInstanceKey } from "./_helpers/SelectablesCreator.js";

const generateSelection = (): SelectableInstanceKey[] => {
  return [createSelectableInstanceKey(1), createSelectableInstanceKey(2), createSelectableInstanceKey(3)];
};

describe("createIVaultHiliteSetProvider", () => {
  let factory: Mock<(props: HiliteSetProviderProps) => HiliteSetProvider>;
  let selectionStorage: SelectionStorage;
  let hiliteSetCache: ReturnType<typeof createIVaultHiliteSetProvider>;
  const provider = { getHiliteSet: vi.fn<(props: { ivaultKey: string }) => AsyncIterableIterator<HiliteSet>>() };
  const ivaultProvider = vi.fn<(ivaultKey: string) => DMClassHierarchyInspector & DMSqlQueryExecutor>();
  const ivaultKey = "iVaultKey";

  async function loadHiliteSet() {
    const iterator = hiliteSetCache.getCurrentHiliteSet({ ivaultKey });

    const models: string[] = [];
    const subCategories: string[] = [];
    const elements: string[] = [];

    for await (const set of iterator) {
      models.push(...set.models);
      subCategories.push(...set.subCategories);
      elements.push(...set.elements);
    }

    return { models, subCategories, elements };
  }

  function stubIVaultAccess() {
    return { createQueryReader: vi.fn(), classDerivesFrom: vi.fn() };
  }

  beforeEach(async () => {
    selectionStorage = createStorage();

    factory = vi
      .fn<(props: HiliteSetProviderProps) => HiliteSetProvider>()
      .mockReturnValue(provider as unknown as HiliteSetProvider);
    hiliteSetCache = createIVaultHiliteSetProvider({
      selectionStorage,
      ivaultProvider,
      createHiliteSetProvider: factory,
    });
    ivaultProvider.mockReturnValue(stubIVaultAccess());
    selectionStorage.addToSelection({ ivaultKey, source: "test", selectables: generateSelection() });

    provider.getHiliteSet.mockImplementation(() =>
      createAsyncIterator([
        { models: ["0x1"], subCategories: ["0x1"], elements: ["0x1"] },
        { models: ["0x2"], subCategories: ["0x2"], elements: ["0x2"] },
        { models: ["0x3"], subCategories: ["0x3"], elements: ["0x3"] },
      ]),
    );
  });

  describe("getHiliteSet", () => {
    it("creates provider once for iVault", async () => {
      const ivault1 = stubIVaultAccess();
      const ivault2 = stubIVaultAccess();
      ivaultProvider.mockReturnValue(ivault1);

      hiliteSetCache.getCurrentHiliteSet({ ivaultKey: "model1" });
      expect(factory).toHaveBeenCalledExactlyOnceWith({ ivaultAccess: ivault1 });
      factory.mockClear();

      hiliteSetCache.getCurrentHiliteSet({ ivaultKey: "model1" });
      expect(factory).not.toHaveBeenCalled();

      ivaultProvider.mockReturnValue(ivault2);
      hiliteSetCache.getCurrentHiliteSet({ ivaultKey: "model2" });
      expect(factory).toHaveBeenCalledExactlyOnceWith({ ivaultAccess: ivault2 });
      factory.mockClear();

      hiliteSetCache.getCurrentHiliteSet({ ivaultKey: "model1" });
      expect(factory).not.toHaveBeenCalled();
    });

    it("caches hilite set", async () => {
      const set1 = await loadHiliteSet();
      const set2 = await loadHiliteSet();

      expect(provider.getHiliteSet).toHaveBeenCalledOnce();
      expect(set1.models).toHaveLength(3);
      expect(set1.subCategories).toHaveLength(3);
      expect(set1.elements).toHaveLength(3);
      expect(set2.models).toEqual(expect.arrayContaining(set1.models));
      expect(set2.subCategories).toEqual(expect.arrayContaining(set1.subCategories));
      expect(set2.elements).toEqual(expect.arrayContaining(set1.elements));
    });

    it("clears cache on storage selection changes", async () => {
      const set1 = await loadHiliteSet();
      selectionStorage.clearSelection({ ivaultKey, source: "test" });
      const set2 = await loadHiliteSet();

      expect(provider.getHiliteSet).toHaveBeenCalledTimes(2);
      expect(set1.models).toHaveLength(3);
      expect(set1.subCategories).toHaveLength(3);
      expect(set1.elements).toHaveLength(3);
      expect(set2.models).toEqual(expect.arrayContaining(set1.models));
      expect(set2.subCategories).toEqual(expect.arrayContaining(set1.subCategories));
      expect(set2.elements).toEqual(expect.arrayContaining(set1.elements));
    });

    it("clears hilite set providers when iVault is closed", async () => {
      const ivaultAccess = stubIVaultAccess();
      ivaultProvider.mockReturnValue(ivaultAccess);

      hiliteSetCache.getCurrentHiliteSet({ ivaultKey });
      expect(factory).toHaveBeenCalledExactlyOnceWith({ ivaultAccess });
      factory.mockClear();

      selectionStorage.clearStorage({ ivaultKey });

      hiliteSetCache.getCurrentHiliteSet({ ivaultKey });
      expect(factory).toHaveBeenCalledExactlyOnceWith({ ivaultAccess });
    });
  });

  describe("dispose", () => {
    it("unregisters listener from `SelectionStorage`", async () => {
      hiliteSetCache[Symbol.dispose]();
      provider.getHiliteSet.mockClear();

      hiliteSetCache.getCurrentHiliteSet({ ivaultKey });
      selectionStorage.clearSelection({ ivaultKey, source: "test" });
      hiliteSetCache.getCurrentHiliteSet({ ivaultKey });

      expect(provider.getHiliteSet).toHaveBeenCalledOnce();
    });
  });
});
