/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Common
 */

import type { IVaultConnection } from "@szewtwin/core-frontend";
import * as React from "react";

const IVaultConnectionContext = React.createContext<
  IVaultConnection | undefined
>(undefined);

/**
 * Provides `IVaultConnection` to the components wrapped by the provider.
 * @public
 */
export function IVaultConnectionProvider({
  iVaultConnection,
  children,
}: React.PropsWithChildren<{ iVaultConnection?: IVaultConnection }>) {
  return (
    <IVaultConnectionContext.Provider value={iVaultConnection}>
      {children}
    </IVaultConnectionContext.Provider>
  );
}

/**
 * @internal
 */
export function useIVaultConnection() {
  return React.useContext(IVaultConnectionContext);
}
