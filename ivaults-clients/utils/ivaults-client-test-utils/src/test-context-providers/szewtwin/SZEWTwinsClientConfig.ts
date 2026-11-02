/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { injectable } from "inversify";

import { IVaultsClientsTestsConfig } from "../../IVaultsClientsTestsConfig";

@injectable()
export class SZEWTwinsClientConfig {
  public baseUrl: string;

  constructor(config: IVaultsClientsTestsConfig) {
    this.baseUrl = config.apis.szewTwins.baseUrl;
  }
}
