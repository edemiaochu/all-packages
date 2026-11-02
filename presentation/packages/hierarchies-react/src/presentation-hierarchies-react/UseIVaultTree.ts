/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { useCallback } from "react";
import {
  createIVaultHierarchyProvider,
  HierarchyDefinition,
  HierarchyFilteringPath,
} from "@szewtwin/presentation-hierarchies";
import { Props } from "@szewtwin/presentation-shared";
import { UseUnifiedTreeSelectionProps } from "./internal/UseUnifiedSelection.js";
import { useTree, UseTreeProps, UseTreeResult, useUnifiedSelectionTree } from "./UseTree.js";

/** @public */
type IVaultHierarchyProviderProps = Props<typeof createIVaultHierarchyProvider>;

/** @public */
type IVaultAccess = IVaultHierarchyProviderProps["ivaultAccess"];

/**
 * Props for `useIVaultTree` and `useIVaultUnifiedSelectionTree` hooks.
 * @public
 */
type UseIVaultTreeProps = Omit<UseTreeProps, "getHierarchyProvider" | "getFilteredPaths"> &
  Pick<IVaultHierarchyProviderProps, "localizedStrings" | "ivaultAccess" | "ivaultChanged"> & {
    /** Provides the hierarchy definition for the tree. */
    getHierarchyDefinition: (props: { ivaultAccess: IVaultAccess }) => HierarchyDefinition;

    /** Provides paths to filtered nodes. */
    getFilteredPaths?: (props: {
      /** Object that provides access to the iVault schema and can run queries against the iVault. */
      ivaultAccess: IVaultAccess;
      /** Signal indicating that that the request was canceled */
      abortSignal: AbortSignal;
    }) => Promise<HierarchyFilteringPath[] | undefined>;
  };

/**
 * A React hook that creates state for a tree component whose displayed hierarchy is based on
 * iVault data.
 *
 * The hook uses `@szewtwin/presentation-hierarchies` package to load the hierarchy data and returns a
 * component-agnostic result which may be used to render the hierarchy using any UI framework.
 *
 * See `README.md` for an example
 *
 * @see `useTree`
 * @see `useIVaultUnifiedSelectionTree`
 * @public
 */
export function useIVaultTree(props: UseIVaultTreeProps): UseTreeResult {
  const { ivaultAccess, ivaultChanged, getHierarchyDefinition, getFilteredPaths, localizedStrings, ...rest } = props;
  return useTree({
    ...rest,
    ...useIVaultTreeProps({ ivaultAccess, ivaultChanged, getHierarchyDefinition, getFilteredPaths, localizedStrings }),
  });
}

/**
 * A React hook that creates state for a tree component whose displayed hierarchy is based on
 * iVault data and that is integrated with unified selection through the given selection
 * storage (previously the storage was provided through the, now deprecated, `UnifiedSelectionProvider`).
 *
 * The hook uses `@szewtwin/presentation-hierarchies` package to load the hierarchy data and returns a
 * component-agnostic result which may be used to render the hierarchy using any UI framework.
 *
 * See `README.md` for an example
 *
 * @see `useIVaultTree`
 * @see `useUnifiedSelectionTree`
 * @see `UnifiedSelectionProvider`
 * @public
 */
export function useIVaultUnifiedSelectionTree(props: UseIVaultTreeProps & UseUnifiedTreeSelectionProps): UseTreeResult {
  const { ivaultAccess, ivaultChanged, getHierarchyDefinition, getFilteredPaths, localizedStrings, ...rest } = props;
  return useUnifiedSelectionTree({
    ...rest,
    ...useIVaultTreeProps({ ivaultAccess, ivaultChanged, getHierarchyDefinition, getFilteredPaths, localizedStrings }),
  });
}

function useIVaultTreeProps(
  props: Pick<
    UseIVaultTreeProps,
    "ivaultAccess" | "ivaultChanged" | "getHierarchyDefinition" | "getFilteredPaths" | "localizedStrings"
  >,
): Pick<UseTreeProps, "getHierarchyProvider" | "getFilteredPaths"> {
  const { ivaultAccess, ivaultChanged, getHierarchyDefinition, getFilteredPaths, localizedStrings } = props;
  return {
    getHierarchyProvider: useCallback(
      () =>
        createIVaultHierarchyProvider({
          ivaultAccess,
          ivaultChanged,
          hierarchyDefinition: getHierarchyDefinition({ ivaultAccess }),
          localizedStrings,
        }),
      [ivaultAccess, ivaultChanged, getHierarchyDefinition, localizedStrings],
    ),
    getFilteredPaths: useCallback(
      async ({ abortSignal }: { abortSignal: AbortSignal }) => getFilteredPaths?.({ ivaultAccess, abortSignal }),
      [ivaultAccess, getFilteredPaths],
    ),
  };
}
