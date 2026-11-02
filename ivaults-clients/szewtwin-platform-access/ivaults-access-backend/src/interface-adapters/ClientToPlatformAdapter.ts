/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  LockProps,
  LockState,
  V2CheckpointAccessProps,
} from "@szewtwin/core-backend";
import { SZEWTwinError } from "@szewtwin/core-szewec";
import {
  ChangesetFileProps,
  ChangesetProps,
  ChangesetType,
} from "@szewtwin/core-common";
import {
  DownloadedChangeset,
  Lock,
  LockLevel,
} from "@szewtwin/ivaults-client-authoring";
import {
  ContainingChanges,
  DirectoryAccessInfo,
  IVaultsErrorCode,
  IVaultsErrorScope,
  MinimalChangeset,
  isIVaultsApiError,
} from "@szewtwin/ivaults-client-management";

export class ClientToPlatformAdapter {
  public static toChangesetProps(changeset: MinimalChangeset): ChangesetProps {
    return {
      id: changeset.id,
      index: changeset.index,
      parentId: changeset.parentId,
      changesType: ClientToPlatformAdapter.toChangesetType(
        changeset.containingChanges
      ),
      description: changeset.description,
      briefcaseId: changeset.briefcaseId,
      pushDate: changeset.pushDateTime,
      userCreated: changeset.creatorId,
      size: changeset.fileSize,
    };
  }

  public static toChangesetFileProps(
    changeset: DownloadedChangeset
  ): ChangesetFileProps {
    return {
      ...ClientToPlatformAdapter.toChangesetProps(changeset),
      pathname: changeset.filePath,
    };
  }

  public static toLockProps(lock: Lock): LockProps[] {
    const result: LockProps[] = [];
    for (const lockedObjectsForBriefcase of lock.lockedObjects)
      for (const objectId of lockedObjectsForBriefcase.objectIds)
        result.push({
          id: objectId,
          state: ClientToPlatformAdapter.toLockState(
            lockedObjectsForBriefcase.lockLevel
          ),
        });

    return result;
  }

  public static toV2CheckpointAccessProps(
    directoryAccessInfo: DirectoryAccessInfo,
    dbName: string
  ): V2CheckpointAccessProps {
    if (
      !directoryAccessInfo.baseDirectory ||
      !directoryAccessInfo.baseUrl ||
      !dbName
    )
      SZEWTwinError.throwError({
        szewTwinErrorId: {
          key: IVaultsErrorCode.CheckpointNotFound,
          scope: IVaultsErrorScope,
        },
        message: "Invalid V2 checkpoint",
      });
    if (
      directoryAccessInfo.storageType !== "azure" &&
      directoryAccessInfo.storageType !== "google"
    )
      SZEWTwinError.throwError({
        szewTwinErrorId: {
          key: IVaultsErrorCode.StorageTypeNotSupported,
          scope: IVaultsErrorScope,
        },
        message: "Invalid V2 checkpoint storage type",
      });
    if (
      directoryAccessInfo.storageType !== "azure" &&
      directoryAccessInfo.storageType !== "google"
    )
      SZEWTwinError.throwError({
        szewTwinErrorId: {
          key: IVaultsErrorCode.StorageTypeNotSupported,
          scope: IVaultsErrorScope,
        },
        message: "Invalid V2 checkpoint storage type",
      });

    return {
      containerId: directoryAccessInfo.baseDirectory,
      sasToken:
        directoryAccessInfo.storageType === "azure"
          ? directoryAccessInfo.azure!.sasToken
          : directoryAccessInfo.google!.authorization,
      accountName: directoryAccessInfo.storage,
      dbName,
      storageType:
        directoryAccessInfo.storageType === "azure"
          ? "azure?sas=1"
          : directoryAccessInfo.storageType,
    };
  }

  public static toChangesetDownloadAbortedError(error: unknown): unknown {
    if (
      !isIVaultsApiError(error) ||
      error.code !== IVaultsErrorCode.DownloadAborted
    )
      return error;

    return SZEWTwinError.create({
      szewTwinErrorId: {
        key: IVaultsErrorCode.DownloadCancelled,
        scope: IVaultsErrorScope,
      },
      message: error.message,
    });
  }

  // eslint-disable-next-line deprecation/deprecation
  private static toLockState(lockLevel: LockLevel): LockState {
    switch (lockLevel) {
      case LockLevel.None:
        // eslint-disable-next-line deprecation/deprecation
        return LockState.None;
      case LockLevel.Shared:
        // eslint-disable-next-line deprecation/deprecation
        return LockState.Shared;
      case LockLevel.Exclusive:
        // eslint-disable-next-line deprecation/deprecation
        return LockState.Exclusive;
      default:
        SZEWTwinError.throwError({
          szewTwinErrorId: {
            key: IVaultsErrorCode.InvalidIVaultsRequest,
            scope: IVaultsErrorScope,
          },
          message: "Unsupported LockLevel",
        });
    }
  }

  private static toChangesetType(
    containingChanges: ContainingChanges
  ): ChangesetType {
    switch (containingChanges) {
      case ContainingChanges.Schema:
        return ChangesetType.Schema;
      default:
        return ChangesetType.Regular;
    }
  }
}
