/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Core
 */

import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { IVaultConnection } from "@szewtwin/core-frontend";
import { SchemaContext } from "@szewtwin/dmschema-metadata";

/**
 * Context that stores metadata related to schemas.
 * @public
 */
export interface SchemaMetadataContext {
  /** Schema context for schemas lookup. */
  schemaContext: SchemaContext;
}

const schemaMetadataContext = createContext<SchemaMetadataContext | undefined>(undefined);

/**
 * Props for [[SchemaMetadataContextProvider]]
 * @public
 */
export interface SchemaMetadataContextProviderProps {
  /** iVault to pull schemas from. */
  ivault: IVaultConnection;
  /** Callback that provides schema context for supplied ivault. */
  schemaContextProvider: (ivault: IVaultConnection) => SchemaContext;
}

/**
 * Provides schema metadata to components that work with schemas.
 * @public
 */
export function SchemaMetadataContextProvider({
  schemaContextProvider,
  ivault,
  children,
}: PropsWithChildren<SchemaMetadataContextProviderProps>) {
  const [state, setState] = useState<SchemaMetadataContext>(() => ({ schemaContext: schemaContextProvider(ivault) }));

  useEffect(() => {
    setState({ schemaContext: schemaContextProvider(ivault) });
  }, [ivault, schemaContextProvider]);

  return <schemaMetadataContext.Provider value={state}>{children}</schemaMetadataContext.Provider>;
}

/**
 * Returns context provided by [[SchemaMetadataContextProvider]].
 * @public
 */
export function useSchemaMetadataContext() {
  return useContext(schemaMetadataContext);
}
