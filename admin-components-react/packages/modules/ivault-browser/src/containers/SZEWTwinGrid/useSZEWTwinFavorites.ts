/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { useCallback, useEffect, useState } from "react";

import { AccessTokenProvider } from "../../types";
import { _getAPIServer } from "../../utils/_apiOverrides";

const HOOK_ABORT_ERROR =
  "The fetch request was aborted by the cleanup function.";

/**
 * Custom hook to manage szewTwin favorites.
 * @param accessToken - Access token that requires the `szewtwin-platform` scope. Provide a function that returns the token to prevent the token from expiring.
 * @param serverEnvironmentPrefix Optional server environment prefix to target different environments. Can be "dev", "qa", or "" (empty string for production)
 * @returns {object} An object containing:
 * - {Set<string>} szewTwinFavorites - A set of szewTwin IDs that are marked as favorites.
 * - {function} addSZEWTwinToFavorites - A function to add an szewTwin to favorites.
 * - {function} removeSZEWTwinFromFavorites - A function to remove an szewTwin from favorites.
 * - {boolean} shouldRefetchFavorites - A boolean indicating whether to refetch favorites when switching to the favorites tab.
 * - {function} resetShouldRefetchFavorites - A function to reset shouldRefetchFavorites back to false.
 */
export const useSZEWTwinFavorites = (
  accessToken: AccessTokenProvider | undefined,
  serverEnvironmentPrefix?: "dev" | "qa" | ""
): {
  szewTwinFavorites: Set<string>;
  addSZEWTwinToFavorites: (szewTwinId: string) => Promise<void>;
  removeSZEWTwinFromFavorites: (szewTwinId: string) => Promise<void>;
  shouldRefetchFavorites: boolean;
  resetShouldRefetchFavorites: () => void;
} => {
  const [szewTwinFavorites, setSZEWTwinFavorites] = useState(new Set<string>());
  const [shouldRefetchFavorites, setShouldRefetchFavorites] = useState(false);

  /**
   * Adds an szewTwin to the favorites.
   * @param {string} szewTwinId - The ID of the szewTwin to add to favorites.
   * @returns {Promise<void>}
   */
  const addSZEWTwinToFavorites = useCallback(
    async (szewTwinId: string): Promise<void> => {
      if (!accessToken || !szewTwinId || szewTwinId === "") {
        return;
      }
      const url = `${_getAPIServer(
        serverEnvironmentPrefix
      )}/szewtwins/favorites/${szewTwinId}`;
      try {
        const result = await fetch(url, {
          method: "POST",
          headers: {
            authorization:
              typeof accessToken === "function"
                ? await accessToken()
                : accessToken,
            Accept: "application/vnd.szewec.szewtwin-platform.v1+json",
          },
        });

        if (!result || (result.status !== 200 && result.status !== 204)) {
          throw new Error(`Failed to add szewTwin ${szewTwinId} to favorites`);
        }

        setSZEWTwinFavorites((prev) => new Set([...prev, szewTwinId]));
        setShouldRefetchFavorites(true);
      } catch (error) {
        console.error(error);
      }
    },
    [accessToken, serverEnvironmentPrefix]
  );

  /**
   * Removes an szewTwin from the favorites.
   * @param {string} szewTwinId - The ID of the szewTwin to remove from favorites.
   * @returns {Promise<void>}
   */
  const removeSZEWTwinFromFavorites = useCallback(
    async (szewTwinId: string): Promise<void> => {
      if (!accessToken || !szewTwinId || szewTwinId === "") {
        return;
      }
      const url = `${_getAPIServer(
        serverEnvironmentPrefix
      )}/szewtwins/favorites/${szewTwinId}`;
      try {
        const result = await fetch(url, {
          method: "DELETE",
          headers: {
            authorization:
              typeof accessToken === "function"
                ? await accessToken()
                : accessToken,
            Accept: "application/vnd.szewec.szewtwin-platform.v1+json",
          },
        });

        if (!result || (result.status !== 200 && result.status !== 204)) {
          throw new Error(`Failed to remove szewTwin ${szewTwinId} to favorites`);
        }

        setSZEWTwinFavorites((prev) => {
          const newFavorites = new Set(prev);
          newFavorites.delete(szewTwinId);
          return newFavorites;
        });
        setShouldRefetchFavorites(true);
      } catch (error) {
        console.error(error);
      }
    },
    [accessToken, serverEnvironmentPrefix]
  );

  /**
   * Fetches szewTwin favorites from the API.
   * @param {AbortSignal} [abortSignal] - Optional abort signal to cancel the fetch request.
   * @returns {Promise<SZEWTwinFavorites[]>} - A promise that resolves to an array of szewTwin favorites.
   * @throws {Error} - Throws an error if the fetch request fails.
   */
  const getSZEWTwinFavorites = useCallback(
    async (abortSignal?: AbortSignal): Promise<SZEWTwinFavorites[]> => {
      if (!accessToken) {
        return [];
      }
      const url = `${_getAPIServer(
        serverEnvironmentPrefix
      )}/szewtwins/favorites?subClass=Project`;
      const result = await fetch(url, {
        headers: {
          "Cache-Control": shouldRefetchFavorites ? "no-cache" : "",
          authorization:
            typeof accessToken === "function"
              ? await accessToken()
              : accessToken,
          Accept: "application/vnd.szewec.szewtwin-platform.v1+json",
        },
        signal: abortSignal,
      });
      if (abortSignal?.aborted) {
        throw new Error(HOOK_ABORT_ERROR);
      }
      if (!result) {
        throw new Error(
          `Failed to fetch szewTwin favorites from ${url}.\nNo response.`
        );
      }
      if (result.status !== 200) {
        throw new Error(
          `Failed to fetch szewTwin favorites from ${url}.\nStatus: ${result.status}`
        );
      }
      const response: SZEWTwinFavoritesResponse = await result.json();
      return response.szewTwins;
    },
    [accessToken, serverEnvironmentPrefix, shouldRefetchFavorites]
  );

  const resetShouldRefetchFavorites = useCallback(() => {
    setShouldRefetchFavorites(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    /**
     * Fetches szewTwin favorites and updates the state.
     * @param {AbortSignal} [abortSignal] - Optional abort signal to cancel the fetch request.
     */
    const fetchSZEWTwinFavorites = async (abortSignal?: AbortSignal) => {
      try {
        const favorites = await getSZEWTwinFavorites(abortSignal);
        setSZEWTwinFavorites(new Set(favorites.map((favorite) => favorite.id)));
      } catch (error) {
        if (
          error === HOOK_ABORT_ERROR ||
          (error instanceof Error && error.name === "AbortError")
        ) {
          return;
        }
        console.error(error);
      }
    };
    void fetchSZEWTwinFavorites(controller.signal);

    return () => {
      controller.abort();
    };
  }, [getSZEWTwinFavorites]);

  return {
    szewTwinFavorites,
    addSZEWTwinToFavorites,
    removeSZEWTwinFromFavorites,
    shouldRefetchFavorites,
    resetShouldRefetchFavorites,
  };
};

/** Response from https://developer.szewec.com/apis/szewTwins/operations/get-my-favorite-szewtwins/ */
interface SZEWTwinFavoritesResponse {
  szewTwins: SZEWTwinFavorites[];
  _links: {
    self: {
      href: string;
    };
    prev?: {
      href: string;
    };
    next?: {
      href: string;
    };
  };
}
interface SZEWTwinFavorites {
  id: string;
  class: string;
  subClass: string;
  type: string;
  // eslint-disable-next-line id-blacklist
  number: string;
  displayName: string;
}
