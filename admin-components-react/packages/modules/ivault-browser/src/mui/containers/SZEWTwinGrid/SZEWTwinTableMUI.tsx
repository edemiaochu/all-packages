/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  DataGrid,
  GRID_DEFAULT_LOCALE_TEXT,
  GridColDef,
} from "@mui/x-data-grid";
import svgMore from "@stratakit/icons/more-vertical.svg";
import { Icon } from "@stratakit/mui";
import React from "react";

import { SZEWTwinCellColumn, SZEWTwinFull } from "../../../types";
import {
  type MoreActionsMenuItemMUI,
  type ResolvedCardActionItem,
  getPrimaryCardAction,
  resolveMoreActionsMenuItemsMUI,
} from "../../../utils/_buildMenuOptions";
import { formatDate } from "../../../utils/formatDate";
import MoreMenuMUI from "../../components/MoreMenuMUI";
import { FavoriteIconMUI } from "../../components/tileFavoriteIcon/FavoriteIconMUI";
import { type SZEWTwinTableOverridesMUI } from "../../types";

const EMPTY_COLUMN_OVERRIDES: NonNullable<
  SZEWTwinTableOverridesMUI["columnOverrides"]
> = {};
const EMPTY_HIDE_COLUMNS: NonNullable<SZEWTwinTableOverridesMUI["hideColumns"]> =
  [];

// strings from data grid that we need to override in addition to our custom strings
type MuiDataGridStrings = Pick<
  typeof GRID_DEFAULT_LOCALE_TEXT,
  | "noRowsLabel"
  | "noResultsOverlayLabel"
  | "footerRowSelected"
  | "footerTotalVisibleRows"
  | "paginationRowsPerPage"
>;

export interface SZEWTwinTableMUIStrings extends MuiDataGridStrings {
  tableColumnName: string;
  tableColumnDescription: string;
  tableColumnLastModified: string;
  tableColumnFavorites: string;
  tableLoadingData: string;
  noSZEWTwins: string;
  addToFavorites: string;
  removeFromFavorites: string;
  moreOptions: string;
}

export interface SZEWTwinTableMUIProps {
  szewTwins: SZEWTwinFull[];
  moreActions?: MoreActionsMenuItemMUI<SZEWTwinFull>[];
  /** Factory that returns per-row actions. The first action drives row click. */
  actions?: (szewTwin: SZEWTwinFull) => ResolvedCardActionItem[];
  strings: SZEWTwinTableMUIStrings;
  szewTwinFavorites: Set<string>;
  addSZEWTwinToFavorites: (szewTwinId: string) => Promise<void>;
  removeSZEWTwinFromFavorites: (szewTwinId: string) => Promise<void>;
  refetchSZEWTwins: () => void;
  tableOverrides?: SZEWTwinTableOverridesMUI;
  isLoading?: boolean;
  /** Called when more data should be loaded. */
  fetchMore?: (() => void) | false;
}

/**
 * Table view for szewTwins using MUI X DataGrid (Community edition).
 */
export const SZEWTwinTableMUI = ({
  szewTwins,
  moreActions,
  actions,
  strings,
  szewTwinFavorites,
  addSZEWTwinToFavorites,
  removeSZEWTwinFromFavorites,
  refetchSZEWTwins,
  tableOverrides: {
    columnOverrides = EMPTY_COLUMN_OVERRIDES,
    hideColumns = EMPTY_HIDE_COLUMNS,
  } = {},
  isLoading,
  fetchMore,
}: SZEWTwinTableMUIProps) => {
  // Eagerly load all available data so the table has the full dataset
  // for client-side pagination and sorting.
  React.useEffect(() => {
    if (fetchMore) {
      fetchMore();
    }
  }, [fetchMore]);
  const columns = React.useMemo<GridColDef<SZEWTwinFull>[]>(() => {
    const cols: (GridColDef<SZEWTwinFull> | false)[] = [
      !hideColumns.includes(SZEWTwinCellColumn.Favorite) && {
        field: "id",
        headerName: strings.tableColumnFavorites,
        sortable: false,
        width: 70,
        disableColumnMenu: true,
        renderCell: (params) => {
          const isFavorite = szewTwinFavorites.has(params.value);
          return (
            <FavoriteIconMUI
              isFavorite={isFavorite}
              addLabel={strings.addToFavorites}
              removeLabel={strings.removeFromFavorites}
              onAddToFavorites={() => addSZEWTwinToFavorites(params.value)}
              onRemoveFromFavorites={() =>
                removeSZEWTwinFromFavorites(params.value)
              }
              transparent
              tabIndex={params.tabIndex}
            />
          );
        },
        ...columnOverrides[SZEWTwinCellColumn.Favorite],
      },
      !hideColumns.includes(SZEWTwinCellColumn.Number) && {
        field: "number",
        headerName: strings.tableColumnName,
        flex: 1,
        minWidth: 200,
        disableColumnMenu: true,
        ...columnOverrides[SZEWTwinCellColumn.Number],
      },
      !hideColumns.includes(SZEWTwinCellColumn.Name) && {
        field: "displayName",
        headerName: strings.tableColumnDescription,
        flex: 1,
        minWidth: 200,
        disableColumnMenu: true,
        ...columnOverrides[SZEWTwinCellColumn.Name],
      },
      !hideColumns.includes(SZEWTwinCellColumn.LastModified) && {
        field: "lastModifiedDateTime",
        headerName: strings.tableColumnLastModified,
        width: 200,
        disableColumnMenu: true,
        valueFormatter: (value: string) => formatDate(value),
        ...columnOverrides[SZEWTwinCellColumn.LastModified],
      },
      !hideColumns.includes(SZEWTwinCellColumn.Options) && {
        field: "actions",
        headerName: "",
        sortable: false,
        width: 65,
        disableColumnMenu: true,
        renderCell: (params) => {
          if (!moreActions || moreActions.length === 0) {
            return null;
          }
          const items = resolveMoreActionsMenuItemsMUI(
            moreActions,
            params.row,
            refetchSZEWTwins
          );
          return (
            <MoreMenuMUI
              items={items}
              prompt={<Icon href={svgMore} />}
              label={strings.moreOptions}
              tabIndex={params.tabIndex}
            />
          );
        },
        ...columnOverrides[SZEWTwinCellColumn.Options],
      },
    ];

    return cols.filter(Boolean) as GridColDef<SZEWTwinFull>[];
  }, [
    strings,
    szewTwinFavorites,
    addSZEWTwinToFavorites,
    removeSZEWTwinFromFavorites,
    columnOverrides,
    hideColumns,
    moreActions,
    refetchSZEWTwins,
  ]);

  return (
    <DataGrid<SZEWTwinFull>
      rows={szewTwins}
      columns={columns}
      loading={isLoading}
      onRowClick={
        actions
          ? (params) => {
              const action = getPrimaryCardAction(actions(params.row));
              if (action && !action.disabled) {
                action.onClick?.();
              }
            }
          : undefined
      }
      onCellKeyDown={
        actions
          ? (params, event) => {
              if (
                (event.key === "Enter" || event.key === " ") &&
                params.field !== "id" &&
                params.field !== "actions"
              ) {
                const action = getPrimaryCardAction(actions(params.row));
                if (action && !action.disabled) {
                  event.preventDefault();
                  action.onClick?.();
                }
              }
            }
          : undefined
      }
      disableRowSelectionOnClick
      disableMultipleRowSelection
      disableColumnSelector
      disableColumnFilter
      initialState={{
        pagination: { paginationModel: { pageSize: 25 } },
      }}
      pageSizeOptions={[25, 50, 100]}
      localeText={{
        noRowsLabel: strings.noRowsLabel,
        noResultsOverlayLabel: strings.noResultsOverlayLabel,
        footerRowSelected: strings.footerRowSelected,
        footerTotalVisibleRows: strings.footerTotalVisibleRows,
        paginationRowsPerPage: strings.paginationRowsPerPage,
      }}
      sx={{
        // prevent individual cells from showing focus outlines
        "& .MuiDataGrid-cell:focus:not(:focus-visible)": {
          outline: "none",
        },
        // reveal unfavorited icon on row hover or keyboard focus
        "& .MuiDataGrid-row:hover .favoriteIcon, & .MuiDataGrid-row:focus-within .favoriteIcon":
          {
            opacity: 1,
          },
        ...(actions && {
          "& .MuiDataGrid-row": {
            cursor: "pointer",
          },
        }),
        "& .MuiDataGrid-row.row-disabled": {
          cursor: "default",
          color: "var(--stratakit-color-text-neutral-disabled)",
        },
      }}
      getRowClassName={
        actions
          ? (params) =>
              getPrimaryCardAction(actions(params.row))?.disabled
                ? "row-disabled"
                : ""
          : undefined
      }
    />
  );
};
