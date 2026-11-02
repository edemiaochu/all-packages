/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  CreateChangesetGroupParams,
  IVaultsClient,
  IVaultsClientOptions,
  UpdateChangesetGroupParams,
} from "@szewtwin/ivaults-client-authoring";
import {
  AuthorizationCallback,
  ChangesetGroup,
  ChangesetGroupState,
} from "@szewtwin/ivaults-client-management";
import {
  IVaultMetadata,
  TestAuthorizationProvider,
  TestIVaultCreator,
  TestIVaultGroup,
  TestIVaultGroupFactory,
  TestUtilTypes,
  assertChangesetGroup,
} from "@szewtwin/ivaults-client-test-utils";

import { Constants, getTestDIContainer, getTestRunId } from "../common";

describe("[Authoring] ChangesetGroupOperations", () => {
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
      testSuiteName: "AuthoringChangesetGroupOperations",
    });

    const testIVaultCreator = container.get(TestIVaultCreator);
    testIVault = await testIVaultCreator.createEmpty(
      testIVaultGroup.getPrefixedUniqueIVaultName("Test iVault for write")
    );
  });

  after(async () => {
    await testIVaultGroup.cleanupIVaults();
  });

  it("should create changeset group", async () => {
    // Arrange
    const createChangesetGroupParams: CreateChangesetGroupParams = {
      authorization,
      iVaultId: testIVault.id,
      changesetGroupProperties: {
        description: "some description",
      },
    };

    // Act
    const changesetGroup: ChangesetGroup =
      await iVaultsClient.changesetGroups.create(createChangesetGroupParams);

    // Assert
    await assertChangesetGroup({
      actualChangesetGroup: changesetGroup,
      expectedChangesetGroupProperties: {
        ...createChangesetGroupParams.changesetGroupProperties,
        state: ChangesetGroupState.InProgress,
      },
    });
  });

  it("should update changeset group", async () => {
    // Arrange
    const createChangesetGroupParams: CreateChangesetGroupParams = {
      authorization,
      iVaultId: testIVault.id,
      changesetGroupProperties: {
        description: "some description",
      },
    };
    const changesetGroup: ChangesetGroup =
      await iVaultsClient.changesetGroups.create(createChangesetGroupParams);
    const updateChangesetGroupParams: UpdateChangesetGroupParams = {
      authorization,
      iVaultId: testIVault.id,
      changesetGroupId: changesetGroup.id,
      changesetGroupProperties: {
        state: ChangesetGroupState.Completed,
      },
    };

    // Act
    const updatedChangesetGroup = await iVaultsClient.changesetGroups.update(
      updateChangesetGroupParams
    );

    // Assert
    await assertChangesetGroup({
      actualChangesetGroup: updatedChangesetGroup,
      expectedChangesetGroupProperties: {
        ...createChangesetGroupParams.changesetGroupProperties,
        ...updateChangesetGroupParams.changesetGroupProperties,
      },
    });
  });
});
