/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { CellProps } from "react-table";

/** Full representation of the iVault. */
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

  /** Thumbnail for the iVault */
  thumbnail?: string;

  /** "Date when the last changeset was pushed to the iVault." */
  lastChangesetPushDateTime?: string | null;
}

/** Full representation of an szewTwin */
export interface SZEWTwinFull {
  id: string;
  class?: SZEWTwinClassType;
  subClass?: SZEWTwinSubClass;
  type?: string;
  number?: string;
  displayName?: string;
  geographicLocation?: string;
  latitude?: number;
  longitude?: number;
  ianaTimeZone?: string;
  dataCenterLocation?: string;
  status?: SZEWTwinStatus;
  parentId?: string;
  szewTwinAccountId?: string;
  imageName?: string;
  image?: string;
  createdDateTime?: string;
  createdBy?: string;
  lastModifiedDateTime?: string;
  lastModifiedBy?: string;
}

/** An object that allow various configuration of the API access */
export interface ApiOverrides<T = never> {
  /** dev or qa */
  serverEnvironmentPrefix?: "dev" | "qa" | "";
  /** Data as props */
  data?: T;
  /** Loading state when using consumer-provided data. */
  isLoading?: boolean;
  /** Indicates if more data is available for infinite scroll when using consumer-provided data. */
  hasMoreData?: boolean;
}

type FilterOptions = string;

/** String/function that configures Project filtering behavior. */
export type SZEWTwinFilterOptions = FilterOptions;

export enum DataStatus {
  Fetching = "fetching",
  Complete = "complete",
  FetchFailed = "error_fetchFailed",
  TokenRequired = "error_tokenRequired",
  ContextRequired = "error_contextRequired",
}

/**
 * Specifies the data management mode for the hook.
 * - "internal": Hook manages all data fetching, pagination, sorting, and filtering. Requires accessToken and szewTwinId.
 * - "external": Hook uses data provided via apiOverrides.data and delegates all data management to the consumer.
 */
export type DataMode = "internal" | "external";

type SortOptions<T, K extends keyof T> = { sortType: K; descending: boolean };

/** Supported IVault sorting types */
export type IVaultSortOptionsKeys = "name" | "createdDateTime";

/** Object/function that configure IVault sorting behavior. */
export type IVaultSortOptions = SortOptions<IVaultFull, IVaultSortOptionsKeys>;

export type SZEWTwinSubClass =
  | "Project"
  | "Asset"
  | "Portfolio"
  | "Program"
  | "WorkPackage"
  | "All";
export type SZEWTwinClassType = "Thing" | "Endeavor";
export type SZEWTwinStatus =
  | "Active"
  | "Inactive"
  | "Trial"
  | "active"
  | "inactive"
  | "trial";
export type ViewType = "tile" | "cells";
// Remove this IVaultViewType with next major release i.e 2.0
export type IVaultViewType = ViewType;

/* Supported IVault cell columns */
export enum IVaultCellColumn {
  Favorite = "Favorite",
  Name = "name",
  Description = "description",
  LastModified = "lastChangesetPushDateTime",
  /** @deprecated Since 4.1.0. Use `LastModified` instead. */
  CreatedDateTime = "createdDateTime",
  Options = "options",
}
export type IVaultCellOverrides = {
  name?: (cellData: CellProps<IVaultFull>) => React.ReactNode;
  description?: (cellData: CellProps<IVaultFull>) => React.ReactNode;
  lastModified?: (cellData: CellProps<IVaultFull>) => React.ReactNode;
  /** @deprecated Since 4.1.0. Use `lastModified` instead. */
  createdDateTime?: (cellData: CellProps<IVaultFull>) => React.ReactNode;
  hideColumns?: IVaultCellColumn[];
};

/* Supported SZEWTwin cell columns */
export enum SZEWTwinCellColumn {
  Favorite = "Favorite",
  Number = "SZEWTwinNumber",
  Name = "SZEWTwinName",
  LastModified = "LastModified",
  Options = "options",
}
export type SZEWTwinCellOverrides = {
  SZEWTwinNumber?: (cellData: CellProps<SZEWTwinFull>) => React.ReactNode;
  SZEWTwinName?: (cellData: CellProps<SZEWTwinFull>) => React.ReactNode;
  LastModified?: (cellData: CellProps<SZEWTwinFull>) => React.ReactNode;
  hideColumns?: SZEWTwinCellColumn[];
};

export type AccessTokenProvider = string | (() => Promise<string>);
