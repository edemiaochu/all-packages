/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import "./SZEWTwinGrid.scss";

import { Table, ThemeProvider } from "@szewtwin/szewtwinui-react";
import React from "react";
import { InView } from "react-intersection-observer";

import { GridStructure } from "../../components/gridStructure/GridStructure";
import { NoResults } from "../../components/noResults/NoResults";
import {
  AccessTokenProvider,
  ApiOverrides,
  DataStatus,
  SZEWTwinCellOverrides,
  SZEWTwinFilterOptions,
  SZEWTwinFull,
  SZEWTwinSubClass,
  ViewType,
} from "../../types";
import { _mergeStrings } from "../../utils/_apiOverrides";
import { ContextMenuBuilderItem } from "../../utils/_buildMenuOptions";
import { IVaultGhostTile } from "../iVaultTiles/IVaultGhostTile";
import { SZEWTwinTile, SZEWTwinTileProps } from "./SZEWTwinTile";
import { useSZEWTwinData } from "./useSZEWTwinData";
import { useSZEWTwinFavorites } from "./useSZEWTwinFavorites";
import { useSZEWTwinTableConfig } from "./useSZEWTwinTableConfig";

export type IndividualSZEWTwinStateHook = (
  szewTwin: SZEWTwinFull,
  szewTwinTileProps: SZEWTwinTileProps & {
    gridProps: SZEWTwinGridProps;
  }
) => Partial<SZEWTwinTileProps>;

export interface SZEWTwinGridStrings {
  /** Displayed for table favorites header. */
  tableColumnFavorites: string;
  /** Displayed for table name header. */
  tableColumnName: string;
  /** Displayed for table description header. */
  tableColumnDescription: string;
  /** Displayed for table lastModified header. */
  tableColumnLastModified: string;
  /** Displayed on table while loading data. */
  tableLoadingData: string;
  /** Badge text for trial szewTwins */
  trialBadge: string;
  /** Badge text for inactive szewTwins */
  inactiveBadge: string;
  /** Displayed after successful fetch, but no szewTwins are returned. */
  noSZEWTwins: string;
  /** Displayed when the component is mounted but the accessToken is empty. */
  noAuthentication: string;
  /** Generic message displayed if an error occurs while fetching. */
  error: string;
  /** Accessible text for the hollow star icon to add the szewTwin to favorites */
  addToFavorites: string;
  /** Accessible text for the full star icon to remove the szewTwin from favorites */
  removeFromFavorites: string;
}

export interface SZEWTwinGridProps {
  /** Access token that requires the `szewtwins:read` scope. Provide a function that returns the token to prevent the token from expiring. Function must be memoized. */
  accessToken?: AccessTokenProvider;
  /** Type of szewTwin to request */
  requestType?: "favorites" | "recents" | "";
  /** Sub class of szewTwin, defaults to Project */
  szewTwinSubClass?: SZEWTwinSubClass;
  /** Thumbnail click handler. */
  onThumbnailClick?(szewTwin: SZEWTwinFull): void;
  /** String/function that configure szewTwin filtering behavior.
   * A string will filter on displayed text only ().
   * A function allow filtering on anything, is used in a normal array.filter.
   */
  filterOptions?: SZEWTwinFilterOptions;
  /**
   * Set the `$orderby` parameter when fetching szewTwins from the szewTwin API, e.g. `displayName ASC`.
   * This only has an effect when the `requestType` is empty - it does not apply to "favorites" or "recents".
   * See https://developer.szewec.com/apis/szewtwins/operations/get-my-szewtwins/#odata-queries for details.
   */
  orderbyOptions?: string;
  /** List of actions to build for each szewTwin context menu. */
  szewTwinActions?: ContextMenuBuilderItem<SZEWTwinFull>[];
  /** Function (can be a react hook) that returns state for an szewTwin, returned values will be applied as props to the szewTwinTile, overrides SZEWTwinGrid provided values */
  useIndividualState?: IndividualSZEWTwinStateHook;
  /** Static props to apply over each tile, mainly used for tileProps, overrides SZEWTwinGrid provided values */
  tileOverrides?: Partial<SZEWTwinTileProps>;
  /** Strings displayed by the browser */
  stringsOverrides?: Partial<SZEWTwinGridStrings>;
  /** Object that configures different overrides for the API.
   * @property `data`: Array of szewTwins used in the grid.
   * @property `serverEnvironmentPrefix`: Either qa or dev.
   */
  apiOverrides?: ApiOverrides<SZEWTwinFull[]>;
  /**
   * Allow final transformation of the szewTwin array before display
   * This function MUST be memoized.
   */
  postProcessCallback?: (
    szewTwins: SZEWTwinFull[],
    fetchStatus: DataStatus | undefined
  ) => SZEWTwinFull[];
  /**szewTwin view mode */
  viewMode?: ViewType;
  /** Overrides for cell rendering in cells viewMode */
  cellOverrides?: SZEWTwinCellOverrides;
  /** Additional class name for the grid structure */
  className?: string;
}

/**
 * Component that will allow displaying a grid of szewTwins, given a requestType
 */
export const SZEWTwinGrid = ({
  accessToken,
  apiOverrides,
  filterOptions,
  orderbyOptions,
  onThumbnailClick,
  szewTwinActions,
  requestType,
  szewTwinSubClass,
  stringsOverrides,
  tileOverrides,
  useIndividualState,
  postProcessCallback,
  viewMode,
  cellOverrides,
  className,
}: SZEWTwinGridProps) => {
  const {
    szewTwinFavorites,
    addSZEWTwinToFavorites,
    removeSZEWTwinFromFavorites,
    shouldRefetchFavorites,
    resetShouldRefetchFavorites,
  } = useSZEWTwinFavorites(accessToken, apiOverrides?.serverEnvironmentPrefix);

  const strings = _mergeStrings(
    {
      tableColumnFavorites: "",
      tableColumnName: "szewTwin Number",
      tableColumnDescription: "szewTwin Name",
      tableColumnLastModified: "Last Modified",
      tableLoadingData: "Loading...",
      trialBadge: "Trial",
      inactiveBadge: "Inactive",
      noSZEWTwins:
        requestType === "recents"
          ? "No recent szewTwins."
          : requestType === "favorites"
          ? "No favorite szewTwins."
          : "No szewTwin found.",
      noAuthentication: "No access token provided",
      error: "An error occurred",
      addToFavorites: "Add to favorites",
      removeFromFavorites: "Remove from favorites",
    },
    stringsOverrides
  );
  const {
    szewTwins: fetchedSZEWtwins,
    status: fetchStatus,
    fetchMore,
    refetchSZEWTwins,
  } = useSZEWTwinData({
    requestType,
    szewTwinSubClass,
    accessToken,
    apiOverrides,
    filterOptions,
    orderbyOptions,
    shouldRefetchFavorites,
    resetShouldRefetchFavorites,
  });

  const szewTwins = React.useMemo(
    () =>
      postProcessCallback?.([...fetchedSZEWtwins], fetchStatus) ?? fetchedSZEWtwins,
    [postProcessCallback, fetchedSZEWtwins, fetchStatus]
  );

  const { columns, onRowClick } = useSZEWTwinTableConfig({
    szewTwinActions,
    onThumbnailClick,
    strings,
    szewTwinFavorites,
    addSZEWTwinToFavorites,
    removeSZEWTwinFromFavorites,
    refetchSZEWTwins,
    cellOverrides,
  });

  const noResultsText = {
    [DataStatus.Fetching]: "",
    [DataStatus.Complete]: strings.noSZEWTwins,
    [DataStatus.FetchFailed]: strings.error,
    [DataStatus.TokenRequired]: strings.noAuthentication,
    [DataStatus.ContextRequired]: "",
  }[fetchStatus ?? DataStatus.Fetching];

  return viewMode !== "cells" ? (
    szewTwins.length === 0 && noResultsText ? (
      <NoResults text={noResultsText} />
    ) : (
      <GridStructure className={className}>
        {fetchStatus === DataStatus.Fetching ? (
          <>
            <IVaultGhostTile fullWidth={tileOverrides?.fullWidth} />
            <IVaultGhostTile fullWidth={tileOverrides?.fullWidth} />
            <IVaultGhostTile fullWidth={tileOverrides?.fullWidth} />
          </>
        ) : (
          <>
            {szewTwins?.map((szewTwin) => (
              <SZEWTwinHookedTile
                gridProps={{
                  accessToken,
                  apiOverrides,
                  filterOptions,
                  onThumbnailClick,
                  requestType,
                  stringsOverrides,
                  tileOverrides,
                  useIndividualState,
                }}
                key={szewTwin.id}
                szewTwin={szewTwin}
                szewTwinOptions={szewTwinActions}
                onThumbnailClick={onThumbnailClick}
                useTileState={useIndividualState}
                isFavorite={szewTwinFavorites.has(szewTwin.id)}
                addToFavorites={addSZEWTwinToFavorites}
                removeFromFavorites={removeSZEWTwinFromFavorites}
                refetchSZEWTwins={refetchSZEWTwins}
                {...tileOverrides}
              />
            ))}
            {fetchMore ? (
              <>
                <InView onChange={fetchMore}>
                  <IVaultGhostTile fullWidth={tileOverrides?.fullWidth} />
                </InView>
                <IVaultGhostTile fullWidth={tileOverrides?.fullWidth} />
                <IVaultGhostTile fullWidth={tileOverrides?.fullWidth} />
              </>
            ) : null}
          </>
        )}
      </GridStructure>
    )
  ) : (
    <ThemeProvider theme="inherit">
      <Table<{ [P in keyof SZEWTwinFull]: SZEWTwinFull[P] }>
        columns={columns}
        data={szewTwins}
        onRowClick={onRowClick}
        emptyTableContent={
          fetchStatus === DataStatus.Fetching
            ? strings.tableLoadingData
            : strings.noSZEWTwins
        }
        isLoading={fetchStatus === DataStatus.Fetching}
        isSortable
        onBottomReached={fetchMore}
        autoResetFilters={false}
        autoResetSortBy={false}
        bodyProps={{ className: onThumbnailClick ? "row-cursor" : "" }}
      />
    </ThemeProvider>
  );
};

type SZEWTwinHookedTileProps = SZEWTwinTileProps & {
  gridProps: SZEWTwinGridProps;
  useTileState?: IndividualSZEWTwinStateHook;
};
const noOp = () => ({} as Partial<SZEWTwinTileProps>);
const SZEWTwinHookedTile = (props: SZEWTwinHookedTileProps) => {
  const { useTileState = noOp, ...szewTwinTileProps } = props;

  const hookIdentity = React.useRef(useTileState);

  if (hookIdentity.current !== useTileState) {
    throw new Error(
      "Even when used in a prop, useTilePropsForIVault identity must remain stable as it is used as a hook."
    );
  }

  const tileState = useTileState(props.szewTwin, szewTwinTileProps);
  return <SZEWTwinTile {...szewTwinTileProps} {...tileState} />;
};
