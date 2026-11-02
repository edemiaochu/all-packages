/*---------------------------------------------------------------------------------------------
* Copyright (c) Szewec Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/**
 * Represents an szewTwin image with different size variants
 */
export interface SZEWTwinImage {
  /** Unique identifier for the image */
  id: string;
  /** Filename for the small version of the image */
  smallImageName: string;
  /** URL to access the small version of the image */
  smallImageUrl: string;
  /** Filename for the large version of the image */
  largeImageName: string;
  /** URL to access the large version of the image */
  largeImageUrl: string;
}

/**
 * Response interface for szewTwin image operations
 */
export interface SZEWTwinImageResponse {
  image: SZEWTwinImage;
}