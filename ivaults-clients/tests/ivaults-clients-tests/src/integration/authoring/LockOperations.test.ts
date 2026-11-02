/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import {
  ConflictingLock,
  ConflictingLocksError,
  IVaultsClient,
  IVaultsClientOptions,
  LockLevel,
  LocksError,
  UpdateLockParams,
} from "@szewtwin/ivaults-client-authoring";
import {
  AuthorizationCallback,
  IVaultsErrorCode,
} from "@szewtwin/ivaults-client-management";
import {
  IVaultMetadata,
  TestAuthorizationProvider,
  TestIVaultCreator,
  TestIVaultFileProvider,
  TestIVaultGroup,
  TestIVaultGroupFactory,
  TestUtilTypes,
  assertError,
  assertLock,
} from "@szewtwin/ivaults-client-test-utils";

import { Constants, getTestDIContainer, getTestRunId } from "../common";

describe("[Authoring] LockOperations", () => {
  let iVaultsClient: IVaultsClient;
  let authorization: AuthorizationCallback;

  let testIVaultFileProvider: TestIVaultFileProvider;
  let testIVaultGroup: TestIVaultGroup;
  let testIVaultForWrite: IVaultMetadata;
  let testIVaultForWriteBriefcaseIds: number[] = [];

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
      testSuiteName: "AuthoringLockOperations",
    });

    const testIVaultCreator = container.get(TestIVaultCreator);
    testIVaultForWrite = await testIVaultCreator.createEmptyAndUploadChangesets(
      testIVaultGroup.getPrefixedUniqueIVaultName("Test iVault for write")
    );
  });

  afterEach(async () => {
    for (const briefcaseId of testIVaultForWriteBriefcaseIds) {
      await iVaultsClient.briefcases.release({
        authorization,
        iVaultId: testIVaultForWrite.id,
        briefcaseId,
      });
    }
    testIVaultForWriteBriefcaseIds = [];
  });

  after(async () => {
    await testIVaultGroup.cleanupIVaults();
  });

  it("should acquire new locks", async () => {
    // Arrange
    const briefcase = await iVaultsClient.briefcases.acquire({
      authorization,
      iVaultId: testIVaultForWrite.id,
    });
    testIVaultForWriteBriefcaseIds.push(briefcase.briefcaseId);

    const updateLockParams: UpdateLockParams = {
      authorization,
      iVaultId: testIVaultForWrite.id,
      briefcaseId: briefcase.briefcaseId,
      lockedObjects: [
        {
          lockLevel: LockLevel.Shared,
          objectIds: ["0xaa"],
        },
        {
          lockLevel: LockLevel.Exclusive,
          objectIds: ["0xbb"],
        },
      ],
    };

    // Act
    const acquiredLock = await iVaultsClient.locks.update(updateLockParams);

    // Assert
    assertLock({
      actualLock: acquiredLock,
      expectedLock: {
        briefcaseId: briefcase.briefcaseId,
        lockedObjects: updateLockParams.lockedObjects,
      },
    });
  });

  it("should release locks", async () => {
    // Arrange
    const briefcase = await iVaultsClient.briefcases.acquire({
      authorization,
      iVaultId: testIVaultForWrite.id,
    });
    testIVaultForWriteBriefcaseIds.push(briefcase.briefcaseId);

    const updateLockParams1: UpdateLockParams = {
      authorization,
      iVaultId: testIVaultForWrite.id,
      briefcaseId: briefcase.briefcaseId,
      lockedObjects: [
        {
          lockLevel: LockLevel.Exclusive,
          objectIds: ["0xcc"],
        },
      ],
    };

    await iVaultsClient.locks.update(updateLockParams1);

    const updateLockParams2: UpdateLockParams = {
      authorization,
      iVaultId: testIVaultForWrite.id,
      briefcaseId: briefcase.briefcaseId,
      changesetId: testIVaultFileProvider.changesets[0].id,
      lockedObjects: [
        {
          lockLevel: LockLevel.None,
          objectIds: updateLockParams1.lockedObjects[0].objectIds,
        },
      ],
    };

    // Act
    const releasedLock = await iVaultsClient.locks.update(updateLockParams2);

    // Assert
    assertLock({
      actualLock: releasedLock,
      expectedLock: {
        briefcaseId: briefcase.briefcaseId,
        lockedObjects: [],
      },
    });
  });

  it("should return error when trying to update non-existing lock to LockLevel.None", async () => {
    // Arrange
    const briefcase = await iVaultsClient.briefcases.acquire({
      authorization,
      iVaultId: testIVaultForWrite.id,
    });
    testIVaultForWriteBriefcaseIds.push(briefcase.briefcaseId);

    const updateLockParams: UpdateLockParams = {
      authorization,
      iVaultId: testIVaultForWrite.id,
      briefcaseId: briefcase.briefcaseId,
      lockedObjects: [
        {
          lockLevel: LockLevel.None,
          objectIds: ["0x1"],
        },
      ],
    };

    // Act
    let objectThrown: unknown;
    try {
      await iVaultsClient.locks.update(updateLockParams);
    } catch (e) {
      objectThrown = e;
    }

    // Assert
    assertError({
      objectThrown,
      expectedError: {
        code: IVaultsErrorCode.LockNotFound,
        message: "Requested Lock(s) is not available.",
      },
    });
  });

  it("should return error when trying to update lock on non-existing iVault", async () => {
    // Arrange
    const updateLockParams: UpdateLockParams = {
      authorization,
      iVaultId: "invalid iVault id",
      briefcaseId: 0,
      lockedObjects: [
        {
          lockLevel: LockLevel.Shared,
          objectIds: ["0x2"],
        },
      ],
    };

    // Act
    let objectThrown: unknown;
    try {
      await iVaultsClient.locks.update(updateLockParams);
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

  it("should return error when trying to update lock on non-existing briefcase", async () => {
    // Arrange
    const updateLockParams: UpdateLockParams = {
      authorization,
      iVaultId: testIVaultForWrite.id,
      briefcaseId: 0,
      lockedObjects: [
        {
          lockLevel: LockLevel.Shared,
          objectIds: ["0x3"],
        },
      ],
    };

    // Act
    let objectThrown: unknown;
    try {
      await iVaultsClient.locks.update(updateLockParams);
    } catch (e) {
      objectThrown = e;
    }

    // Assert
    assertError({
      objectThrown,
      expectedError: {
        code: IVaultsErrorCode.BriefcaseNotFound,
        message: "Requested Briefcase is not available.",
      },
    });
  });

  it("should return error when trying to update lock with non-existing changeset specified", async () => {
    // Arrange
    const briefcase = await iVaultsClient.briefcases.acquire({
      authorization,
      iVaultId: testIVaultForWrite.id,
    });
    testIVaultForWriteBriefcaseIds.push(briefcase.briefcaseId);

    const updateLockParams: UpdateLockParams = {
      authorization,
      iVaultId: testIVaultForWrite.id,
      briefcaseId: briefcase.briefcaseId,
      changesetId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      lockedObjects: [
        {
          lockLevel: LockLevel.Shared,
          objectIds: ["0x4"],
        },
      ],
    };

    // Act
    let objectThrown: unknown;
    try {
      await iVaultsClient.locks.update(updateLockParams);
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

  it("should return error when trying to acquire exclusive lock on an object that is already locked by another briefcase", async () => {
    // Arrange
    const briefcase1 = await iVaultsClient.briefcases.acquire({
      authorization,
      iVaultId: testIVaultForWrite.id,
    });
    testIVaultForWriteBriefcaseIds.push(briefcase1.briefcaseId);

    const updateLockParams1: UpdateLockParams = {
      authorization,
      iVaultId: testIVaultForWrite.id,
      briefcaseId: briefcase1.briefcaseId,
      lockedObjects: [
        {
          lockLevel: LockLevel.Shared,
          objectIds: ["0x5"],
        },
      ],
    };

    await iVaultsClient.locks.update(updateLockParams1);

    const briefcase2 = await iVaultsClient.briefcases.acquire({
      authorization,
      iVaultId: testIVaultForWrite.id,
    });
    testIVaultForWriteBriefcaseIds.push(briefcase2.briefcaseId);

    const updateLockParams2: UpdateLockParams = {
      authorization,
      iVaultId: testIVaultForWrite.id,
      briefcaseId: briefcase2.briefcaseId,
      lockedObjects: [
        {
          lockLevel: LockLevel.Exclusive,
          objectIds: updateLockParams1.lockedObjects[0].objectIds,
        },
      ],
    };

    // Act
    let objectThrown: unknown;
    try {
      await iVaultsClient.locks.update(updateLockParams2);
    } catch (e) {
      objectThrown = e;
    }

    // Assert
    assertError({
      objectThrown,
      expectedError: {
        code: IVaultsErrorCode.ConflictWithAnotherUser,
        message:
          "Lock(s) is owned by another Briefcase. Conflicting locks:\n" +
          `1. Object id: 0x5, lock level: shared, briefcase ids: ${briefcase1.briefcaseId}\n`,
      },
    });
    const conflictingLocks = (objectThrown as ConflictingLocksError)
      .conflictingLocks;
    expect(conflictingLocks).to.not.be.undefined;
    expect(conflictingLocks!.length).to.be.equal(1);
    const conflictingLock: ConflictingLock = conflictingLocks![0];
    expect(conflictingLock.objectId).to.be.equal("0x5");
    expect(conflictingLock.lockLevel).to.be.equal(LockLevel.Shared);
    expect(conflictingLock.briefcaseIds.length).to.be.equal(1);
    expect(conflictingLock.briefcaseIds[0]).to.be.equal(briefcase1.briefcaseId);
  });

  it("should return error when trying to acquire lock on an object that has been released with a more recent changeset", async () => {
    // Arrange
    const briefcase1 = await iVaultsClient.briefcases.acquire({
      authorization,
      iVaultId: testIVaultForWrite.id,
    });
    testIVaultForWriteBriefcaseIds.push(briefcase1.briefcaseId);

    const updateLockParams1: UpdateLockParams = {
      authorization,
      iVaultId: testIVaultForWrite.id,
      changesetId: testIVaultFileProvider.changesets[5].id,
      briefcaseId: briefcase1.briefcaseId,
      lockedObjects: [
        {
          lockLevel: LockLevel.Exclusive,
          objectIds: ["0x5"],
        },
      ],
    };
    await iVaultsClient.locks.update(updateLockParams1);

    const releaseLockParams: UpdateLockParams = {
      ...updateLockParams1,
      lockedObjects: [
        {
          lockLevel: LockLevel.None,
          objectIds: ["0x5"],
        },
      ],
    };
    await iVaultsClient.locks.update(releaseLockParams);

    const briefcase2 = await iVaultsClient.briefcases.acquire({
      authorization,
      iVaultId: testIVaultForWrite.id,
    });
    testIVaultForWriteBriefcaseIds.push(briefcase2.briefcaseId);

    const updateLockParams2: UpdateLockParams = {
      authorization,
      iVaultId: testIVaultForWrite.id,
      changesetId: testIVaultFileProvider.changesets[4].id,
      briefcaseId: briefcase2.briefcaseId,
      lockedObjects: updateLockParams1.lockedObjects,
    };

    // Act
    let objectThrown: unknown;
    try {
      await iVaultsClient.locks.update(updateLockParams2);
    } catch (e) {
      objectThrown = e;
    }

    // Assert
    assertError({
      objectThrown,
      expectedError: {
        code: IVaultsErrorCode.NewerChangesExist,
        message:
          "One or more objects have been locked in a newer Changeset. Object ids: 0x5",
      },
    });
    const objectIds = (objectThrown as LocksError).objectIds;
    expect(objectIds).to.not.be.undefined;
    expect(objectIds!.length).to.be.equal(1);
    const objectId = objectIds![0];
    expect(objectId).to.be.equal("0x5");
  });
});
