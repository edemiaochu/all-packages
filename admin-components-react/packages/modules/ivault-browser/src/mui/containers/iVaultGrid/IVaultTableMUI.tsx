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

import { useIVaultFavoritesContext } from "../../../contexts/IVaultFavoritesContext";
import { type IVaultFull, IVaultCellColumn } from "../../../types";
import {
  type MoreActionsMenuItemMUI,
  type ResolvedCardActionItem,
  getPrimaryCardAction,
  resolveMoreActionsMenuItemsMUI,
} from "../../../utils/_buildMenuOptions";
import { formatDate } from "../../../utils/formatDate";
import MoreMenuMUI from "../../components/MoreMenuMUI";
import { FavoriteIconMUI } from "../../components/tileFavoriteIcon/FavoriteIconMUI";
import { type IVaultTableOverridesMUI } from "../../types";

const EMPTY_COLUMN_OVERRIDES: NonNullable<
  IVaultTableOverridesMUI["columnOverrides"]
> = {};
const EMPTY_HIDE_COLUMNS: NonNullable<IVaultTableOverridesMUI["hideColumns"]> =
  [];

type MuiDataGridStrings = Pick<
  typeof GRID_DEFAULT_LOCALE_TEXT,
  | "noRowsLabel"
  | "noResultsOverlayLabel"
  | "footerRowSelected"
  | "footerTotalVisibleRows"
  | "paginationRowsPerPage"
>;

export interface IVaultTableMUIStrings extends MuiDataGridStrings {
  tableColumnName: string;
  tableColumnDescription: string;
  tableColumnLastModified: string;
  tableColumnFavorites: string;
  tableLoadingData: string;
  noIVaultSearch: string;
  addToFavorites: string;
  removeFromFavorites: string;
  moreOptions: string;
}

export interface IVaultTableMUIProps {
  iVaults: IVaultFull[];
  moreActions?: MoreActionsMenuItemMUI<IVaultFull>[];
  /** Factory that returns per-row actions. The first action drives row click. */
  actions?: (iVault: IVaultFull) => ResolvedCardActionItem[];
  strings: IVaultTableMUIStrings;
  refetchIVaults: () => void;
  tableOverrides?: IVaultTableOverridesMUI;
  isLoading?: boolean;
  /** Called when more data should be loaded. */
  fetchMore?: (() => void) | false;
}

/**
 * Table view for iVaults using MUI X DataGrid (Community edition).
 */
export const IVaultTableMUI = ({
  iVaults,
  moreActions,
  actions,
  strings,
  refetchIVaults,
  tableOverrides: {
    columnOverrides = EMPTY_COLUMN_OVERRIDES,
    hideColumns = EMPTY_HIDE_COLUMNS,
  } = {},
  isLoading,
  fetchMore,
}: IVaultTableMUIProps) => {
  // Eagerly load all available data so the table has the full dataset
  // for client-side pagination and sorting.
  React.useEffect(() => {
    if (fetchMore) {
      fetchMore();
    }
  }, [fetchMore]);
  const favoritesContext = useIVaultFavoritesContext();

  const columns = React.useMemo<GridColDef<IVaultFull>[]>(() => {
    const cols: (GridColDef<IVaultFull> | false)[] = [
      !hideColumns.includes(IVaultCellColumn.Favorite) && {
        field: "id",
        headerName: strings.tableColumnFavorites,
        sortable: false,
        width: 70,
        disableColumnMenu: true,
        renderCell: (params) => {
          const isFavorite = favoritesContext?.favorites.has(params.value);
          return (
            <FavoriteIconMUI
              isFavorite={!!isFavorite}
              addLabel={strings.addToFavorites}
              removeLabel={strings.removeFromFavorites}
              onAddToFavorites={() => favoritesContext?.add?.(params.value)}
              onRemoveFromFavorites={() =>
                favoritesContext?.remove?.(params.value)
              }
              transparent
              tabIndex={params.tabIndex}
            />
          );
        },
        ...columnOverrides[IVaultCellColumn.Favorite],
      },
      !hideColumns.includes(IVaultCellColumn.Name) && {
        field: "name",
        headerName: strings.tableColumnName,
        flex: 1,
        minWidth: 200,
        disableColumnMenu: true,
        valueGetter: (_value: string | undefined, row: IVaultFull) =>
          row.name ?? row.displayName ?? "",
        ...columnOverrides[IVaultCellColumn.Name],
      },
      !hideColumns.includes(IVaultCellColumn.Description) && {
        field: "description",
        headerName: strings.tableColumnDescription,
        flex: 1,
        minWidth: 200,
        sortable: false,
        disableColumnMenu: true,
        ...columnOverrides[IVaultCellColumn.Description],
      },
      !hideColumns.includes(IVaultCellColumn.LastModified) &&
        !hideColumns.includes(IVaultCellColumn.CreatedDateTime) && {
          field: "lastChangesetPushDateTime",
          headerName: strings.tableColumnLastModified,
          width: 200,
          valueGetter: (value: string | null | undefined, row: IVaultFull) =>
            row.lastChangesetPushDateTime ?? row.createdDateTime ?? "",
          valueFormatter: (value: string) => formatDate(value),
          disableColumnMenu: true,
          ...columnOverrides[IVaultCellColumn.LastModified],
        },
      !hideColumns.includes(IVaultCellColumn.Options) && {
        field: "actions",
        headerName: "",
        sortable: false,
        width: 50,
        disableColumnMenu: true,
        renderCell: (params) => {
          if (!moreActions || moreActions.length === 0) {
            return null;
          }
          const items = resolveMoreActionsMenuItemsMUI(
            moreActions,
            params.row,
            refetchIVaults
          );
          return (
            <MoreMenuMUI
              items={items}
              label={strings.moreOptions}
              prompt={<Icon href={svgMore} />}
              tabIndex={params.tabIndex}
            />
          );
        },
        ...columnOverrides[IVaultCellColumn.Options],
      },
    ];

    return cols.filter(Boolean) as GridColDef<IVaultFull>[];
  }, [
    strings,
    favoritesContext,
    columnOverrides,
    hideColumns,
    moreActions,
    refetchIVaults,
  ]);

  return (
    <DataGrid<IVaultFull>
      rows={iVaults}
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
          "& .MuiDataGrid-row.row-disabled": {
            cursor: "default",
            color: "var(--stratakit-color-text-neutral-disabled)",
          },
        }),
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
