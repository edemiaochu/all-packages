/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import svgIvault from "@stratakit/icons/ivault.svg";
import React from "react";

import { IVaultTileProps } from "../../../containers/iVaultTiles/IVaultTile";
import { IVaultFavoritesContext } from "../../../contexts/IVaultFavoritesContext";
import { AccessTokenProvider, ApiOverrides, IVaultFull } from "../../../types";
import { _mergeStrings } from "../../../utils/_apiOverrides";
import {
  type MoreActionsMenuItemMUI,
  type ResolvedMoreActionsMenuItem,
} from "../../../utils/_buildMenuOptions";
import {
  type BaseCardProps,
  BaseCard,
} from "../../components/baseCard/BaseCard";
import { FavoriteIconMUI } from "../../components/tileFavoriteIcon/FavoriteIconMUI";
import { IVaultThumbnailMUI } from "../iVaultThumbnail/IVaultThumbnailMUI";

/** @alpha */
export interface IVaultTileMUIProps
  extends Omit<
      IVaultTileProps,
      "onThumbnailClick" | "iVaultOptions" | "tileProps" | "fullWidth"
    >,
    Omit<
      BaseCardProps,
      | "statusIcon"
      | "onSelect"
      | "onOpen"
      | "title"
      | "description"
      | "thumbnailTopRight"
      | "moreActions"
    > {
  /** If not provided, iVault display name will be used */
  title?: string;
  /** If not provided, iVault description will be used */
  description?: string;
  /** iVault to display */
  iVault: IVaultFull;
  /** Items for the three-dot context menu */
  moreActions?: MoreActionsMenuItemMUI<IVaultFull>[];
  /** Strings displayed by the component */
  stringsOverrides?: {
    /** Accessible text for the hollow star icon to add the iVault to favorites */
    addToFavorites?: string;
    /** Accessible text for the full star icon to remove the iVault from favorites */
    removeFromFavorites?: string;

    moreOptions?: string;
  };
  /** Access token for fetching the thumbnail */
  accessToken?: AccessTokenProvider;
  /** Object that configures different overrides for the API */
  apiOverrides?: ApiOverrides;
  /** Function to refetch iVaults */
  refetchIVaults?: () => void;
  /** Hides the favorite icon when true */
  hideFavoriteIcon?: boolean;
}

/**
 * Representation of an IVault — V2 (Stratakit/MUI)
 * @alpha
 */
export const IVaultTileMUI = ({
  iVault,
  moreActions: moreActionItems,
  accessToken,
  apiOverrides,
  stringsOverrides,
  refetchIVaults,
  hideFavoriteIcon,
  loading,
  disabled,
  status,
  thumbnail,
  thumbnailTopLeft,
  thumbnailBottomLeft,
  thumbnailBottomRight,
  title,
  description,
  subheader,
  actions,

  className,
  ...rest
}: IVaultTileMUIProps) => {
  const favoritesContext = React.useContext(IVaultFavoritesContext);
  const strings = _mergeStrings(
    {
      addToFavorites: "Add to favorites",
      removeFromFavorites: "Remove from favorites",
      moreOptions: "More options",
    },
    stringsOverrides
  );

  const moreActions: ResolvedMoreActionsMenuItem[] | undefined = React.useMemo(
    () =>
      moreActionItems
        ?.filter(({ visible }) =>
          typeof visible === "function" ? visible(iVault) : visible ?? true
        )
        .map(({ key, label, icon, onClick, disabled }) => ({
          key,
          label: typeof label === "function" ? label(iVault) : label,
          icon,
          onClick: onClick ? () => onClick(iVault, refetchIVaults) : undefined,
          disabled:
            typeof disabled === "function" ? disabled(iVault) : disabled,
        })),
    [moreActionItems, iVault, refetchIVaults]
  );

  const thumbnailApiOverride =
    apiOverrides || iVault.thumbnail
      ? { ...(apiOverrides ?? {}), data: iVault.thumbnail }
      : undefined;

  const isFavorite = favoritesContext?.favorites.has(iVault.id) ?? false;
  const favoriteIcon =
    !hideFavoriteIcon && favoritesContext ? (
      <FavoriteIconMUI
        isFavorite={isFavorite}
        onAddToFavorites={() => favoritesContext.add(iVault.id)}
        onRemoveFromFavorites={() => favoritesContext.remove(iVault.id)}
        addLabel={strings.addToFavorites}
        removeLabel={strings.removeFromFavorites}
        disabled={disabled}
      />
    ) : undefined;

  return (
    <BaseCard
      className={className}
      sx={{
        "&:hover .favoriteIcon, &:focus-within .favoriteIcon": {
          opacity: 1,
        },
      }}
      disabled={disabled}
      loading={loading}
      thumbnail={
        thumbnail ?? (
          <IVaultThumbnailMUI
            iVaultId={iVault.id}
            accessToken={accessToken}
            apiOverrides={thumbnailApiOverride}
          />
        )
      }
      thumbnailTopLeft={thumbnailTopLeft}
      thumbnailTopRight={favoriteIcon}
      thumbnailBottomLeft={thumbnailBottomLeft}
      thumbnailBottomRight={thumbnailBottomRight}
      title={title ?? iVault.displayName ?? ""}
      actions={actions}
      moreActions={moreActions}
      status={status}
      statusIconHref={svgIvault}
      description={description ?? iVault.description ?? ""}
      subheader={subheader}
      stringsOverrides={stringsOverrides}
      data-testid={`ivault-tile-${iVault.id}`}
      {...rest}
    />
  );
};
