/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { useActiveIVaultConnection } from "@szewtwin/appui-react";
import { SchemaMetadataContextProvider } from "@szewtwin/presentation-components";
import { MultiElementPropertyGrid } from "./components/MultiElementPropertyGrid.js";
import { TelemetryContextProvider } from "./hooks/UseTelemetryContext.js";
import { PreferencesContextProvider } from "./PropertyGridPreferencesContext.js";

import type { IVaultConnection } from "@szewtwin/core-frontend";
import type { PreferencesStorage } from "./api/PreferencesStorage.js";
import type { MultiElementPropertyGridProps } from "./components/MultiElementPropertyGrid.js";
import type { TelemetryContextProviderProps } from "./hooks/UseTelemetryContext.js";

/**
 * Props for `PropertyGridComponent`.
 * @public
 */
export interface PropertyGridComponentProps extends Omit<MultiElementPropertyGridProps, "ivault">, TelemetryContextProviderProps {
  /**
   * Custom storage that should be used for persisting preferences.
   * Defaults to `IVaultAppUserPreferencesStorage` that uses `IVaultApp.userPreferences`.
   */
  preferencesStorage?: PreferencesStorage;
}

/**
 * Component that renders `MultiElementPropertyGrid` if there is active iVault connection.
 * @public
 */
export function PropertyGridComponent({ preferencesStorage, onPerformanceMeasured, onFeatureUsed, ...props }: PropertyGridComponentProps) {
  const ivault = useActiveIVaultConnection();
  if (!ivault) {
    return null;
  }

  return (
    <SchemaMetadataContextProvider ivault={ivault} schemaContextProvider={getSchemaContext}>
      <TelemetryContextProvider onPerformanceMeasured={onPerformanceMeasured} onFeatureUsed={onFeatureUsed}>
        <PreferencesContextProvider storage={preferencesStorage}>
          <MultiElementPropertyGrid {...props} ivault={ivault} />
        </PreferencesContextProvider>
      </TelemetryContextProvider>
    </SchemaMetadataContextProvider>
  );
}

function getSchemaContext(ivault: IVaultConnection) {
  return ivault.schemaContext;
}
