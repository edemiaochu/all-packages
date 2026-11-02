/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { OperationsBase } from "../../base/internal";
import {
  ContentType,
  HttpResponse,
  Thumbnail,
  ThumbnailSize,
} from "../../base/types";
import { OperationOptions } from "../OperationOptions";

import {
  DownloadThumbnailParams,
  UploadThumbnailParams,
} from "./ThumbnailOperationParams";

export class ThumbnailOperations<
  TOptions extends OperationOptions
> extends OperationsBase<TOptions> {
  /**
   * Downloads a thumbnail for a specific iVault. The Thumbnail returned is either a default one or a custom
   * uploaded one. Wraps the
   * {@link https://developer.szewec.com/apis/ivaults-v2/operations/get-ivault-thumbnail/ Download iVault Thumbnail}
   * operation from iVaults API.
   * @param {DownloadThumbnailParams} params parameters for this operation. See {@link DownloadThumbnailParams}.
   * @returns {Promise<Thumbnail>} downloaded Thumbnail. See {@link Thumbnail}. The method returns the data in binary
   * form which can then be consumed depending on the environment.
   * @example
   * Save data to local file (Node.js):
   * ```
   *  const thumbnail: Thumbnail = await iVaultsClient.thumbnails.download({ ... });
   *  await fs.promises.writeFile("thumbnail.png", Buffer.from(thumbnail.data.buffer), "binary");
   * ```
   */
  public async download(params: DownloadThumbnailParams): Promise<Thumbnail> {
    // By default iVaults API returns a small thumbnail. We specify the size explicitly to be able
    // to return to user the information which thumbnail is this.
    const urlParams = {
      ...params.urlParams,
      size: params.urlParams?.size ?? ThumbnailSize.Small,
    };
    const url = this._options.urlFormatter.getThumbnailUrl({
      iVaultId: params.iVaultId,
      urlParams,
    });
    const response: HttpResponse<Uint8Array> = await this.sendGetRequest({
      authorization: params.authorization,
      url,
      responseType: ContentType.Png,
      headers: params.headers,
    });

    return {
      size: urlParams.size,
      imageType: ContentType.Png,
      image: response.body,
    };
  }

  /**
   * Uploads a custom iVault Thumbnail. Wraps the
   * {@link https://developer.szewec.com/apis/ivaults-v2/operations/upload-ivault-thumbnail/ Upload iVault Thumbnail}
   * operation from iVaults API.
   * @param {UploadThumbnailParams} params parameters for this operation. See {@link UploadThumbnailParams}.
   * @returns {Promise<void>} a promise that resolves after operation completes.
   */
  public async upload(params: UploadThumbnailParams): Promise<void> {
    const url = this._options.urlFormatter.getThumbnailUrl({
      iVaultId: params.iVaultId,
    });
    await this.sendPutRequest({
      authorization: params.authorization,
      url,
      contentType: params.thumbnailProperties.imageType,
      body: params.thumbnailProperties.image,
      headers: params.headers,
    });
  }
}
