/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Link, StorageLink } from "../CommonInterfaces";

import { User } from "./UserInterfaces";

/** Possible iVault states. */
export enum IVaultState {
  /**
   * Not initialized iVault. iVault is not yet initialized and the server-side background initialization
   * process is still running. Initialization could take several minutes.
   */
  NotInitialized = "notInitialized",
  /** Initialized iVault. It means that iVault initialization has completed and iVault is ready to use. */
  Initialized = "initialized",
}

/** A point on the Earth's surface denoted by coordinates. Used to specify {@link Extent}. */
export interface Point {
  /** Latitude. Values range from -90 to 90. */
  latitude: number;
  /** Longitude. Value range from -180 to 180. */
  longitude: number;
}

/** A flag enum used to specify which containers are enabled for the iVault. */
export enum ContainerTypes {
  None = 0,
  SchemaSync = 1 << 0,
  CodeStore = 1 << 1,
  ViewStore = 1 << 2,
}

/**
 * The maximum rectangular area on the Earth which encloses the iVault. The maximum extent is used to help keep your
 * iVault clean. When new elements are imported, those outside the extent will be flagged for further processing. This
 * extent will also help to zoom to the area of interest in web viewers.
 */
export interface Extent {
  /** South Latitude, West Longitude. */
  southWest: Point;
  /** North Latitude, East Longitude. */
  northEast: Point;
}

/** The GeographicCoordinateSystem is used to determine how to spatially locate the iVault on the Earth's surface. */
export interface GeographicCoordinateSystem {
  /** A string identifier corresponding to a horizontal Coordinate Reference System in szewTwin.js. */
  horizontalCRSId: string;
}

/**
 * The mode of iVault creation.
 */
export type IVaultCreationMode = "empty" | "fromIVaultVersion" | "fromBaseline";

/** Minimal representation of an iVault. */
export interface MinimalIVault {
  /** iVault id. */
  id: string;
  /** iVault display name. Corresponds to {@link IVault.name} property. */
  displayName: string;
}

/** Links that belong to iVault entity returned from iVaults API. */
export interface IVaultLinks {
  /**
   * Link where to upload the iVault Baseline file. Link points to a remote storage. IMPORTANT: this link
   * is never present in any of the IVault instances returned from methods in this client. This property is
   * only used internally.
   * @private
   */
  upload: StorageLink | null | undefined;
  /**
   * Link to confirm the Baseline file upload and complete the iVault creation process. Points to a specific
   * iVault Baseline in iVaults API. IMPORTANT: this link is never present in any of the IVault instances
   * returned from methods in this client. This property is only used internally.
   * @private
   */
  complete: Link | null | undefined;
  /** Link to the User who created the baseline file instance. Link points to a specific User in iVaults API. */
  creator: Link | null;
  /** Link to retrieve iVault Changesets. Link points to Changeset collection in iVaults API. */
  changesets: Link | null;
  /** Link to retrieve iVault Named Versions. Link points to Named Version collection in iVaults API. */
  namedVersions: Link | null;
}

/** Full representation of an iVault. */
export interface IVault extends MinimalIVault {
  /** iVault name. */
  name: string;
  /** iVault description. */
  description: string | null;
  /** iVault state. See {@link iVaultState}.*/
  state: IVaultState;
  /** Datetime string of when the iVault was created. */
  createdDateTime: string;
  /** Id of the szewTwin that the iVault belongs to. */
  szewTwinId: string;
  /** iVault extent. See {@link Extent}. */
  extent: Extent | null;
  /** iVault container types. See {@link ContainerTypes}. */
  containersEnabled: ContainerTypes;
  /** The data center where the data for the iVault is persisted. */
  dataCenterLocation: string;
  /** iVault links. See {@link IVaultLinks}.*/
  _links: IVaultLinks;
  /**
   * Function to query User who created this iVault. If this information is unavailable the
   * function returns `undefined`. This function reuses authorization information passed to specific iVault
   * operation that originally queried the iVault from API.
   */
  getCreator: () => Promise<User | undefined>;
}
