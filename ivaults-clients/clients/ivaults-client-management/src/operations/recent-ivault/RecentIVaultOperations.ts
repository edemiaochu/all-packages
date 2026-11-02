/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  EntityListIteratorImpl,
  IVaultsResponse,
  OperationsBase,
} from "../../base/internal";
import {
  EntityListIterator,
  IVault,
  MinimalIVault,
  PreferReturn,
} from "../../base/types";
import { OperationOptions } from "../OperationOptions";

import {
  AddIVaultToRecentsParams,
  GetRecentIVaultListParams,
  RemoveIVaultFromRecentsParams,
} from "./RecentIVaultOperationParams";

export class RecentIVaultOperations<
  TOptions extends OperationOptions
> extends OperationsBase<TOptions> {
  /**
   * Gets recently used iVaults for a specific szewTwin. A user can only have 25 recently used iVaults.
   * They are returned in order with the most recently used iVault first in the list. This method returns iVaults in their minimal representation.
   * The returned iterator internally queries entities in pages. Wraps the
   * {@link https://developer.szewec.com/apis/ivaults-v2/operations/get-my-recently-used-ivaults/ Get My Recently Used szewTwin iVaults}
   * operation from iVaults API.
   * @param {GetRecentIVaultListParams} params parameters for this operation. See {@link GetRecentIVaultListParams}.
   * @returns {EntityListIterator<MinimalIVault>} iterator for recent iVault list. See {@link EntityListIterator}, {@link MinimalIVault}.
   */
  public getMinimalList(
    params: GetRecentIVaultListParams
  ): EntityListIterator<MinimalIVault> {
    return new EntityListIteratorImpl(async () =>
      this.getEntityCollectionPage<
        MinimalIVault,
        IVaultsResponse<MinimalIVault>
      >({
        authorization: params.authorization,
        url: this._options.urlFormatter.getRecentIVaultListUrl({
          urlParams: params.urlParams,
        }),
        preferReturn: PreferReturn.Minimal,
        entityCollectionAccessor: (response) => response.body.iVaults,
        headers: params.headers,
      })
    );
  }

  /**
   * Gets recently used iVaults for a specific szewTwin. A user can only have 25 recently used iVaults.
   * They are returned in order with the most recently used iVault first in the list. This method returns iVaults in their full representation.
   * The returned iterator internally queries entities in pages. Wraps the
   * {@link https://developer.szewec.com/apis/ivaults-v2/operations/get-my-recently-used-ivaults/ Get My Recently Used szewTwin iVaults}
   * operation from iVaults API.
   * @param {GetRecentIVaultListParams} params parameters for this operation. See {@link GetRecentIVaultListParams}.
   * @returns {EntityListIterator<IVault>} iterator for recent iVault list. See {@link EntityListIterator}, {@link IVault}.
   */
  public getRepresentationList(
    params: GetRecentIVaultListParams
  ): EntityListIterator<IVault> {
    return new EntityListIteratorImpl(async () =>
      this.getEntityCollectionPage<IVault, IVaultsResponse<IVault>>({
        authorization: params.authorization,
        url: this._options.urlFormatter.getRecentIVaultListUrl({
          urlParams: params.urlParams,
        }),
        preferReturn: PreferReturn.Representation,
        entityCollectionAccessor: (response) => response.body.iVaults,
        headers: params.headers,
      })
    );
  }

  /**
   * Adds an iVault to the calling user's recently used iVaults list. No more than 25 iVaults are
   * stored in the recently used list. Older ones are removed to make room for new ones. Wraps the
   * {@link https://developer.szewec.com/apis/ivaults-v2/operations/add-ivault-to-my-recents/ Add iVault to My Recents}
   * operation from iVaults API.
   * @param {AddIVaultToRecentsParams} params parameters for this operation. See {@link AddIVaultToRecentsParams}.
   * @returns {Promise<void>}
   */
  public async add(params: AddIVaultToRecentsParams): Promise<void> {
    await this.sendPostRequest({
      authorization: params.authorization,
      url: this._options.urlFormatter.getRecentIVaultUrl({
        iVaultId: params.iVaultId,
      }),
      headers: params.headers,
      body: undefined,
    });
  }

  /**
   * Removes an iVault from the calling user's recents list. Wraps the
   * {@link https://developer.szewec.com/apis/ivaults-v2/operations/remove-ivault-from-my-recents/ Remove iVault from My Recents}
   * operation from iVaults API.
   * @param {RemoveIVaultFromRecentsParams} params parameters for this operation. See {@link RemoveIVaultFromRecentsParams}.
   * @returns {Promise<void>}
   */
  public async remove(params: RemoveIVaultFromRecentsParams): Promise<void> {
    await this.sendDeleteRequest({
      authorization: params.authorization,
      url: this._options.urlFormatter.getRecentIVaultUrl({
        iVaultId: params.iVaultId,
      }),
      headers: params.headers,
    });
  }
}
