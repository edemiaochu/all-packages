/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  AcquireBriefcaseParams,
  IVaultsClient,
  IVaultsClientOptions,
} from "@szewtwin/ivaults-client-authoring";
import {
  AuthorizationCallback,
  Briefcase,
} from "@szewtwin/ivaults-client-management";
import {
  IVaultMetadata,
  TestAuthorizationProvider,
  TestIVaultCreator,
  TestIVaultGroup,
  TestIVaultGroupFactory,
  TestUtilTypes,
  assertBriefcase,
} from "@szewtwin/ivaults-client-test-utils";

import { Constants, getTestDIContainer, getTestRunId } from "../common";

describe("[Authoring] BriefcaseOperations", () => {
  let iVaultsClient: IVaultsClient;
  let authorization: AuthorizationCallback;

  let testIVaultGroup: TestIVaultGroup;
  let testIVault: IVaultMetadata;

  before(async () => {
    const container = getTestDIContainer();

    const iVaultsClientOptions = container.get<IVaultsClientOptions>(
      TestUtilTypes.IVaultsClientOptions
    );
    iVaultsClient = new IVaultsClient(iVaultsClientOptions);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    const testIVaultGroupFactory = container.get(TestIVaultGroupFactory);
    testIVaultGroup = testIVaultGroupFactory.create({
      testRunId: getTestRunId(),
      packageName: Constants.PackagePrefix,
      testSuiteName: "AuthoringBriefcaseOperations",
    });

    const testIVaultCreator = container.get(TestIVaultCreator);
    testIVault = await testIVaultCreator.createEmpty(
      testIVaultGroup.getPrefixedUniqueIVaultName("Test iVault for write")
    );
  });

  after(async () => {
    await testIVaultGroup.cleanupIVaults();
  });

  it("should acquire briefcase", async () => {
    // Arrange
    const acquireBriefcaseParams: AcquireBriefcaseParams = {
      authorization,
      iVaultId: testIVault.id,
      briefcaseProperties: {
        deviceName: "some device name",
      },
    };

    // Act
    const briefcase: Briefcase = await iVaultsClient.briefcases.acquire(
      acquireBriefcaseParams
    );

    // Assert
    await assertBriefcase({
      actualBriefcase: briefcase,
      expectedBriefcaseProperties: acquireBriefcaseParams.briefcaseProperties!,
    });
  });
});
