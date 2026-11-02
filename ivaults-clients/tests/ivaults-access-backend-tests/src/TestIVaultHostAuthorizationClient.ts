/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { AuthorizationClient } from "@szewtwin/core-common";

export class TestIVaultHostAuthorizationClient implements AuthorizationClient {
  constructor(private _accessToken: string) {}

  public getAccessToken(): Promise<string> {
    return Promise.resolve(this._accessToken);
  }
}
