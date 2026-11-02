/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
const frontendTestEnvVariableKeys = {
  iVaultsClientApiOptions: "iVaultsClientApiOptions",
  admin1AuthorizationInfo: "admin1AuthorizationInfo",

  testSZEWTwinId: "testSZEWTwinId",
  testIVaultForReadId: "testIVaultForReadId",

  testPngFilePath: "testPngFilePath",
} as const;

export { frontendTestEnvVariableKeys as FrontendTestEnvVariableKeys };
