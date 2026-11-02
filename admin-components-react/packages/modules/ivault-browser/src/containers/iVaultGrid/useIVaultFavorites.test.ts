/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { renderHook } from "@testing-library/react-hooks";
import { act } from "react";

import { useIVaultFavorites } from "./useIVaultFavorites";

export function mockFetch(data: any, status = 200) {
  return jest.fn().mockImplementation(async () =>
    Promise.resolve({
      status,
      ok: true,
      json: () => data,
    })
  );
}

const accessToken = "test-access-token";
const szewTwinId = "szewTwinId";

describe("useIVaultFavorites", () => {
  // Clear mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should initialize with empty Set", () => {
    const { result } = renderHook(() =>
      useIVaultFavorites(szewTwinId, accessToken)
    );
    window.fetch = mockFetch({ iVaults: [] });

    expect(result.current.iVaultFavorites).toBeInstanceOf(Set);
    expect(result.current.iVaultFavorites.size).toBe(0);
  });

  test("should fetch favorites on mount", async () => {
    const mockFavorites = [
      { id: "1", name: "iVault1" },
      { id: "2", name: "iVault2" },
    ];

    window.fetch = mockFetch({ iVaults: mockFavorites });
    const { result, waitForNextUpdate } = renderHook(() =>
      useIVaultFavorites(szewTwinId, accessToken)
    );

    await waitForNextUpdate();
    expect(result.current.iVaultFavorites.has("1")).toBe(true);
    expect(result.current.iVaultFavorites.has("2")).toBe(true);
    expect(result.current.iVaultFavorites.size).toBe(2);
  });

  test("should handle empty response from API", async () => {
    window.fetch = mockFetch({ iVaults: [] });

    const { result, waitForNextUpdate } = renderHook(() =>
      useIVaultFavorites(szewTwinId, accessToken)
    );

    await waitForNextUpdate();
    expect(result.current.iVaultFavorites.size).toBe(0);
  });

  test("should add and remove an iVault from favorites", async () => {
    window.fetch = mockFetch({});
    const { result } = renderHook(() =>
      useIVaultFavorites(szewTwinId, accessToken)
    );
    const iVaultId = "test-iVault-id";
    await act(async () => {
      await result.current.addIVaultToFavorites(iVaultId);
    });
    expect(result.current.iVaultFavorites.has(iVaultId)).toBe(true);

    await act(async () => {
      await result.current.removeIVaultFromFavorites(iVaultId);
    });
    expect(result.current.iVaultFavorites.has(iVaultId)).toBe(false);
  });
});
