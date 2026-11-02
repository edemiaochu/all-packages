/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { injectable } from "inversify";

import { TestAuthorizationProvider } from "../auth/TestAuthorizationProvider";

import { SZEWTwinsClient } from "./SZEWTwinsClient";
import { TestSZEWTwinProviderConfig } from "./TestSZEWTwinProviderConfig";

@injectable()
export class TestSZEWTwinProvider {
  private _szewTwinId: string | undefined;

  constructor(
    private readonly _testSZEWTwinProviderConfig: TestSZEWTwinProviderConfig,
    private readonly _szewTwinsClient: SZEWTwinsClient,
    private readonly _testAuthorizationProvider: TestAuthorizationProvider
  ) {}

  public async getOrCreate(): Promise<string> {
    return this._szewTwinId ?? (await this.initialize());
  }

  private async initialize(): Promise<string> {
    const authorization =
      this._testAuthorizationProvider.getAdmin1AuthorizationForSZEWTwins();
    this._szewTwinId = await this._szewTwinsClient.getOrCreateSZEWTwin({
      authorization,
      szewTwinName: this._testSZEWTwinProviderConfig.testSZEWTwinName,
    });
    return this._szewTwinId;
  }
}
