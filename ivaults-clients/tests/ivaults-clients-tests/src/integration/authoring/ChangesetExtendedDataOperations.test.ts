/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  CreateChangesetExtendedDataParams,
  IVaultsClient,
  IVaultsClientOptions,
} from "@szewtwin/ivaults-client-authoring";
import {
  AuthorizationCallback,
  ChangesetExtendedData,
  GetSingleChangesetExtendedDataParams,
} from "@szewtwin/ivaults-client-management";
import {
  IVaultMetadata,
  TestAuthorizationProvider,
  TestIVaultCreator,
  TestIVaultFileProvider,
  TestIVaultGroup,
  TestIVaultGroupFactory,
  TestUtilTypes,
  assertChangesetExtendedData,
} from "@szewtwin/ivaults-client-test-utils";

import { Constants, getTestDIContainer, getTestRunId } from "../common";

describe("[Authoring] ChangesetExtendedDataOperations", () => {
  let iVaultsClient: IVaultsClient;
  let authorization: AuthorizationCallback;

  let testIVaultFileProvider: TestIVaultFileProvider;
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

    testIVaultFileProvider = container.get(TestIVaultFileProvider);

    const testIVaultGroupFactory = container.get(TestIVaultGroupFactory);
    testIVaultGroup = testIVaultGroupFactory.create({
      testRunId: getTestRunId(),
      packageName: Constants.PackagePrefix,
      testSuiteName: "AuthoringChangesetExtendedDataOperations",
    });

    const testIVaultCreator = container.get(TestIVaultCreator);
    testIVault = await testIVaultCreator.createEmptyAndUploadChangesets(
      testIVaultGroup.getPrefixedUniqueIVaultName("Test iVault for write")
    );
  });

  after(async () => {
    await testIVaultGroup.cleanupIVaults();
  });

  it("create changeset extended data", async () => {
    // Arrange
    const expectedDataObject: object = { "some key": "some value" };
    const expectedChangesetExtendedData = {
      changesetId: testIVaultFileProvider.changesets[0].id,
      changesetIndex: 1,
      data: expectedDataObject,
    };

    const createChangesetExtendedDataParams: CreateChangesetExtendedDataParams =
      {
        authorization,
        iVaultId: testIVault.id,
        changesetIndex: expectedChangesetExtendedData.changesetIndex,
        changesetExtendedDataProperties: {
          data: expectedDataObject,
        },
      };

    // Act
    const changesetExtendedData: ChangesetExtendedData =
      await iVaultsClient.changesetExtendedData.create(
        createChangesetExtendedDataParams
      );

    // Assert
    assertChangesetExtendedData({
      actualChangesetExtendedData: changesetExtendedData,
      expectedChangesetExtendedData,
    });

    // Arrange
    const getSingleChangesetExtendedDataParams: GetSingleChangesetExtendedDataParams =
      {
        authorization,
        iVaultId: testIVault.id,
        changesetIndex: expectedChangesetExtendedData.changesetIndex,
      };

    // Act
    const singleChangesetExtendedData: ChangesetExtendedData =
      await iVaultsClient.changesetExtendedData.getSingle(
        getSingleChangesetExtendedDataParams
      );

    // Assert
    assertChangesetExtendedData({
      actualChangesetExtendedData: singleChangesetExtendedData,
      expectedChangesetExtendedData,
    });
  });
});
