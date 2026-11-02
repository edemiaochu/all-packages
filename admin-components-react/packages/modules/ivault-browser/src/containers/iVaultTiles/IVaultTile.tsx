/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Tile } from "@szewtwin/szewtwinui-react";
import React from "react";

import { TileFavoriteIcon } from "../../components/tileFavoriteIcon/TileFavoriteIcon";
import { useIVaultFavoritesContext } from "../../contexts/IVaultFavoritesContext";
import { AccessTokenProvider, ApiOverrides, IVaultFull } from "../../types";
import { _mergeStrings } from "../../utils/_apiOverrides";
import {
  _buildManagedContextMenuOptions,
  ContextMenuBuilderItem,
} from "../../utils/_buildMenuOptions";
import { IVaultThumbnail } from "../iVaultThumbnail/IVaultThumbnail";
import styles from "./IVaultTile.module.scss";

type TileProps = React.ComponentPropsWithoutRef<typeof Tile>;

export interface IVaultTileProps {
  /** iVault to display */
  iVault: IVaultFull;
  /** Access token to display */
  accessToken?: AccessTokenProvider;
  /** List of options to build for the ivault context menu */
  iVaultOptions?: ContextMenuBuilderItem<IVaultFull>[];
  /** Function to call on thumbnail click */
  onThumbnailClick?(iVault: IVaultFull): void;
  /** Strings displayed by the browser */
  stringsOverrides?: {
    /** Accessible text for the hollow star icon to add the iVault to favorites */
    addToFavorites?: string;
    /** Accessible text for the full star icon to remove the iVault from favorites */
    removeFromFavorites?: string;
  };
  /** Tile props that will be applied after normal use. (Will override IVaultTile if used) */
  tileProps?: Partial<
    TileProps & { getBadge?: (iVault: IVaultFull) => React.ReactNode }
  >;
  /** Object that configures different overrides for the API */
  apiOverrides?: ApiOverrides;
  /** Function to refetch iVaults */
  refetchIVaults?: () => void;
  /** Indicates whether the tile should take the full width of its container */
  fullWidth?: boolean;
  /** Hides the favorite icon when true */
  hideFavoriteIcon?: boolean;
}

/**
 * Representation of an IVault
 */
export const IVaultTile = ({
  iVault,
  iVaultOptions,
  accessToken,
  onThumbnailClick,
  apiOverrides,
  tileProps,
  stringsOverrides,
  refetchIVaults,
  fullWidth,
  hideFavoriteIcon,
}: IVaultTileProps) => {
  const {
    name,
    status,
    isNew,
    isLoading,
    isSelected,
    thumbnail,
    badge,
    getBadge,
    leftIcon,
    rightIcon,
    buttons,
    moreOptions,
    isDisabled,
    onClick: tilePropsOnClick,
    metadata,
    className = "",
    ...rest
  } = tileProps ?? {};
  const favoritesContext = useIVaultFavoritesContext();
  const strings = _mergeStrings(
    {
      addToFavorites: "Add to favorites",
      removeFromFavorites: "Remove from favorites",
    },
    stringsOverrides
  );

  const moreOptionsBuilt = React.useMemo(
    () =>
      _buildManagedContextMenuOptions(
        iVaultOptions,
        iVault,
        undefined,
        refetchIVaults
      ),
    [iVaultOptions, iVault, refetchIVaults]
  );
  const thumbnailApiOverride =
    apiOverrides || iVault.thumbnail
      ? {
          ...(apiOverrides ?? {}),
          data: iVault.thumbnail,
        }
      : undefined;

  return (
    <Tile.Wrapper
      key={iVault.id}
      isNew={isNew}
      isSelected={isSelected}
      isLoading={isLoading}
      status={status}
      isDisabled={isDisabled}
      className={`${styles.iVaultTile} ${
        fullWidth ? styles.fullWidth : ""
      } ${className}`}
      {...rest}
    >
      <Tile.Name>
        <Tile.NameIcon />
        <Tile.NameLabel
          onClick={(e) => tilePropsOnClick?.(e) ?? onThumbnailClick?.(iVault)}
          aria-disabled={isDisabled}
          data-testid={`iVault-tile-${iVault.id}-name-label`}
        >
          {name ?? iVault.displayName}
        </Tile.NameLabel>
      </Tile.Name>
      <Tile.ThumbnailArea>
        {leftIcon && <Tile.TypeIndicator>{leftIcon}</Tile.TypeIndicator>}
        <Tile.QuickAction>
          {rightIcon}
          {!hideFavoriteIcon && favoritesContext && (
            <TileFavoriteIcon
              isFavorite={favoritesContext.favorites.has(iVault.id)}
              onAddToFavorites={() => favoritesContext.add(iVault.id)}
              onRemoveFromFavorites={() => favoritesContext.remove(iVault.id)}
              addLabel={strings.addToFavorites}
              removeLabel={strings.removeFromFavorites}
              className={`${styles.iVaultTileFavoriteIcon} ${
                !favoritesContext.favorites.has(iVault.id) && styles.hidden
              }`}
            />
          )}
        </Tile.QuickAction>
        {thumbnail ? (
          <Tile.ThumbnailPicture>{thumbnail}</Tile.ThumbnailPicture>
        ) : (
          <IVaultThumbnail
            iVaultId={iVault.id}
            accessToken={accessToken}
            apiOverrides={thumbnailApiOverride}
          />
        )}
        {(getBadge || badge) && (
          <Tile.BadgeContainer>
            {getBadge?.(iVault) ?? badge}
          </Tile.BadgeContainer>
        )}
      </Tile.ThumbnailArea>
      <Tile.ContentArea>
        <Tile.Action
          onClick={(e) => tilePropsOnClick?.(e) ?? onThumbnailClick?.(iVault)}
          aria-disabled={isDisabled}
          data-testid={`iVault-tile-${iVault.id}-action`}
        >
          <Tile.Description>{iVault?.description ?? ""}</Tile.Description>
        </Tile.Action>
        {(moreOptions || moreOptionsBuilt) && (
          <Tile.MoreOptions
            data-testid={`iVault-tile-${iVault.id}-more-options`}
          >
            {moreOptions ?? moreOptionsBuilt}
          </Tile.MoreOptions>
        )}
        {metadata && (
          <Tile.Metadata data-testid={`iVault-tile-${iVault.id}-metadata`}>
            {metadata}
          </Tile.Metadata>
        )}
      </Tile.ContentArea>
      {buttons && <Tile.Buttons>{buttons}</Tile.Buttons>}
    </Tile.Wrapper>
  );
};
