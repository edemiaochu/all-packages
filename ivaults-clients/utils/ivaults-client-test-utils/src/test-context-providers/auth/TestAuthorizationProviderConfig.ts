/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { injectable } from "inversify";

import {
  IVaultsClientsTestsConfig,
  TestUsersConfigValues,
} from "../../IVaultsClientsTestsConfig";

interface ApiScopes {
  iVaults: string;
  szewTwins: string;
}

@injectable()
export class TestAuthorizationProviderConfig {
  public testUsers: TestUsersConfigValues;
  public apiScopes: ApiScopes;

  constructor(config: IVaultsClientsTestsConfig) {
    this.testUsers = config.testUsers;
    this.apiScopes = {
      iVaults: config.apis.iVaults.scopes,
      szewTwins: config.apis.szewTwins.scopes,
    };
  }
}
