/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import {
  IVaultsClient,
  IVaultsClientOptions,
} from "@szewtwin/ivaults-client-authoring";
import {
  AuthorizationCallback,
  Changeset,
  CheckpointState,
  GetSingleCheckpointParams,
  GetSingleNamedVersionParams,
  IVaultScopedOperationParams,
  IVaultsErrorCode,
} from "@szewtwin/ivaults-client-management";
import {
  IVaultMetadata,
  NamedVersionMetadata,
  ReusableIVaultMetadata,
  ReusableTestIVaultProvider,
  TestAuthorizationProvider,
  TestIVaultCreator,
  TestIVaultGroup,
  TestIVaultGroupFactory,
  TestSetupError,
  TestUtilTypes,
  assertCheckpoint,
  assertError,
} from "@szewtwin/ivaults-client-test-utils";

import { Constants, getTestDIContainer, getTestRunId } from "../common";

describe("[Authoring] CheckpointOperations", () => {
  let iVaultsClient: IVaultsClient;
  let authorization: AuthorizationCallback;

  let testIVault: ReusableIVaultMetadata;
  let testIVaultNamedVersion: NamedVersionMetadata;
  let testIVaultGroup: TestIVaultGroup;
  let testIVaultForWrite: IVaultMetadata;

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
      testSuiteName: "AuthoringCheckpointOperations",
    });

    const testIVaultCreator = container.get(TestIVaultCreator);
    testIVaultForWrite = await testIVaultCreator.createEmptyAndUploadChangesets(
      testIVaultGroup.getPrefixedUniqueIVaultName("Test iVault for write")
    );

    const reusableTestIVaultProvider = container.get(
      ReusableTestIVaultProvider
    );
    testIVault = await reusableTestIVaultProvider.getOrCreate();
    testIVaultNamedVersion = testIVault.namedVersions[0];
  });

  it("should get by changeset id", async () => {
    // Arrange
    const getSingleCheckpointParams: GetSingleCheckpointParams = {
      authorization,
      iVaultId: testIVault.id,
      changesetId: testIVaultNamedVersion.changesetId,
    };

    // Act
    const checkpoint = await iVaultsClient.checkpoints.getSingle(
      getSingleCheckpointParams
    );

    // Assert
    assertCheckpoint({
      actualCheckpoint: checkpoint,
      expectedCheckpointProperties: {
        changesetId: testIVaultNamedVersion.changesetId,
        changesetIndex: testIVaultNamedVersion.changesetIndex,
        state: CheckpointState.Successful,
      },
    });
  });

  it("should get by changeset index", async () => {
    // Arrange
    const getSingleCheckpointParams: GetSingleCheckpointParams = {
      authorization,
      iVaultId: testIVault.id,
      changesetIndex: testIVaultNamedVersion.changesetIndex,
    };

    // Act
    const checkpoint = await iVaultsClient.checkpoints.getSingle(
      getSingleCheckpointParams
    );

    // Assert
    assertCheckpoint({
      actualCheckpoint: checkpoint,
      expectedCheckpointProperties: {
        changesetId: testIVaultNamedVersion.changesetId,
        changesetIndex: testIVaultNamedVersion.changesetIndex,
        state: CheckpointState.Successful,
      },
    });
  });

  it("should get by named version id", async () => {
    // Arrange
    const getSingleCheckpointParams: GetSingleCheckpointParams = {
      authorization,
      iVaultId: testIVault.id,
      namedVersionId: testIVaultNamedVersion.id,
    };

    // Act
    const checkpoint = await iVaultsClient.checkpoints.getSingle(
      getSingleCheckpointParams
    );

    // Assert
    assertCheckpoint({
      actualCheckpoint: checkpoint,
      expectedCheckpointProperties: {
        changesetId: testIVaultNamedVersion.changesetId,
        changesetIndex: testIVaultNamedVersion.changesetIndex,
        state: CheckpointState.Successful,
      },
    });
  });

  it("should get latest", async () => {
    // Arrange
    const expectedNamedVersion =
      testIVault.namedVersions[testIVault.namedVersions.length - 1];
    const getSingleCheckpointParams: GetSingleCheckpointParams = {
      authorization,
      iVaultId: testIVault.id,
    };

    // Act
    const checkpoint = await iVaultsClient.checkpoints.getSingle(
      getSingleCheckpointParams
    );

    // Assert
    assertCheckpoint({
      actualCheckpoint: checkpoint,
      expectedCheckpointProperties: {
        changesetId: expectedNamedVersion.changesetId,
        changesetIndex: expectedNamedVersion.changesetIndex,
        state: CheckpointState.Successful,
      },
    });
  });

  [
    {
      label: "by changeset id",
      functionUnderTest: async (params: IVaultScopedOperationParams) =>
        iVaultsClient.checkpoints.getSingle({
          ...params,
          changesetId: testIVaultNamedVersion.changesetId,
        }),
    },
    {
      label: "by changeset index",
      functionUnderTest: async (params: IVaultScopedOperationParams) =>
        iVaultsClient.checkpoints.getSingle({
          ...params,
          changesetIndex: testIVaultNamedVersion.changesetIndex,
        }),
    },
    {
      label: "by named version id",
      functionUnderTest: async (params: IVaultScopedOperationParams) =>
        iVaultsClient.checkpoints.getSingle({
          ...params,
          namedVersionId: testIVaultNamedVersion.id,
        }),
    },
    {
      label: "(latest)",
      functionUnderTest: async (params: IVaultScopedOperationParams) =>
        iVaultsClient.checkpoints.getSingle(params),
    },
  ].forEach((testCase) => {
    it(`should not find checkpoint ${testCase.label} if iVault does not exist`, async () => {
      // Arrange
      const iVaultScopedOperationParams: IVaultScopedOperationParams = {
        authorization,
        iVaultId: "invalidIVaultId",
      };

      // Act
      let objectThrown: unknown;
      try {
        await testCase.functionUnderTest(iVaultScopedOperationParams);
      } catch (e) {
        objectThrown = e;
      }

      // Assert
      assertError({
        objectThrown,
        expectedError: {
          code: IVaultsErrorCode.IVaultNotFound,
          message: "Requested iVault is not available.",
        },
      });
    });
  });

  [
    {
      label: "by changeset id",
      functionUnderTest: async (params: IVaultScopedOperationParams) =>
        iVaultsClient.checkpoints.getSingle({
          ...params,
          changesetId: "invalidId",
        }),
    },
    {
      label: "by changeset index",
      functionUnderTest: async (params: IVaultScopedOperationParams) =>
        iVaultsClient.checkpoints.getSingle({
          ...params,
          changesetIndex: 1000,
        }),
    },
  ].forEach((testCase) => {
    it(`should not find checkpoint ${testCase.label} if changeset does not exist`, async () => {
      // Arrange
      const iVaultScopedOperationParams: IVaultScopedOperationParams = {
        authorization,
        iVaultId: testIVault.id,
      };

      // Act
      let objectThrown: unknown;
      try {
        await testCase.functionUnderTest(iVaultScopedOperationParams);
      } catch (e) {
        objectThrown = e;
      }

      // Assert
      assertError({
        objectThrown,
        expectedError: {
          code: IVaultsErrorCode.ChangesetNotFound,
          message: "Requested Changeset is not available.",
        },
      });
    });
  });

  it("should not find checkpoint by named version id if named version does not exist", async () => {
    // Arrange
    const getSingleCheckpointParams: GetSingleCheckpointParams = {
      authorization,
      iVaultId: testIVault.id,
      namedVersionId: "invalidId",
    };

    // Act
    let objectThrown: unknown;
    try {
      await iVaultsClient.checkpoints.getSingle(getSingleCheckpointParams);
    } catch (e) {
      objectThrown = e;
    }

    // Assert
    assertError({
      objectThrown,
      expectedError: {
        code: IVaultsErrorCode.NamedVersionNotFound,
        message: "Requested Named Version is not available.",
      },
    });
  });

  it("should reschedule named version checkpoint if it is not succeeded", async () => {
    // Arrange
    const changeset = await getChangesetWithoutNamedVersion({
      authorization,
      iVaultId: testIVaultForWrite.id,
    });
    const namedVersion = await iVaultsClient.namedVersions.create({
      authorization,
      iVaultId: testIVaultForWrite.id,
      namedVersionProperties: {
        name: `Named Version ${changeset.index}`,
        description: `Some description for Named Version ${changeset.index}`,
        changesetId: changeset.id,
      },
    });
    const getSingleNamedVersionParams: GetSingleNamedVersionParams = {
      authorization,
      iVaultId: testIVaultForWrite.id,
      namedVersionId: namedVersion.id,
    };

    // Act
    const checkpoint =
      await iVaultsClient.checkpoints.updateNamedVersionCheckpoint(
        getSingleNamedVersionParams
      );

    // Assert
    expect(checkpoint.changesetId).to.equal(namedVersion.changesetId);
    expect(checkpoint.changesetIndex).to.equal(namedVersion.changesetIndex);
    expect(checkpoint.state).to.equal(CheckpointState.Scheduled);
    expect(checkpoint.directoryAccessInfo).to.be.null;
    expect(checkpoint._links).to.exist;
    expect(checkpoint._links.download).to.be.null;
  });

  it("should not update named version checkpoint if checkpoint succeeded", async () => {
    // Arrange
    const getSingleNamedVersionParams: GetSingleNamedVersionParams = {
      authorization,
      iVaultId: testIVault.id,
      namedVersionId: testIVaultNamedVersion.id,
    };

    // Act
    const checkpoint =
      await iVaultsClient.checkpoints.updateNamedVersionCheckpoint(
        getSingleNamedVersionParams
      );

    // Assert
    assertCheckpoint({
      actualCheckpoint: checkpoint,
      expectedCheckpointProperties: {
        changesetId: testIVaultNamedVersion.changesetId,
        changesetIndex: testIVaultNamedVersion.changesetIndex,
        state: CheckpointState.Successful,
      },
    });
  });

  it("should not update named version checkpoint if iVault does not exist", async () => {
    // Arrange
    const getSingleNamedVersionParams: GetSingleNamedVersionParams = {
      authorization,
      iVaultId: "invalidId",
      namedVersionId: testIVaultNamedVersion.id,
    };

    // Act
    let objectThrown: unknown;
    try {
      await iVaultsClient.checkpoints.updateNamedVersionCheckpoint(
        getSingleNamedVersionParams
      );
    } catch (e) {
      objectThrown = e;
    }

    // Assert
    assertError({
      objectThrown,
      expectedError: {
        code: IVaultsErrorCode.IVaultNotFound,
        message: "Requested iVault is not available.",
      },
    });
  });

  it("should not update named version checkpoint if named version does not exist", async () => {
    // Arrange
    const getSingleNamedVersionParams: GetSingleNamedVersionParams = {
      authorization,
      iVaultId: testIVault.id,
      namedVersionId: "invalidId",
    };

    // Act
    let objectThrown: unknown;
    try {
      await iVaultsClient.checkpoints.updateNamedVersionCheckpoint(
        getSingleNamedVersionParams
      );
    } catch (e) {
      objectThrown = e;
    }

    // Assert
    assertError({
      objectThrown,
      expectedError: {
        code: IVaultsErrorCode.NamedVersionNotFound,
        message: "Requested Named Version is not available.",
      },
    });
  });

  async function getChangesetWithoutNamedVersion(
    params: IVaultScopedOperationParams
  ): Promise<Changeset> {
    for await (const changeset of iVaultsClient.changesets.getRepresentationList(
      params
    )) {
      const namedVersion = await changeset.getNamedVersion();
      if (!namedVersion) return changeset;
    }

    throw new TestSetupError(
      "Test iVault does not have any changesets without named versions."
    );
  }
});
