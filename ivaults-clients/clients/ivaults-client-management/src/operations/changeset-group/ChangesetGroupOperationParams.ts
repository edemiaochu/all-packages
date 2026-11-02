/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  CollectionRequestParams,
  IVaultScopedOperationParams,
} from "../../base/types";

/** Url parameters supported in Changeset Group list query. */
export type GetChangesetGroupListUrlParams = CollectionRequestParams;

/** Parameters for get Changeset Group list operation. */
export interface GetChangesetGroupListParams
  extends IVaultScopedOperationParams {
  /** Parameters that will be appended to the entity list request url that will narrow down the results. */
  urlParams?: GetChangesetGroupListUrlParams;
}

/** Parameters for get single Changeset Group operation. */
export interface GetSingleChangesetGroupParams
  extends IVaultScopedOperationParams {
  /** Changeset Group id. */
  changesetGroupId: string;
}
