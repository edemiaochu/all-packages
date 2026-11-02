/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { instanceOfUrlTransferInput } from "@szewtwin/object-storage-core/lib/common/internal";
import {
  FrontendConfigUploadInput,
  FrontendUrlUploadInput,
} from "@szewtwin/object-storage-core/lib/frontend";
import { FrontendUrlTransferClient } from "@szewtwin/object-storage-core/lib/frontend/internal";
import {
  FrontendS3ClientWrapperFactory,
  S3FrontendStorage,
} from "@szewtwin/object-storage-s3/lib/frontend";

import { handleMinioUrlUploadFrontend } from "./internal";

export class MinioFrontendStorage extends S3FrontendStorage {
  public constructor(
    clientWrapperFactory: FrontendS3ClientWrapperFactory,
    urlTransferClient?: FrontendUrlTransferClient
  ) {
    super(clientWrapperFactory, urlTransferClient);
  }

  public override async upload(
    input: FrontendUrlUploadInput | FrontendConfigUploadInput
  ): Promise<void> {
    if (instanceOfUrlTransferInput(input))
      return handleMinioUrlUploadFrontend(input, this._urlTransferClient);
    else return super.upload(input);
  }
}
