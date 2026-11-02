/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import path = require("path");

import { expect } from "chai";

import {
  AcquireNewBriefcaseIdArg,
  BriefcaseDbArg,
  BriefcaseIdArg,
  ChangesetArg,
  ChangesetRangeArg,
  CheckpointProps,
  CreateNewIVaultProps,
  DownloadChangesetArg,
  DownloadRequest,
  IVaultHost,
  IVaultIdArg,
  IVaultNameArg,
  SZEWTwinIdArg,
  LockMap,
  LockState,
} from "@szewtwin/core-backend";
import { SZEWTwinError } from "@szewtwin/core-szewec";
import { ChangesetFileProps, IVaultVersion } from "@szewtwin/core-common";
import { BackendIVaultsAccess } from "@szewtwin/ivaults-access-backend";
import {
  IVaultsClient,
  IVaultsClientOptions,
} from "@szewtwin/ivaults-client-authoring";
import {
  IVaultsErrorCode,
  IVaultsErrorScope,
} from "@szewtwin/ivaults-client-management";
import {
  IVaultMetadata,
  ReusableIVaultMetadata,
  ReusableTestIVaultProvider,
  TestAuthorizationProvider,
  TestIVaultCreator,
  TestIVaultFileProvider,
  TestIVaultGroup,
  TestIVaultGroupFactory,
  TestSZEWTwinProvider,
  TestUtilTypes,
  cleanupDirectory,
  createGuidValue,
} from "@szewtwin/ivaults-client-test-utils";

import { getTestDIContainer } from "./TestDiContainerProvider";
import { TestIVaultHostAuthorizationClient } from "./TestIVaultHostAuthorizationClient";

describe("BackendIVaultsAccess error handling", () => {
  const testRunId = createGuidValue();

  let backendIVaultsAccess: BackendIVaultsAccess;

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
    const iVaultsClient = new IVaultsClient(iVaultsClientOptions);
    backendIVaultsAccess = new BackendIVaultsAccess(iVaultsClient);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    const authorizationCallback =
      authorizationProvider.getAdmin1Authorization();
    const authorization = await authorizationCallback();
    accessToken = `${authorization.scheme} ${authorization.token}`;
    IVaultHost.authorizationClient = new TestIVaultHostAuthorizationClient(
      accessToken
    );
    await IVaultHost.startup();

    const testSZEWTwinProvider = container.get(TestSZEWTwinProvider);
    szewTwinId = await testSZEWTwinProvider.getOrCreate();

    testIVaultFileProvider = container.get(TestIVaultFileProvider);

    const testIVaultGroupFactory = container.get(TestIVaultGroupFactory);
    testIVaultGroup = testIVaultGroupFactory.create({
      testRunId,
      packageName: "IVaultsAccessBackendTests",
      testSuiteName: "BackendIVaultsAccess errors",
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

  beforeEach(async () => {
    await cleanupDirectory(testDownloadPath);
  });

  after(async () => {
    await testIVaultGroup.cleanupIVaults();
  });

  it("should throw SZEWTwinError if changeset does not exist when downloading a single changeset", async () => {
    const downloadChangesetParams: DownloadChangesetArg = {
      accessToken,
      iVaultId: testIVaultForRead.id,
      targetDir: testDownloadPath,
      changeset: { index: 555 },
    };

    await executeFuncAndAssertError(
      async () =>
        backendIVaultsAccess.downloadChangeset(downloadChangesetParams),
      IVaultsErrorCode.ChangesetNotFound
    );
  });

  it("should throw SZEWTwinError if changeset does not exist when querying a single changeset", async () => {
    const queryChangesetParams: ChangesetArg = {
      accessToken,
      iVaultId: testIVaultForRead.id,
      changeset: { index: 555 },
    };

    await executeFuncAndAssertError(
      async () => backendIVaultsAccess.queryChangeset(queryChangesetParams),
      IVaultsErrorCode.ChangesetNotFound
    );
  });

  it("should throw SZEWTwinError if iVault does not exist when querying changesets", async () => {
    const queryChangesetsParams: ChangesetRangeArg = {
      accessToken,
      iVaultId: "nonExistentiVaultId",
    };

    await executeFuncAndAssertError(
      async () => backendIVaultsAccess.queryChangesets(queryChangesetsParams),
      IVaultsErrorCode.IVaultNotFound
    );
  });

  it("should throw SZEWTwinError if Briefcase does not exist when pushing changeset", async () => {
    const testIVaultChangeset = testIVaultFileProvider.changesets[0];
    const pushChangesetParams: IVaultIdArg & {
      changesetProps: ChangesetFileProps;
    } = {
      accessToken,
      iVaultId: testIVaultForWrite.id,
      changesetProps: {
        pathname: testIVaultChangeset.filePath,
        id: testIVaultChangeset.id,
        index: testIVaultChangeset.index,
        parentId: testIVaultChangeset.parentId,
        changesType: 0,
        description: testIVaultChangeset.description,
        briefcaseId: 555,
        pushDate: new Date().toDateString(),
        userCreated: createGuidValue(),
        size: 555,
      },
    };

    await executeFuncAndAssertError(
      async () => backendIVaultsAccess.pushChangeset(pushChangesetParams),
      IVaultsErrorCode.BriefcaseNotFound
    );
  });

  it("should throw SZEWTwinError if iVault does not exist when querying latest changeset", async () => {
    const getLatestChangesetParams: IVaultIdArg = {
      accessToken,
      iVaultId: "nonExistentiVaultId",
    };

    await executeFuncAndAssertError(
      async () =>
        backendIVaultsAccess.getLatestChangeset(getLatestChangesetParams),
      IVaultsErrorCode.IVaultNotFound
    );
  });

  it("should throw SZEWTwinError if iVault does not exist when resolving changeset for version (IVaultVersion.named)", async () => {
    const getChangesetFromVersionParams: IVaultIdArg & {
      version: IVaultVersion;
    } = {
      accessToken,
      iVaultId: "nonExistentiVaultId",
      version: IVaultVersion.named("non existent named version"),
    };

    await executeFuncAndAssertError(
      async () =>
        backendIVaultsAccess.getChangesetFromVersion(
          getChangesetFromVersionParams
        ),
      IVaultsErrorCode.IVaultNotFound
    );
  });

  it("should throw SZEWTwinError if named version does not exist when resolving changeset from version", async () => {
    const getChangesetFromVersionParams: IVaultIdArg & {
      version: IVaultVersion;
    } = {
      accessToken,
      iVaultId: testIVaultForWrite.id,
      version: IVaultVersion.named("non existent named version"),
    };

    await executeFuncAndAssertError(
      async () =>
        backendIVaultsAccess.getChangesetFromVersion(
          getChangesetFromVersionParams
        ),
      IVaultsErrorCode.NamedVersionNotFound
    );
  });

  it("should throw SZEWTwinError if iVault does not exist when resolving changeset for version (IVaultVersion.asOfChangeSet)", async () => {
    const getChangesetFromVersionParams: IVaultIdArg & {
      version: IVaultVersion;
    } = {
      accessToken,
      iVaultId: "nonExistentiVaultId",
      version: IVaultVersion.asOfChangeSet("nonExistentChangesetId"),
    };

    await executeFuncAndAssertError(
      async () =>
        backendIVaultsAccess.getChangesetFromVersion(
          getChangesetFromVersionParams
        ),
      IVaultsErrorCode.IVaultNotFound
    );
  });

  it("should throw SZEWTwinError if changeset does not exist when resolving changeset from version", async () => {
    const getChangesetFromVersionParams: IVaultIdArg & {
      version: IVaultVersion;
    } = {
      accessToken,
      iVaultId: testIVaultForWrite.id,
      version: IVaultVersion.asOfChangeSet("nonExistentChangesetId"),
    };

    await executeFuncAndAssertError(
      async () =>
        backendIVaultsAccess.getChangesetFromVersion(
          getChangesetFromVersionParams
        ),
      IVaultsErrorCode.ChangesetNotFound
    );
  });

  it("should throw SZEWTwinError if iVault does not exist when resolving changeset from latest version", async () => {
    const getChangesetFromVersionParams: IVaultIdArg & {
      version: IVaultVersion;
    } = {
      accessToken,
      iVaultId: "nonExistentiVaultId",
      version: IVaultVersion.latest(),
    };

    await executeFuncAndAssertError(
      async () =>
        backendIVaultsAccess.getChangesetFromVersion(
          getChangesetFromVersionParams
        ),
      IVaultsErrorCode.IVaultNotFound
    );
  });

  it("should throw SZEWTwinError if IVault does not exist when querying changeset for named version", async () => {
    const getChangesetFromNamedVersionParams: IVaultIdArg & {
      versionName: string;
    } = {
      accessToken,
      iVaultId: "nonExistentiVaultId",
      versionName: "non existent named version",
    };

    await executeFuncAndAssertError(
      async () =>
        backendIVaultsAccess.getChangesetFromNamedVersion(
          getChangesetFromNamedVersionParams
        ),
      IVaultsErrorCode.IVaultNotFound
    );
  });

  it("should throw SZEWTwinError if Named Version does not exist when querying changeset for named version", async () => {
    const getChangesetFromNamedVersionParams: IVaultIdArg & {
      versionName: string;
    } = {
      accessToken,
      iVaultId: testIVaultForWrite.id,
      versionName: "non existent named version",
    };

    await executeFuncAndAssertError(
      async () =>
        backendIVaultsAccess.getChangesetFromNamedVersion(
          getChangesetFromNamedVersionParams
        ),
      IVaultsErrorCode.NamedVersionNotFound
    );
  });

  it("should throw SZEWTwinError if iVault does not exist when acquiring briefcase", async () => {
    const acquireNewBriefcaseIdParams: AcquireNewBriefcaseIdArg = {
      accessToken,
      iVaultId: "nonExistentiVaultId",
    };

    await executeFuncAndAssertError(
      async () =>
        backendIVaultsAccess.acquireNewBriefcaseId(acquireNewBriefcaseIdParams),
      IVaultsErrorCode.IVaultNotFound
    );
  });

  it("should throw SZEWTwinError when too many briefcases per user per minute are acquired", async () => {
    const briefcaseIds: number[] = [];
    try {
      const acquireNewBriefcaseIdParams: AcquireNewBriefcaseIdArg = {
        accessToken,
        iVaultId: testIVaultForWrite.id,
      };

      const acquire6BriefcasesFunc = async () => {
        for (let i = 0; i < 6; i++) {
          const briefcaseId = await backendIVaultsAccess.acquireNewBriefcaseId(
            acquireNewBriefcaseIdParams
          );
          briefcaseIds.push(briefcaseId);
        }
      };

      await executeFuncAndAssertError(
        acquire6BriefcasesFunc,
        IVaultsErrorCode.MaximumNumberOfBriefcasesPerUserPerMinute
      );
    } finally {
      for (const briefcaseId of briefcaseIds) {
        const releaseBriefcaseParams: BriefcaseIdArg = {
          accessToken,
          iVaultId: testIVaultForWrite.id,
          briefcaseId,
        };
        await backendIVaultsAccess.releaseBriefcase(releaseBriefcaseParams);
      }
    }
  });

  it("should throw SZEWTwinError if briefcase does not exist when releasing briefcase", async () => {
    const releaseBriefcaseParams: BriefcaseIdArg = {
      accessToken,
      iVaultId: testIVaultForWrite.id,
      briefcaseId: 555,
    };

    await executeFuncAndAssertError(
      async () => backendIVaultsAccess.releaseBriefcase(releaseBriefcaseParams),
      IVaultsErrorCode.BriefcaseNotFound
    );
  });

  it("should throw SZEWTwinError if changeset does not exist when downloading V1 checkpoint for specific changeset", async () => {
    const downloadV1CheckpointParams: DownloadRequest = {
      localFile: path.join(testDownloadPath, "error handling v1.dtw"),
      checkpoint: {
        accessToken,
        szewTwinId: "",
        iVaultId: testIVaultForWrite.id,
        changeset: { id: "nonExistentChangesetId" },
      },
    };

    await executeFuncAndAssertError(
      // eslint-disable-next-line deprecation/deprecation
      async () =>
        backendIVaultsAccess.downloadV1Checkpoint(downloadV1CheckpointParams),
      IVaultsErrorCode.ChangesetNotFound
    );
  });

  it("should throw SZEWTwinError if iVault does not exist when downloading baseline V1 checkpoint", async () => {
    const downloadV1CheckpointParams: DownloadRequest = {
      localFile: path.join(testDownloadPath, "error handling v1.dtw"),
      checkpoint: {
        accessToken,
        szewTwinId: "",
        iVaultId: "nonExistentiVaultId",
        changeset: { id: "", index: 0 },
      },
    };

    await executeFuncAndAssertError(
      // eslint-disable-next-line deprecation/deprecation
      async () =>
        backendIVaultsAccess.downloadV1Checkpoint(downloadV1CheckpointParams),
      IVaultsErrorCode.IVaultNotFound
    );
  });

  it("should throw SZEWTwinError if iVault does not exist when querying V2 checkpoint", async () => {
    const queryV2CheckpointParams: CheckpointProps = {
      accessToken,
      szewTwinId: "",
      iVaultId: "nonExistentiVaultId",
      changeset: { id: "nonExistentChangesetId" },
    };

    await executeFuncAndAssertError(
      async () =>
        backendIVaultsAccess.queryV2Checkpoint(queryV2CheckpointParams),
      IVaultsErrorCode.IVaultNotFound
    );
  });

  it("should throw SZEWTwinError if briefcase does not exist when acquiring locks", async () => {
    const briefcaseDbParams: BriefcaseDbArg = {
      accessToken,
      iVaultId: testIVaultForWrite.id,
      briefcaseId: 555,
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

    await executeFuncAndAssertError(
      async () =>
        backendIVaultsAccess.acquireLocks(briefcaseDbParams, locksToAcquire),
      IVaultsErrorCode.BriefcaseNotFound
    );
  });

  it("should throw SZEWTwinError if iVault does not exist when querying all locks", async () => {
    const queryAllLocksParams: BriefcaseDbArg = {
      accessToken,
      iVaultId: "nonExistentiVaultId",
      briefcaseId: 555,
      changeset: { id: "", index: 0 },
    };
    await executeFuncAndAssertError(
      async () => backendIVaultsAccess.queryAllLocks(queryAllLocksParams),
      IVaultsErrorCode.IVaultNotFound
    );
  });

  it("should throw SZEWTwinError if iVault does not exist when releasing all locks", async () => {
    const briefcaseDbParams: BriefcaseDbArg = {
      accessToken,
      iVaultId: "nonExistentiVaultId",
      briefcaseId: 5,
      changeset: { id: "", index: 0 },
    };

    await executeFuncAndAssertError(
      async () => backendIVaultsAccess.releaseAllLocks(briefcaseDbParams),
      IVaultsErrorCode.IVaultNotFound
    );
  });

  it("should throw SZEWTwinError if szewTwin does not exist when querying iVault with specific name", async () => {
    const queryIVaultByNameParams: IVaultNameArg = {
      accessToken,
      szewTwinId: createGuidValue(),
      iVaultName: "nonExistentiVaultName",
    };

    await executeFuncAndAssertError(
      async () =>
        backendIVaultsAccess.queryIVaultByName(queryIVaultByNameParams),
      IVaultsErrorCode.SZEWTwinNotFound
    );
  });

  it("should throw SZEWTwinError if user attempts to create iVault with duplicate name", async () => {
    const createNewIVaultParams: CreateNewIVaultProps = {
      accessToken,
      szewTwinId,
      iVaultName: testIVaultForRead.name,
    };

    await executeFuncAndAssertError(
      async () => backendIVaultsAccess.createNewIVault(createNewIVaultParams),
      IVaultsErrorCode.IVaultExists
    );
  });

  it("should throw SZEWTwinError if user attempts to delete nonexistent iVault", async () => {
    const deleteIVaultParams: IVaultIdArg & SZEWTwinIdArg = {
      accessToken,
      iVaultId: "nonExistentiVaultId",
      szewTwinId: "",
    };
    await executeFuncAndAssertError(
      async () => backendIVaultsAccess.deleteIVault(deleteIVaultParams),
      IVaultsErrorCode.IVaultNotFound
    );
  });

  async function executeFuncAndAssertError(
    func: () => Promise<void> | Promise<unknown>,
    expectedErrorCode: string
  ): Promise<void> {
    let thrownError: unknown;
    try {
      await func();
    } catch (error: unknown) {
      thrownError = error;
    }

    expect(thrownError).to.not.be.undefined;
    expect(
      SZEWTwinError.isError(thrownError, IVaultsErrorScope, expectedErrorCode)
    ).to.be.true;
    expect((thrownError as SZEWTwinError).message).to.not.be.empty;
  }
});
