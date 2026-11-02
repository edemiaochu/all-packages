/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Table, ThemeProvider } from "@szewtwin/szewtwinui-react";
import React from "react";
import { InView } from "react-intersection-observer";

import { GridStructure } from "../../components/gridStructure/GridStructure";
import { NoResults } from "../../components/noResults/NoResults";
import { IVaultFavoritesProvider } from "../../contexts/IVaultFavoritesContext";
import {
  AccessTokenProvider,
  ApiOverrides,
  DataMode,
  DataStatus,
  IVaultCellOverrides,
  IVaultFull,
  IVaultSortOptions,
  ViewType,
} from "../../types";
import { _mergeStrings } from "../../utils/_apiOverrides";
import { ContextMenuBuilderItem } from "../../utils/_buildMenuOptions";
import {
  addIVaultToRecents,
  removeIVaultFromRecents,
} from "../../utils/iVaultApi";
import { IVaultGhostTile } from "../iVaultTiles/IVaultGhostTile";
import { IVaultTile, IVaultTileProps } from "../iVaultTiles/IVaultTile";
import styles from "./IVaultGrid.module.scss";
import { DEFAULT_PAGE_SIZE, useIVaultData } from "./useIVaultData";
import {
  IVaultTableStrings,
  useIVaultTableConfig,
} from "./useIVaultTableConfig";

export interface IVaultGridProps {
  /**
   * Access token that requires the `ivaults:read` scope. Provide a function that returns the token to prevent the token from expiring. Function must be memoized. */
  accessToken?: AccessTokenProvider;
  /** SZEWTwin Id to list the iVaults from (mutually exclusive to assetId) */
  szewTwinId?: string | undefined;
  /** Type of iVaults to request - "favorites" for user's favorite iVaults, "recents" for recently accessed iVaults, or empty string for all iVaults */
  requestType?: "favorites" | "recents" | "";
  /** Thumbnail click handler. Adds iVault to recents when clicked unless disableAddToRecents is true. */
  onThumbnailClick?(iVault: IVaultFull): void;
  /** When true, prevents automatically adding iVaults to recents when thumbnail is clicked. Default is false. */
  disableAddToRecents?: boolean;
  /** Configure IVault sorting behavior. */
  sortOptions?: IVaultSortOptions;
  /** List of actions to build for each ivault context menu. */
  iVaultActions?: ContextMenuBuilderItem<IVaultFull>[];
  /** Custom icon for the "Remove from recents" context menu action. Only applies when requestType is "recents". */
  removeFromRecentsIcon?: JSX.Element;
  /** Function (can be a react hook) that returns state for an iVault, returned values will be applied as props to the IVaultTile, overrides IVaultGrid provided values */
  useIndividualState?: (
    iVault: IVaultFull,
    iVaultTileProps: IVaultTileProps
  ) => Partial<IVaultTileProps>;
  /** Static props to apply over each tile, mainly used for tileProps, overrides IVaultGrid provided values */
  tileOverrides?: Partial<IVaultTileProps>;
  /** Strings displayed by the browser */
  stringsOverrides?: Partial<IVaultTableStrings> & {
    /** Displayed after successful fetch search, but no iVault is returned. */
    noIVaultSearch?: string;
    /** Displayed after successful fetch, but no iVaults are returned. */
    noIVaults?: string;
    /** Displayed when the component is mounted and there is no szewTwin or asset Id. */
    noContext?: string;
    /** Displayed when the component is mounted but the accessToken is empty. */
    noAuthentication?: string;
    /** Generic message displayed if an error occurs while fetching. */
    error?: string;
    /** Displayed on table while loading data. */
    tableLoadingData?: string;
    /** Displayed after successful fetch search, but no iVault is returned, along with noIVaultSearch text. */
    noIVaultSearchSubtext?: string;
    /** Displayed in context menu for removing iVault from recents. */
    removeFromRecents?: string;
  };
  /** Object that configures different overrides for the API.
   * @property `data`: Array of iVaults used in the grid.
   * @property `isLoading`: Loading state when using consumer-provided data.
   * @property `hasMoreData`: Whether more data is available for infinite scroll (external mode only).
   * @property `serverEnvironmentPrefix`: Either qa or dev.
   */
  apiOverrides?: ApiOverrides<IVaultFull[]>;
  /**
   * Allow final transformation of the iVault array before display
   * This function MUST be memoized.
   */
  postProcessCallback?: (
    iVaults: IVaultFull[],
    fetchStatus: DataStatus | undefined,
    searchText: string | undefined
  ) => IVaultFull[];
  /**Component to show when there is no iVault */
  emptyStateComponent?: React.ReactNode;
  /**  Exact name of the iVault to display */
  searchText?: string;
  /**iVault view mode */
  viewMode?: ViewType;
  /** The maximum number of iVaults that can be fetched per request */
  pageSize?: number;
  /** Maximum number of iVaults to fetch, default is unlimited */
  maxCount?: number;
  /** Overrides for cell rendering in cells viewMode */
  cellOverrides?: IVaultCellOverrides;
  /** Additional class name for the grid structure */
  className?: string;
  /**
   * Specifies how data should be managed.
   * - 'internal': Package handles data fetching internally (default)
   * - 'external': Consumer manages data via apiOverrides.data and isLoading.
   * When using 'external' mode, `accessToken` and `szewTwinId` are not required, as the consumer is responsible for data fetching.
   * Allows for infinite scrolling and data refresh via onLoadMore and onRefetch callbacks.
   */
  dataMode?: DataMode;
  /**
   * Callback function to load more data when using external data mode.
   * Only used when dataMode is set to 'external'. This enables infinite scrolling when you provide data directly from your consumer.
   */
  onLoadMore?: () => void | Promise<void>;
  /**
   * Callback function to refresh data when using external data mode.
   * Only used when dataMode is set to 'external'.
   */
  onRefetch?: () => void | Promise<void>;
}

/**
 * Component that will allow displaying a grid of iVaults, given a contextId
 */
export const IVaultGrid = (props: IVaultGridProps) => {
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

function calculateSort(
  viewMode: ViewType | undefined,
  sortOptions: IVaultSortOptions
): IVaultSortOptions {
  return viewMode === "cells"
    ? {
        sortType: "name",
        descending: false,
      }
    : {
        sortType: sortOptions.sortType,
        descending: sortOptions.descending,
      };
}

function generateStrings(
  requestType: IVaultGridProps["requestType"],
  stringsOverrides?: IVaultGridProps["stringsOverrides"]
) {
  return _mergeStrings(
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
    },
    stringsOverrides
  );
}

const IVaultGridInternal = ({
  accessToken,
  apiOverrides,
  iVaultActions,
  removeFromRecentsIcon,
  onThumbnailClick,
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
  cellOverrides,
  className,
  onLoadMore,
  onRefetch,
  dataMode = "internal",
  disableAddToRecents = false,
}: IVaultGridProps) => {
  const [sort, setSort] = React.useState<IVaultSortOptions>(sortOptions);

  React.useEffect(() => {
    setSort(calculateSort(viewMode, sortOptions));
  }, [sortOptions.descending, sortOptions.sortType, viewMode]);

  const strings = generateStrings(requestType, stringsOverrides);

  // Add "Remove from recents" action when viewing recents
  const enhancedIVaultActions = React.useMemo(() => {
    if (requestType === "recents") {
      const removeFromRecentsAction: ContextMenuBuilderItem<IVaultFull> = {
        key: "remove-from-recents",
        children: strings.removeFromRecents,
        ...(removeFromRecentsIcon && { icon: removeFromRecentsIcon }),
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
      return iVaultActions
        ? [removeFromRecentsAction, ...iVaultActions]
        : [removeFromRecentsAction];
    }
    return iVaultActions;
  }, [
    requestType,
    iVaultActions,
    strings.removeFromRecents,
    removeFromRecentsIcon,
    accessToken,
    apiOverrides?.serverEnvironmentPrefix,
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

  const iVaults = React.useMemo(
    () =>
      postProcessCallback?.([...fetchediVaults], fetchStatus, searchText) ??
      fetchediVaults,
    [postProcessCallback, fetchediVaults, fetchStatus, searchText]
  );

  React.useEffect(() => {
    if (
      iVaults.length < (pageSize ?? DEFAULT_PAGE_SIZE) &&
      fetchMore &&
      fetchStatus !== DataStatus.Fetching
    ) {
      fetchMore();
    }
  }, [iVaults.length, pageSize, fetchMore, fetchStatus]);

  const iVaultClickAndAddToRecents = async (
    iVault: IVaultFull,
    clickFn: () => void
  ) => {
    try {
      if (!accessToken || disableAddToRecents) {
        clickFn();
        return;
      }

      void addIVaultToRecents({
        iVaultId: iVault.id,
        accessToken,
        serverEnvironmentPrefix: apiOverrides?.serverEnvironmentPrefix,
      });
    } catch (e) {
      // swallow errors to avoid disrupting the UI
      console.error("Failed to add iVault to recents", e);
    }
    onThumbnailClick?.(iVault);
  };

  const { columns, onRowClick } = useIVaultTableConfig({
    iVaultActions: enhancedIVaultActions,
    onThumbnailClick: (iVault) =>
      iVaultClickAndAddToRecents(iVault, () => onThumbnailClick?.(iVault)),
    strings,
    refetchIVaults,
    cellOverrides,
  });

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

  const renderIVaultGridStructure = () => {
    return (
      <>
        {viewMode !== "cells" ? (
          <GridStructure className={className}>
            {iVaults?.map((iVault) => (
              <IVaultHookedTile
                key={iVault.id}
                iVault={iVault}
                iVaultOptions={enhancedIVaultActions}
                accessToken={accessToken}
                onThumbnailClick={(iVault) =>
                  iVaultClickAndAddToRecents(iVault, () =>
                    onThumbnailClick?.(iVault)
                  )
                }
                apiOverrides={tileApiOverrides}
                useTileState={useIndividualState}
                refetchIVaults={refetchIVaults}
                {...tileOverrides}
                tileProps={
                  tileOverrides
                    ? {
                        ...tileOverrides.tileProps,
                        onClick: tileOverrides.tileProps?.onClick
                          ? (e) =>
                              iVaultClickAndAddToRecents(iVault, () =>
                                tileOverrides.tileProps?.onClick?.(e)
                              )
                          : undefined,
                      }
                    : undefined
                }
              />
            ))}
            {fetchMore ? (
              <InView
                onChange={(inView) => {
                  inView && fetchStatus !== DataStatus.Fetching && fetchMore();
                }}
              >
                {({ ref }) => {
                  return (
                    <IVaultGhostTile
                      ref={ref}
                      fullWidth={tileOverrides?.fullWidth}
                    />
                  );
                }}
              </InView>
            ) : null}
            {fetchStatus === DataStatus.Fetching && (
              <>
                <IVaultGhostTile fullWidth={tileOverrides?.fullWidth} />
                <IVaultGhostTile fullWidth={tileOverrides?.fullWidth} />
              </>
            )}
          </GridStructure>
        ) : (
          <ThemeProvider theme="inherit">
            <Table<{ [P in keyof IVaultFull]: IVaultFull[P] }>
              columns={columns}
              data={iVaults}
              onRowClick={onRowClick}
              emptyTableContent={
                fetchStatus === DataStatus.Fetching
                  ? strings.tableLoadingData
                  : strings.noIVaultSearch
              }
              isLoading={fetchStatus === DataStatus.Fetching}
              isSortable
              onBottomReached={fetchMore}
              autoResetFilters={false}
              autoResetSortBy={false}
              bodyProps={{
                className: onThumbnailClick ? styles.rowCursor : "",
              }}
            />
          </ThemeProvider>
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

type IVaultHookedTileProps = IVaultTileProps & {
  useTileState?: (
    iVault: IVaultFull,
    iVaultTileProps: IVaultTileProps
  ) => Partial<IVaultTileProps>;
};
const noOp = () => ({} as Partial<IVaultTileProps>);
const IVaultHookedTile = (props: IVaultHookedTileProps) => {
  const { useTileState = noOp, ...iVaultTileProps } = props;

  const hookIdentity = React.useRef(useTileState);

  if (hookIdentity.current !== useTileState) {
    throw new Error(
      "Even when used in a prop, useTilePropsForIVault identity must remain stable as it is used as a hook."
    );
  }

  const tileState = useTileState(props.iVault, iVaultTileProps);
  return <IVaultTile {...iVaultTileProps} {...tileState} />;
};
