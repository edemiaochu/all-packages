/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { act, renderHook } from "@testing-library/react-hooks";
import {
  type ResponseComposition,
  type RestContext,
  type RestRequest,
  rest,
} from "msw";

import { server } from "../../tests/mocks/server";
import { DataStatus } from "../../types";
import { useSZEWTwinData } from "./useSZEWTwinData";

describe("useSZEWTwinData hook", () => {
  const accessToken = "accessToken";
  const urlWatcher = jest.fn();

  // Establish API mocking before all tests.
  beforeAll(() => server.listen());
  // Reset any request handlers that we may add during the tests,
  // so they don't affect other tests.
  afterEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
  });
  // Clean up after the tests are finished.
  afterAll(() => server.close());

  it("returns all szewTwins and proper status on successful call", async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useSZEWTwinData({ accessToken })
    );

    await waitForNextUpdate();
    expect(result.current.szewTwins).toContainEqual({
      id: "my1",
      displayName: "myName1",
    });
    expect(result.current.status).toEqual(DataStatus.Complete);
  });
  it("returns favorite szewTwins and proper status on successful call", async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useSZEWTwinData({ accessToken, requestType: "favorites" })
    );

    await waitForNextUpdate();
    expect(result.current.szewTwins).toContainEqual({
      id: "favorite1",
      displayName: "favoriteName1",
    });
    expect(result.current.status).toEqual(DataStatus.Complete);
  });
  it("returns recent szewTwins and proper status on successful call", async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useSZEWTwinData({ accessToken, requestType: "recents" })
    );

    await waitForNextUpdate();
    expect(result.current.szewTwins).toContainEqual({
      id: "recent1",
      displayName: "recentName1",
    });
    expect(result.current.status).toEqual(DataStatus.Complete);
  });
  it("returns searched szewTwins and proper status on successful call", async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useSZEWTwinData({ accessToken, filterOptions: "searched" })
    );

    await waitForNextUpdate();
    expect(result.current.szewTwins).toContainEqual({
      id: "mySearched1",
      displayName: "mySearchedName1",
    });
    expect(result.current.status).toEqual(DataStatus.Complete);
  });

  it("returns error status and no data on failure", async () => {
    server.use(
      rest.get("https://api.szewec.com/szewtwins/", (req, res, ctx) => {
        return res(ctx.status(401));
      })
    );

    const { result, waitForValueToChange } = renderHook(() =>
      useSZEWTwinData({ accessToken })
    );

    await waitForValueToChange(() => result.current.status);
    expect(result.current.szewTwins).toEqual([]);
    expect(result.current.status).toEqual(DataStatus.FetchFailed);
  });

  it("returns apiOverrides.data without fetching when it is provided", async () => {
    const data = [{ id: "rerenderedId", displayName: "rerenderedDisplayName" }];
    const fetchData = [{ id: "fetchedId", displayName: "fetchedDisplayName" }];

    server.use(
      rest.get("https://api.szewec.com/szewtwins/", (req, res, ctx) => {
        urlWatcher(req.url.toString());
        return res(ctx.status(200), ctx.json({ szewTwins: fetchData }));
      })
    );

    const { result, rerender, waitForNextUpdate } = renderHook<
      Parameters<typeof useSZEWTwinData>,
      ReturnType<typeof useSZEWTwinData>
    >((initialValue) => useSZEWTwinData(...initialValue), {
      initialProps: [{ accessToken }],
    });

    await waitForNextUpdate();

    expect(urlWatcher).toHaveBeenCalledTimes(1);
    expect(result.current.status).toEqual(DataStatus.Complete);
    expect(result.current.szewTwins).toEqual(fetchData);

    rerender([
      {
        apiOverrides: {
          data,
        },
      },
    ]);

    expect(result.current.szewTwins).toEqual([
      { id: "rerenderedId", displayName: "rerenderedDisplayName" },
    ]);
    expect(result.current.status).toEqual(DataStatus.Complete);
    expect(urlWatcher).toHaveBeenCalledTimes(1);

    rerender([{ accessToken }]);
    await waitForNextUpdate();

    expect(result.current.szewTwins).toEqual(fetchData);
    expect(result.current.status).toEqual(DataStatus.Complete);
    expect(urlWatcher).toHaveBeenCalledTimes(2);
  });

  it("returns proper error if no accessToken is provided without data override", async () => {
    const { result } = renderHook(() => useSZEWTwinData({}));

    expect(result.current.szewTwins).toEqual([]);
    expect(result.current.status).toEqual(DataStatus.TokenRequired);
  });

  it("apply filtering", async () => {
    const expected = ["2", "5"];
    const options = {
      apiOverrides: {
        data: [
          {
            id: "1",
            displayName: "d",
            number: "e",
          },
          {
            id: "2",
            displayName: "a",
            number: "d",
          },
          {
            id: "3",
            displayName: "e",
            number: "c",
          },
          {
            id: "4",
            displayName: "b",
            number: "b",
          },
          {
            id: "5",
            displayName: "c",
            number: "a",
          },
        ],
      },
      filterOptions: "a",
    };
    const { result } = renderHook(() => useSZEWTwinData(options));

    expect(result.current.szewTwins.map((szewTwin) => szewTwin.id)).toEqual(expected);
  });

  describe("orderByOptions", () => {
    const orderbyOptions = "displayName DESC";
    const fetchedSZEWTwins = [
      { id: "fetchedId", displayName: "fetchedDisplayName" },
    ];

    const handleRequest = (
      req: RestRequest,
      res: ResponseComposition,
      ctx: RestContext
    ) => {
      urlWatcher(req.url.toString());
      return res(ctx.status(200), ctx.json({ szewTwins: fetchedSZEWTwins }));
    };

    it("returns ordered szewTwins and proper status on successful call", async () => {
      server.use(rest.get("https://api.szewec.com/szewtwins/", handleRequest));
      const { result, waitForNextUpdate } = renderHook(() =>
        useSZEWTwinData({ accessToken, orderbyOptions: "displayName ASC" })
      );

      await waitForNextUpdate();

      expect(result.current.szewTwins).toEqual(fetchedSZEWTwins);
      expect(urlWatcher).toHaveBeenCalledWith(
        expect.stringContaining("$orderby=displayName%20ASC")
      );
      expect(result.current.status).toEqual(DataStatus.Complete);
    });

    it("ignores orderBy options for favorites request", async () => {
      server.use(
        rest.get("https://api.szewec.com/szewtwins/favorites", handleRequest)
      );

      const { result, waitForNextUpdate } = renderHook(() =>
        useSZEWTwinData({ accessToken, requestType: "favorites", orderbyOptions })
      );

      await waitForNextUpdate();
      expect(urlWatcher).toHaveBeenCalledWith(
        expect.not.stringContaining("$orderby")
      );
      expect(result.current.status).toEqual(DataStatus.Complete);
    });

    it("ignores orderBy options for recents request", async () => {
      server.use(
        rest.get("https://api.szewec.com/szewtwins/recents", handleRequest)
      );

      const { result, waitForNextUpdate } = renderHook(() =>
        useSZEWTwinData({ accessToken, requestType: "recents", orderbyOptions })
      );

      await waitForNextUpdate();
      expect(urlWatcher).toHaveBeenCalledWith(
        expect.not.stringContaining("$orderby")
      );
      expect(result.current.status).toEqual(DataStatus.Complete);
    });

    it("properly encodes orderBy options with special characters", async () => {
      server.use(rest.get("https://api.szewec.com/szewtwins/", handleRequest));

      const { result, waitForNextUpdate } = renderHook(() =>
        useSZEWTwinData({ accessToken, orderbyOptions })
      );

      await waitForNextUpdate();
      expect(urlWatcher).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(orderbyOptions))
      );
      expect(result.current.status).toEqual(DataStatus.Complete);
    });

    it("refetches data when orderBy options change", async () => {
      server.use(rest.get("https://api.szewec.com/szewtwins/", handleRequest));

      const { rerender, waitForNextUpdate } = renderHook<
        Parameters<typeof useSZEWTwinData>,
        ReturnType<typeof useSZEWTwinData>
      >((initialValue) => useSZEWTwinData(...initialValue), {
        initialProps: [{ accessToken, orderbyOptions }],
      });

      await waitForNextUpdate();
      expect(urlWatcher).toHaveBeenCalledTimes(1);

      rerender([{ accessToken, orderbyOptions: "somethingDifferent" }]);
      await waitForNextUpdate();
      expect(urlWatcher).toHaveBeenCalledTimes(2);
    });
  });

  describe("fetchMore", () => {
    it("ignores fetchMore until the initial request settles", async () => {
      const requestedPages: (string | null)[] = [];
      server.use(
        rest.get("https://api.szewec.com/szewtwins/", (req, res, ctx) => {
          const skip = req.url.searchParams.get("$skip");
          requestedPages.push(skip);
          return res(
            ctx.status(200),
            ctx.json({
              szewTwins: [{ id: `id-${skip}`, displayName: `name-${skip}` }],
            })
          );
        })
      );

      const { result, waitForNextUpdate } = renderHook(() =>
        useSZEWTwinData({ accessToken })
      );

      // fetchMore is available immediately but must be ignored until the first request completes.
      act(() => {
        result.current.fetchMore?.();
        result.current.fetchMore?.();
      });

      await waitForNextUpdate();

      expect(result.current.status).toEqual(DataStatus.Complete);
      // Only the first page should have been requested
      expect(requestedPages).toEqual(["0"]);
      expect(result.current.szewTwins).toEqual([
        { id: "id-0", displayName: "name-0" },
      ]);
    });

    it("fetches the next page once the previous request has settled", async () => {
      const firstPage = Array.from({ length: 100 }, (_, i) => ({
        id: `first-${i}`,
        displayName: `first-${i}`,
      }));
      const secondPage = [{ id: "second-0", displayName: "second-0" }];
      server.use(
        rest.get("https://api.szewec.com/szewtwins/", (req, res, ctx) => {
          const skip = req.url.searchParams.get("$skip");
          return res(
            ctx.status(200),
            ctx.json({ szewTwins: skip === "0" ? firstPage : secondPage })
          );
        })
      );

      const { result, waitForNextUpdate } = renderHook(() =>
        useSZEWTwinData({ accessToken })
      );

      await waitForNextUpdate();
      expect(result.current.status).toEqual(DataStatus.Complete);
      expect(result.current.szewTwins).toHaveLength(100);
      expect(result.current.fetchMore).toBeDefined();

      act(() => {
        result.current.fetchMore?.();
      });
      await waitForNextUpdate();

      expect(result.current.szewTwins).toHaveLength(101);
      expect(result.current.szewTwins).toContainEqual({
        id: "second-0",
        displayName: "second-0",
      });
    });
  });
});
