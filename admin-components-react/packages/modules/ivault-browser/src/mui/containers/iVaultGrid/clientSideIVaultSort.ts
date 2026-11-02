/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import type { IVaultFull, IVaultSortOptions, ViewType } from "../../../types";

export interface ClientSideIVaultSortOptions {
  viewMode: ViewType | undefined;
  requestType: "favorites" | "recents" | "" | undefined;
  sort: IVaultSortOptions;
}

/**
 * Client-side sort applied to the MUI iVault grid for tile view when the
 * request type is "recents" or "favorites" — the server does not honor sort
 * options for those request types, so we sort on the client.
 */
export const clientSideIVaultSort = (
  iVaults: IVaultFull[],
  { viewMode, requestType, sort }: ClientSideIVaultSortOptions
): IVaultFull[] => {
  if (viewMode === "cells") {
    return iVaults;
  }
  if (requestType !== "recents" && requestType !== "favorites") {
    return iVaults;
  }

  const sortValue = (iVault: IVaultFull) => {
    const currValue =
      sort.sortType === "name"
        ? iVault.displayName ?? iVault.name ?? ""
        : iVault[sort.sortType] ?? "";
    return currValue.toLocaleLowerCase();
  };

  return [...iVaults].sort((a, b) => {
    const aValue = sortValue(a);
    const bValue = sortValue(b);
    return sort.descending
      ? bValue.localeCompare(aValue)
      : aValue.localeCompare(bValue);
  });
};
