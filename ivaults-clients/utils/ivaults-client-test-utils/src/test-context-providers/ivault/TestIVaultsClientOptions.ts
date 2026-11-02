/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { injectable } from "inversify";

import { IVaultsClientOptions } from "@szewtwin/ivaults-client-authoring";
import { ApiOptions } from "@szewtwin/ivaults-client-management";
import { GoogleClientStorage } from "@szewtwin/object-storage-google/lib/client/index.js";
import { ClientStorageWrapperFactory } from "@szewtwin/object-storage-google/lib/client/wrappers/index.js";

import {
  AzureClientStorage,
  BlockBlobClientWrapperFactory,
} from "@szewtwin/object-storage-azure";
import {
  ClientStorage,
  StrategyClientStorage,
} from "@szewtwin/object-storage-core";

import { IVaultsClientsTestsConfig } from "../../IVaultsClientsTestsConfig";

@injectable()
export class TestIVaultsClientOptions implements IVaultsClientOptions {
  public api: ApiOptions;
  public cloudStorage: ClientStorage;

  constructor(config: IVaultsClientsTestsConfig) {
    this.api = { baseUrl: config.apis.iVaults.baseUrl };
    this.cloudStorage = new StrategyClientStorage([
      {
        instanceName: "azure",
        instance: new AzureClientStorage(new BlockBlobClientWrapperFactory()),
      },
      {
        instanceName: "google",
        instance: new GoogleClientStorage(new ClientStorageWrapperFactory()),
      },
    ]);
  }
}
