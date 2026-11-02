/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { injectable } from "inversify";

import {
  BehaviorOptions,
  IVaultsClientsTestsConfig,
} from "../../IVaultsClientsTestsConfig";

@injectable()
export class ReusableTestIVaultProviderConfig {
  public testIVaultName: string;
  public behaviorOptions: Pick<BehaviorOptions, "recreateReusableIVault">;

  constructor(config: IVaultsClientsTestsConfig) {
    this.testIVaultName = config.testIVaultName;
    this.behaviorOptions = config.behaviorOptions;
  }
}
