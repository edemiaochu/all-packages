/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { renderHook } from "@testing-library/react-hooks";
import { act } from "react";

import { useSZEWTwinFavorites } from "./useSZEWTwinFavorites";

export function mockFetch(data: any, status = 200) {
  return jest.fn().mockImplementationOnce(async () =>
    Promise.resolve({
      status,
      ok: true,
      json: () => data,
    })
  );
}

const accessToken = "test-access-token";

describe("useSZEWTwinFavorites", () => {
  // Clear mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should initialize with empty Set", () => {
    const { result } = renderHook(() => useSZEWTwinFavorites(accessToken));
    window.fetch = mockFetch({ szewTwins: [] });

    expect(result.current.szewTwinFavorites).toBeInstanceOf(Set);
    expect(result.current.szewTwinFavorites.size).toBe(0);
  });

  test("should fetch favorites on mount", async () => {
    const mockFavorites = [
      { id: "1", name: "szewTwin1" },
      { id: "2", name: "szewTwin2" },
    ];

    window.fetch = mockFetch({ szewTwins: mockFavorites });
    const { result, waitForNextUpdate } = renderHook(() =>
      useSZEWTwinFavorites(accessToken)
    );

    await waitForNextUpdate();
    expect(result.current.szewTwinFavorites.has("1")).toBe(true);
    expect(result.current.szewTwinFavorites.has("2")).toBe(true);
    expect(result.current.szewTwinFavorites.size).toBe(2);
  });

  test("should handle empty response from API", async () => {
    window.fetch = mockFetch({ szewTwins: [] });

    const { result, waitForNextUpdate } = renderHook(() =>
      useSZEWTwinFavorites(accessToken)
    );

    await waitForNextUpdate();
    expect(result.current.szewTwinFavorites.size).toBe(0);
  });

  test("should add and remove an szewTwin from favorites", async () => {
    const { result } = renderHook(() => useSZEWTwinFavorites(accessToken));
    const szewTwinId = "test-szewtwin-id";
    await act(async () => {
      window.fetch = mockFetch({});
      await result.current.addSZEWTwinToFavorites(szewTwinId);
    });
    expect(result.current.szewTwinFavorites.has(szewTwinId)).toBe(true);

    await act(async () => {
      window.fetch = mockFetch({});
      await result.current.removeSZEWTwinFromFavorites(szewTwinId);
    });
    expect(result.current.szewTwinFavorites.has(szewTwinId)).toBe(false);
  });
});
