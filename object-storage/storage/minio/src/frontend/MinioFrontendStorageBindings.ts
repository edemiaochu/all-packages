/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  Types as CoreTypes,
  FrontendStorage,
  FrontendStorageBindingsConfig,
} from "@szewtwin/object-storage-core/lib/frontend";
import {
  S3FrontendStorageBindings,
  Types as S3Types,
} from "@szewtwin/object-storage-s3/lib/frontend";

import { DIContainer } from "@szewtwin/cloud-agnostic-core";

import { Constants } from "../common";

import { MinioFrontendStorage } from "./MinioFrontendStorage";
import { FrontendMinioS3ClientWrapperFactory } from "./wrappers/FrontendMinioS3ClientFactory";

export class MinioFrontendStorageBindings extends S3FrontendStorageBindings {
  public override readonly dependencyName: string = Constants.storageType;

  public override register(
    container: DIContainer,
    config?: FrontendStorageBindingsConfig
  ): void {
    super.register(container, config);

    container.unregister<FrontendStorage>(CoreTypes.Frontend.frontendStorage);
    container.registerFactory<FrontendStorage>(
      CoreTypes.Frontend.frontendStorage,
      (c: DIContainer) =>
        new MinioFrontendStorage(
          c.resolve(CoreTypes.Frontend.clientWrapperFactory),
          c.resolve(CoreTypes.Frontend.urlTransferClient)
        )
    );

    container.unregister(CoreTypes.Frontend.clientWrapperFactory);
    container.registerFactory(
      CoreTypes.Frontend.clientWrapperFactory,
      (c: DIContainer) =>
        new FrontendMinioS3ClientWrapperFactory(
          c.resolve<FrontendStorageBindingsConfig>(
            S3Types.S3Frontend.config
          ).retryOptions
        )
    );
  }
}
