/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import React from "react";

import { useIVaultFavorites } from "../containers/iVaultGrid/useIVaultFavorites";
import { AccessTokenProvider } from "../types";

export interface IVaultFavoritesContextValue {
  favorites: Set<string>;
  add: (iVaultId: string) => Promise<void>;
  remove: (iVaultId: string) => Promise<void>;
}

export const IVaultFavoritesContext = React.createContext<
  IVaultFavoritesContextValue | undefined
>(undefined);

export interface IVaultFavoritesProviderProps {
  szewTwinId: string | undefined;
  accessToken?: AccessTokenProvider;
  serverEnvironmentPrefix?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export const IVaultFavoritesProvider = ({
  szewTwinId,
  accessToken,
  serverEnvironmentPrefix,
  children,
  disabled,
}: IVaultFavoritesProviderProps) => {
  const { iVaultFavorites, addIVaultToFavorites, removeIVaultFromFavorites } =
    useIVaultFavorites(
      szewTwinId,
      accessToken,
      serverEnvironmentPrefix === "dev" || serverEnvironmentPrefix === "qa"
        ? serverEnvironmentPrefix
        : undefined,
      disabled
    );

  const value = React.useMemo<IVaultFavoritesContextValue>(
    () => ({
      favorites: iVaultFavorites,
      add: addIVaultToFavorites,
      remove: removeIVaultFromFavorites,
    }),
    [iVaultFavorites, addIVaultToFavorites, removeIVaultFromFavorites]
  );

  return (
    <IVaultFavoritesContext.Provider value={value}>
      {children}
    </IVaultFavoritesContext.Provider>
  );
};

export const useIVaultFavoritesContext = () => {
  const ctx = React.useContext(IVaultFavoritesContext);
  if (!ctx) {
    console.warn(
      "useIVaultFavoritesContext must be used within IVaultFavoritesProvider"
    );
  }
  return ctx;
};
