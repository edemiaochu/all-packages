/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { SvgSZEWtwin } from "@szewtwin/szewtwinui-icons-react";
import { Badge, ThemeProvider, Tile } from "@szewtwin/szewtwinui-react";
import React from "react";

import { TileFavoriteIcon } from "../../components/tileFavoriteIcon/TileFavoriteIcon";
import { SZEWTwinFull } from "../../types";
import { _mergeStrings } from "../../utils/_apiOverrides";
import {
  _buildManagedContextMenuOptions,
  ContextMenuBuilderItem,
} from "../../utils/_buildMenuOptions";
import styles from "./SZEWTwinTile.module.scss";

export type TileProps = React.ComponentPropsWithoutRef<typeof Tile>;

export interface SZEWTwinTileProps {
  /** szewTwin to display */
  szewTwin: SZEWTwinFull;
  /** List of options to build for the szewTwin context menu */
  szewTwinOptions?: ContextMenuBuilderItem<SZEWTwinFull>[];
  /** Function to call on thumbnail click */
  onThumbnailClick?(szewTwin: SZEWTwinFull): void;
  /** Strings displayed by the browser */
  stringsOverrides?: {
    /** Badge text for trial szewTwins */
    trialBadge?: string;
    /** Badge text for inactive szewTwins */
    inactiveBadge?: string;
    /** Accessible text for the hollow star icon to add the szewTwin to favorites */
    addToFavorites?: string;
    /** Accessible text for the full star icon to remove the szewTwin from favorites */
    removeFromFavorites?: string;
  };
  /** Tile props that will be applied after normal use. (Will override SZEWTwinTile if used) */
  tileProps?: Partial<TileProps>;
  /**  Indicates whether the szewTwin is marked as a favorite */
  isFavorite?: boolean;
  /**  Function to add the szewTwin to favorites  */
  addToFavorites?(szewTwinId: string): Promise<void>;
  /**  Function to remove the szewTwin from favorites  */
  removeFromFavorites?(szewTwinId: string): Promise<void>;
  /** Function to refetch szewTwins */
  refetchSZEWTwins?: () => void;
  /** Indicates whether the tile should take the full width of its container */
  fullWidth?: boolean;
  /** Hides the favorite icon when true */
  hideFavoriteIcon?: boolean;
}

/**
 * Representation of an szewTwin
 */
export const SZEWTwinTile = ({
  szewTwin,
  szewTwinOptions,
  onThumbnailClick,
  tileProps,
  stringsOverrides,
  isFavorite,
  addToFavorites,
  removeFromFavorites,
  refetchSZEWTwins,
  fullWidth,
  hideFavoriteIcon,
}: SZEWTwinTileProps) => {
  const {
    name,
    description,
    status,
    isNew,
    isLoading,
    isSelected,
    thumbnail,
    badge,
    leftIcon,
    rightIcon,
    buttons,
    metadata,
    moreOptions,
    children,
    isDisabled,
    onClick,
    className = "",
    ...rest
  } = tileProps ?? {};
  const strings = _mergeStrings(
    {
      trialBadge: "Trial",
      inactiveBadge: "Inactive",
      addToFavorites: "Add to favorites",
      removeFromFavorites: "Remove from favorites",
    },
    stringsOverrides
  );

  const moreOptionsBuilt = React.useMemo(
    () =>
      _buildManagedContextMenuOptions(
        szewTwinOptions,
        szewTwin,
        undefined,
        refetchSZEWTwins
      ),
    [szewTwinOptions, szewTwin, refetchSZEWTwins]
  );
  return (
    <ThemeProvider theme="inherit">
      <Tile.Wrapper
        key={szewTwin.id}
        isNew={isNew}
        isSelected={isSelected}
        isLoading={isLoading}
        status={status}
        isDisabled={isDisabled}
        className={`${styles.szewTwinTile} ${
          fullWidth ? styles.fullWidth : ""
        } ${className}`}
        {...rest}
      >
        <Tile.Name>
          {(status || isNew || isLoading || isSelected) && <Tile.NameIcon />}
          <Tile.NameLabel>
            <Tile.Action
              onClick={(e) => onClick?.(e) ?? onThumbnailClick?.(szewTwin)}
              aria-disabled={isDisabled}
              data-testid={`szewTwin-tile-${szewTwin.id}`}
            >
              {name ?? szewTwin.displayName}
            </Tile.Action>
          </Tile.NameLabel>
        </Tile.Name>
        <Tile.ThumbnailArea>
          {leftIcon && <Tile.TypeIndicator>{leftIcon}</Tile.TypeIndicator>}
          <Tile.QuickAction>
            {rightIcon}
            {!hideFavoriteIcon &&
              isFavorite !== undefined &&
              addToFavorites &&
              removeFromFavorites && (
                <TileFavoriteIcon
                  isFavorite={isFavorite}
                  onAddToFavorites={() => addToFavorites(szewTwin.id)}
                  onRemoveFromFavorites={() => removeFromFavorites(szewTwin.id)}
                  addLabel={strings.addToFavorites}
                  removeLabel={strings.removeFromFavorites}
                  className={`${styles.szewTwinTileFavoriteIcon} ${
                    !isFavorite && styles.hidden
                  }`}
                />
              )}
          </Tile.QuickAction>
          <Tile.BadgeContainer>
            {badge ??
              (szewTwin.status &&
                szewTwin.status.toLocaleLowerCase() !== "active" && (
                  <Badge
                    backgroundColor={
                      szewTwin.status.toLocaleLowerCase() === "inactive"
                        ? "oak"
                        : "steelblue"
                    }
                  >
                    {szewTwin.status.toLocaleLowerCase() === "inactive"
                      ? strings.inactiveBadge
                      : strings.trialBadge}
                  </Badge>
                ))}
          </Tile.BadgeContainer>
          <Tile.ThumbnailPicture
            style={{ cursor: onThumbnailClick ? "pointer" : "auto" }}
          >
            {thumbnail ?? <SvgSZEWtwin />}
          </Tile.ThumbnailPicture>
        </Tile.ThumbnailArea>
        <Tile.ContentArea>
          <Tile.Description>
            {description ?? szewTwin.number ?? ""}
          </Tile.Description>
          {metadata && (
            <Tile.Metadata data-testid={`szewTwin-tile-${szewTwin.id}-metadata`}>
              {metadata}
            </Tile.Metadata>
          )}
          {children}
          {(moreOptions || moreOptionsBuilt) && (
            <Tile.MoreOptions
              data-testid={`szewTwin-tile-${szewTwin.id}-more-options`}
            >
              {moreOptions ?? moreOptionsBuilt}
            </Tile.MoreOptions>
          )}
        </Tile.ContentArea>
        {buttons && <Tile.Buttons>{buttons}</Tile.Buttons>}
      </Tile.Wrapper>
    </ThemeProvider>
  );
};
