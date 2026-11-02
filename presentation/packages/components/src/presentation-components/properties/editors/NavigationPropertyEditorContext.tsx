/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/**
 * @packageDocumentation
 * @module Properties
 */

import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import { PropertyDescription } from "@szewtwin/appui-abstract";
import { IVaultConnection } from "@szewtwin/core-frontend";
import { NavigationPropertyInfo } from "@szewtwin/presentation-common";
import { IContentDataProvider } from "../../common/ContentDataProvider.js";

/**
 * A context providing necessary information for [[NavigationPropertyEditor]].
 * @internal
 */
export interface NavigationPropertyEditorContext {
  /** iVault connection to pull data from. */
  ivault: IVaultConnection;
  /** Getter to get [NavigationPropertyInfo]($presentation-common) for specific property. */
  getNavigationPropertyInfo: (property: PropertyDescription) => Promise<NavigationPropertyInfo | undefined>;
}

const navigationPropertyEditorContext = createContext<NavigationPropertyEditorContext | undefined>(undefined);

/**
 * Props for [[NavigationPropertyEditorContextProvider]].
 * @public
 */
export interface NavigationPropertyEditorContextProviderProps {
  /** iVault connection to pull data from. */
  ivault: IVaultConnection;
  /** Getter to get [NavigationPropertyInfo]($presentation-common) for specific property. */
  getNavigationPropertyInfo: (property: PropertyDescription) => Promise<NavigationPropertyInfo | undefined>;
}

/**
 * Creates context that supplies necessary navigation property-related information for [[NavigationPropertyEditor]].
 * @public
 */
export function NavigationPropertyEditorContextProvider({
  children,
  ...props
}: PropsWithChildren<NavigationPropertyEditorContextProviderProps>) {
  return <navigationPropertyEditorContext.Provider value={props}>{children}</navigationPropertyEditorContext.Provider>;
}

/**
 * Returns context provided by [[NavigationPropertyEditorContextProvider]]. The context is required for rendering [[NavigationPropertyEditor]] with editable
 * navigation property values.
 *
 * @internal
 */
export function useNavigationPropertyEditorContext() {
  return useContext(navigationPropertyEditorContext);
}

/**
 * Custom hook that creates props for [[NavigationPropertyEditorContextProvider]].
 * @public
 */
export function useNavigationPropertyEditorContextProviderProps(
  ivault: IVaultConnection,
  dataProvider: IContentDataProvider,
): NavigationPropertyEditorContextProviderProps {
  return useMemo<NavigationPropertyEditorContextProviderProps>(
    () => ({
      ivault,
      getNavigationPropertyInfo: async (property) => {
        const field = await dataProvider.getFieldByPropertyDescription(property);
        if (!field || !field.isPropertiesField()) {
          return undefined;
        }
        return field.properties[0].property.navigationPropertyInfo;
      },
    }),
    [ivault, dataProvider],
  );
}
