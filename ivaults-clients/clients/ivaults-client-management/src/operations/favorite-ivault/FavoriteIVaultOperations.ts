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
  AddIVaultToFavoritesParams,
  GetFavoriteIVaultListParams,
  RemoveIVaultFromFavoritesParams,
} from "./FavoriteIVaultOperationParams";

export class FavoriteIVaultOperations<
  TOptions extends OperationOptions
> extends OperationsBase<TOptions> {
  /**
   * Gets favorite iVaults for a specific szewTwin. This method returns iVaults in their minimal representation. The returned iterator
   * internally queries entities in pages. Wraps the {@link https://developer.szewec.com/apis/ivaults-v2/operations/get-my-favorite-ivaults/ Get My Favorite szewTwin iVaults}
   * operation from iVaults API.
   * @param {GetFavoriteIVaultListParams} params parameters for this operation. See {@link GetFavoriteIVaultListParams}.
   * @returns {EntityListIterator<MinimalIVault>} iterator for favorite iVault list. See {@link EntityListIterator}, {@link MinimalIVault}.
   */
  public getMinimalList(
    params: GetFavoriteIVaultListParams
  ): EntityListIterator<MinimalIVault> {
    return new EntityListIteratorImpl(async () =>
      this.getEntityCollectionPage<
        MinimalIVault,
        IVaultsResponse<MinimalIVault>
      >({
        authorization: params.authorization,
        url: this._options.urlFormatter.getFavoriteIVaultListUrl({
          urlParams: params.urlParams,
        }),
        preferReturn: PreferReturn.Minimal,
        entityCollectionAccessor: (response) => response.body.iVaults,
        headers: params.headers,
      })
    );
  }

  /**
   * Gets favorite iVaults for a specific szewTwin. This method returns iVaults in their full representation. The returned iterator
   * internally queries entities in pages. Wraps the {@link https://developer.szewec.com/apis/ivaults-v2/operations/get-my-favorite-ivaults/ Get My Favorite szewTwin iVaults}
   * operation from iVaults API.
   * @param {GetFavoriteIVaultListParams} params parameters for this operation. See {@link GetFavoriteIVaultListParams}.
   * @returns {EntityListIterator<IVault>} iterator for favorite iVault list. See {@link EntityListIterator}, {@link IVault}.
   */
  public getRepresentationList(
    params: GetFavoriteIVaultListParams
  ): EntityListIterator<IVault> {
    return new EntityListIteratorImpl(async () =>
      this.getEntityCollectionPage<IVault, IVaultsResponse<IVault>>({
        authorization: params.authorization,
        url: this._options.urlFormatter.getFavoriteIVaultListUrl({
          urlParams: params.urlParams,
        }),
        preferReturn: PreferReturn.Representation,
        entityCollectionAccessor: (response) => response.body.iVaults,
        headers: params.headers,
      })
    );
  }

  /**
   * Adds an iVault to the calling user's favorites list. Wraps the
   * {@link https://developer.szewec.com/apis/ivaults-v2/operations/add-ivault-to-my-favorites/ Add iVault to My Favorites}
   * operation from iVaults API.
   * @param {AddIVaultToFavoritesParams} params parameters for this operation. See {@link AddIVaultToFavoritesParams}.
   * @returns {Promise<void>}
   */
  public async add(params: AddIVaultToFavoritesParams): Promise<void> {
    await this.sendPutRequest({
      authorization: params.authorization,
      url: this._options.urlFormatter.getFavoriteIVaultUrl({
        iVaultId: params.iVaultId,
      }),
      headers: params.headers,
      body: new Uint8Array(),
    });
  }

  /**
   * Removes an iVault from the calling user's favorites list. Wraps the
   * {@link https://developer.szewec.com/apis/ivaults-v2/operations/remove-ivault-from-my-favorites/ Remove iVault from My Favorites}
   * operation from iVaults API.
   * @param {RemoveIVaultFromFavoritesParams} params parameters for this operation. See {@link RemoveIVaultFromFavoritesParams}.
   * @returns {Promise<void>}
   */
  public async remove(params: RemoveIVaultFromFavoritesParams): Promise<void> {
    await this.sendDeleteRequest({
      authorization: params.authorization,
      url: this._options.urlFormatter.getFavoriteIVaultUrl({
        iVaultId: params.iVaultId,
      }),
      headers: params.headers,
    });
  }
}
