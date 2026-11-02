/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import React, { useEffect } from "react";

import {
  AccessTokenProvider,
  ApiOverrides,
  DataMode,
  DataStatus,
  IVaultFull,
  IVaultSortOptions,
  ViewType,
} from "../../types";
import { _getAPIServer } from "../../utils/_apiOverrides";
import { useIVaultSort } from "./useIVaultSort";

export interface IVaultDataHookOptions {
  /** Type of iVaults to request - "favorites" for user's favorite iVaults, "recents" for recently accessed iVaults, or empty string for all iVaults */
  requestType?: "favorites" | "recents" | "";
  szewTwinId?: string | undefined;
  accessToken?: AccessTokenProvider;
  sortOptions?: IVaultSortOptions;
  apiOverrides?: ApiOverrides<IVaultFull[]>;
  searchText?: string | undefined;
  maxCount?: number;
  pageSize?: number;
  /** @deprecated in 2.1 It is no longer used as it has no effect on the data fetching. */
  viewMode?: ViewType;
  /** Controls whether data is fetched and managed internally or externally.*/
  dataMode?: DataMode;
  onLoadMore?: () => void | Promise<void>;
  onRefetch?: () => void | Promise<void>;
}
export const DEFAULT_PAGE_SIZE = 100;

export const useIVaultData = ({
  requestType = "",
  szewTwinId,
  accessToken,
  sortOptions,
  apiOverrides,
  searchText,
  pageSize = DEFAULT_PAGE_SIZE,
  maxCount,
  dataMode,
  onLoadMore,
  onRefetch,
}: IVaultDataHookOptions) => {
  const [needsUpdate, setNeedsUpdate] = React.useState(true);
  const [iVaults, setIVaults] = React.useState<IVaultFull[]>([]);
  const [status, setStatus] = React.useState<DataStatus>();
  const [page, setPage] = React.useState(0);
  const [morePagesAvailable, setMorePagesAvailable] = React.useState(true);
  const [abortController, setAbortController] = React.useState<
    AbortController | undefined
  >(undefined);

  const sortType =
    sortOptions && ["name", "createdDateTime"].includes(sortOptions.sortType)
      ? sortOptions.sortType
      : undefined; //Only available sort-by API at the moment.
  const [previousSortOptions, setPreviousSortOptions] = React.useState<
    IVaultSortOptions | undefined
  >(sortOptions && { ...sortOptions });
  const sortDescending = sortOptions?.descending;
  const sortedIVaults = useIVaultSort(
    iVaults,
    sortOptions,
    requestType !== "recents"
  );

  // For recents and favorites, apply client-side filtering based on searchText
  const filteredIVaults = React.useMemo(() => {
    if (
      !searchText?.trim() ||
      (requestType !== "recents" && requestType !== "favorites")
    ) {
      return sortedIVaults;
    }

    const lowerSearchText = searchText.toLowerCase();
    return sortedIVaults.filter(
      (iVault) =>
        (iVault.name?.toLowerCase().includes(lowerSearchText) ?? false) ||
        (iVault.description?.toLowerCase().includes(lowerSearchText) ?? false)
    );
  }, [sortedIVaults, searchText, requestType]);

  const sortChanged =
    sortOptions?.descending !== previousSortOptions?.descending ||
    sortOptions?.sortType !== previousSortOptions?.sortType;
  if (sortChanged) {
    setPreviousSortOptions(sortOptions);
  }

  // cleanup the abort controller when unmounting
  useEffect(() => () => abortController?.abort(), [abortController]);

  const reset = React.useCallback(() => {
    if (dataMode === "external") {
      return;
    }

    setStatus(DataStatus.Fetching);
    setIVaults([]);
    setPage(0);
    setMorePagesAvailable(true);
    setNeedsUpdate(true);
  }, [dataMode]);

  const fetchMore = React.useCallback(() => {
    if (dataMode === "external") {
      return;
    }

    if (
      needsUpdate ||
      status === DataStatus.Fetching ||
      status === DataStatus.TokenRequired ||
      status === DataStatus.ContextRequired ||
      !morePagesAvailable
    ) {
      return;
    }
    setPage((page) => page + 1);
    setNeedsUpdate(true);
  }, [dataMode, needsUpdate, status, morePagesAvailable]);

  React.useEffect(() => {
    if (dataMode === "external") {
      return;
    }

    // start from scratch when any external state changes
    if (requestType !== "recents" && requestType !== "favorites") {
      reset();
    }
  }, [
    dataMode,
    szewTwinId,
    accessToken,
    sortOptions?.descending,
    sortOptions?.sortType,
    apiOverrides?.data,
    apiOverrides?.serverEnvironmentPrefix,
    searchText,
    pageSize,
    maxCount,
    requestType,
    reset,
  ]);

  React.useEffect(() => {
    if (dataMode === "external") {
      return;
    }

    // start from scratch when any external state changes
    if (requestType === "recents" || requestType === "favorites") {
      reset();
    }
  }, [
    dataMode,
    szewTwinId,
    accessToken,
    sortOptions?.descending,
    sortOptions?.sortType,
    apiOverrides?.data,
    apiOverrides?.serverEnvironmentPrefix,
    pageSize,
    maxCount,
    requestType,
    reset,
  ]);

  // Main function
  React.useEffect(() => {
    if (dataMode === "external" || !needsUpdate) {
      return;
    }

    setNeedsUpdate(false);
    abortController?.abort();
    setAbortController(undefined);

    if (!accessToken || !szewTwinId) {
      setStatus(
        !accessToken ? DataStatus.TokenRequired : DataStatus.ContextRequired
      );
      setIVaults([]);
      return;
    }

    // If sort changes but we already have all the data, let client side sorting do its job
    if (sortChanged && !morePagesAvailable) {
      setStatus(DataStatus.Complete);
      return;
    }

    // Otherwise, fetch from server
    setStatus(DataStatus.Fetching);

    const { abortController: newAbortController, fetchIVaults } =
      createFetchIVaultsFn(
        szewTwinId,
        accessToken,
        sortType,
        sortDescending ?? false,
        page,
        searchText,
        pageSize,
        maxCount,
        apiOverrides?.serverEnvironmentPrefix,
        requestType
      );
    setAbortController(newAbortController);

    fetchIVaults()
      .then(({ iVaults, morePagesAvailable }) => {
        setMorePagesAvailable(morePagesAvailable);
        setIVaults((prev) =>
          page === 0 ? [...iVaults] : [...prev, ...iVaults]
        );
        setStatus(DataStatus.Complete);
      })
      .catch((e) => {
        if (e.name === "AbortError") {
          // Aborting because unmounting is not an error, swallow.
          return;
        }
        setIVaults([]);
        setMorePagesAvailable(false);
        setStatus(DataStatus.FetchFailed);
        console.error(e);
      });
  }, [
    dataMode,
    abortController,
    accessToken,
    apiOverrides?.data,
    apiOverrides?.serverEnvironmentPrefix,
    iVaults,
    szewTwinId,
    maxCount,
    pageSize,
    morePagesAvailable,
    needsUpdate,
    page,
    requestType,
    searchText,
    sortChanged,
    sortDescending,
    sortType,
  ]);

  if (dataMode === "external") {
    return {
      iVaults: apiOverrides?.data ?? [],
      status: apiOverrides?.isLoading
        ? DataStatus.Fetching
        : DataStatus.Complete,
      fetchMore:
        apiOverrides?.hasMoreData && !apiOverrides.isLoading
          ? onLoadMore
          : undefined,
      refetchIVaults:
        onRefetch ??
        (() => {
          // No-op in external mode - consumer handles refetch
        }),
    };
  }

  return {
    iVaults: filteredIVaults,
    status,
    fetchMore: morePagesAvailable ? fetchMore : undefined,
    refetchIVaults: reset,
  };
};

const createFetchIVaultsFn = (
  szewTwinId: string,
  accessToken: AccessTokenProvider,
  sortType: string | undefined,
  sortDescending: boolean,
  page: number,
  searchText: string | undefined,
  pageSize: number = DEFAULT_PAGE_SIZE,
  maxCount: number | undefined,
  serverEnvironmentPrefix?: "" | "dev" | "qa",
  requestType: "favorites" | "recents" | "" = ""
): {
  abortController: AbortController;
  fetchIVaults: () => Promise<{
    iVaults: IVaultFull[];
    morePagesAvailable: boolean;
  }>;
} => {
  const selection = `?szewTwinId=${encodeURIComponent(szewTwinId)}`;
  const sorting = sortType
    ? `&$orderBy=${encodeURIComponent(sortType)} ${
        sortDescending ? "desc" : "asc"
      }`
    : "";
  const skip = page * pageSize;

  if (maxCount !== undefined && skip >= maxCount) {
    const abortController = new AbortController();
    return {
      abortController,
      fetchIVaults: async () => ({
        iVaults: [],
        morePagesAvailable: false,
      }),
    };
  }

  const endpoint = ["favorites", "recents"].includes(requestType)
    ? requestType
    : "";
  const top = maxCount ? Math.min(pageSize, maxCount - skip) : pageSize;
  const paging = `&$skip=${skip}&$top=${top}`;
  // Only apply server-side search for non-recents and non-favorites requests
  const searching =
    searchText?.trim() && !["favorites", "recents"].includes(requestType)
      ? `&$search=${encodeURIComponent(searchText)}`
      : "";

  const abortController = new AbortController();
  const url = `${_getAPIServer(
    serverEnvironmentPrefix
  )}/ivaults/${endpoint}${selection}${sorting}${paging}${searching}`;

  const doFetchRequest = async () => {
    const options: RequestInit = {
      signal: abortController.signal,
      headers: {
        Authorization:
          typeof accessToken === "function" ? await accessToken() : accessToken,
        Prefer: "return=representation",
        Accept: "application/vnd.szewec.szewtwin-platform.v2+json",
      },
    };

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(await response.text());
    }

    const result: { iVaults: IVaultFull[] } = await response.json();
    const totalLocalIVaults = page * pageSize + result.iVaults.length;

    return {
      iVaults: result.iVaults,
      morePagesAvailable: !(
        totalLocalIVaults === maxCount || result.iVaults.length < top
      ),
    };
  };

  return {
    abortController,
    fetchIVaults: doFetchRequest,
  };
};
