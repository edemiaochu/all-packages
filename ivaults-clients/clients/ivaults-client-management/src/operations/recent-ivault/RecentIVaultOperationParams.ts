/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AuthorizationParam, HeadersParam } from "../../base/types";

/** Url parameters supported in recent iVault list query. */
export interface GetRecentIVaultListUrlParams {
  /** Filters recent iVaults for a specific szewTwin. */
  szewTwinId: string;
  /**
   * Specifies how many entities should be returned in an entity page. The value must not exceed 1000.
   * If not specified 100 entities per page will be returned.
   */
  $top?: number;
}

/** Parameters for get recent iVault list operation. */
export interface GetRecentIVaultListParams
  extends AuthorizationParam,
    HeadersParam {
  /** Parameters that will be appended to the entity list request url that will narrow down the results. */
  urlParams: GetRecentIVaultListUrlParams;
}

/** Parameters for add iVault to recents operation. */
export interface AddIVaultToRecentsParams
  extends AuthorizationParam,
    HeadersParam {
  /** iVault id. iVault id must not be an empty or whitespace string. */
  iVaultId: string;
}

/** Parameters for remove iVault from recents operation. */
export interface RemoveIVaultFromRecentsParams
  extends AuthorizationParam,
    HeadersParam {
  /** iVault id. iVault id must not be an empty or whitespace string. */
  iVaultId: string;
}
