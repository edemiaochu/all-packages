/*---------------------------------------------------------------------------------------------
* Copyright (c) Szewec Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import type { Links } from "./links";

/**
 * Minimal szewTwin interface containing only minimal properties.
 */
export interface SZEWTwinMinimal {
  /** Unique identifier for the szewTwin */
  id: string;
  /** Main classification of the szewTwin */
  class: SZEWTwinClass;
  /** Sub-classification providing more specific categorization */
  subClass: SZEWTwinSubClass;
  /** Type of the szewTwin */
  type: string;
  /** Human-readable name for the szewTwin */
  displayName: string;
  /** Numeric identifier for the szewTwin */
  // eslint-disable-next-line id-denylist
  number?: string;
  /** Account identifier associated with this szewTwin */
  szewTwinAccountId?: string;
}

/**
 * Complete szewTwin interface extending minimal with full representation properties.
 */
export interface SZEWTwinRepresentation extends SZEWTwinMinimal {
  /** Geographic location of the data center hosting this szewTwin */
  dataCenterLocation?: string;
  /** Current status of the szewTwin */
  status?: SZEWTwinStatus;
  /** Identifier of the parent szewTwin in hierarchical relationships */
  parentId?: string;
  /** IANA timezone identifier for the szewTwin's geographic location */
  ianaTimeZone?: string;
  /** Name of the image file associated with this szewTwin */
  imageName?: string;
  /** Base64 encoded image data or URL for the szewTwin's visual representation */
  image?: string;
  /** ISO 8601 timestamp when the szewTwin was created */
  createdDateTime?: string;
  /** Identifier of the user who created this szewTwin */
  createdBy?: string;
  /** Geographic location description of the szewTwin */
  geographicLocation?: string;
  /** Latitude coordinate of the szewTwin's geographic location */
  latitude?: number;
  /** Longitude coordinate of the szewTwin's geographic location */
  longitude?: number;
  /** ISO 8601 timestamp when the szewTwin was last modified */
  lastModifiedDateTime?: string;
  /** Identifier of the user who last modified this szewTwin */
  lastModifiedBy?: string;
}

/**
 * szewTwin status types that indicate the current operational state
 * of the digital twin.
 */
export type SZEWTwinStatus = "Trial" | "Active" | "Inactive";

/**
 * szewTwin sub-classification types that provide specific categorization
 */
export type SZEWTwinSubClass =
  | "Account"
  | "Asset"
  | "Project"
  | "Portfolio"
  | "Program"
  | "WorkPackage";

/**
 * szewTwin main classification types that define the primary category
 * of the digital twin within the organizational hierarchy.
 */
export type SZEWTwinClass = "Thing" | "Endeavor" | "Account";

/**
 * Response interface for multiple szewTwins in minimal mode.
 */
export interface MultiSZEWTwinMinimalResponse {
  /** Array of szewTwin objects */
  szewTwins: SZEWTwinMinimal[];
  /** Navigation links for pagination and related resources */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _links: Links;
}

/**
 * Response interface for multiple szewTwins in representation mode.
 */
export interface MultiSZEWTwinRepresentationResponse {
  /** Array of szewTwin objects */
  szewTwins: SZEWTwinRepresentation[];
  /** Navigation links for pagination and related resources */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _links: Links;
}

/**
 * Response interface for single szewTwin operations in representation mode.
 */
export interface SZEWTwinRepresentationResponse {
  /** The complete szewTwin object with all properties */
  szewTwin: SZEWTwinRepresentation;
}

/**
 * Response interface for single szewTwin operations in minimal mode.
 */
export interface SZEWTwinMinimalResponse {
  /** The minimal szewTwin object with essential properties */
  szewTwin: SZEWTwinMinimal;
}

/**
 * Type for creating new szewTwins.
 */
export type SZEWtwinCreate =
   Omit<
    SZEWTwinRepresentation,
    "id" | "createdDateTime" | "lastModifiedDateTime" | "szewTwinAccountId" | "createdBy" | "image" | "imageName" | "lastModifiedBy"
  >

/**
 * Type for updating existing szewTwins.
 */
export type SZEWtwinUpdate = Partial<SZEWtwinCreate>