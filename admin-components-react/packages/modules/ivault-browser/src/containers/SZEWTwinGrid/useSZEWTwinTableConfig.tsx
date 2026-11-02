/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { SvgMore, SvgStar, SvgStarHollow } from "@szewtwin/szewtwinui-icons-react";
import { DropdownMenu, IconButton } from "@szewtwin/szewtwinui-react";
import React from "react";
import { useMemo } from "react";
import { CellProps } from "react-table";

import { SZEWTwinCellColumn, SZEWTwinCellOverrides, SZEWTwinFull } from "../../types";
import {
  _buildManagedContextMenuOptions,
  ContextMenuBuilderItem,
} from "../../utils/_buildMenuOptions";
import { SZEWTwinGridStrings } from "./SZEWTwinGrid";

export interface useSZEWTwinTableConfigProps {
  szewTwinActions: ContextMenuBuilderItem<SZEWTwinFull>[] | undefined;
  onThumbnailClick: ((szewTwin: SZEWTwinFull) => void) | undefined;
  strings: SZEWTwinGridStrings;
  szewTwinFavorites: Set<string>;
  addSZEWTwinToFavorites: (szewTwinId: string) => Promise<void>;
  removeSZEWTwinFromFavorites: (szewTwinId: string) => Promise<void>;
  refetchSZEWTwins: () => void;
  cellOverrides?: SZEWTwinCellOverrides;
}

export const useSZEWTwinTableConfig = ({
  szewTwinActions,
  onThumbnailClick,
  strings,
  szewTwinFavorites,
  addSZEWTwinToFavorites,
  removeSZEWTwinFromFavorites,
  refetchSZEWTwins,
  cellOverrides = {},
}: useSZEWTwinTableConfigProps) => {
  const onRowClick = (_: React.MouseEvent, row: any) => {
    const szewTwin = row.original as SZEWTwinFull;
    if (!szewTwin) {
      return;
    }
    onThumbnailClick?.(szewTwin);
  };

  const columns = useMemo(
    () => [
      {
        Header: "Table",
        columns: [
          {
            id: SZEWTwinCellColumn.Favorite,
            Header: strings.tableColumnFavorites,
            accessor: "id",
            disableSortBy: true,
            width: 70,
            Cell: (props: CellProps<SZEWTwinFull>) => {
              const isFavorite = szewTwinFavorites.has(props.value);
              return (
                <IconButton
                  styleType="borderless"
                  aria-label={
                    isFavorite
                      ? strings.addToFavorites
                      : strings.removeFromFavorites
                  }
                  onClick={async (e) => {
                    e.stopPropagation();
                    isFavorite
                      ? await removeSZEWTwinFromFavorites(props.value)
                      : await addSZEWTwinToFavorites(props.value);
                  }}
                >
                  {isFavorite ? <SvgStar /> : <SvgStarHollow />}
                </IconButton>
              );
            },
          },
          {
            id: SZEWTwinCellColumn.Number,
            Header: strings.tableColumnName,
            accessor: "number",
            maxWidth: 350,
            Cell: (props: CellProps<SZEWTwinFull>) => (
              <div
                data-tip={props.row.original.number}
                className="iac-szewTwinCell"
              >
                {cellOverrides.SZEWTwinNumber ? (
                  cellOverrides.SZEWTwinNumber(props)
                ) : (
                  <span>{props.value}</span>
                )}
              </div>
            ),
          },
          {
            id: SZEWTwinCellColumn.Name,
            Header: strings.tableColumnDescription,
            accessor: "displayName",
            maxWidth: 350,
            Cell: (props: CellProps<SZEWTwinFull>) => (
              <div
                data-tip={props.row.original.displayName}
                className="iac-szewTwinCell"
              >
                {cellOverrides.SZEWTwinName ? (
                  cellOverrides.SZEWTwinName(props)
                ) : (
                  <span>{props.value}</span>
                )}
              </div>
            ),
          },
          {
            id: SZEWTwinCellColumn.LastModified,
            Header: strings.tableColumnLastModified,
            // Use lastModifiedDateTime (not createdDateTime) so this column reflects the last update, matching the "Last modified" header.
            accessor: "lastModifiedDateTime",
            Cell: (props: CellProps<SZEWTwinFull>) => {
              const date = props.data[props.row.index].lastModifiedDateTime;
              return cellOverrides.LastModified
                ? cellOverrides.LastModified(props)
                : date
                ? new Date(date).toDateString()
                : "";
            },
          },
          {
            id: SZEWTwinCellColumn.Options,
            disableSortBy: true,
            maxWidth: 65,
            Cell: (props: CellProps<SZEWTwinFull>) => {
              const moreOptions = (close: () => void) => {
                const options = _buildManagedContextMenuOptions(
                  szewTwinActions,
                  props.row.original,
                  close,
                  refetchSZEWTwins
                );
                return options !== undefined ? options : [];
              };

              return szewTwinActions && szewTwinActions.length > 0 ? (
                <DropdownMenu menuItems={moreOptions}>
                  <IconButton
                    data-testid={`szewTwin-row-${props.row.original.id}-more-options`}
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
        ].filter((column) => !cellOverrides.hideColumns?.includes(column.id)),
      },
    ],
    [
      strings.tableColumnFavorites,
      strings.tableColumnName,
      strings.tableColumnDescription,
      strings.tableColumnLastModified,
      strings.addToFavorites,
      strings.removeFromFavorites,
      szewTwinFavorites,
      removeSZEWTwinFromFavorites,
      addSZEWTwinToFavorites,
      cellOverrides,
      szewTwinActions,
      refetchSZEWTwins,
    ]
  );

  return {
    onRowClick,
    columns,
  };
};
