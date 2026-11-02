/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { SvgMore, SvgStar, SvgStarHollow } from "@szewtwin/szewtwinui-icons-react";
import { DropdownMenu, IconButton } from "@szewtwin/szewtwinui-react";
import React from "react";
import { useMemo } from "react";
import { CellProps } from "react-table";

import { useIVaultFavoritesContext } from "../../contexts/IVaultFavoritesContext";
import { IVaultCellColumn, IVaultCellOverrides, IVaultFull } from "../../types";
import {
  _buildManagedContextMenuOptions,
  ContextMenuBuilderItem,
} from "../../utils/_buildMenuOptions";

export interface IVaultTableStrings {
  /** Displayed for table name header. */
  tableColumnName: string;
  /** Displayed for table description header. */
  tableColumnDescription: string;
  /** Displayed for table last modified date header. */
  tableColumnLastModified: string;
  /** Displayed for table favorites header. */
  tableColumnFavorites: string;
  /** Text for adding an iVault to favorites. */
  addToFavorites: string;
  /** Text for removing an iVault from favorites. */
  removeFromFavorites: string;
}
export interface useIVaultTableConfigProps {
  iVaultActions: ContextMenuBuilderItem<IVaultFull>[] | undefined;
  onThumbnailClick: ((iVault: IVaultFull) => void) | undefined;
  strings: IVaultTableStrings;
  refetchIVaults: () => void;
  cellOverrides?: IVaultCellOverrides;
}

export const useIVaultTableConfig = ({
  iVaultActions,
  onThumbnailClick,
  strings,
  refetchIVaults,
  cellOverrides = {},
}: useIVaultTableConfigProps) => {
  const favoritesContext = useIVaultFavoritesContext();
  const onRowClick = (_: React.MouseEvent, row: any) => {
    const iVault = row.original as IVaultFull;
    if (!iVault) {
      return;
    }
    onThumbnailClick?.(iVault);
  };

  const columns = useMemo(
    () => [
      {
        Header: "Table",
        columns: [
          {
            id: IVaultCellColumn.Favorite,
            Header: strings.tableColumnFavorites,
            accessor: "id",
            disableSortBy: true,
            width: 70,
            Cell: (props: CellProps<IVaultFull>) => {
              const isFavorite = favoritesContext?.favorites.has(props.value);
              return (
                <IconButton
                  styleType="borderless"
                  aria-label={
                    isFavorite
                      ? strings.removeFromFavorites
                      : strings.addToFavorites
                  }
                  onClick={async (e) => {
                    e.stopPropagation();
                    isFavorite
                      ? await favoritesContext?.remove?.(props.value)
                      : await favoritesContext?.add?.(props.value);
                  }}
                >
                  {isFavorite ? <SvgStar /> : <SvgStarHollow />}
                </IconButton>
              );
            },
          },
          {
            id: IVaultCellColumn.Name,
            Header: strings.tableColumnName,
            accessor: "name",
            maxWidth: 350,
            Cell: (props: CellProps<IVaultFull>) => (
              <div data-tip={props.row.original.name}>
                {cellOverrides.name ? (
                  cellOverrides.name(props)
                ) : (
                  <span>{props.value}</span>
                )}
              </div>
            ),
          },
          {
            id: IVaultCellColumn.Description,
            Header: strings.tableColumnDescription,
            accessor: "description",
            disableSortBy: true,
            Cell: (props: CellProps<IVaultFull>) => (
              <div data-tip={props.row.original.description}>
                {cellOverrides.description ? (
                  cellOverrides.description(props)
                ) : (
                  <span>{props.value}</span>
                )}
              </div>
            ),
          },
          {
            id: IVaultCellColumn.LastModified,
            Header: strings.tableColumnLastModified,
            accessor: (row: IVaultFull) =>
              row.lastChangesetPushDateTime ?? row.createdDateTime ?? "",
            maxWidth: 350,
            Cell: (props: CellProps<IVaultFull>) => {
              const date =
                props.data[props.row.index].lastChangesetPushDateTime ??
                props.data[props.row.index].createdDateTime;
              const lastModifiedOverride =
                cellOverrides.lastModified ?? cellOverrides.createdDateTime;
              return lastModifiedOverride
                ? lastModifiedOverride(props)
                : date
                ? new Date(date).toDateString()
                : "";
            },
          },
          {
            id: IVaultCellColumn.Options,
            disableSortBy: true,
            maxWidth: 65,
            Cell: (props: CellProps<IVaultFull>) => {
              const moreOptions = (close: () => void) => {
                const options = _buildManagedContextMenuOptions(
                  iVaultActions,
                  props.row.original,
                  close,
                  refetchIVaults
                );
                return options !== undefined ? options : [];
              };

              return iVaultActions && iVaultActions.length > 0 ? (
                <DropdownMenu
                  menuItems={moreOptions}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <IconButton
                    data-testid={`iVault-row-${props.row.original.id}-more-options`}
                    styleType="borderless"
                    aria-label="More options"
                    className="iac-options-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <SvgMore />
                  </IconButton>
                </DropdownMenu>
              ) : null;
            },
          },
        ].filter(
          ({ id }) =>
            !cellOverrides.hideColumns?.includes(id) &&
            // Support deprecated CreatedDateTime alias for the LastModified column
            !(
              id === IVaultCellColumn.LastModified &&
              cellOverrides.hideColumns?.includes(
                IVaultCellColumn.CreatedDateTime
              )
            )
        ),
      },
    ],
    [
      strings.tableColumnFavorites,
      strings.tableColumnName,
      strings.tableColumnDescription,
      strings.tableColumnLastModified,
      strings.addToFavorites,
      strings.removeFromFavorites,
      favoritesContext,
      cellOverrides,
      iVaultActions,
      refetchIVaults,
    ]
  );

  return {
    onRowClick,
    columns,
  };
};
