/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { renderHook } from "@testing-library/react-hooks";
import { rest } from "msw";
import { act } from "react";

import { server } from "../../tests/mocks/server";
import { DataStatus } from "../../types";
import { useIVaultData } from "./useIVaultData";

describe("useIVaultData hook", () => {
  // Establish API mocking before all tests.
  beforeAll(() => server.listen());
  // Reset any request handlers that we may add during the tests,
  // so they don't affect other tests.
  afterEach(() => server.resetHandlers());
  // Clean up after the tests are finished.
  afterAll(() => {
    server.close();
    jest.clearAllMocks();
  });

  it("returns the data and proper status on successful call", async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useIVaultData({ szewTwinId: "szewTwinId", accessToken: "accessToken" })
    );

    await waitForNextUpdate();
    expect(result.current.iVaults).toContainEqual({
      id: "fakeId",
      displayName: "fakeName",
    });
    expect(result.current.status).toEqual(DataStatus.Complete);
  });

  it("request the sort order the data and proper status on successful call", async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useIVaultData({
        szewTwinId: "szewTwinId",
        accessToken: "accessToken",
        sortOptions: { sortType: "name", descending: true },
      })
    );

    await waitForNextUpdate();
    expect(result.current.iVaults).toContainEqual({
      id: "fakeId",
      displayName: "nameDescOrdered",
    });
    expect(result.current.status).toEqual(DataStatus.Complete);
  });

  it("returns error status and no data on failure", async () => {
    server.use(
      rest.get("https://api.szewec.com/ivaults/", (req, res, ctx) => {
        return res(ctx.status(401));
      })
    );

    const { result, waitForValueToChange } = renderHook(() =>
      useIVaultData({ szewTwinId: "szewTwinId", accessToken: "accessToken" })
    );

    await waitForValueToChange(() => result.current.status);
    expect(result.current.iVaults).toEqual([]);
    expect(result.current.status).toEqual(DataStatus.FetchFailed);
  });

  it("returns apiOverrides.data without fetching when it is provided", async () => {
    const externalData = [
      { id: "externalId1", displayName: "External IVault 1" },
      { id: "externalId2", displayName: "External IVault 2" },
    ];
    const onLoadMore = jest.fn();
    const watcher = jest.fn();
    server.use(
      rest.get("https://api.szewec.com/ivaults/", (req, res, ctx) => {
        watcher();
        return res(ctx.status(200), ctx.json({ iVaults: [] }));
      })
    );

    const { result, rerender, waitForNextUpdate } = renderHook<
      Parameters<typeof useIVaultData>,
      ReturnType<typeof useIVaultData>
    >((initialValue) => useIVaultData(...initialValue), {
      initialProps: [{ szewTwinId: "szewTwinId", accessToken: "accessToken" }],
    });

    await waitForNextUpdate();

    expect(result.current.iVaults).toEqual([]);
    expect(result.current.status).toEqual(DataStatus.Complete);
    expect(result.current.fetchMore).toBeUndefined();
    expect(watcher).toHaveBeenCalledTimes(1);

    rerender([
      {
        dataMode: "external",
        apiOverrides: {
          data: externalData,
          isLoading: false,
          hasMoreData: true,
        },
        onLoadMore,
      },
    ]);

    expect(result.current.iVaults).toEqual(externalData);
    expect(result.current.status).toEqual(DataStatus.Complete);
    expect(result.current.fetchMore).toBe(onLoadMore);
    expect(watcher).toHaveBeenCalledTimes(1);

    act(() => result.current.fetchMore?.());
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    rerender([
      {
        szewTwinId: "szewTwinId",
        accessToken: "accessToken",
      },
    ]);

    await waitForNextUpdate();

    expect(result.current.iVaults).toEqual([]);
    expect(result.current.status).toEqual(DataStatus.Complete);
    expect(result.current.fetchMore).toBeUndefined();
    expect(watcher).toHaveBeenCalledTimes(2);
  });

  it("returns proper error if no accessToken is provided without data override", async () => {
    const { result } = renderHook(() => useIVaultData({ szewTwinId: "szewTwinId" }));

    expect(result.current.iVaults).toEqual([]);
    expect(result.current.status).toEqual(DataStatus.TokenRequired);
  });

  it("returns proper error if no context is provided without data override", async () => {
    const { result } = renderHook(() =>
      useIVaultData({ accessToken: "accessToken" })
    );

    expect(result.current.iVaults).toEqual([]);
    expect(result.current.status).toEqual(DataStatus.ContextRequired);
  });

  it("should call correct api when maxCount is provided", async () => {
    // Arrange
    const fetchSpy = jest.spyOn(window, "fetch");

    let callNum = 0;
    const mockIVaults = Array.from({ length: 110 }, (_, i) => ({
      id: `fakeId${i + 1}`,
      displayName: `fakeName${i + 1}`,
    }));

    const watcher = jest.fn();
    server.use(
      rest.get("https://api.szewec.com/ivaults/", (req, res, ctx) => {
        watcher();
        return res(
          ctx.json({
            iVaults:
              ++callNum === 1
                ? mockIVaults.slice(0, 100)
                : mockIVaults.slice(100),
          })
        );
      })
    );

    // Act
    const { result, waitForValueToChange } = renderHook(() =>
      useIVaultData({
        szewTwinId: "szewTwinId",
        accessToken: "accessToken",
        maxCount: 110,
      })
    );
    await waitForValueToChange(
      () => result.current.status === DataStatus.Complete
    );

    act(() => result.current.fetchMore?.());
    await waitForValueToChange(
      () => result.current.status === DataStatus.Complete
    );

    // Assert
    const opts = {
      headers: {
        Accept: "application/vnd.szewec.szewtwin-platform.v2+json",
        Authorization: "accessToken",
        Prefer: "return=representation",
      },
      signal: new AbortController().signal,
    };

    expect(result.current.status).toEqual(DataStatus.Complete);
    expect(result.current.fetchMore).toBeUndefined();
    expect(watcher).toBeCalledTimes(2);
    expect(fetchSpy).toHaveBeenNthCalledWith(
      fetchSpy.mock.calls.length - 1,
      "https://api.szewec.com/ivaults/?szewTwinId=szewTwinId&$skip=0&$top=100",
      opts
    );
    expect(fetchSpy).toHaveBeenLastCalledWith(
      "https://api.szewec.com/ivaults/?szewTwinId=szewTwinId&$skip=100&$top=10",
      opts
    );
  });

  it("should call correct api when pageSize is provided", async () => {
    const fetchSpy = jest.spyOn(window, "fetch");

    const mockIVaults = Array.from({ length: 110 }, (_, i) => ({
      id: `fakeId${i + 1}`,
      displayName: `fakeName${i + 1}`,
    }));

    const watcher = jest.fn();
    server.use(
      rest.get("https://api.szewec.com/ivaults/", (req, res, ctx) => {
        watcher();
        return res(
          ctx.json({
            iVaults: mockIVaults,
          })
        );
      })
    );

    const { result, waitForValueToChange } = renderHook(() =>
      useIVaultData({
        szewTwinId: "szewTwinId",
        accessToken: "accessToken",
        pageSize: 110,
      })
    );

    await waitForValueToChange(
      () => result.current.status === DataStatus.Complete
    );

    expect(fetchSpy).toHaveBeenLastCalledWith(
      expect.stringContaining(`$skip=0`) && expect.stringContaining(`$top=110`),
      expect.any(Object)
    );
    expect(result.current.iVaults.length).toBe(110);
    expect(watcher).toHaveBeenCalledTimes(1);
  });

  it("returns properly paged iVaults", async () => {
    const fetchSpy = jest.spyOn(window, "fetch");

    let callNum = 0;
    const mockIVaults = Array.from({ length: 101 }, (_, i) => ({
      id: `fakeId${i + 1}`,
      displayName: `fakeName${i + 1}`,
    }));

    const watcher = jest.fn();
    server.use(
      rest.get("https://api.szewec.com/ivaults/", (req, res, ctx) => {
        watcher();
        return res(
          ctx.json({
            iVaults:
              ++callNum === 1
                ? mockIVaults.slice(0, 100)
                : mockIVaults.slice(100),
          })
        );
      })
    );

    const { result, waitForValueToChange } = renderHook(() =>
      useIVaultData({
        szewTwinId: "szewTwinId",
        accessToken: "accessToken",
      })
    );

    await waitForValueToChange(
      () => result.current.status === DataStatus.Complete
    );

    expect(fetchSpy).toHaveBeenLastCalledWith(
      expect.stringContaining(`$skip=0`) && expect.stringContaining(`$top=100`),
      expect.any(Object)
    );
    expect(result.current.iVaults.length).toBe(100);
    expect(result.current.fetchMore).toBeDefined();
    expect(watcher).toHaveBeenCalledTimes(1);

    act(() => result.current.fetchMore?.());
    await waitForValueToChange(
      () => result.current.status === DataStatus.Complete
    );

    expect(fetchSpy).toHaveBeenLastCalledWith(
      expect.stringContaining(`$skip=100`) &&
        expect.stringContaining(`$top=100`),
      expect.any(Object)
    );
    expect(result.current.iVaults.length).toBe(101);
    expect(result.current.fetchMore).toBeUndefined();
    expect(watcher).toHaveBeenCalledTimes(2);
  });

  it.each([
    {
      missing: "accessToken",
      initialProps: { accessToken: undefined as any, szewTwinId: "szewTwinId" },
      supplyProps: { accessToken: "accessToken" },
    },
    {
      missing: "szewTwinId",
      initialProps: { szewTwinId: undefined as any, accessToken: "accessToken" },
      supplyProps: { szewTwinId: "szewTwinId" },
    },
  ])(
    "does not skip first page if fetchMore called before $missing becomes available",
    async ({ initialProps, supplyProps }) => {
      const fetchSpy = jest.spyOn(window, "fetch").mockImplementation(
        () =>
          Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                iVaults: [{ id: "first", displayName: "first" }],
              }),
          }) as any
      );

      const { result, rerender, waitForNextUpdate } = renderHook(
        (props: any) =>
          useIVaultData({
            szewTwinId: (props as any).szewTwinId,
            accessToken: (props as any).accessToken,
          }),
        { initialProps }
      );

      // Attempt pagination before prerequisite present
      act(() => result.current.fetchMore?.());

      // Provide missing prerequisite
      rerender({ ...initialProps, ...supplyProps });
      await waitForNextUpdate();

      const firstUrl = fetchSpy.mock.calls[0][0] as string;
      expect(firstUrl).toContain("$skip=0");
      expect(firstUrl).toContain("$top=100");
      expect(result.current.iVaults[0]?.id).toBe("first");
    }
  );
});

it("fetches data with searchText", async () => {
  const fetchSpy = jest.spyOn(window, "fetch").mockImplementation(
    () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ iVaults: [] }),
      }) as any
  );
  const searchText = "testSearch";

  const { result, waitForNextUpdate } = renderHook(() =>
    useIVaultData({
      szewTwinId: "szewTwinId",
      accessToken: "accessToken",
      searchText,
    })
  );

  await waitForNextUpdate();

  expect(result.current.status).toEqual(DataStatus.Complete);
  expect(fetchSpy).toHaveBeenCalledWith(
    expect.stringContaining(`&$search=${searchText}`),
    expect.any(Object)
  );
});

it("fetches data with serverEnvironmentPrefix", async () => {
  const fetchSpy = jest.spyOn(window, "fetch").mockImplementation(
    () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ iVaults: [] }),
      }) as any
  );
  const serverEnvironmentPrefix = "dev";

  const { result, waitForNextUpdate } = renderHook(() =>
    useIVaultData({
      szewTwinId: "szewTwinId",
      accessToken: "accessToken",
      apiOverrides: {
        serverEnvironmentPrefix,
      },
    })
  );

  await waitForNextUpdate();

  expect(result.current.status).toEqual(DataStatus.Complete);
  expect(fetchSpy).toHaveBeenCalledWith(
    expect.stringContaining(`${serverEnvironmentPrefix}`),
    expect.any(Object)
  );
});

it("aborts previous fetch when new fetch is initiated", async () => {
  jest.spyOn(window, "fetch").mockImplementation(
    () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ iVaults: [] }),
      }) as any
  );
  const abortSpy = jest.spyOn(AbortController.prototype, "abort");

  const { rerender, waitForNextUpdate } = renderHook(
    ({ szewTwinId, accessToken }) =>
      useIVaultData({
        szewTwinId,
        accessToken,
      }),
    {
      initialProps: { szewTwinId: "szewTwinId1", accessToken: "accessToken" },
    }
  );

  rerender({ szewTwinId: "szewTwinId2", accessToken: "accessToken" });
  await waitForNextUpdate();
  expect(abortSpy).toHaveBeenCalled();
});
