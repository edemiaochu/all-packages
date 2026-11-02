/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Text, Tile } from "@szewtwin/szewtwinui-react";
import classNames from "classnames";
import React from "react";
import { useInView } from "react-intersection-observer";

import { AccessTokenProvider, ApiOverrides } from "../../types";
import { useIVaultThumbnail } from "./useIVaultThumbnail";

export interface IVaultThumbnailProps {
  className?: string;
  /** Id of the iVault to fetch thumbnail for */
  iVaultId: string;
  /** Triggered on the image click, controls pointer */
  onClick?(iVaultId: string): void;
  /* Access token that requires the `ivaults:read` scope. */
  accessToken?: AccessTokenProvider;
  /** Object that configures different overrides for the API
   * @property data thumbnail URL
   * @property serverEnvironmentPrefix Either qa or dev
   */
  apiOverrides?: ApiOverrides<string>;
}

/** Clickable iVault thumbnail, fetched from the servers */
export const IVaultThumbnail = ({
  iVaultId,
  accessToken,
  apiOverrides,
  className,
}: IVaultThumbnailProps) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    skip: !!apiOverrides?.data,
  });
  const thumbnail = useIVaultThumbnail(
    iVaultId,
    inView ? accessToken : undefined,
    apiOverrides
  );
  return thumbnail ? (
    <Tile.ThumbnailPicture
      url={thumbnail}
      ref={ref}
      className={classNames("iac-thumbnail", className)}
    />
  ) : (
    <Text
      as="p"
      variant="body"
      ref={ref}
      isSkeleton
      style={{ height: "100%", width: "100%", margin: 0 }}
    />
  );
};
