/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { useCallback, useEffect, useState } from "react";

import { AccessTokenProvider } from "../../types";
import * as iVaultApi from "../../utils/iVaultApi";

/**
 * Custom hook to manage iVault favorites.
 * @param szewTwinId - The ID of the szewTwin for which to fetch favorites.
 * @param accessToken - Access token that requires the `szewtwin-platform` scope. Provide a function that returns the token to prevent the token from expiring.
 * @param serverEnvironmentPrefix - Optional server environment prefix.
 * @param disabled - Optional flag to disable fetching of the favorites in the hook.
 * @returns An object containing:
 * - {Set<string>} iVaultFavorites - A set of iVault IDs that are marked as favorites.
 * - {function} addIVaultToFavorites - A function to add an iVault to favorites.
 * - {function} removeIVaultFromFavorites - A function to remove an iVault from favorites.
 */
export const useIVaultFavorites = (
  szewTwinId: string | undefined,
  accessToken: AccessTokenProvider | undefined,
  serverEnvironmentPrefix?: "dev" | "qa" | "",
  disabled?: boolean
): {
  iVaultFavorites: Set<string>;
  addIVaultToFavorites: (iVaultId: string) => Promise<void>;
  removeIVaultFromFavorites: (iVaultId: string) => Promise<void>;
} => {
  const [iVaultFavorites, setIVaultFavorites] = useState(new Set<string>());

  /**
   * Adds an iVault to the favorites.
   * @param {string} iVaultId - The ID of the iVault to add to favorites.
   * @returns {Promise<void>}
   */
  const addIVaultToFavorites = useCallback(
    async (iVaultId: string): Promise<void> => {
      if (!accessToken || !iVaultId || iVaultId === "") {
        return;
      }
      try {
        await iVaultApi.addIVaultToFavorites({
          iVaultId,
          accessToken,
          serverEnvironmentPrefix,
        });

        setIVaultFavorites((prev) => new Set([...prev, iVaultId]));
      } catch (error) {
        console.error(error);
      }
    },
    [accessToken, serverEnvironmentPrefix]
  );

  /**
   * Removes an iVault from the favorites.
   * @param {string} iVaultId - The ID of the iVault to remove from favorites.
   * @returns {Promise<void>}
   */
  const removeIVaultFromFavorites = useCallback(
    async (iVaultId: string): Promise<void> => {
      if (!accessToken || !iVaultId || iVaultId === "") {
        return;
      }
      try {
        await iVaultApi.removeIVaultFromFavorites({
          iVaultId,
          accessToken,
          serverEnvironmentPrefix,
        });

        setIVaultFavorites((prev) => {
          const newFavorites = new Set(prev);
          newFavorites.delete(iVaultId);
          return newFavorites;
        });
      } catch (error) {
        console.error(error);
      }
    },
    [accessToken, serverEnvironmentPrefix]
  );

  useEffect(() => {
    const controller = new AbortController();
    /**
     * Fetches szewTwin favorites and updates the state.
     * @param {AbortSignal} [abortSignal] - Optional abort signal to cancel the fetch request.
     */
    const fetchIVaultFavorites = async (abortSignal?: AbortSignal) => {
      try {
        if (disabled || !szewTwinId || !accessToken) {
          setIVaultFavorites(new Set());
          return;
        }

        const favorites = await iVaultApi.getIVaultFavorites({
          szewTwinId,
          accessToken,
          serverEnvironmentPrefix,
          abortSignal,
        });
        setIVaultFavorites(new Set(favorites.map((favorite) => favorite.id)));
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error(error);
      }
    };
    void fetchIVaultFavorites(controller.signal);

    return () => {
      controller.abort();
    };
  }, [disabled, szewTwinId, accessToken, serverEnvironmentPrefix]);

  return {
    iVaultFavorites,
    addIVaultToFavorites,
    removeIVaultFromFavorites,
  };
};
