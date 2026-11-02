/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { assert } from "console";
import * as fs from "fs";
import * as path from "path";

import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";

import {
  AcquireNewBriefcaseIdArg,
  BriefcaseDbArg,
  ChangesetRangeArg,
  CheckpointProps,
  CreateNewIVaultProps,
  DownloadChangesetRangeArg,
  DownloadRequest,
  IVaultHost,
  IVaultIdArg,
  IVaultJsFs,
  LockMap,
  LockProps,
  LockState,
  PhysicalModel,
  ProgressFunction,
  ProgressStatus,
  StandaloneDb,
  V2CheckpointAccessProps,
} from "@szewtwin/core-backend";
import { Guid, SZEWTwinError, Logger } from "@szewtwin/core-szewec";
import {
  BriefcaseId,
  ChangesetFileProps,
  ChangesetIndexAndId,
  ChangesetType,
  IVault as CoreIVault,
  LocalDirName,
} from "@szewtwin/core-common";
import { BackendIVaultsAccess } from "@szewtwin/ivaults-access-backend";
import {
  IVaultOperations,
  IVaultsClient,
  IVaultsClientOptions,
} from "@szewtwin/ivaults-client-authoring";
import {
  AuthorizationCallback,
  ContainingChanges,
  IVault,
  IVaultsErrorCode,
  IVaultsErrorScope,
  isIVaultsApiError,
} from "@szewtwin/ivaults-client-management";
import {
  IVaultMetadata,
  ProgressReport,
  ReusableIVaultMetadata,
  ReusableTestIVaultProvider,
  TestAuthorizationProvider,
  TestIVaultCreator,
  TestIVaultFileProvider,
  TestIVaultGroup,
  TestIVaultGroupFactory,
  TestSZEWTwinProvider,
  TestUtilTypes,
  assertAbortError,
  assertProgressReports,
  cleanupDirectory,
  createGuidValue,
} from "@szewtwin/ivaults-client-test-utils";

import { getTestDIContainer } from "./TestDiContainerProvider";
import { TestIVaultHostAuthorizationClient } from "./TestIVaultHostAuthorizationClient";

use(chaiAsPromised);

describe("BackendIVaultsAccess", () => {
  const testRunId = createGuidValue();

  let backendIVaultsAccess: BackendIVaultsAccess;
  let iVaultsClient: IVaultsClient;
  let authorizationCallback: AuthorizationCallback;
  let accessToken: string;
  let szewTwinId: string;

  let testIVaultFileProvider: TestIVaultFileProvider;
  let testIVaultGroup: TestIVaultGroup;
  let testIVaultForRead: ReusableIVaultMetadata;
  let testIVaultForWrite: IVaultMetadata;
  const testDownloadPath = path.join(__dirname, "../lib/testDownloads");

  before(async () => {
    const container = getTestDIContainer();

    const iVaultsClientOptions = container.get<IVaultsClientOptions>(
      TestUtilTypes.IVaultsClientOptions
    );
    iVaultsClient = new IVaultsClient(iVaultsClientOptions);
    backendIVaultsAccess = new BackendIVaultsAccess(iVaultsClient);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorizationCallback = authorizationProvider.getAdmin1Authorization();
    const authorization = await authorizationCallback();
    accessToken = `${authorization.scheme} ${authorization.token}`;
    IVaultHost.authorizationClient = new TestIVaultHostAuthorizationClient(
      accessToken
    );

    const testSZEWTwinProvider = container.get(TestSZEWTwinProvider);
    szewTwinId = await testSZEWTwinProvider.getOrCreate();

    testIVaultFileProvider = container.get(TestIVaultFileProvider);

    const testIVaultGroupFactory = container.get(TestIVaultGroupFactory);
    testIVaultGroup = testIVaultGroupFactory.create({
      testRunId,
      packageName: "IVaultsAccessBackendTests",
      testSuiteName: "BackendIVaultsAccess",
    });

    const reusableTestIVaultProvider = container.get(
      ReusableTestIVaultProvider
    );
    testIVaultForRead = await reusableTestIVaultProvider.getOrCreate();

    const testIVaultCreator = container.get(TestIVaultCreator);
    testIVaultForWrite = await testIVaultCreator.createEmpty(
      testIVaultGroup.getPrefixedUniqueIVaultName("Test iVault for write")
    );

    await IVaultHost.startup();
  });

  beforeEach(async () => {
    await cleanupDirectory(testDownloadPath);
  });

  afterEach(async () => {
    await cleanupDirectory(testDownloadPath);
  });

  after(async () => {
    await IVaultHost.shutdown();

    await testIVaultGroup.cleanupIVaults();
  });

  describe("briefcases", () => {
    it("should get current user briefcase ids", async () => {
      // Arrange
      const expectedBriefcaseIds = testIVaultForRead.briefcases.map(
        (briefcase) => briefcase.id
      );
      const getMyBriefcaseIdsParams: IVaultIdArg = {
        accessToken,
        iVaultId: testIVaultForRead.id,
      };

      // Act
      const briefcaseIds: BriefcaseId[] =
        await backendIVaultsAccess.getMyBriefcaseIds(getMyBriefcaseIdsParams);

      // Assert
      expect(briefcaseIds.length).to.equal(expectedBriefcaseIds.length);
      expect(briefcaseIds).to.have.members(expectedBriefcaseIds);
    });
  });

  describe("changesets", () => {
    it("should download changesets", async () => {
      // Arrange
      const downloadChangesetsParams: ChangesetRangeArg & {
        targetDir: LocalDirName;
      } = {
        accessToken,
        iVaultId: testIVaultForRead.id,
        targetDir: testDownloadPath,
      };

      // Act
      const downloadedChangesets: ChangesetFileProps[] =
        await backendIVaultsAccess.downloadChangesets(downloadChangesetsParams);

      // Assert
      expect(downloadedChangesets.length).to.be.equal(
        testIVaultFileProvider.changesets.length
      );
      for (let i = 0; i < downloadedChangesets.length; i++) {
        const downloadedChangeset = downloadedChangesets[i];
        const expectedChangesetFile = testIVaultFileProvider.changesets[i];

        expect(fs.existsSync(downloadedChangeset.pathname)).to.equal(true);
        expect(downloadedChangeset.id).to.be.equal(expectedChangesetFile.id);
        expect(downloadedChangeset.index).to.be.equal(
          expectedChangesetFile.index
        );
        expect(downloadedChangeset.parentId).to.be.equal(
          expectedChangesetFile.parentId
        );
        expect(downloadedChangeset.description).to.be.equal(
          expectedChangesetFile.description
        );
        expect(downloadedChangeset.briefcaseId).to.be.equal(
          testIVaultForRead.briefcases[0].id
        );
        expect(downloadedChangeset.size).to.be.equal(
          fs.statSync(expectedChangesetFile.filePath).size
        );

        if (
          expectedChangesetFile.containingChanges ===
          (ContainingChanges.Schema as number)
        )
          expect(downloadedChangeset.changesType).to.be.equal(
            ChangesetType.Schema
          );
        else
          expect(downloadedChangeset.changesType).to.be.equal(
            ChangesetType.Regular
          );
      }
    });

    it("should cancel changesets download and finish downloading missing changesets during next download", async () => {
      // Arrange
      const downloadChangesetsParams: DownloadChangesetRangeArg = {
        accessToken,
        iVaultId: testIVaultForRead.id,
        targetDir: testDownloadPath,
      };

      let progressReports: ProgressReport[] = [];
      const progressCallbackFor1stDownload = (
        downloaded: number,
        total: number
      ) => {
        progressReports.push({ downloaded, total });
        return downloaded < total / 4
          ? ProgressStatus.Continue
          : ProgressStatus.Abort;
      };
      const progressCallbackFor2ndDownload = (
        downloaded: number,
        total: number
      ) => {
        progressReports.push({ downloaded, total });
        return ProgressStatus.Continue;
      };

      // Act #1
      let thrownError: unknown;
      try {
        await backendIVaultsAccess.downloadChangesets({
          ...downloadChangesetsParams,
          progressCallback: progressCallbackFor1stDownload,
        });
      } catch (error: unknown) {
        thrownError = error;
      }

      // Assert #1
      const expectedErrorCode = IVaultsErrorCode.DownloadCancelled;
      expect(
        SZEWTwinError.isError(thrownError, IVaultsErrorScope, expectedErrorCode)
      ).to.be.true;

      expect(fs.readdirSync(testDownloadPath).length).to.be.greaterThan(0);
      assertProgressReports(progressReports, false);
      progressReports = [];

      // Act #2
      const changesets = await backendIVaultsAccess.downloadChangesets({
        ...downloadChangesetsParams,
        progressCallback: progressCallbackFor2ndDownload,
      });

      // Assert #2
      expect(changesets.length).to.equal(
        testIVaultFileProvider.changesets.length
      );

      const downloadedFilesSizeSum = fs
        .readdirSync(testDownloadPath)
        .reduce(
          (sum, filename) =>
            sum + fs.statSync(path.join(testDownloadPath, filename)).size,
          0
        );
      const expectedSizeSum = changesets.reduce(
        (sum, changeset) => sum + (changeset.size ?? 0),
        0
      );
      expect(downloadedFilesSizeSum).to.equal(expectedSizeSum);

      assertProgressReports(progressReports);
    });
  });

  describe("CreateNewIVault", () => {
    it("should create new empty iVault", async () => {
      const createNewIVaultProps: CreateNewIVaultProps = {
        accessToken,
        iVaultName: testIVaultGroup.getPrefixedUniqueIVaultName(
          "Test create empty iVault"
        ),
        szewTwinId,
      };

      const newiVaultId = await backendIVaultsAccess.createNewIVault(
        createNewIVaultProps
      );

      expect(newiVaultId).to.not.be.empty;
    });

    it("should perform a wal checkpoint", async () => {
      // cspell:disable-next-line
      const filePath = path.join(testDownloadPath, "createnewivault.dtw");
      try {
        // Arrange - Create an iVault and insert some data into it, so that SQLite creates a wal file with that data. https://www.sqlite.org/wal.html for more info.
        const walPath = `${filePath}-wal`;
        const loggerSpy = sinon
          .spy(Logger, "logWarning")
          .withArgs(
            "BackendIVaultsAccess",
            "Wal file found while uploading file, performing checkpoint.",
            sinon.match.any
          );
        // No need to actually talk to the hub, so stub the call to the hub.
        sinon
          .stub(IVaultOperations.prototype, "createFromBaseline")
          .callsFake((_params) => {
            return Promise.resolve({
              id: Guid.createValue(),
            } as unknown as IVault);
          });
        const testIVault = StandaloneDb.createEmpty(filePath, {
          rootSubject: { name: "test1" },
          allowEdit: JSON.stringify({ txns: true }),
        });
        PhysicalModel.insert(testIVault, CoreIVault.rootSubjectId, "TestModel");
        testIVault.saveChanges();
        expect(testIVault.isOpen).to.be.true;
        expect(IVaultJsFs.existsSync(walPath)).to.be.true;
        expect(IVaultJsFs.lstatSync(walPath)?.size).to.be.greaterThan(0);
        const arg: CreateNewIVaultProps = {
          version0: filePath,
          iVaultName: "testivault",
          szewTwinId: Guid.createValue(),
        };
        /**
         * NOTE: The below 'await expect' is possibly a test case worth doing but it takes 20 seconds to test due to the busy retry.
         * It first requires that a person does not saveChanges after performing some insert to put the database in a locked state. Commenting out the saveChanges earlier in this test would achieve that.
         * The below line does pass in the current state of the code (szewtwinjs 4.x), which is useful to know because we'd want a user who is uploading an iVault to get an error
         * that their database is locked due to them not saving changes.
         * await expect(backendIVaultsAccess.createNewIVault(arg)).to.eventually.be.rejectedWith("database is locked");
         */

        // Act
        await backendIVaultsAccess.createNewIVault(arg);
        // Assert
        expect(IVaultJsFs.lstatSync(walPath)?.size).to.be.equal(0);
        expect(loggerSpy.callCount).to.be.equal(1);

        // Arrange
        PhysicalModel.insert(
          testIVault,
          CoreIVault.rootSubjectId,
          "TestModel2"
        );
        testIVault.saveChanges();
        expect(IVaultJsFs.lstatSync(walPath)?.size).to.be.greaterThan(0);

        // Act
        testIVault.performCheckpoint();
        expect(IVaultJsFs.lstatSync(walPath)?.size).to.be.equal(0);
        await backendIVaultsAccess.createNewIVault(arg);

        // Assert - As I expected, the loggerSpy is called a second time below which tells me that we will perform a checkpoint on the iVault even if the WAL file has no contents.
        // This is because the iVault is still open for write, causing the wal file to still exist.
        // This behavior could be changed if desired by first checking the size of the wal file before performing the checkpoint.
        expect(loggerSpy.callCount).to.be.equal(2);

        // Arrange
        testIVault.close();
        // Act
        await backendIVaultsAccess.createNewIVault(arg);
        // Assert - Expect that the wal file is gone due to closing testIVault so logger is not called a 3rd time.
        expect(loggerSpy.callCount).to.be.equal(2);
      } finally {
        sinon.restore();
        // Need to reset the authorizationClient after otherwise future tests fail.
        IVaultHost.authorizationClient = new TestIVaultHostAuthorizationClient(
          accessToken
        );
      }
    });
  });

  describe("checkpoints v1", () => {
    it("should download checkpoint for a specific changeset", async () => {
      // Arrange
      const lastNamedVersion =
        testIVaultForRead.namedVersions[
          testIVaultForRead.namedVersions.length - 1
        ];

      const localCheckpointFilePath = path.join(
        testDownloadPath,
        "checkpoint_specific_changeset.dtw"
      );
      const downloadV1CheckpointParams = {
        localFile: localCheckpointFilePath,
        checkpoint: {
          accessToken,
          szewTwinId,
          iVaultId: testIVaultForRead.id,
          changeset: {
            id: lastNamedVersion.changesetId,
          },
        },
      };

      // Act
      // eslint-disable-next-line deprecation/deprecation
      const downloadedCheckpoint: ChangesetIndexAndId =
        await backendIVaultsAccess.downloadV1Checkpoint(
          downloadV1CheckpointParams
        );

      // Assert
      expect(downloadedCheckpoint.id).to.be.equal(lastNamedVersion.changesetId);
      expect(downloadedCheckpoint.index).to.be.equal(
        lastNamedVersion.changesetIndex
      );
      expect(fs.existsSync(localCheckpointFilePath)).to.be.equal(true);
      expect(fs.statSync(localCheckpointFilePath).size).to.be.greaterThan(0);
    });

    it("should query preceding checkpoint v2", async () => {
      // Arrange
      const firstNamedVersion = testIVaultForRead.namedVersions[0];
      assert(
        testIVaultFileProvider.changesets.length >=
          firstNamedVersion.changesetIndex + 1,
        "Not enough changesets"
      );
      const nextChangeset =
        testIVaultFileProvider.changesets[firstNamedVersion.changesetIndex];
      assert(
        firstNamedVersion.changesetId !== nextChangeset.id,
        "Unexpected changeset ids"
      );
      const queryV2CheckpointParams: CheckpointProps = {
        accessToken,
        szewTwinId,
        iVaultId: testIVaultForRead.id,
        changeset: {
          id: nextChangeset.id,
        },
      };

      // Act
      const v2checkpointForExactChangeset: V2CheckpointAccessProps | undefined =
        await backendIVaultsAccess.queryV2Checkpoint(queryV2CheckpointParams);
      // Assert
      expect(v2checkpointForExactChangeset).to.be.undefined;

      // Act
      const v2checkpointForChangesetAllowPrecedingParams = {
        ...queryV2CheckpointParams,
        allowPreceding: true,
      };
      const v2checkpointForChangesetAllowPreceding:
        | V2CheckpointAccessProps
        | undefined = await backendIVaultsAccess.queryV2Checkpoint(
        v2checkpointForChangesetAllowPrecedingParams
      );
      // Assert
      expect(v2checkpointForChangesetAllowPreceding).to.not.be.undefined;
    });

    it("should skip over a preceding v1 checkpoint in favor of finding a preceding v2 checkpoint", async () => {
      // Arrange
      // iVault has 3 checkpoints:
      //  baseline             - v1 and v2
      //  changeset index 5    - only v1 (v2 failed)
      //  changeset index 10   - only v1 (v2 failed)
      // This iVault is a clone of the testIVaultFileProvider aka "[do not delete][iVaultsClientsTests] Reusable Test iVault"
      // so it will have the same 10 changesets in total.
      const iVaultId = "e71f4085-75a6-479c-bab8-dce19b9352f6";
      await assertHardcodedIVaultExists(
        iVaultId,
        "iVault for queryV2Checkpoint test was not found. Please recreate the test iVault as described within the test, or disable the test."
      );

      const mostRecentChangeset =
        testIVaultFileProvider.changesets[
          testIVaultFileProvider.changesets.length - 1
        ];
      const queryV2CheckpointParams: CheckpointProps = {
        accessToken,
        szewTwinId,
        iVaultId,
        changeset: {
          id: mostRecentChangeset.id,
        },
        allowPreceding: true,
      };

      // Act
      const queryCheckpoint: V2CheckpointAccessProps | undefined =
        await backendIVaultsAccess.queryV2Checkpoint(queryV2CheckpointParams);

      // Assert
      expect(queryCheckpoint).to.not.be.undefined;
      expect(queryCheckpoint!.dbName === "BASELINE.dtw").to.be.true;
    });

    it("should download preceding checkpoint if one for current changeset does not exist", async () => {
      // Arrange
      const firstNamedVersion = testIVaultForRead.namedVersions[0];
      assert(
        testIVaultFileProvider.changesets.length >=
          firstNamedVersion.changesetIndex + 1,
        "Not enough changesets"
      );
      const nextChangeset =
        testIVaultFileProvider.changesets[firstNamedVersion.changesetIndex];
      assert(
        firstNamedVersion.changesetId !== nextChangeset.id,
        "Unexpected changeset ids"
      );

      const localCheckpointFilePath = path.join(
        testDownloadPath,
        "checkpoint_preceding_changeset.dtw"
      );
      const downloadV1CheckpointParams = {
        localFile: localCheckpointFilePath,
        checkpoint: {
          accessToken,
          szewTwinId,
          iVaultId: testIVaultForRead.id,
          changeset: {
            id: nextChangeset.id,
          },
        },
      };

      // Act
      // eslint-disable-next-line deprecation/deprecation
      const downloadedCheckpoint: ChangesetIndexAndId =
        await backendIVaultsAccess.downloadV1Checkpoint(
          downloadV1CheckpointParams
        );

      // Assert
      expect(downloadedCheckpoint.id).to.be.equal(
        firstNamedVersion.changesetId
      );
      expect(downloadedCheckpoint.index).to.be.equal(
        firstNamedVersion.changesetIndex
      );
      expect(fs.existsSync(localCheckpointFilePath)).to.be.equal(true);
      expect(fs.statSync(localCheckpointFilePath).size).to.be.greaterThan(0);
    });

    it("should skip over a preceding v2 checkpoint in favor of finding a preceding v1 checkpoint", async () => {
      // Arrange
      // iVault has 3 checkpoints
      //  baseline             - v1 and v2
      //  changeset index 5    - only v2 (v1 entry non existent)
      //  changeset index 10   - v1 and v2
      // This iVault is a clone of the testIVaultFileProvider aka "[do not delete][iVaultsClientsTests] Reusable Test iVault"
      // so it will have the same 10 changesets in total.
      const iVaultId = "c53e6b49-020f-4bf6-804b-d320463c5e00";
      await assertHardcodedIVaultExists(
        iVaultId,
        "iVault for downloadV1Checkpoint test was not found. Please recreate the test iVault as described within the test, or disable the test."
      );

      const secondToLastChangeset =
        testIVaultFileProvider.changesets[
          testIVaultFileProvider.changesets.length - 2
        ];
      const localCheckpointFilePath = path.join(
        testDownloadPath,
        "checkpoint_skip_v2_checkpoint.dtw"
      );
      const downloadV1CheckpointParams: DownloadRequest = {
        localFile: localCheckpointFilePath,
        checkpoint: {
          szewTwinId,
          iVaultId,
          changeset: {
            id: secondToLastChangeset.id,
          },
        },
      };

      // Act
      // eslint-disable-next-line deprecation/deprecation
      const changesetIndexAndId: ChangesetIndexAndId =
        await backendIVaultsAccess.downloadV1Checkpoint(
          downloadV1CheckpointParams
        );

      // Assert
      expect(changesetIndexAndId.index).to.be.equal(0);
      expect(changesetIndexAndId.id).to.be.null;
    });

    it("should report progress when downloading checkpoint", async () => {
      // Arrange
      const progressLogs: ProgressReport[] = [];
      const progressCallback: ProgressFunction = (
        downloaded: number,
        total: number
      ) => {
        progressLogs.push({ downloaded, total });
        return ProgressStatus.Continue;
      };

      const localCheckpointFilePath = path.join(
        testDownloadPath,
        "checkpoint_progress_test.dtw"
      );
      const downloadV1CheckpointParams = {
        localFile: localCheckpointFilePath,
        checkpoint: {
          accessToken,
          szewTwinId,
          iVaultId: testIVaultForRead.id,
          changeset: {
            id: testIVaultForRead.namedVersions[0].changesetId,
          },
        },
        onProgress: progressCallback,
      };

      // Act
      // eslint-disable-next-line deprecation/deprecation
      await backendIVaultsAccess.downloadV1Checkpoint(
        downloadV1CheckpointParams
      );

      // Assert
      expect(fs.existsSync(localCheckpointFilePath)).to.be.equal(true);
      expect(fs.statSync(localCheckpointFilePath).size).to.be.greaterThan(0);

      assertProgressReports(progressLogs);
      const lastReportedLog = progressLogs[progressLogs.length - 1];
      expect(lastReportedLog.total).to.be.equal(
        fs.statSync(localCheckpointFilePath).size
      );
    });

    it("should cancel checkpoint download", async () => {
      // Arrange
      const progressLogs: ProgressReport[] = [];
      const progressCallback: ProgressFunction = (
        downloaded: number,
        total: number
      ) => {
        progressLogs.push({ downloaded, total });
        return downloaded > total / 2
          ? ProgressStatus.Abort
          : ProgressStatus.Continue;
      };

      const localCheckpointFilePath = path.join(
        testDownloadPath,
        "checkpoint_cancel_test.dtw"
      );
      const downloadV1CheckpointParams = {
        localFile: localCheckpointFilePath,
        checkpoint: {
          accessToken,
          szewTwinId,
          iVaultId: testIVaultForRead.id,
          changeset: {
            id: testIVaultForRead.namedVersions[0].changesetId,
          },
        },
        onProgress: progressCallback,
      };

      // Act
      let thrownError: unknown;
      try {
        // eslint-disable-next-line deprecation/deprecation
        await backendIVaultsAccess.downloadV1Checkpoint(
          downloadV1CheckpointParams
        );
      } catch (error: unknown) {
        thrownError = error;
      }

      // Assert
      assertAbortError(thrownError);
      assertProgressReports(progressLogs, false);
      const lastReportedLog = progressLogs[progressLogs.length - 1];
      expect(lastReportedLog.total).to.be.greaterThan(
        fs.statSync(localCheckpointFilePath).size
      );
    });

    async function assertHardcodedIVaultExists(
      iVaultId: string,
      errorMessage: string
    ): Promise<void> {
      try {
        // Make sure iVault exists since we're hardcoding this ID.
        const iVault = await iVaultsClient.iVaults.getSingle({
          iVaultId,
          authorization: authorizationCallback,
        });
        expect(iVault).to.not.be.undefined;
      } catch (error) {
        if (
          isIVaultsApiError(error) &&
          error.code === IVaultsErrorCode.IVaultNotFound
        ) {
          throw new Error(errorMessage);
        }
        throw error;
      }
    }
  });

  describe("locks", () => {
    let testIVaultForWriteBriefcaseIds: BriefcaseId[] = [];

    afterEach(async () => {
      for (const briefcaseId of testIVaultForWriteBriefcaseIds) {
        await backendIVaultsAccess.releaseBriefcase({
          accessToken,
          iVaultId: testIVaultForWrite.id,
          briefcaseId,
        });
      }
      testIVaultForWriteBriefcaseIds = [];
    });

    it("should successfully acquire new locks", async () => {
      // Arrange
      const acquireNewBriefcaseIdParams: AcquireNewBriefcaseIdArg = {
        accessToken,
        iVaultId: testIVaultForWrite.id,
      };
      const briefcaseId = await backendIVaultsAccess.acquireNewBriefcaseId(
        acquireNewBriefcaseIdParams
      );
      testIVaultForWriteBriefcaseIds.push(briefcaseId);

      const briefcaseDbParams: BriefcaseDbArg = {
        accessToken,
        iVaultId: testIVaultForWrite.id,
        briefcaseId,
        changeset: { id: "", index: 0 },
      };
      // eslint-disable-next-line deprecation/deprecation
      const locksToAcquire: LockMap = new Map<string, LockState>([
        // eslint-disable-next-line deprecation/deprecation
        ["0x1", LockState.Exclusive],
        // eslint-disable-next-line deprecation/deprecation
        ["0x2", LockState.Exclusive],
        // eslint-disable-next-line deprecation/deprecation
        ["0x3", LockState.Shared],
      ]);

      // Act
      await backendIVaultsAccess.acquireLocks(
        briefcaseDbParams,
        locksToAcquire
      );

      // Assert
      await assertLocks({
        lockQueryParams: briefcaseDbParams,
        expectedLocks: locksToAcquire,
      });
    });

    it("should successfully release locks", async () => {
      // Arrange
      const acquireNewBriefcaseIdParams: AcquireNewBriefcaseIdArg = {
        accessToken,
        iVaultId: testIVaultForWrite.id,
      };
      const briefcaseId = await backendIVaultsAccess.acquireNewBriefcaseId(
        acquireNewBriefcaseIdParams
      );
      testIVaultForWriteBriefcaseIds.push(briefcaseId);

      const briefcaseDbParams: BriefcaseDbArg = {
        accessToken,
        iVaultId: testIVaultForWrite.id,
        briefcaseId,
        changeset: { id: "", index: 0 },
      };

      // eslint-disable-next-line deprecation/deprecation
      const locksToAcquire: LockMap = new Map<string, LockState>();

      const objectIdsDec = Array.from({ length: 201 }, (_, i) => i + 1);
      for (const objectId of objectIdsDec) {
        // eslint-disable-next-line deprecation/deprecation
        locksToAcquire.set(`0x${objectId.toString(16)}`, LockState.Exclusive);
      }

      await backendIVaultsAccess.acquireLocks(
        briefcaseDbParams,
        locksToAcquire
      );
      await assertLocks({
        lockQueryParams: briefcaseDbParams,
        expectedLocks: locksToAcquire,
      });

      // Act
      await backendIVaultsAccess.releaseAllLocks(briefcaseDbParams);

      // Assert
      const actualLocks: LockProps[] = await backendIVaultsAccess.queryAllLocks(
        briefcaseDbParams
      );
      expect(actualLocks.length).to.be.equal(0);
    });

    async function assertLocks(params: {
      lockQueryParams: BriefcaseDbArg;
      expectedLocks: LockMap;
    }): Promise<void> {
      const actualLocks: LockProps[] = await backendIVaultsAccess.queryAllLocks(
        params.lockQueryParams
      );
      expect(actualLocks.length).to.equal(params.expectedLocks.size);
      for (const [
        expectedObjectId,
        expectedLockState,
      ] of params.expectedLocks) {
        const actualLock = actualLocks.find(
          (lock) =>
            lock.id === expectedObjectId && lock.state === expectedLockState
        );
        expect(actualLock).to.not.be.undefined;
      }
    }
  });
});
