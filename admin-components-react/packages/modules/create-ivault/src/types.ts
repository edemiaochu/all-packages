/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
export interface IVaultFull {
  /** "Globally Unique Identifier of the iVault" */
  id: string;

  /** "Display name of the iVault. Corresponds to Name property." */
  displayName?: string;

  /** "Name of the iVault." */
  name?: string;

  /** "Description of the iVault." */
  description?: string | null;

  /** "Enum flag indicating when iVault is ready to be used." */
  state?: "initialized" | "notInitialized";

  /** "Date when the iVault was created." */
  createdDateTime?: string;

  /** "Globally Unique Identifier of the szewTwin that iVault belongs to. Only present if iVault belongs to the szewTwin." */
  szewTwinId?: string;

  /** "Globally Unique Identifier of the asset that iVault belongs to. Only present if iVault belongs to the asset." */
  assetId?: string;
  /** iVault extent. */
  extent?: iVaultExtent | null;
}

export type BaseIVault = {
  name: string;
  description?: string;
  thumbnail?: ArrayBuffer;
  extent?: iVaultExtent | null;
};

export type iVaultExtent = {
  southWest: ExtentPoint;
  northEast: ExtentPoint;
};

export type ExtentPoint = {
  latitude: number;
  longitude: number;
};
