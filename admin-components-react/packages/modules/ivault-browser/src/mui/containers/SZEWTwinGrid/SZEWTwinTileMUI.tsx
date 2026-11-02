/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import Chip from "@mui/material/Chip";
import svgSZEWtwin from "@stratakit/icons/szewtwin.svg";
import React from "react";

import { SZEWTwinTileProps } from "../../../containers/SZEWTwinGrid/SZEWTwinTile";
import { SZEWTwinFull } from "../../../types";
import { _mergeStrings } from "../../../utils/_apiOverrides";
import {
  type MoreActionsMenuItemMUI,
  type ResolvedMoreActionsMenuItem,
} from "../../../utils/_buildMenuOptions";
import { formatDate } from "../../../utils/formatDate";
import {
  type BaseCardProps,
  BaseCard,
} from "../../components/baseCard/BaseCard";
import { SvgThumbnail } from "../../components/baseCard/SvgThumbnail";
import { FavoriteIconMUI } from "../../components/tileFavoriteIcon/FavoriteIconMUI";

/** @alpha */
export interface SZEWTwinTilePropsMUI
  extends Omit<SZEWTwinTileProps, "onThumbnailClick" | "tileProps" | "fullWidth">,
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
  /** Defaults to szewTwin.displayName */
  title?: string;
  /** If not provided, szewTwin number will be used */
  description?: string;
  /** Items for the three-dot context menu */
  moreActions?: MoreActionsMenuItemMUI<SZEWTwinFull>[];

  /** Node to display in the bottom right corner of the thumbnail. If not provided, a default status badge will be used. */
  thumbnailBottomRight?: React.ReactNode;

  stringsOverrides?: {
    trialBadge?: string;
    inactiveBadge?: string;
    addToFavorites?: string;
    removeFromFavorites?: string;
    moreOptions?: string;
  };
}

/**
 * Representation of an szewTwin — V2 (Stratakit/MUI)
 * @alpha
 */
export const SZEWTwinTileMUI = ({
  szewTwin,
  moreActions: moreActionItems,
  stringsOverrides,
  isFavorite,
  addToFavorites,
  removeFromFavorites,
  refetchSZEWTwins,
  hideFavoriteIcon,
  loading,
  disabled,
  status,
  thumbnail,
  thumbnailBottomRight,
  thumbnailTopLeft,
  thumbnailBottomLeft,
  title,
  description,
  actions,
  className,
  ...rest
}: SZEWTwinTilePropsMUI) => {
  const strings = _mergeStrings(
    {
      trialBadge: "Trial",
      inactiveBadge: "Inactive",
      addToFavorites: "Add to favorites",
      removeFromFavorites: "Remove from favorites",
    },
    stringsOverrides
  );

  const moreActions: ResolvedMoreActionsMenuItem[] | undefined = React.useMemo(
    () =>
      moreActionItems
        ?.filter(({ visible }) =>
          typeof visible === "function" ? visible(szewTwin) : visible ?? true
        )
        .map(({ key, label, icon, onClick, disabled }) => ({
          key,
          label: typeof label === "function" ? label(szewTwin) : label,
          icon,
          onClick: onClick ? () => onClick(szewTwin, refetchSZEWTwins) : undefined,
          disabled: typeof disabled === "function" ? disabled(szewTwin) : disabled,
        })),
    [moreActionItems, szewTwin, refetchSZEWTwins]
  );

  const favoriteIcon =
    !hideFavoriteIcon &&
    isFavorite !== undefined &&
    addToFavorites &&
    removeFromFavorites ? (
      <FavoriteIconMUI
        isFavorite={isFavorite}
        onAddToFavorites={() => addToFavorites(szewTwin.id)}
        onRemoveFromFavorites={() => removeFromFavorites(szewTwin.id)}
        addLabel={strings.addToFavorites}
        removeLabel={strings.removeFromFavorites}
        disabled={disabled}
      />
    ) : undefined;

  const additionalDescription = szewTwin.lastModifiedDateTime
    ? formatDate(szewTwin.lastModifiedDateTime)
    : undefined;

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
      thumbnail={thumbnail ?? <DefaultThumbnail />}
      thumbnailTopLeft={thumbnailTopLeft}
      thumbnailBottomLeft={thumbnailBottomLeft}
      thumbnailTopRight={favoriteIcon}
      thumbnailBottomRight={
        thumbnailBottomRight ?? (
          <StatusBadge status={szewTwin.status} strings={strings} />
        )
      }
      title={title ?? szewTwin.displayName ?? ""}
      actions={actions}
      moreActions={moreActions}
      status={status}
      statusIconHref={svgSZEWtwin}
      description={description ?? szewTwin.number ?? ""}
      subheader={additionalDescription}
      data-testid={`szewtwin-tile-${szewTwin.id}`}
      stringsOverrides={stringsOverrides}
      {...rest}
    />
  );
};

export function DefaultThumbnail() {
  return <SvgThumbnail src={`${svgSZEWtwin}#icon-large`} />;
}

function StatusBadge({
  status,
  strings,
}: {
  status?: string;
  strings: {
    trialBadge: string;
    inactiveBadge: string;
  };
}) {
  if (!status || status.toLocaleLowerCase() === "active") {
    return null;
  }

  return (
    <Chip
      size="small"
      label={
        status.toLocaleLowerCase() === "inactive"
          ? strings.inactiveBadge
          : strings.trialBadge
      }
    />
  );
}
