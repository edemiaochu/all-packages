/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import Box from "@mui/material/Box";
import React from "react";
import { InView } from "react-intersection-observer";

import type {
  SZEWTwinGridProps,
  SZEWTwinGridStrings,
} from "../../../containers/SZEWTwinGrid/SZEWTwinGrid";
import { useSZEWTwinData } from "../../../containers/SZEWTwinGrid/useSZEWTwinData";
import { useSZEWTwinFavorites } from "../../../containers/SZEWTwinGrid/useSZEWTwinFavorites";
import { type SZEWTwinFull, DataStatus } from "../../../types";
import { _mergeStrings } from "../../../utils/_apiOverrides";
import {
  type CardActionsItemMUI,
  MoreActionsMenuItemMUI,
  resolveCardActionsItemsMUI,
} from "../../../utils/_buildMenuOptions";
import { BaseCardLoading } from "../../components/baseCard/BaseCardLoading";
import { NoResultsMUI } from "../../components/noResults/NoResultsMUI";
import { type SZEWTwinTableOverridesMUI } from "../../types";
import { stripNonTileProps } from "../../utils/stripNonTileProps";
import { type SZEWTwinTableMUIStrings, SZEWTwinTableMUI } from "./SZEWTwinTableMUI";
import { type SZEWTwinTilePropsMUI, SZEWTwinTileMUI } from "./SZEWTwinTileMUI";

/** @alpha */
export type IndividualSZEWTwinStateHookMUI = (
  szewTwin: SZEWTwinFull,
  szewTwinTileProps: SZEWTwinTilePropsMUI & {
    gridProps: SZEWTwinGridPropsMUI;
  }
) => Partial<SZEWTwinTilePropsMUI>;

/** @alpha */
export interface SZEWTwinGridStringsMUI
  extends SZEWTwinGridStrings,
    SZEWTwinTableMUIStrings {}

/** @alpha */
export interface SZEWTwinGridPropsMUI
  extends Omit<
    SZEWTwinGridProps,
    | "onThumbnailClick"
    | "szewTwinActions"
    | "tileOverrides"
    | "useIndividualState"
    | "cellOverrides"
    | "tableOverrides"
    | "stringsOverrides"
    | "status"
    | "onOpen"
  > {
  /**
   * Factory that returns actions for a given szewTwin.
   *
   * - **Single action** — the tile title becomes a clickable link; a table row click fires the action.
   * - **Multiple actions** — rendered as buttons in the tile footer; the first action still drives table row click.
   *
   * @example
   * ```tsx
   * actions={[
   *   { key: "open", label: (szewTwin) => szewTwin.displayName, onClick: (szewTwin) => navigate(`/szewtwins/${szewTwin.id}`) },
   * ]}
   * ```
   */
  actions?: CardActionsItemMUI<SZEWTwinFull>[];
  /** List of actions to build for each szewTwin context menu. */
  moreActions?: MoreActionsMenuItemMUI<SZEWTwinFull>[];
  /** Function (can be a react hook) that returns state for an szewTwin, returned values will be applied as props to the szewTwinTile, overrides SZEWTwinGrid provided values */
  useIndividualState?: IndividualSZEWTwinStateHookMUI;
  /** Static props to apply over each tile, mainly used for tileProps, overrides SZEWTwinGrid provided values */
  tileOverrides?: Partial<SZEWTwinTilePropsMUI>;
  /** Overrides for table column definitions and visibility in cells viewMode */
  tableOverrides?: SZEWTwinTableOverridesMUI;
  /** Localized string overrides - falls back to default English strings if not provided */
  stringsOverrides?: Partial<SZEWTwinGridStringsMUI>;
}

/**
 * Component that will allow displaying a grid of szewTwins, given a requestType
 * @alpha
 */
export const SZEWTwinGridMUI = ({
  accessToken,
  apiOverrides,
  filterOptions,
  orderbyOptions,
  actions,
  moreActions,
  requestType,
  szewTwinSubClass,
  stringsOverrides,
  tileOverrides,
  useIndividualState,
  postProcessCallback,
  viewMode,
  tableOverrides,
  className,
}: SZEWTwinGridPropsMUI) => {
  const {
    szewTwinFavorites,
    addSZEWTwinToFavorites,
    removeSZEWTwinFromFavorites,
    shouldRefetchFavorites,
    resetShouldRefetchFavorites,
  } = useSZEWTwinFavorites(accessToken, apiOverrides?.serverEnvironmentPrefix);

  const strings = React.useMemo(
    () =>
      _mergeStrings(
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
              : "No szewTwins found.",
          noAuthentication: "No access token provided",
          error: "An error occurred",
          addToFavorites: "Add to favorites",
          removeFromFavorites: "Remove from favorites",
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

  const noResultsText = {
    [DataStatus.Fetching]: "",
    [DataStatus.Complete]: strings.noSZEWTwins,
    [DataStatus.FetchFailed]: strings.error,
    [DataStatus.TokenRequired]: strings.noAuthentication,
    [DataStatus.ContextRequired]: "",
  }[fetchStatus ?? DataStatus.Fetching];

  if (szewTwins.length === 0 && noResultsText) {
    return <NoResultsMUI text={noResultsText} />;
  }

  return viewMode !== "cells" ? (
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
    >
      {fetchStatus === DataStatus.Fetching ? (
        <>
          <li>
            <BaseCardLoading />
          </li>
          <li>
            <BaseCardLoading />
          </li>
          <li>
            <BaseCardLoading />
          </li>
        </>
      ) : (
        <>
          {szewTwins?.map((szewTwin) => (
            <li key={szewTwin.id}>
              <SZEWTwinHookedTile
                gridProps={{
                  accessToken,
                  apiOverrides,
                  filterOptions,
                  actions,
                  requestType,
                  stringsOverrides,
                  tileOverrides,
                  useIndividualState,
                }}
                szewTwin={szewTwin}
                moreActions={moreActions}
                actions={
                  actions
                    ? resolveCardActionsItemsMUI(actions, szewTwin)
                    : undefined
                }
                useTileState={useIndividualState}
                isFavorite={szewTwinFavorites.has(szewTwin.id)}
                addToFavorites={addSZEWTwinToFavorites}
                removeFromFavorites={removeSZEWTwinFromFavorites}
                refetchSZEWTwins={refetchSZEWTwins}
                stringsOverrides={stringsOverrides}
                thumbnail={szewTwin.image} // This is a fix for https://github.com/szewTwin/admin-components-react/issues/196
                {...tileOverrides}
              />
            </li>
          ))}
          {fetchMore ? (
            <>
              <li>
                <InView
                  onChange={(inView) => {
                    inView && fetchMore();
                  }}
                >
                  <BaseCardLoading />
                </InView>
              </li>
              <li>
                <BaseCardLoading />
              </li>
              <li>
                <BaseCardLoading />
              </li>
            </>
          ) : null}
        </>
      )}
    </Box>
  ) : (
    <SZEWTwinTableMUI
      szewTwins={szewTwins}
      moreActions={moreActions}
      actions={
        actions
          ? (szewTwin: SZEWTwinFull) => resolveCardActionsItemsMUI(actions, szewTwin)
          : undefined
      }
      strings={strings}
      szewTwinFavorites={szewTwinFavorites}
      addSZEWTwinToFavorites={addSZEWTwinToFavorites}
      removeSZEWTwinFromFavorites={removeSZEWTwinFromFavorites}
      refetchSZEWTwins={refetchSZEWTwins}
      tableOverrides={tableOverrides}
      isLoading={fetchStatus === DataStatus.Fetching}
      fetchMore={fetchMore}
    />
  );
};

type SZEWTwinHookedTileProps = SZEWTwinTilePropsMUI & {
  gridProps: SZEWTwinGridPropsMUI;
  useTileState?: IndividualSZEWTwinStateHookMUI;
};
const noOp = () => ({} as Partial<SZEWTwinTilePropsMUI>);
const SZEWTwinHookedTile = (props: SZEWTwinHookedTileProps) => {
  const { useTileState = noOp, ...rest } = props;

  const hookIdentity = React.useRef(useTileState);

  if (hookIdentity.current !== useTileState) {
    throw new Error(
      "Even when used in a prop, useIndividualState identity must remain stable as it is used as a hook."
    );
  }

  const tileProps = stripNonTileProps(rest);
  const tileState = stripNonTileProps(useTileState(props.szewTwin, rest));
  return <SZEWTwinTileMUI {...tileProps} {...tileState} />;
};
