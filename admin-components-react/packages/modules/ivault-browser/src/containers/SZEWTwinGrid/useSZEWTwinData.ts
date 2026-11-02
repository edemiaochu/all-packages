/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import React from "react";

import {
  AccessTokenProvider,
  ApiOverrides,
  DataStatus,
  SZEWTwinFilterOptions,
  SZEWTwinFull,
  SZEWTwinSubClass,
} from "../../types";
import { _getAPIServer } from "../../utils/_apiOverrides";
import { useSZEWTwinFilter } from "./useSZEWTwinFilter";

export interface ProjectDataHookOptions {
  requestType?: "favorites" | "recents" | "";
  szewTwinSubClass?: SZEWTwinSubClass;
  accessToken?: AccessTokenProvider;
  apiOverrides?: ApiOverrides<SZEWTwinFull[]>;
  filterOptions?: SZEWTwinFilterOptions;
  orderbyOptions?: string;
  shouldRefetchFavorites?: boolean;
  resetShouldRefetchFavorites?: () => void;
}

const PAGE_SIZE = 100;

export const useSZEWTwinData = ({
  requestType = "",
  szewTwinSubClass = "Project",
  accessToken,
  apiOverrides,
  filterOptions,
  orderbyOptions,
  shouldRefetchFavorites,
  resetShouldRefetchFavorites,
}: ProjectDataHookOptions) => {
  const data = apiOverrides?.data;
  const serverEnvironmentPrefix = apiOverrides?.serverEnvironmentPrefix;
  const [projects, setProjects] = React.useState<SZEWTwinFull[]>([]);
  const [status, setStatus] = React.useState<DataStatus>();
  const filteredProjects = useSZEWTwinFilter(projects, filterOptions);
  const [page, setPage] = React.useState(0);
  const [morePages, setMorePages] = React.useState(true);

  const refetchData = React.useCallback(() => {
    setStatus(DataStatus.Fetching);
    setProjects([]);
    setPage(0);
    setMorePages(true);
    fetchingMoreRef.current = true;
  }, []);

  // We start in a fetching state
  const fetchingMoreRef = React.useRef(true);
  const fetchMore = React.useCallback(() => {
    if (fetchingMoreRef.current) {
      return;
    }
    fetchingMoreRef.current = true;
    setPage((page) => page + 1);
  }, []);

  const morePagesRef = React.useRef(morePages);
  morePagesRef.current = morePages;

  React.useEffect(() => {
    // If filter changes but we already have all the data for favorites or recents,
    // let client side filtering do its job, otherwise, refetch from scratch.
    // Use ref so "morePages" changes itself does not trigger the effect.
    if (
      morePagesRef.current ||
      !["favorites", "recents"].includes(requestType)
    ) {
      refetchData();
    }
  }, [filterOptions, requestType, refetchData]);

  React.useEffect(() => {
    // If any of the dependencies change, always restart the fetch from scratch.
    refetchData();
  }, [
    accessToken,
    requestType,
    szewTwinSubClass,
    orderbyOptions,
    data,
    serverEnvironmentPrefix,
    refetchData,
  ]);

  React.useEffect(() => {
    if (!morePages) {
      return;
    }
    if (data) {
      setProjects(data);
      setStatus(DataStatus.Complete);
      setMorePages(false);
      return;
    }
    if (!accessToken) {
      setStatus(DataStatus.TokenRequired);
      setProjects([]);
      return;
    }
    if (page === 0) {
      setStatus(DataStatus.Fetching);
    }
    const abortController = new AbortController();
    const endpoint = ["favorites", "recents"].includes(requestType)
      ? requestType
      : "";
    const resolvedSZEWTwinSubClass = szewTwinSubClass === "All" ? "" : szewTwinSubClass;
    const subClass = `?subClass=${resolvedSZEWTwinSubClass}`;
    const paging = `&$skip=${page * PAGE_SIZE}&$top=${PAGE_SIZE}`;
    const search =
      ["favorites", "recents"].includes(requestType) || !filterOptions
        ? ""
        : `&$search=${encodeURIComponent(String(filterOptions).trim())}`;
    const orderby =
      ["favorites", "recents"].includes(requestType) || !orderbyOptions
        ? ""
        : `&$orderby=${encodeURIComponent(String(orderbyOptions).trim())}`;

    const url = `${_getAPIServer(
      serverEnvironmentPrefix
    )}/szewtwins/${endpoint}${subClass}${paging}${search}${orderby}`;

    const makeFetchRequest = async () => {
      const options: RequestInit = {
        signal: abortController.signal,
        headers: {
          "Cache-Control":
            requestType === "favorites" && shouldRefetchFavorites
              ? "no-cache"
              : "",
          Authorization:
            typeof accessToken === "function"
              ? await accessToken()
              : accessToken,
          Accept: "application/vnd.szewec.szewtwin-platform.v1+json",
          Prefer: "return=representation",
        },
      };

      const response = await fetch(url, options);
      const result: { szewTwins: SZEWTwinFull[] } = response.ok
        ? await response.json()
        : await response.text().then((errorText) => {
            throw new Error(errorText);
          });
      setStatus(DataStatus.Complete);
      fetchingMoreRef.current = false;
      requestType === "favorites" && resetShouldRefetchFavorites?.();
      if (result.szewTwins.length !== PAGE_SIZE) {
        setMorePages(false);
      }
      setProjects((projects) =>
        page === 0 ? result.szewTwins : [...projects, ...result.szewTwins]
      );
    };

    makeFetchRequest().catch((e) => {
      if (e.name === "AbortError") {
        // Aborting because unmounting is not an error, swallow.
        return;
      }
      setProjects([]);
      setStatus(DataStatus.FetchFailed);
      fetchingMoreRef.current = false;
      console.error(e);
    });
    return () => {
      abortController.abort();
    };
  }, [
    accessToken,
    requestType,
    data,
    serverEnvironmentPrefix,
    filterOptions,
    orderbyOptions,
    page,
    morePages,
    szewTwinSubClass,
    shouldRefetchFavorites,
    resetShouldRefetchFavorites,
  ]);
  return {
    szewTwins: filteredProjects,
    status,
    fetchMore: morePages ? fetchMore : undefined,
    refetchSZEWTwins: refetchData,
  };
};
