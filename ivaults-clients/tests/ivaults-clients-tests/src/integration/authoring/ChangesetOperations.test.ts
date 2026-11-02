/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as path from "path";

import { AbortController } from "@azure/abort-controller";
import { expect } from "chai";

import {
  AcquireBriefcaseParams,
  CreateChangesetGroupParams,
  CreateChangesetParams,
  DownloadChangesetListParams,
  DownloadSingleChangesetParams,
  DownloadedChangeset,
  IVaultsClient,
  IVaultsClientOptions,
  ProgressCallback,
  TargetDirectoryParam,
} from "@szewtwin/ivaults-client-authoring";
import {
  AuthorizationCallback,
  IVaultScopedOperationParams,
  IVaultsError,
  IVaultsErrorCode,
  isIVaultsApiError,
} from "@szewtwin/ivaults-client-management";
import {
  FileTransferLog,
  IVaultMetadata,
  ProgressReport,
  ReusableIVaultMetadata,
  ReusableTestIVaultProvider,
  TestAuthorizationProvider,
  TestIVaultCreator,
  TestIVaultFileProvider,
  TestIVaultGroup,
  TestIVaultGroupFactory,
  TestUtilTypes,
  TrackableClientStorage,
  assertChangeset,
  assertDownloadedChangeset,
  assertProgressReports,
  cleanupDirectory,
} from "@szewtwin/ivaults-client-test-utils";
import { GoogleClientStorage } from "@szewtwin/object-storage-google/lib/client";
import { ClientStorageWrapperFactory } from "@szewtwin/object-storage-google/lib/client/wrappers";

import {
  AzureClientStorage,
  BlockBlobClientWrapperFactory,
} from "@szewtwin/object-storage-azure";
import {
  ClientStorage,
  ConfigDownloadInput,
  StrategyClientStorage,
  UrlDownloadInput,
} from "@szewtwin/object-storage-core";

import { Constants, getTestDIContainer, getTestRunId } from "../common";

type CommonDownloadParams = IVaultScopedOperationParams & TargetDirectoryParam;

function createDefaultClientStorage(): ClientStorage {
  return new StrategyClientStorage([
    {
      instanceName: "azure",
      instance: new AzureClientStorage(new BlockBlobClientWrapperFactory()),
    },
    {
      instanceName: "google",
      instance: new GoogleClientStorage(new ClientStorageWrapperFactory()),
    },
  ]);
}

describe("[Authoring] ChangesetOperations", () => {
  let iVaultsClient: IVaultsClient;
  let iVaultsClientOptions: IVaultsClientOptions;
  let authorization: AuthorizationCallback;

  let testIVaultFileProvider: TestIVaultFileProvider;
  let testIVaultGroup: TestIVaultGroup;
  let testIVaultForRead: ReusableIVaultMetadata;
  let testIVaultForWrite: IVaultMetadata;

  beforeEach(async () => {
    await cleanupDirectory(Constants.TestDownloadDirectoryPath);
  });

  before(async () => {
    const container = getTestDIContainer();

    iVaultsClientOptions = container.get<IVaultsClientOptions>(
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
      testSuiteName: "AuthoringChangesetOperations",
    });

    const reusableTestIVaultProvider = container.get(
      ReusableTestIVaultProvider
    );
    testIVaultForRead = await reusableTestIVaultProvider.getOrCreate();

    const testIVaultCreator = container.get(TestIVaultCreator);
    testIVaultForWrite = await testIVaultCreator.createEmpty(
      testIVaultGroup.getPrefixedUniqueIVaultName("Test iVault for write")
    );
  });

  afterEach(async () => {
    await cleanupDirectory(Constants.TestDownloadDirectoryPath);
  });

  after(async () => {
    await testIVaultGroup.cleanupIVaults();
  });

  it("should create changeset #1", async () => {
    // Arrange
    const acquireBriefcaseParams: AcquireBriefcaseParams = {
      authorization,
      iVaultId: testIVaultForWrite.id,
    };
    const briefcase = await iVaultsClient.briefcases.acquire(
      acquireBriefcaseParams
    );

    const testChangesetFile = testIVaultFileProvider.changesets[0];
    const createChangesetParams: CreateChangesetParams = {
      authorization,
      iVaultId: testIVaultForWrite.id,
      changesetProperties: {
        briefcaseId: briefcase.briefcaseId,
        id: testChangesetFile.id,
        filePath: testChangesetFile.filePath,
        synchronizationInfo: {
          taskId: "11111111-1111-1111-1111-111111111111",
        },
      },
    };

    // Act
    const changeset = await iVaultsClient.changesets.create(
      createChangesetParams
    );

    // Assert
    const expectedTestChangesetFile = testIVaultFileProvider.changesets.find(
      (cs) => cs.id === changeset.id
    )!;
    await assertChangeset({
      actualChangeset: changeset,
      expectedChangesetProperties: createChangesetParams.changesetProperties,
      expectedTestChangesetFile,
      expectedLinks: {
        namedVersion: false,
        checkpoint: false,
      },
      isGetResponse: false,
    });
  });

  it("should create changeset #2 in a changeset group", async () => {
    // Arrange
    const acquireBriefcaseParams: AcquireBriefcaseParams = {
      authorization,
      iVaultId: testIVaultForWrite.id,
    };
    const briefcase = await iVaultsClient.briefcases.acquire(
      acquireBriefcaseParams
    );

    const createChangesetGroupParams: CreateChangesetGroupParams = {
      authorization,
      iVaultId: testIVaultForWrite.id,
      changesetGroupProperties: {
        description: "Some group",
      },
    };
    const changesetGroup = await iVaultsClient.changesetGroups.create(
      createChangesetGroupParams
    );

    const parentChangesetFile = testIVaultFileProvider.changesets[0];
    const testChangesetFile = testIVaultFileProvider.changesets[1];
    const createChangesetParams: CreateChangesetParams = {
      authorization,
      iVaultId: testIVaultForWrite.id,
      changesetProperties: {
        briefcaseId: briefcase.briefcaseId,
        id: testChangesetFile.id,
        parentId: parentChangesetFile.id,
        filePath: testChangesetFile.filePath,
        groupId: changesetGroup.id,
        synchronizationInfo: {
          taskId: "11111111-1111-1111-1111-111111111111",
          changedFiles: ["foo.dtw"],
        },
      },
    };

    // Act
    const changeset = await iVaultsClient.changesets.create(
      createChangesetParams
    );

    // Assert
    const expectedTestChangesetFile = testIVaultFileProvider.changesets.find(
      (cs) => cs.id === changeset.id
    )!;
    await assertChangeset({
      actualChangeset: changeset,
      expectedChangesetProperties: createChangesetParams.changesetProperties,
      expectedTestChangesetFile,
      expectedLinks: {
        namedVersion: false,
        checkpoint: false,
      },
      isGetResponse: false,
    });
  });

  describe("download operations", () => {
    it("should download all changesets", async () => {
      // Arrange
      const downloadPath = path.join(
        Constants.TestDownloadDirectoryPath,
        "[Authoring] ChangesetOperations",
        "download all changesets test"
      );
      const downloadChangesetListParams: DownloadChangesetListParams = {
        authorization,
        iVaultId: testIVaultForRead.id,
        targetDirectoryPath: downloadPath,
      };

      // Act
      const changesets = await iVaultsClient.changesets.downloadList(
        downloadChangesetListParams
      );

      // Assert
      expect(changesets.length).to.equal(
        testIVaultFileProvider.changesets.length
      );
      expect(fs.readdirSync(downloadPath).length).to.equal(
        testIVaultFileProvider.changesets.length
      );

      for (const changeset of changesets) {
        const testChangesetFile = testIVaultFileProvider.changesets.find(
          (cs) => cs.index === changeset.index
        )!;
        const changesetHasNamedVersion = !!testIVaultForRead.namedVersions.find(
          (version) => version.changesetIndex === changeset.index
        );
        const groupId = testIVaultForRead.changesetGroups.find((csGroup) =>
          csGroup.changesetIndexes.includes(changeset.index)
        )?.id;
        await assertDownloadedChangeset({
          actualChangeset: changeset,
          expectedChangesetProperties: {
            id: testChangesetFile.id,
            briefcaseId: testIVaultForRead.briefcases[0].id,
            parentId: testChangesetFile.parentId,
            description: testChangesetFile.description,
            containingChanges: testChangesetFile.containingChanges,
            synchronizationInfo: testChangesetFile.synchronizationInfo,
            groupId,
          },
          expectedLinks: {
            namedVersion: changesetHasNamedVersion,
            checkpoint: true,
          },
          expectedTestChangesetFile: testChangesetFile,
        });
      }
    });

    it("should download some changesets based on range", async () => {
      // Arrange
      const downloadPath = path.join(
        Constants.TestDownloadDirectoryPath,
        "[Authoring] ChangesetOperations",
        "download range test"
      );
      const downloadChangesetListParams: DownloadChangesetListParams = {
        authorization,
        iVaultId: testIVaultForRead.id,
        urlParams: {
          afterIndex: 5,
          lastIndex: 10,
        },
        targetDirectoryPath: downloadPath,
      };

      // Act
      const changesets = await iVaultsClient.changesets.downloadList(
        downloadChangesetListParams
      );

      // Assert
      const expectedChangesetCount =
        downloadChangesetListParams.urlParams!.lastIndex! -
        downloadChangesetListParams.urlParams!.afterIndex!;
      expect(changesets.length).to.equal(expectedChangesetCount);
      expect(fs.readdirSync(downloadPath).length).to.equal(
        expectedChangesetCount
      );
      expect(
        changesets.map((changeset: DownloadedChangeset) => changeset.index)
      ).to.have.members([6, 7, 8, 9, 10]);

      for (const changeset of changesets) {
        const testChangesetFile = testIVaultFileProvider.changesets.find(
          (cs) => cs.index === changeset.index
        )!;
        const changesetHasNamedVersion = !!testIVaultForRead.namedVersions.find(
          (version) => version.changesetIndex === changeset.index
        );
        const groupId = testIVaultForRead.changesetGroups.find((csGroup) =>
          csGroup.changesetIndexes.includes(changeset.index)
        )?.id;
        await assertDownloadedChangeset({
          actualChangeset: changeset,
          expectedChangesetProperties: {
            id: testChangesetFile.id,
            briefcaseId: testIVaultForRead.briefcases[0].id,
            parentId: testChangesetFile.parentId,
            description: testChangesetFile.description,
            containingChanges: testChangesetFile.containingChanges,
            synchronizationInfo: testChangesetFile.synchronizationInfo,
            groupId,
          },
          expectedLinks: {
            namedVersion: changesetHasNamedVersion,
            checkpoint: true,
          },
          expectedTestChangesetFile: testChangesetFile,
        });
      }
    });

    [
      {
        label: "id",
        get changesetUnderTest() {
          return testIVaultFileProvider.changesets[0];
        },
        get functionUnderTest() {
          return async (params: CommonDownloadParams) =>
            iVaultsClient.changesets.downloadSingle({
              ...params,
              changesetId: this.changesetUnderTest.id,
            });
        },
      },
      {
        label: "index",
        get changesetUnderTest() {
          return testIVaultFileProvider.changesets[0];
        },
        get functionUnderTest() {
          return async (params: CommonDownloadParams) =>
            iVaultsClient.changesets.downloadSingle({
              ...params,
              changesetIndex: this.changesetUnderTest.index,
            });
        },
      },
    ].forEach((testCase) => {
      it(`should download changeset by ${testCase.label}`, async () => {
        // Arrange
        const downloadPath = path.join(
          Constants.TestDownloadDirectoryPath,
          "[Authoring] ChangesetOperations",
          `download by ${testCase.label} test`
        );
        const partialDownloadChangesetParams: CommonDownloadParams = {
          authorization,
          iVaultId: testIVaultForRead.id,
          targetDirectoryPath: downloadPath,
        };

        // Act
        const changeset = await testCase.functionUnderTest(
          partialDownloadChangesetParams
        );

        // Assert
        const testChangesetFile = testCase.changesetUnderTest;
        const changesetHasNamedVersion = !!testIVaultForRead.namedVersions.find(
          (version) => version.changesetIndex === changeset.index
        );
        const groupId = testIVaultForRead.changesetGroups.find((csGroup) =>
          csGroup.changesetIndexes.includes(changeset.index)
        )?.id;
        await assertDownloadedChangeset({
          actualChangeset: changeset,
          expectedChangesetProperties: {
            id: testChangesetFile.id,
            briefcaseId: testIVaultForRead.briefcases[0].id,
            parentId: testChangesetFile.parentId,
            description: testChangesetFile.description,
            containingChanges: testChangesetFile.containingChanges,
            synchronizationInfo: testChangesetFile.synchronizationInfo,
            groupId,
          },
          expectedLinks: {
            namedVersion: changesetHasNamedVersion,
            checkpoint: true,
          },
          expectedTestChangesetFile: testChangesetFile,
        });
      });
    });

    [
      {
        label: "by id",
        get functionUnderTest() {
          return async (client: IVaultsClient, params: CommonDownloadParams) =>
            client.changesets.downloadSingle({
              ...params,
              changesetId: testIVaultFileProvider.changesets[0].id,
            });
        },
      },
      {
        label: "by index",
        get functionUnderTest() {
          return async (client: IVaultsClient, params: CommonDownloadParams) =>
            client.changesets.downloadSingle({
              ...params,
              changesetIndex: 1,
            });
        },
      },
      {
        label: "list",
        get functionUnderTest() {
          return async (client: IVaultsClient, params: CommonDownloadParams) =>
            client.changesets
              .downloadList({
                ...params,
                urlParams: { afterIndex: 0, lastIndex: 1 },
              })
              .then((changesets) => changesets[0]);
        },
      },
    ].forEach((testCase) => {
      it(`should should retry changeset download if it fails the first time when downloading changeset ${testCase.label}`, async () => {
        // Arrange
        const fileTransferLog = new FileTransferLog();
        const clientStorage = createDefaultClientStorage();
        let hasDownloadFailed = false;
        const downloadInterceptor = (
          input: UrlDownloadInput | ConfigDownloadInput
        ) => {
          fileTransferLog.recordDownload((input as UrlDownloadInput).url);

          if (!hasDownloadFailed) {
            hasDownloadFailed = true;
            throw new Error("Download failed.");
          }
        };

        const trackedStorage = new TrackableClientStorage(clientStorage, {
          download: downloadInterceptor,
        });
        const iVaultsClientWithTrackedFileTransfer = new IVaultsClient({
          ...iVaultsClientOptions,
          cloudStorage: trackedStorage,
        });

        const downloadPath = path.join(
          Constants.TestDownloadDirectoryPath,
          "[Authoring] ChangesetOperations",
          `download ${testCase.label} retry test`
        );
        const partialDownloadChangesetParams: CommonDownloadParams = {
          authorization,
          iVaultId: testIVaultForRead.id,
          targetDirectoryPath: downloadPath,
        };

        // Act
        const changeset: DownloadedChangeset = await testCase.functionUnderTest(
          iVaultsClientWithTrackedFileTransfer,
          partialDownloadChangesetParams
        );

        // Assert
        expect(changeset).to.be.not.be.undefined;

        const allDownloadUrlsCalled = Object.keys(fileTransferLog.downloads);
        expect(allDownloadUrlsCalled.length).to.equal(2);
        expect(allDownloadUrlsCalled[0]).to.contain(changeset.id);
        expect(allDownloadUrlsCalled[1]).to.contain(changeset.id);

        const timesDownloadUrl1WasCalled =
          fileTransferLog.downloads[allDownloadUrlsCalled[0]];
        expect(timesDownloadUrl1WasCalled).to.equal(1);
        const timesDownloadUrl2WasCalled =
          fileTransferLog.downloads[allDownloadUrlsCalled[1]];
        expect(timesDownloadUrl2WasCalled).to.equal(1);
      });

      it(`should not download changeset again if it is already present when downloading changeset ${testCase.label}`, async () => {
        // Arrange
        const fileTransferLog = new FileTransferLog();
        const clientStorage = createDefaultClientStorage();
        const downloadInterceptor = (
          input: UrlDownloadInput | ConfigDownloadInput
        ) => {
          fileTransferLog.recordDownload((input as UrlDownloadInput).url);
        };

        const trackedStorage = new TrackableClientStorage(clientStorage, {
          download: downloadInterceptor,
        });
        const iVaultsClientWithTrackedFileTransfer = new IVaultsClient({
          ...iVaultsClientOptions,
          cloudStorage: trackedStorage,
        });

        const downloadPath = path.join(
          Constants.TestDownloadDirectoryPath,
          "[Authoring] ChangesetOperations",
          `download ${testCase.label} reuse test`
        );
        const partialDownloadChangesetParams: CommonDownloadParams = {
          authorization,
          iVaultId: testIVaultForRead.id,
          targetDirectoryPath: downloadPath,
        };

        await testCase.functionUnderTest(
          iVaultsClientWithTrackedFileTransfer,
          partialDownloadChangesetParams
        );

        // Act
        const changeset = await testCase.functionUnderTest(
          iVaultsClientWithTrackedFileTransfer,
          partialDownloadChangesetParams
        );

        // Assert
        expect(changeset).to.be.not.be.undefined;

        const allDownloadUrlsCalled = Object.keys(fileTransferLog.downloads);
        expect(allDownloadUrlsCalled.length).to.equal(1);
        expect(allDownloadUrlsCalled[0]).to.contain(changeset.id);

        const timesDownloadUrlWasCalled =
          fileTransferLog.downloads[allDownloadUrlsCalled[0]];
        expect(timesDownloadUrlWasCalled).to.equal(1);
      });
    });

    it("should report progress of changeset download", async () => {
      // Arrange
      const progressReports: ProgressReport[] = [];
      const progressCallback: ProgressCallback = (
        downloaded: number,
        total: number
      ) => progressReports.push({ downloaded, total });

      const downloadPath = path.join(
        Constants.TestDownloadDirectoryPath,
        "[Authoring] ChangesetOperations",
        "download changeset while reporting progress"
      );
      const downloadParams: DownloadSingleChangesetParams = {
        authorization,
        iVaultId: testIVaultForRead.id,
        changesetId: testIVaultFileProvider.changesets[0].id,
        targetDirectoryPath: downloadPath,
        progressCallback,
      };

      // Act
      await iVaultsClient.changesets.downloadSingle(downloadParams);

      // Assert
      assertProgressReports(progressReports);
    });

    it("should cancel changeset download", async () => {
      // Arrange
      const abortController = new AbortController();
      const abortSignal = abortController.signal;

      const downloadPath = path.join(
        Constants.TestDownloadDirectoryPath,
        "[Authoring] ChangesetOperations",
        "cancel changeset download"
      );
      const downloadParams: DownloadSingleChangesetParams = {
        authorization,
        iVaultId: testIVaultForRead.id,
        changesetId: testIVaultFileProvider.changesets[0].id,
        targetDirectoryPath: downloadPath,
        abortSignal,
      };

      // Act
      let thrownError: unknown;
      try {
        const promise = iVaultsClient.changesets.downloadSingle(downloadParams);
        abortController.abort();
        await promise;
      } catch (error: unknown) {
        thrownError = error;
      }

      // Assert
      expect(isIVaultsApiError(thrownError)).to.be.true;
      expect((thrownError as IVaultsError).code).to.be.equal(
        IVaultsErrorCode.DownloadAborted
      );
    });

    it("should report progress of changesets download", async () => {
      // Arrange
      const progressReports: ProgressReport[] = [];
      const progressCallback: ProgressCallback = (
        downloaded: number,
        total: number
      ) => progressReports.push({ downloaded, total });

      const downloadPath = path.join(
        Constants.TestDownloadDirectoryPath,
        "[Authoring] ChangesetOperations",
        "download changesets while reporting progress"
      );
      const downloadChangesetListParams: DownloadChangesetListParams = {
        authorization,
        iVaultId: testIVaultForRead.id,
        targetDirectoryPath: downloadPath,
        progressCallback,
      };

      // Act
      const changesets = await iVaultsClient.changesets.downloadList(
        downloadChangesetListParams
      );

      // Assert
      expect(changesets.length).to.equal(
        testIVaultFileProvider.changesets.length
      );
      expect(fs.readdirSync(downloadPath).length).to.equal(
        testIVaultFileProvider.changesets.length
      );

      assertProgressReports(progressReports);
    });

    it("should cancel changesets download", async () => {
      // Arrange
      const abortController = new AbortController();
      const abortSignal = abortController.signal;

      // Promise construction below mimics the cancellation workflow implemented in
      // `PlatformToClientAdapter.toDownloadProgressParam` function `@szewtwin/ivaults-access-backend` package.
      // Refer to that for an explanation on why this is needed.
      let triggerDownloadCancellation: () => void = undefined!;
      const triggerDownloadCancellationPromise = new Promise<void>(
        (resolve) => {
          triggerDownloadCancellation = resolve;
        }
      );

      const progressReports: ProgressReport[] = [];
      const progressCallback: ProgressCallback = (downloaded, total) => {
        progressReports.push({ downloaded, total });
        if (downloaded > total / 2) triggerDownloadCancellation();
      };

      const downloadPath = path.join(
        Constants.TestDownloadDirectoryPath,
        "[Authoring] ChangesetOperations",
        "cancel changesets download"
      );
      const downloadChangesetListParams: DownloadChangesetListParams = {
        authorization,
        iVaultId: testIVaultForRead.id,
        targetDirectoryPath: downloadPath,
        progressCallback,
        abortSignal,
      };

      // Act
      let thrownError: unknown;
      try {
        const testedFunctionPromise = iVaultsClient.changesets.downloadList(
          downloadChangesetListParams
        );

        await triggerDownloadCancellationPromise;
        abortController.abort();

        await testedFunctionPromise;
      } catch (error: unknown) {
        thrownError = error;
      }

      // Assert
      expect(abortSignal.aborted).to.be.true;
      expect(isIVaultsApiError(thrownError)).to.be.true;
      expect((thrownError as IVaultsError).code).to.be.equal(
        IVaultsErrorCode.DownloadAborted
      );

      assertProgressReports(progressReports, false);
    });
  });
});
