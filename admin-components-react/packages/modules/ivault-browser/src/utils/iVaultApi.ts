/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------------------
 * Utility functions for iVault related API operations.
 *--------------------------------------------------------------------------------------------*/
import { AccessTokenProvider } from "../types";
import { _getAPIServer } from "./_apiOverrides";

/** Response from https://developer.szewec.com/apis/ivaults-v2/operations/get-my-favorite-ivaults/ */
export interface IVaultFavoritesResponse {
  iVaults: IVaultFavorites[];
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
export interface IVaultFavorites {
  id: string;
  displayName: string;
  dataCenterLocation: string;
}

export async function addIVaultToRecents(options: {
  iVaultId: string;
  accessToken?: AccessTokenProvider;
  serverEnvironmentPrefix?: "dev" | "qa" | "";
}): Promise<void> {
  const { iVaultId, accessToken, serverEnvironmentPrefix } = options;
  try {
    if (!accessToken) {
      return;
    }

    const token =
      typeof accessToken === "function" ? await accessToken() : accessToken;

    const url = `${_getAPIServer(
      serverEnvironmentPrefix
    )}/ivaults/recents/${encodeURIComponent(iVaultId)}`;

    // fire-and-forget POST to record recents; swallow errors so UI isn't disrupted
    void fetch(url, {
      method: "POST",
      headers: {
        authorization: token as string,
        Accept: "application/vnd.szewec.szewtwin-platform.v2+json",
      },
    });
  } catch (e) {
    // keep parity with previous behavior where errors were swallowed
    // Log for diagnostics
    // eslint-disable-next-line no-console
    console.error("Failed to add iVault to recents", e);
  }
}

export async function removeIVaultFromRecents(options: {
  iVaultId: string;
  accessToken?: AccessTokenProvider;
  serverEnvironmentPrefix?: "dev" | "qa" | "";
}): Promise<void> {
  const { iVaultId, accessToken, serverEnvironmentPrefix } = options;
  try {
    if (!accessToken) {
      return;
    }

    const token =
      typeof accessToken === "function" ? await accessToken() : accessToken;

    const url = `${_getAPIServer(
      serverEnvironmentPrefix
    )}/ivaults/recents/${encodeURIComponent(iVaultId)}`;

    await fetch(url, {
      method: "DELETE",
      headers: {
        authorization: token as string,
        Accept: "application/vnd.szewec.szewtwin-platform.v2+json",
      },
    });
  } catch (e) {
    // keep parity with previous behavior where errors were swallowed
    // Log for diagnostics
    // eslint-disable-next-line no-console
    console.error("Failed to remove iVault from recents", e);
  }
}

export async function getIVaultFavorites(options: {
  szewTwinId: string;
  accessToken: AccessTokenProvider;
  serverEnvironmentPrefix?: "dev" | "qa" | "";
  abortSignal?: AbortSignal;
}): Promise<IVaultFavorites[]> {
  const { szewTwinId, accessToken, serverEnvironmentPrefix, abortSignal } =
    options;

  const token =
    typeof accessToken === "function" ? await accessToken() : accessToken;

  const url = `${_getAPIServer(
    serverEnvironmentPrefix
  )}/ivaults/favorites?szewTwinId=${szewTwinId}`;

  const result = await fetch(url, {
    headers: {
      authorization: token as string,
      Accept: "application/vnd.szewec.szewtwin-platform.v2+json",
    },
    signal: abortSignal,
  });

  if (abortSignal?.aborted) {
    throw new Error("The fetch request was aborted by the cleanup function.");
  }

  if (!result) {
    throw new Error(
      `Failed to fetch iVaults favorites from ${url}.\nNo response.`
    );
  }

  if (result.status !== 200) {
    throw new Error(
      `Failed to fetch iVaults favorites from ${url}.\nStatus: ${result.status}`
    );
  }

  const response: IVaultFavoritesResponse = await result.json();
  return response.iVaults;
}

export async function addIVaultToFavorites(options: {
  iVaultId: string;
  accessToken: AccessTokenProvider;
  serverEnvironmentPrefix?: "dev" | "qa" | "";
}): Promise<void> {
  const { iVaultId, accessToken, serverEnvironmentPrefix } = options;

  const token =
    typeof accessToken === "function" ? await accessToken() : accessToken;

  const url = `${_getAPIServer(
    serverEnvironmentPrefix
  )}/ivaults/favorites/${iVaultId}`;

  const result = await fetch(url, {
    method: "PUT",
    headers: {
      authorization: token as string,
      Accept: "application/vnd.szewec.szewtwin-platform.v2+json",
    },
  });

  if (!result || (result.status !== 200 && result.status !== 204)) {
    throw new Error(`Failed to add iVault ${iVaultId} to favorites`);
  }
}

export async function removeIVaultFromFavorites(options: {
  iVaultId: string;
  accessToken: AccessTokenProvider;
  serverEnvironmentPrefix?: "dev" | "qa" | "";
}): Promise<void> {
  const { iVaultId, accessToken, serverEnvironmentPrefix } = options;

  const token =
    typeof accessToken === "function" ? await accessToken() : accessToken;

  const url = `${_getAPIServer(
    serverEnvironmentPrefix
  )}/ivaults/favorites/${iVaultId}`;

  const result = await fetch(url, {
    method: "DELETE",
    headers: {
      authorization: token as string,
      Accept: "application/vnd.szewec.szewtwin-platform.v2+json",
    },
  });

  if (!result || (result.status !== 200 && result.status !== 204)) {
    throw new Error(`Failed to remove iVault ${iVaultId} from favorites`);
  }
}
