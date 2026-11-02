/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  BaselineFile,
  BaselineFileState,
  GetSingleBaselineFileParams,
  IVaultsClient,
  IVaultsClientOptions,
} from "@szewtwin/ivaults-client-authoring";
import { AuthorizationCallback } from "@szewtwin/ivaults-client-management";
import {
  IVaultMetadata,
  ReusableTestIVaultProvider,
  TestAuthorizationProvider,
  TestIVaultFileProvider,
  TestUtilTypes,
  assertBaselineFile,
} from "@szewtwin/ivaults-client-test-utils";

import { getTestDIContainer } from "../common";

describe("[Authoring] BaselineFileOperations", () => {
  let iVaultsClient: IVaultsClient;
  let authorization: AuthorizationCallback;

  let testIVaultFileProvider: TestIVaultFileProvider;
  let testIVaultForRead: IVaultMetadata;

  before(async () => {
    const container = getTestDIContainer();

    const iVaultsClientOptions = container.get<IVaultsClientOptions>(
      TestUtilTypes.IVaultsClientOptions
    );
    iVaultsClient = new IVaultsClient(iVaultsClientOptions);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    testIVaultFileProvider = container.get(TestIVaultFileProvider);

    const reusableTestIVaultProvider = container.get(
      ReusableTestIVaultProvider
    );
    testIVaultForRead = await reusableTestIVaultProvider.getOrCreate();
  });

  it("should return baseline file by iVault id", async () => {
    // Arrange
    const getSingleBaselineFileParams: GetSingleBaselineFileParams = {
      authorization,
      iVaultId: testIVaultForRead.id,
    };

    // Act
    const baselineFile: BaselineFile =
      await iVaultsClient.baselineFiles.getSingle(getSingleBaselineFileParams);

    // Assert
    await assertBaselineFile({
      actualBaselineFile: baselineFile,
      expectedBaselineFileProperties: {
        state: BaselineFileState.Initialized,
      },
      expectedTestBaselineFile: testIVaultFileProvider.iVault,
    });
  });
});
