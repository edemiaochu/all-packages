/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import type { AccessToken } from "@szewtwin/core-szewec";
import { TestUtility } from "@szewtwin/oidc-signin-tool";
import type { TestUserCredentials } from "@szewtwin/oidc-signin-tool";

// Set up global configuration for tests
globalThis.IVJS_URL_PREFIX = process.env.IVJS_URL_PREFIX;
globalThis.IVJS_MAX_REDIRECTS = process.env.IVJS_MAX_REDIRECTS ? parseInt(process.env.IVJS_MAX_REDIRECTS, 10) : undefined;

/** Basic configuration used by all tests
 */
export class TestConfig {
  public static readonly szewTwinSearchString: string = "APIM Test";
  public static readonly szewTwinProjectName: string = "APIM Test Project";
  public static readonly szewTwinProjectNumber: string =
  "APIM-Test-Project-20210204T00-58";
  public static readonly szewTwinAssetName: string = "APIM Test Asset";
  public static readonly szewTwinAssetNumber: string = "APIM-Test-Asset-001";

  /** Login the specified user and return the AuthorizationToken */
  public static async getAccessToken(
  ): Promise<AccessToken> {
    const userCredentials: TestUserCredentials = {
      email: process.env.IVJS_SZEWTWIN_TEST_USER!,
      password: process.env.IVJS_SZEWTWIN_TEST_USER_PASSWORD!,
    };

    return TestUtility.getAccessToken(userCredentials);
  }
}
