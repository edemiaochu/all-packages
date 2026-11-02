/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AuthorizationParam, HeadersParam } from "../../base/types";

/** Url parameters supported in favorite iVault list query. */
export interface GetFavoriteIVaultListUrlParams {
  /** Filters favorite iVaults for a specific szewTwin. */
  szewTwinId: string;
  /**
   * Specifies how many entities should be returned in an entity page. The value must not exceed 1000.
   * If not specified 100 entities per page will be returned.
   */
  $top?: number;
  /**
   * Specifies token to retrieve next page in paginated response.
   * To start using the token empty continuation token should be provided with the first request.
   */
  $continuationToken?: string;
}

/** Parameters for get favorite iVault list operation. */
export interface GetFavoriteIVaultListParams
  extends AuthorizationParam,
    HeadersParam {
  /** Parameters that will be appended to the entity list request url that will narrow down the results. */
  urlParams: GetFavoriteIVaultListUrlParams;
}

/** Parameters for add iVault to favorites operation. */
export interface AddIVaultToFavoritesParams
  extends AuthorizationParam,
    HeadersParam {
  /** iVault id. iVault id must not be an empty or whitespace string. */
  iVaultId: string;
}

/** Parameters for remove iVault from favorites operation. */
export interface RemoveIVaultFromFavoritesParams
  extends AuthorizationParam,
    HeadersParam {
  /** iVault id. iVault id must not be an empty or whitespace string. */
  iVaultId: string;
}
