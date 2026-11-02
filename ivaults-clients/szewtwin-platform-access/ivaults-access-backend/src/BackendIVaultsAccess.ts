/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { join } from "path";

import {
  AcquireNewBriefcaseIdArg,
  BackendHubAccess,
  BriefcaseDbArg,
  BriefcaseIdArg,
  BriefcaseLocalValue,
  ChangesetArg,
  ChangesetRangeArg,
  CheckpointProps,
  CreateNewIVaultProps,
  DownloadChangesetArg,
  DownloadChangesetRangeArg,
  DownloadRequest,
  IVaultDb,
  IVaultHost,
  IVaultIdArg,
  IVaultJsFs,
  IVaultJsNative,
  IVaultNameArg,
  SZEWTwinIdArg,
  KnownLocations,
  LockMap,
  LockProps,
  SnapshotDb,
  TokenArg,
  V2CheckpointAccessProps,
} from "@szewtwin/core-backend";
import {
  AccessToken,
  Guid,
  GuidString,
  SZEWTwinError,
  Logger,
  OpenMode,
  StopWatch,
} from "@szewtwin/core-szewec";
import {
  BriefcaseId,
  BriefcaseIdValue,
  ChangesetFileProps,
  ChangesetIndex,
  ChangesetIndexAndId,
  ChangesetProps,
  IVaultVersion,
} from "@szewtwin/core-common";
import {
  AccessTokenAdapter,
  Constants,
  ErrorAdapter,
  getLatestFullChangesetIfExists,
  getNamedVersionChangeset,
  handleAPIErrors,
} from "@szewtwin/ivaults-access-common";
import {
  AcquireBriefcaseParams,
  CreateChangesetParams,
  CreateIVaultFromBaselineParams,
  DownloadChangesetListParams,
  DownloadSingleChangesetParams,
  DownloadedChangeset,
  GetLockListParams,
  IVaultsClient,
  IVaultsClientOptions,
  Lock,
  ReleaseBriefcaseParams,
  UpdateLockParams,
  downloadFile,
} from "@szewtwin/ivaults-client-authoring";
import {
  AuthorizationCallback,
  AuthorizationParam,
  Briefcase,
  Changeset,
  Checkpoint,
  DeleteIVaultParams,
  EntityListIterator,
  GetBriefcaseListParams,
  GetChangesetListParams,
  GetIVaultListParams,
  GetSingleChangesetParams,
  GetSingleCheckpointParams,
  IVault,
  IVaultScopedOperationParams,
  IVaultsErrorCode,
  IVaultsErrorScope,
  MinimalChangeset,
  MinimalIVault,
  ReleaseLocksChunkParams,
  ReleaseLocksChunkResult,
  SPECIAL_VALUES_ME,
  isIVaultsApiError,
  toArray,
} from "@szewtwin/ivaults-client-management";

import { RetryOptions } from "@szewtwin/object-storage-core";

import {
  getV1CheckpointSize,
  queryCurrentOrPrecedingV1Checkpoint,
  queryCurrentOrPrecedingV2Checkpoint,
} from "./CheckpointHelperFunctions";
import { createDefaultClientStorage } from "./DefaultClientStorage";
import { ClientToPlatformAdapter } from "./interface-adapters/ClientToPlatformAdapter";
import {
  DownloadCancellationMonitorFunc,
  PlatformToClientAdapter,
} from "./interface-adapters/PlatformToClientAdapter";

export type BackendIVaultsAccessOptions = Pick<
  Partial<IVaultsClientOptions>,
  "cloudStorage"
> &
  Omit<IVaultsClientOptions, "cloudStorage"> & {
    retryOptions?: RetryOptions;
  };

export class BackendIVaultsAccess implements BackendHubAccess {
  protected readonly _iVaultsClient: IVaultsClient;

  constructor(iVaultsClient?: IVaultsClient | BackendIVaultsAccessOptions) {
    this._iVaultsClient =
      iVaultsClient instanceof IVaultsClient
        ? iVaultsClient
        : new IVaultsClient({
            ...iVaultsClient,
            cloudStorage:
              iVaultsClient?.cloudStorage ??
              createDefaultClientStorage(iVaultsClient?.retryOptions),
          });
  }

  public get iVaultsClient(): IVaultsClient {
    return this._iVaultsClient;
  }

  public async downloadChangesets(
    arg: DownloadChangesetRangeArg
  ): Promise<ChangesetFileProps[]> {
    const downloadParams: DownloadChangesetListParams = {
      ...this.getIVaultScopedOperationParams(arg),
      targetDirectoryPath: arg.targetDir,
    };
    downloadParams.urlParams =
      PlatformToClientAdapter.toChangesetRangeUrlParams(arg.range);

    let downloadCancellationMonitorFunc:
      | DownloadCancellationMonitorFunc
      | undefined;
    try {
      const downloadProgressParams =
        PlatformToClientAdapter.toDownloadProgressParam(arg.progressCallback);
      downloadCancellationMonitorFunc =
        downloadProgressParams?.downloadCancellationMonitorFunc;
      downloadParams.progressCallback =
        downloadProgressParams?.progressCallback;
      downloadParams.abortSignal = downloadProgressParams?.abortSignal;

      const downloadedChangesets: DownloadedChangeset[] = await handleAPIErrors(
        async () => this._iVaultsClient.changesets.downloadList(downloadParams),
        "downloadChangesets"
      );

      const result: ChangesetFileProps[] = downloadedChangesets.map(
        (value: DownloadedChangeset) =>
          ClientToPlatformAdapter.toChangesetFileProps(value)
      );
      return result;
    } finally {
      downloadCancellationMonitorFunc?.({ shouldCancel: false });
    }
  }

  public async downloadChangeset(
    arg: DownloadChangesetArg
  ): Promise<ChangesetFileProps> {
    const downloadSingleChangesetParams: DownloadSingleChangesetParams = {
      ...this.getIVaultScopedOperationParams(arg),
      ...PlatformToClientAdapter.toChangesetIdOrIndex(arg.changeset),
      targetDirectoryPath: arg.targetDir,
    };

    let downloadCancellationMonitorFunc:
      | DownloadCancellationMonitorFunc
      | undefined;
    try {
      const downloadProgressParams =
        PlatformToClientAdapter.toDownloadProgressParam(arg.progressCallback);
      downloadCancellationMonitorFunc =
        downloadProgressParams?.downloadCancellationMonitorFunc;
      downloadSingleChangesetParams.progressCallback =
        downloadProgressParams?.progressCallback;
      downloadSingleChangesetParams.abortSignal =
        downloadProgressParams?.abortSignal;

      const downloadedChangeset: DownloadedChangeset = await handleAPIErrors(
        async () => {
          const stopwatch = new StopWatch(`[${arg.changeset.id}]`, true);
          Logger.logInfo(
            "BackendIVaultsAccess",
            `Starting download of changeset with id ${stopwatch.description}`
          );

          const innerResult =
            await this._iVaultsClient.changesets.downloadSingle(
              downloadSingleChangesetParams
            );

          Logger.logInfo(
            "BackendIVaultsAccess",
            `Downloaded changeset with id ${stopwatch.description} (${stopwatch.elapsedSeconds} seconds)`
          );
          return innerResult;
        },
        "downloadChangesets"
      );

      const result: ChangesetFileProps =
        ClientToPlatformAdapter.toChangesetFileProps(downloadedChangeset);
      return result;
    } finally {
      downloadCancellationMonitorFunc?.({ shouldCancel: false });
    }
  }

  public async queryChangeset(arg: ChangesetArg): Promise<ChangesetProps> {
    const getSingleChangesetParams: GetSingleChangesetParams = {
      ...this.getIVaultScopedOperationParams(arg),
      ...PlatformToClientAdapter.toChangesetIdOrIndex(arg.changeset),
    };

    const changeset: Changeset = await handleAPIErrors(async () =>
      this._iVaultsClient.changesets.getSingle(getSingleChangesetParams)
    );

    const result: ChangesetProps =
      ClientToPlatformAdapter.toChangesetProps(changeset);
    return result;
  }

  public async queryChangesets(
    arg: ChangesetRangeArg
  ): Promise<ChangesetProps[]> {
    const iVaultOperationParams: GetChangesetListParams =
      this.getIVaultScopedOperationParams(arg);
    iVaultOperationParams.urlParams =
      PlatformToClientAdapter.toChangesetRangeUrlParams(arg.range);

    const changesetsIterator: EntityListIterator<Changeset> =
      this._iVaultsClient.changesets.getRepresentationList(
        iVaultOperationParams
      );
    const changesets: Changeset[] = await handleAPIErrors(async () =>
      toArray(changesetsIterator)
    );

    const result: ChangesetProps[] = changesets.map((value: Changeset) =>
      ClientToPlatformAdapter.toChangesetProps(value)
    );
    return result;
  }

  public async pushChangeset(
    arg: IVaultIdArg & { changesetProps: ChangesetFileProps }
  ): Promise<ChangesetIndex> {
    let changesetDescription = arg.changesetProps.description;
    if (changesetDescription.length >= 255) {
      Logger.logWarning(
        "BackendIVaultsAccess",
        `pushChangeset - Truncating description to 255 characters. ${changesetDescription}`
      );
      changesetDescription = changesetDescription.slice(0, 254);
    }

    const createChangesetParams: CreateChangesetParams = {
      ...this.getIVaultScopedOperationParams(arg),
      changesetProperties:
        PlatformToClientAdapter.toChangesetPropertiesForCreate(
          arg.changesetProps,
          changesetDescription
        ),
    };
    const createdChangeset: Changeset = await handleAPIErrors(
      async () => this._iVaultsClient.changesets.create(createChangesetParams),
      "createChangeset"
    );

    return createdChangeset.index;
  }

  public async getLatestChangeset(arg: IVaultIdArg): Promise<ChangesetProps> {
    const latestChangeset = await getLatestFullChangesetIfExists(
      this._iVaultsClient,
      this.getIVaultScopedOperationParams(arg)
    );

    if (!latestChangeset) return Constants.ChangeSet0;

    const result: ChangesetProps =
      ClientToPlatformAdapter.toChangesetProps(latestChangeset);
    return result;
  }

  public async getChangesetFromVersion(
    arg: IVaultIdArg & { version: IVaultVersion }
  ): Promise<ChangesetProps> {
    const version = arg.version;
    if (version.isFirst) return Constants.ChangeSet0;

    const namedVersionChangesetId = version.getAsOfChangeSet();
    if (namedVersionChangesetId)
      return this.queryChangeset({
        ...arg,
        changeset: { id: namedVersionChangesetId },
      });

    const namedVersionName = version.getName();
    if (namedVersionName)
      return this.getChangesetFromNamedVersion({
        ...arg,
        versionName: namedVersionName,
      });

    return this.getLatestChangeset(arg);
  }

  public async getChangesetFromNamedVersion(
    arg: IVaultIdArg & { versionName: string }
  ): Promise<ChangesetProps> {
    const iVaultOperationParams: IVaultScopedOperationParams =
      this.getIVaultScopedOperationParams(arg);
    const namedVersionChangeset = await getNamedVersionChangeset(
      this._iVaultsClient,
      iVaultOperationParams,
      arg.versionName
    );

    const getSingleChangesetParams: GetSingleChangesetParams = {
      ...iVaultOperationParams,
      changesetId: namedVersionChangeset.id,
    };

    const changeset: MinimalChangeset = await handleAPIErrors(async () =>
      this._iVaultsClient.changesets.getSingle(getSingleChangesetParams)
    );

    const result: ChangesetProps =
      ClientToPlatformAdapter.toChangesetProps(changeset);
    return result;
  }

  public async acquireNewBriefcaseId(
    arg: AcquireNewBriefcaseIdArg
  ): Promise<BriefcaseId> {
    const acquireBriefcaseParams: AcquireBriefcaseParams =
      this.getIVaultScopedOperationParams(arg);

    const briefcase: Briefcase = await handleAPIErrors(
      async () =>
        this._iVaultsClient.briefcases.acquire(acquireBriefcaseParams),
      "acquireBriefcase"
    );

    if (!briefcase)
      SZEWTwinError.throwError({
        szewTwinErrorId: {
          key: IVaultsErrorCode.CannotAcquire,
          scope: IVaultsErrorScope,
        },
        message: "Could not acquire briefcase",
      });

    return briefcase.briefcaseId;
  }

  public async releaseBriefcase(arg: BriefcaseIdArg): Promise<void> {
    const releaseBriefcaseParams: ReleaseBriefcaseParams = {
      ...this.getIVaultScopedOperationParams(arg),
      briefcaseId: arg.briefcaseId,
    };

    await handleAPIErrors(async () =>
      this._iVaultsClient.briefcases.release(releaseBriefcaseParams)
    );
  }

  public async getMyBriefcaseIds(arg: IVaultIdArg): Promise<BriefcaseId[]> {
    const getBriefcaseListParams: GetBriefcaseListParams = {
      ...this.getIVaultScopedOperationParams(arg),
      urlParams: {
        ownerId: SPECIAL_VALUES_ME,
      },
    };

    const briefcasesIterator: EntityListIterator<Briefcase> =
      this._iVaultsClient.briefcases.getRepresentationList(
        getBriefcaseListParams
      );
    const briefcases: Briefcase[] = await handleAPIErrors(async () =>
      toArray(briefcasesIterator)
    );

    const briefcaseIds: BriefcaseId[] = briefcases.map(
      (briefcase) => briefcase.briefcaseId
    );
    return briefcaseIds;
  }

  // eslint-disable-next-line deprecation/deprecation
  public async downloadV1Checkpoint(
    arg: DownloadRequest
  ): Promise<ChangesetIndexAndId> {
    const iVaultScopedOperationParams: IVaultScopedOperationParams = {
      ...this.getAuthorizationParam(arg.checkpoint),
      iVaultId: arg.checkpoint.iVaultId,
    };
    const checkpoint: Checkpoint | undefined =
      await queryCurrentOrPrecedingV1Checkpoint(
        this._iVaultsClient,
        iVaultScopedOperationParams,
        arg
      );
    if (!checkpoint || !checkpoint._links?.download)
      SZEWTwinError.throwError({
        szewTwinErrorId: {
          key: IVaultsErrorCode.CheckpointNotFound,
          scope: IVaultsErrorScope,
        },
        message: "V1 checkpoint not found",
      });

    const v1CheckpointSize = await getV1CheckpointSize(
      checkpoint._links.download.href
    );

    let downloadCancellationMonitorFunc:
      | DownloadCancellationMonitorFunc
      | undefined;
    try {
      const downloadProgressParams =
        PlatformToClientAdapter.toDownloadProgressParam(arg.onProgress);
      downloadCancellationMonitorFunc =
        downloadProgressParams?.downloadCancellationMonitorFunc;
      const totalDownloadCallback = downloadProgressParams?.progressCallback
        ? (downloaded: number) =>
            downloadProgressParams.progressCallback?.(
              downloaded,
              v1CheckpointSize
            )
        : undefined;

      const stopwatch = new StopWatch(`[${checkpoint.changesetId}]`, true);
      Logger.logInfo(
        "BackendIVaultsAccess",
        `Starting download of checkpoint with id ${stopwatch.description}`
      );
      await downloadFile({
        storage: this._iVaultsClient.cloudStorage,
        storageType: checkpoint._links.download.storageType,
        url: checkpoint._links.download.href,
        localPath: arg.localFile,
        totalDownloadCallback,
        abortSignal: downloadProgressParams?.abortSignal,
      });
      Logger.logInfo(
        "BackendIVaultsAccess",
        `Downloaded checkpoint with id ${stopwatch.description} (${stopwatch.elapsedSeconds} seconds)`
      );

      return { index: checkpoint.changesetIndex, id: checkpoint.changesetId };
    } finally {
      downloadCancellationMonitorFunc?.({ shouldCancel: false });
    }
  }

  public async queryV2Checkpoint(
    arg: CheckpointProps
  ): Promise<V2CheckpointAccessProps | undefined> {
    const iVaultScopedOperationParams =
      this.getIVaultScopedOperationParams(arg);
    const getSingleCheckpointParams: GetSingleCheckpointParams = {
      ...this.getIVaultScopedOperationParams(arg),
      ...PlatformToClientAdapter.toChangesetIdOrIndex(arg.changeset),
    };

    let checkpoint: Checkpoint;
    try {
      checkpoint = await this._iVaultsClient.checkpoints.getSingle(
        getSingleCheckpointParams
      );
    } catch (error) {
      // Means that neither v1 nor v2 checkpoint exists
      if (
        isIVaultsApiError(error) &&
        error.code === IVaultsErrorCode.CheckpointNotFound
      ) {
        return arg?.allowPreceding
          ? queryCurrentOrPrecedingV2Checkpoint(
              this._iVaultsClient,
              iVaultScopedOperationParams,
              arg
            )
          : undefined;
      }

      throw ErrorAdapter.toSZEWTwinError(error);
    }

    // Means the v2 checkpoint does not exist.
    if (checkpoint.directoryAccessInfo === null) {
      return arg?.allowPreceding
        ? queryCurrentOrPrecedingV2Checkpoint(
            this._iVaultsClient,
            iVaultScopedOperationParams,
            arg
          )
        : undefined;
    }

    const result = ClientToPlatformAdapter.toV2CheckpointAccessProps(
      checkpoint.directoryAccessInfo,
      checkpoint.dbName
    );
    return result;
  }

  public async acquireLocks(
    arg: BriefcaseDbArg,
    locks: LockMap
  ): Promise<void> {
    const updateLockParams: UpdateLockParams = {
      ...this.getIVaultScopedOperationParams(arg),
      briefcaseId: arg.briefcaseId,
      changesetId: arg.changeset.id,
      lockedObjects: PlatformToClientAdapter.toLockedObjects(locks),
    };

    await handleAPIErrors(
      async () => this._iVaultsClient.locks.update(updateLockParams),
      "updateLocks"
    );
  }

  public async queryAllLocks(arg: BriefcaseDbArg): Promise<LockProps[]> {
    const getLockListParams: GetLockListParams = {
      ...this.getIVaultScopedOperationParams(arg),
      urlParams: {
        briefcaseId: arg.briefcaseId,
      },
    };

    const locksIterator: EntityListIterator<Lock> =
      this._iVaultsClient.locks.getList(getLockListParams);
    const locks: Lock[] = await handleAPIErrors(async () =>
      toArray(locksIterator)
    );

    if (locks.length === 0) return [];
    const result: LockProps[] = locks.flatMap((lock: Lock) =>
      ClientToPlatformAdapter.toLockProps(lock)
    );
    return result;
  }

  public async releaseAllLocks(arg: BriefcaseDbArg): Promise<void> {
    const releaseLocksChunkParams: ReleaseLocksChunkParams = {
      ...this.getIVaultScopedOperationParams(arg),
      briefcaseId: arg.briefcaseId,
      changesetId: arg.changeset.id,
    };

    let isLastChunk = false;
    do {
      const result: ReleaseLocksChunkResult = await handleAPIErrors(
        async () =>
          await this._iVaultsClient.locks.releaseLocksChunk(
            releaseLocksChunkParams
          ),
        "releaseLocksChunk"
      );
      isLastChunk = result.isLastChunk;
    } while (!isLastChunk);
  }

  public async queryIVaultByName(
    arg: IVaultNameArg
  ): Promise<GuidString | undefined> {
    const getIVaultListParams: GetIVaultListParams = {
      ...this.getAuthorizationParam(arg),
      urlParams: {
        szewTwinId: arg.szewTwinId,
        name: arg.iVaultName,
      },
    };

    const iVaultsIterator: EntityListIterator<MinimalIVault> =
      this._iVaultsClient.iVaults.getMinimalList(getIVaultListParams);
    const iVaults = await handleAPIErrors(async () => toArray(iVaultsIterator));

    return iVaults.length === 0 ? undefined : iVaults[0].id;
  }

  public async createNewIVault(arg: CreateNewIVaultProps): Promise<GuidString> {
    // TODO: use iVaultsClient.iVaults.createEmpty when it supports the `noLocks` flag.
    const baselineFilePath = this.copyAndPrepareBaselineFile(arg);
    const createIVaultFromBaselineParams: CreateIVaultFromBaselineParams = {
      ...this.getAuthorizationParam(arg),
      iVaultProperties: {
        ...PlatformToClientAdapter.toIVaultProperties(arg),
        filePath: baselineFilePath,
      },
    };

    const iVault: IVault = await handleAPIErrors(async () =>
      this._iVaultsClient.iVaults.createFromBaseline(
        createIVaultFromBaselineParams
      )
    );

    IVaultJsFs.removeSync(baselineFilePath);
    return iVault.id;
  }

  public async deleteIVault(arg: IVaultIdArg & SZEWTwinIdArg): Promise<void> {
    const deleteIVaultParams: DeleteIVaultParams =
      this.getIVaultScopedOperationParams(arg);

    return handleAPIErrors(async () =>
      this._iVaultsClient.iVaults.delete(deleteIVaultParams)
    );
  }

  private getIVaultScopedOperationParams(
    arg: IVaultIdArg
  ): IVaultScopedOperationParams {
    return {
      ...this.getAuthorizationParam(arg),
      iVaultId: arg.iVaultId,
    };
  }

  private getAuthorizationParam(tokenArg: TokenArg): AuthorizationParam {
    const authorizationCallback: AuthorizationCallback = tokenArg.accessToken
      ? this.getAuthorizationCallbackFromToken(tokenArg.accessToken)
      : AccessTokenAdapter.toAuthorizationCallback(() =>
          IVaultHost.getAccessToken()
        );

    return {
      authorization: authorizationCallback,
    };
  }

  private getAuthorizationCallbackFromToken(
    accessToken: AccessToken
  ): AuthorizationCallback {
    return () =>
      Promise.resolve(AccessTokenAdapter.toAuthorization(accessToken));
  }

  private copyAndPrepareBaselineFile(arg: CreateNewIVaultProps): string {
    const tempBaselineFilePath = join(
      KnownLocations.tmpdir,
      `temp-baseline-${Guid.createValue()}.bim`
    );
    IVaultJsFs.removeSync(tempBaselineFilePath);

    const baselineFilePath = arg.version0;
    if (!baselineFilePath) {
      // if they didn't supply a baseline file, create a blank one.
      const emptyBaseline = SnapshotDb.createEmpty(tempBaselineFilePath, {
        rootSubject: { name: arg.description ?? arg.iVaultName },
      });
      emptyBaseline.saveChanges();
      emptyBaseline.close();
    } else {
      // Check for wal before we open because opening for readWrite will create a 0 byte wal file.
      const foundWalFile = IVaultJsFs.existsSync(`${baselineFilePath}-wal`);
      const db = IVaultDb.openBldDb(
        { path: baselineFilePath },
        OpenMode.ReadWrite
      );
      if (foundWalFile) {
        Logger.logWarning(
          "BackendIVaultsAccess",
          "Wal file found while uploading file, performing checkpoint.",
          { baselineFilePath }
        );
        db.performCheckpoint();
      }
      this.closeFile(db);
      IVaultJsFs.copySync(baselineFilePath, tempBaselineFilePath);
    }

    const nativeDb = IVaultDb.openBldDb(
      { path: tempBaselineFilePath },
      OpenMode.ReadWrite
    );
    try {
      nativeDb.setSZEWTwinId(arg.szewTwinId);
      nativeDb.saveChanges();
      // cspell:disable-next-line
      nativeDb.deleteAllTxns(); // necessary before resetting briefcaseId
      nativeDb.resetBriefcaseId(BriefcaseIdValue.Unassigned);
      nativeDb.saveLocalValue(
        BriefcaseLocalValue.NoLocking,
        arg.noLocks ? "true" : undefined
      );
      nativeDb.saveChanges();
    } finally {
      this.closeFile(nativeDb);
    }

    return tempBaselineFilePath;
  }

  private closeFile(db: IVaultJsNative.BldDb): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((db as any).closeIVault) (db as any).closeIVault();
    else db.closeFile();
  }
}
