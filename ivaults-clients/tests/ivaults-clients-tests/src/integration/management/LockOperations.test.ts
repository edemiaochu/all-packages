/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import {
  IVaultsClient as AuthoringIVaultsClient,
  IVaultsClientOptions as AuthoringIVaultsClientOptions,
  UpdateLockParams,
} from "@szewtwin/ivaults-client-authoring";
import {
  AuthorizationCallback,
  GetLockListParams,
  IVaultsClient,
  IVaultsClientOptions,
  Lock,
  LockLevel,
  LockLevelFilter,
  ReleaseLocksChunkParams,
  toArray,
} from "@szewtwin/ivaults-client-management";
import {
  IVaultMetadata,
  ReusableIVaultMetadata,
  ReusableTestIVaultProvider,
  TestAuthorizationProvider,
  TestIVaultCreator,
  TestIVaultGroup,
  TestIVaultGroupFactory,
  TestUtilTypes,
  assertCollection,
  assertLock,
} from "@szewtwin/ivaults-client-test-utils";

import { Constants, getTestDIContainer, getTestRunId } from "../common";

describe("[Management] LockOperations", () => {
  let iVaultsClient: IVaultsClient;
  let authorization: AuthorizationCallback;

  let testIVaultForRead: ReusableIVaultMetadata;

  let testIVaultGroup: TestIVaultGroup;
  let testIVaultForWrite: IVaultMetadata;
  let testIVaultForWriteBriefcaseIds: number[] = [];
  let authoringClient: AuthoringIVaultsClient;

  before(async () => {
    const container = getTestDIContainer();

    const iVaultsClientOptions = container.get<IVaultsClientOptions>(
      TestUtilTypes.IVaultsClientOptions
    );
    iVaultsClient = new IVaultsClient(iVaultsClientOptions);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    const reusableTestIVaultProvider = container.get(
      ReusableTestIVaultProvider
    );
    testIVaultForRead = await reusableTestIVaultProvider.getOrCreate();

    const testIVaultGroupFactory = container.get(TestIVaultGroupFactory);
    testIVaultGroup = testIVaultGroupFactory.create({
      testRunId: getTestRunId(),
      packageName: Constants.PackagePrefix,
      testSuiteName: "ManagementLockOperations",
    });

    const authoringClientOptions = container.get<AuthoringIVaultsClientOptions>(
      TestUtilTypes.IVaultsClientOptions
    );
    authoringClient = new AuthoringIVaultsClient(authoringClientOptions);

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

  it("should return all items when querying collection", async () => {
    // Arrange
    const getLockListParams: GetLockListParams = {
      authorization,
      iVaultId: testIVaultForRead.id,
    };

    // Act
    const locks = iVaultsClient.locks.getList(getLockListParams);

    // Assert
    await assertCollection({
      asyncIterable: locks,
      isEntityCountCorrect: (count) => count === 1,
    });
  });

  it("should return correct values when querying collection with briefcaseId filter", async () => {
    // Arrange
    const getLockListParams: GetLockListParams = {
      authorization,
      iVaultId: testIVaultForRead.id,
      urlParams: {
        briefcaseId: testIVaultForRead.briefcases[0].id,
      },
    };

    // Act
    const locks = iVaultsClient.locks.getList(getLockListParams);

    // Assert
    const lockArray = await toArray(locks);
    const lock = lockArray[0];
    assertLock({
      actualLock: lock,
      expectedLock: testIVaultForRead.lock,
    });
  });

  it("should return empty collection when querying locks for non-existent briefcase", async () => {
    // Arrange
    const getLockListParams: GetLockListParams = {
      authorization,
      iVaultId: testIVaultForRead.id,
      urlParams: {
        briefcaseId: 500,
      },
    };

    // Act
    const locks = iVaultsClient.locks.getList(getLockListParams);

    // Assert
    const lockArray = await toArray(locks);
    expect(lockArray.length).to.equal(0);
  });

  ([LockLevel.Shared, LockLevel.Exclusive] as LockLevelFilter[]).forEach(
    (lockLevel) => {
      it(`should return correct values when querying collection with lockLevel filter (${lockLevel})`, async () => {
        // Arrange
        const expectedLock: Lock = {
          briefcaseId: testIVaultForRead.lock.briefcaseId,
          lockedObjects: testIVaultForRead.lock.lockedObjects.filter(
            (lockedObject) => lockedObject.lockLevel === lockLevel
          ),
        };
        expect(expectedLock.lockedObjects.length).to.be.greaterThan(0);

        const getLockListParams: GetLockListParams = {
          authorization,
          iVaultId: testIVaultForRead.id,
          urlParams: {
            lockLevel,
          },
        };

        // Act
        const locks = iVaultsClient.locks.getList(getLockListParams);

        // Assert
        const lockArray = await toArray(locks);
        expect(lockArray.length).to.be.equal(1);
        const actualLock = lockArray[0];
        assertLock({
          actualLock,
          expectedLock,
        });
      });
    }
  );

  it("should release locks chunk", async () => {
    // Arrange
    const briefcase = await authoringClient.briefcases.acquire({
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
          lockLevel: LockLevel.Exclusive,
          objectIds: ["0xdd", "0xee", "0xff"],
        },
      ],
    };
    await authoringClient.locks.update(updateLockParams);

    const releaseLocksChunkParams: ReleaseLocksChunkParams = {
      authorization,
      iVaultId: testIVaultForWrite.id,
      briefcaseId: briefcase.briefcaseId,
    };

    // Act
    const result = await iVaultsClient.locks.releaseLocksChunk(
      releaseLocksChunkParams
    );

    // Assert
    expect(result.isLastChunk).to.be.true;

    const getLockListParams: GetLockListParams = {
      authorization,
      iVaultId: testIVaultForWrite.id,
      urlParams: {
        briefcaseId: briefcase.briefcaseId,
      },
    };
    const locks = iVaultsClient.locks.getList(getLockListParams);
    const lockArray = await toArray(locks);
    expect(lockArray.length).to.equal(0);
  });
});
