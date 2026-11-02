/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import Box from "@mui/material/Box";
import React from "react";
import { InView } from "react-intersection-observer";

import type { IVaultGridProps } from "../../../containers/iVaultGrid/IVaultGrid";
import {
  DEFAULT_PAGE_SIZE,
  useIVaultData,
} from "../../../containers/iVaultGrid/useIVaultData";
import { IVaultFavoritesProvider } from "../../../contexts/IVaultFavoritesContext";
import {
  type AccessTokenProvider,
  type ApiOverrides,
  type IVaultFull,
  DataStatus,
  IVaultSortOptions,
} from "../../../types";
import { _mergeStrings } from "../../../utils/_apiOverrides";
import {
  type CardActionsItemMUI,
  MoreActionsMenuItemMUI,
  resolveCardActionsItemsMUI,
} from "../../../utils/_buildMenuOptions";
import {
  addIVaultToRecents,
  removeIVaultFromRecents,
} from "../../../utils/iVaultApi";
import { BaseCardLoading } from "../../components/baseCard/BaseCardLoading";
import { NoResultsMUI as NoResults } from "../../components/noResults/NoResultsMUI";
import { type IVaultTableOverridesMUI } from "../../types";
import { stripNonTileProps } from "../../utils/stripNonTileProps";
import {
  type IVaultTileMUIProps,
  IVaultTileMUI,
} from "../iVaultTiles/IVaultTileMUI";
import { clientSideIVaultSort } from "./clientSideIVaultSort";
import { type IVaultTableMUIStrings, IVaultTableMUI } from "./IVaultTableMUI";

/**
 * Localized strings for the MUI IVaultGrid. Extends the table-level strings
 * with the grid-level messages used for empty, error, and authentication states.
 * @alpha
 */
export interface IVaultGridStringsMUI extends IVaultTableMUIStrings {
  /** Displayed after successful fetch, but no iVaults are returned. */
  noIVaults: string;
  /** Displayed when the component is mounted and there is no szewTwin or asset Id. */
  noContext: string;
  /** Displayed when the component is mounted but the accessToken is empty. */
  noAuthentication: string;
  /** Generic message displayed if an error occurs while fetching. */
  error: string;
  /** Displayed after successful fetch search, but no iVault is returned, along with noIVaultSearch text. */
  noIVaultSearchSubtext: string;
  /** Displayed in context menu for removing iVault from recents. */
  removeFromRecents: string;
}

/** @alpha */
export interface IVaultGridMUIProps
  extends Omit<
    IVaultGridProps,
    | "onThumbnailClick"
    | "iVaultActions"
    | "useIndividualState"
    | "tileOverrides"
    | "cellOverrides"
    | "tableOverrides"
    | "status"
    | "removeFromRecentsIcon"
    | "onOpen"
  > {
  /**
   * Factory that returns actions for a given iVault.
   *
   * - **Single action** — the tile title becomes a clickable link; a table row click fires the action.
   * - **Multiple actions** — rendered as buttons in the tile footer; the first action still drives table row click.
   *
   * The grid automatically wraps the first action with recents tracking
   * unless `disableAddToRecents` is true.
   *
   * @example
   * ```tsx
   * actions={[
   *   { key: "open", label: (iVault) => iVault.displayName, onClick: (iVault) => navigate(`/ivaults/${iVault.id}`) },
   * ]}
   * ```
   */
  actions?: CardActionsItemMUI<IVaultFull>[];
  /** List of actions to build for each ivault context menu. */
  moreActions?: MoreActionsMenuItemMUI<IVaultFull>[];
  /** Custom icon for the "Remove from recents" context menu action. Only applies when requestType is "recents". Should be a Stratakit SVG href. */
  removeFromRecentsIcon?: string;
  useIndividualState?: (
    iVault: IVaultFull,
    iVaultTileProps: IVaultTileMUIProps
  ) => Partial<IVaultTileMUIProps>;
  /** Static props to apply over each tile, mainly used for tileProps, overrides IVaultGrid provided values */
  tileOverrides?: Partial<IVaultTileMUIProps>;
  tableOverrides?: IVaultTableOverridesMUI;
  stringsOverrides?: Partial<IVaultGridStringsMUI>;
}

/**
 * Component to display a grid or table of iVaults within a given szewTwin.
 *
 * This is the Stratakit/MUI version of the IVaultGrid. It is still under active development and may have breaking changes.
 *
 * Feedback is most welcome.
 * @alpha
 */
export const IVaultGridMUI = (props: IVaultGridMUIProps) => {
  return (
    <IVaultFavoritesProvider
      szewTwinId={props.szewTwinId}
      accessToken={props.accessToken}
      serverEnvironmentPrefix={props.apiOverrides?.serverEnvironmentPrefix}
      disabled={props.tileOverrides?.hideFavoriteIcon}
    >
      <IVaultGridInternal {...props} />
    </IVaultFavoritesProvider>
  );
};
const IVaultGridInternal = ({
  accessToken,
  apiOverrides,
  moreActions,
  removeFromRecentsIcon,
  actions,
  szewTwinId,
  sortOptions = { sortType: "name", descending: false },
  requestType,
  stringsOverrides,
  tileOverrides,
  useIndividualState,
  postProcessCallback,
  emptyStateComponent,
  searchText,
  viewMode,
  pageSize,
  maxCount,
  tableOverrides,
  className,
  onLoadMore,
  onRefetch,
  dataMode = "internal",
  disableAddToRecents = false,
}: IVaultGridMUIProps) => {
  const [sort, setSort] = React.useState<IVaultSortOptions>(sortOptions);

  React.useEffect(() => {
    setSort(
      viewMode === "cells"
        ? {
            sortType: "name",
            descending: false,
          }
        : {
            sortType: sortOptions.sortType,
            descending: sortOptions.descending,
          }
    );
  }, [sortOptions.descending, sortOptions.sortType, viewMode]);

  const strings = React.useMemo(
    () =>
      _mergeStrings(
        {
          tableColumnFavorites: "",
          tableColumnName: "Name",
          tableColumnDescription: "Description",
          tableColumnLastModified: "Last Modified",
          tableLoadingData: "Loading...",
          noIVaultSearch: "No results found",
          noIVaultSearchSubtext:
            "Try adjusting your search by using fewer or more general terms.",
          noIVaults:
            requestType === "recents"
              ? "There are no recent iVaults."
              : requestType === "favorites"
              ? "There are no favorite iVaults."
              : "There are no iVaults in this szewTwin.",
          noContext: "No context provided",
          noAuthentication: "No access token provided",
          error: "An error occurred",
          addToFavorites: "Add to favorites",
          removeFromFavorites: "Remove from favorites",
          removeFromRecents: "Remove from recents",
          moreOptions: "More options",
          noRowsLabel: "No rows",
          noResultsOverlayLabel: "No results found.",
          paginationRowsPerPage: "Rows per page:",
          footerRowSelected: (count: number): React.ReactNode =>
            count !== 1
              ? `${count.toLocaleString()} rows selected`
              : `${count.toLocaleString()} row selected`,
          footerTotalVisibleRows: (
            visibleCount: number,
            totalCount: number
          ): React.ReactNode =>
            `${visibleCount.toLocaleString()} of ${totalCount.toLocaleString()}`,
        },
        stringsOverrides
      ),
    [requestType, stringsOverrides]
  );

  const enhancedMoreActions = React.useMemo(() => {
    // Add "Remove from recents" action when viewing recents
    if (requestType === "recents") {
      const action = removeFromRecentsAction(
        strings,
        accessToken,
        apiOverrides,
        removeFromRecentsIcon
      );
      return moreActions ? [action, ...moreActions] : [action];
    }
    return moreActions;
  }, [
    requestType,
    moreActions,
    strings,
    removeFromRecentsIcon,
    accessToken,
    apiOverrides,
  ]);

  const {
    iVaults: fetchediVaults,
    status: fetchStatus,
    fetchMore,
    refetchIVaults,
  } = useIVaultData({
    requestType,
    accessToken,
    apiOverrides,
    szewTwinId,
    sortOptions: sort,
    searchText,
    maxCount,
    pageSize,
    viewMode,
    dataMode,
    onLoadMore,
    onRefetch,
  });

  const iVaults = React.useMemo(() => {
    const processed =
      postProcessCallback?.([...fetchediVaults], fetchStatus, searchText) ??
      fetchediVaults;
    return clientSideIVaultSort(processed, { viewMode, requestType, sort });
  }, [
    postProcessCallback,
    fetchediVaults,
    fetchStatus,
    searchText,
    viewMode,
    requestType,
    sort,
  ]);

  React.useEffect(() => {
    if (
      iVaults.length < (pageSize ?? DEFAULT_PAGE_SIZE) &&
      fetchMore &&
      fetchStatus !== DataStatus.Fetching
    ) {
      fetchMore();
    }
  }, [iVaults.length, pageSize, fetchMore, fetchStatus]);

  const iVaultClickAndAddToRecents = React.useCallback(
    async (iVault: IVaultFull, clickFn: () => void) => {
      if (!accessToken || disableAddToRecents) {
        clickFn();
        return;
      }

      void addIVaultToRecents({
        iVaultId: iVault.id,
        accessToken,
        serverEnvironmentPrefix: apiOverrides?.serverEnvironmentPrefix,
      }).catch((e) => {
        // swallow errors to avoid disrupting the UI
        console.error("Failed to add iVault to recents", e);
      });
      clickFn();
    },
    [accessToken, disableAddToRecents, apiOverrides?.serverEnvironmentPrefix]
  );

  const noResultsText = {
    [DataStatus.Fetching]: "",
    [DataStatus.Complete]: strings.noIVaults,
    [DataStatus.FetchFailed]: strings.error,
    [DataStatus.TokenRequired]: strings.noAuthentication,
    [DataStatus.ContextRequired]: strings.noContext,
  }[fetchStatus ?? DataStatus.Fetching];

  const tileApiOverrides = apiOverrides
    ? { serverEnvironmentPrefix: apiOverrides.serverEnvironmentPrefix }
    : undefined;

  const resolveActions = React.useCallback(
    (iVault: IVaultFull) => {
      if (!actions?.length) {
        return [];
      }
      const resolved = resolveCardActionsItemsMUI(actions, iVault);
      if (!resolved.length) {
        return resolved;
      }
      const [first, ...rest] = resolved;
      return [
        {
          ...first,
          onClick: first.onClick
            ? () => iVaultClickAndAddToRecents(iVault, first.onClick!)
            : undefined,
        },
        ...rest,
      ];
    },
    [actions, iVaultClickAndAddToRecents]
  );

  const renderIVaultGridStructure = () => {
    return (
      <>
        {viewMode !== "cells" ? (
          // adding in this alignItems:stretch styling to mimic current iVaultGrid behaviour
          <Box
            component="ul"
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: "repeat(auto-fill, minmax(18rem, 1fr))",
              listStyle: "none",
              alignItems: "stretch",
              "& > li": {
                display: "flex",
                minWidth: 0,
              },
              "& > li > *": {
                flex: 1,
                minWidth: 0,
              },
              p: 0,
              m: 0,
            }}
            className={className}
            data-testid="ivault-grid"
          >
            {iVaults?.map((iVault) => (
              <li key={iVault.id}>
                <IVaultHookedTile
                  iVault={iVault}
                  moreActions={enhancedMoreActions}
                  accessToken={accessToken}
                  apiOverrides={tileApiOverrides}
                  useTileState={useIndividualState}
                  refetchIVaults={refetchIVaults}
                  stringsOverrides={stringsOverrides}
                  {...tileOverrides}
                  actions={resolveActions(iVault)}
                />
              </li>
            ))}
            {fetchMore ? (
              <li>
                <InView
                  onChange={(inView) => {
                    inView &&
                      fetchStatus !== DataStatus.Fetching &&
                      fetchMore();
                  }}
                >
                  {({ ref }) => {
                    return <BaseCardLoading ref={ref} />;
                  }}
                </InView>
              </li>
            ) : null}
            {fetchStatus === DataStatus.Fetching && (
              <>
                <li>
                  <BaseCardLoading />
                </li>
                <li>
                  <BaseCardLoading />
                </li>
              </>
            )}
          </Box>
        ) : (
          <IVaultTableMUI
            iVaults={iVaults}
            moreActions={enhancedMoreActions}
            actions={actions ? resolveActions : undefined}
            strings={strings}
            refetchIVaults={refetchIVaults}
            tableOverrides={tableOverrides}
            isLoading={fetchStatus === DataStatus.Fetching}
            fetchMore={fetchMore}
            data-testid="ivault-table"
          />
        )}
      </>
    );
  };

  const renderComponent = () => {
    if (
      !searchText &&
      iVaults.length === 0 &&
      noResultsText === strings.noIVaults &&
      emptyStateComponent
    ) {
      return <>{emptyStateComponent}</>;
    }
    if (!searchText && iVaults.length === 0 && noResultsText) {
      return <NoResults text={noResultsText} />;
    }
    if (
      searchText &&
      iVaults.length === 0 &&
      fetchStatus !== DataStatus.Fetching
    ) {
      return (
        <NoResults
          text={strings.noIVaultSearch}
          subtext={strings.noIVaultSearchSubtext}
          isSearchResult
        />
      );
    }
    return renderIVaultGridStructure();
  };
  return renderComponent();
};

type IVaultHookedTileProps = IVaultTileMUIProps & {
  useTileState?: (
    iVault: IVaultFull,
    iVaultTileProps: IVaultTileMUIProps
  ) => Partial<IVaultTileMUIProps>;
};
const noOp = () => ({} as Partial<IVaultTileMUIProps>);

const IVaultHookedTile = (props: IVaultHookedTileProps) => {
  const { useTileState = noOp, ...rest } = props;

  const hookIdentity = React.useRef(useTileState);

  if (hookIdentity.current !== useTileState) {
    throw new Error(
      "Even when used in a prop, useIndividualState identity must remain stable as it is used as a hook."
    );
  }

  const tileProps = stripNonTileProps(rest);
  const tileState = stripNonTileProps(useTileState(props.iVault, rest));
  return <IVaultTileMUI {...tileProps} {...tileState} />;
};

function removeFromRecentsAction(
  strings: IVaultGridProps["stringsOverrides"],
  accessToken?: AccessTokenProvider,
  apiOverrides?: ApiOverrides<IVaultFull[]>,
  removeFromRecentsIcon?: string
): MoreActionsMenuItemMUI<IVaultFull> {
  return {
    key: "remove-from-recents",
    icon: removeFromRecentsIcon,
    label: strings?.removeFromRecents ?? "Remove from recents",
    onClick: async (iVault, refetchData) => {
      if (!iVault || !accessToken) {
        return;
      }

      await removeIVaultFromRecents({
        iVaultId: iVault.id,
        accessToken,
        serverEnvironmentPrefix: apiOverrides?.serverEnvironmentPrefix,
      });
      refetchData?.();
    },
  };
}
