/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as path from "path";

import { Container } from "inversify";

import { IVaultsClientOptions } from "@szewtwin/ivaults-client-management";
import {
  ReusableTestIVaultProvider,
  TestAuthorizationProvider,
  TestSZEWTwinProvider,
  TestUtilBootstrapper,
  TestUtilTypes,
} from "@szewtwin/ivaults-client-test-utils";

import { FrontendTestEnvVariableKeys } from "./FrontendTestEnvVariableKeys";

export async function setupIntegrationTests(
  _on: unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: { env: any }
): Promise<unknown> {
  const container = new Container();
  TestUtilBootstrapper.bind(container, path.join(__dirname, "..", ".env"));

  const iVaultsClientOptions = container.get<IVaultsClientOptions>(
    TestUtilTypes.IVaultsClientOptions
  );
  config.env[FrontendTestEnvVariableKeys.iVaultsClientApiOptions] =
    JSON.stringify(iVaultsClientOptions.api);

  const authorizationProvider = container.get(TestAuthorizationProvider);
  const authorizationCallback = authorizationProvider.getAdmin1Authorization();
  const authorizationInfo = await authorizationCallback();
  config.env[FrontendTestEnvVariableKeys.admin1AuthorizationInfo] =
    JSON.stringify(authorizationInfo);

  const testSZEWTwinProvider = container.get(TestSZEWTwinProvider);
  const szewTwinId = await testSZEWTwinProvider.getOrCreate();
  config.env[FrontendTestEnvVariableKeys.testSZEWTwinId] = szewTwinId;

  const reusableTestIVaultProvider = container.get(ReusableTestIVaultProvider);
  const testIVaultForRead = await reusableTestIVaultProvider.getOrCreate();
  config.env[FrontendTestEnvVariableKeys.testIVaultForReadId] =
    testIVaultForRead.id;

  config.env[FrontendTestEnvVariableKeys.testPngFilePath] = path.join(
    __dirname,
    "assets",
    "Sample.png"
  );

  return config;
}
