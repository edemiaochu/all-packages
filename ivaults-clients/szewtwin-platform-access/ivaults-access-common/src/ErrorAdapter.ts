/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { SZEWTwinError } from "@szewtwin/core-szewec";
import { type ConflictingLock } from "@szewtwin/ivaults-client-authoring";
import {
  IVaultsError,
  IVaultsErrorCode,
  IVaultsErrorScope,
  isIVaultsApiError,
} from "@szewtwin/ivaults-client-management";

import { ConflictingLocksError } from "./IVaultsClientsErrorInterfaces";

export type OperationNameForErrorMapping =
  | "acquireBriefcase"
  | "downloadChangesets"
  | "updateLocks"
  | "createChangeset"
  | "releaseLocksChunk";

export class ErrorAdapter {
  public static toSZEWTwinError(
    error: unknown,
    operationName?: OperationNameForErrorMapping
  ): unknown {
    if (!isIVaultsApiError(error)) return error;

    if (error.code === IVaultsErrorCode.Unrecognized) return error;

    if (ErrorAdapter.isAPIAuthError(error.code)) return error;
    if (ErrorAdapter.isIncorrectAPIUsageError(error.code)) return error;
    if (ErrorAdapter.isAPIErrorWithoutCorrespondingStatus(error.code))
      return error;

    if (error.code === IVaultsErrorCode.InvalidIVaultsRequest)
      return ErrorAdapter.adaptInvalidRequestErrorIfPossible(error);

    let errorCode = ErrorAdapter.tryMapGenericErrorCode(
      error.code,
      operationName
    );
    if (!errorCode) errorCode = ErrorAdapter.mapErrorCode(error.code);

    if ("conflictingLocks" in error)
      return SZEWTwinError.create<ConflictingLocksError>({
        szewTwinErrorId: {
          key: errorCode,
          scope: IVaultsErrorScope,
        },
        message: error.message,
        conflictingLocks: error.conflictingLocks as ConflictingLock[],
      });

    return SZEWTwinError.create({
      szewTwinErrorId: { key: errorCode, scope: IVaultsErrorScope },
      message: error.message,
    });
  }

  private static isAPIAuthError(apiErrorCode: IVaultsErrorCode): boolean {
    switch (apiErrorCode) {
      case IVaultsErrorCode.Unauthorized:
      case IVaultsErrorCode.InsufficientPermissions:
        return true;
      default:
        return false;
    }
  }

  private static isIncorrectAPIUsageError(
    apiErrorCode: IVaultsErrorCode
  ): boolean {
    switch (apiErrorCode) {
      case IVaultsErrorCode.TooManyRequests:
      case IVaultsErrorCode.RequestTooLarge:
      case IVaultsErrorCode.InvalidValue:
      case IVaultsErrorCode.InvalidHeaderValue:
      case IVaultsErrorCode.InvalidRequestBody:
      case IVaultsErrorCode.InvalidThumbnailFormat:
      case IVaultsErrorCode.MutuallyExclusivePropertiesProvided:
      case IVaultsErrorCode.MutuallyExclusiveParametersProvided:
      case IVaultsErrorCode.MissingRequestBody:
      case IVaultsErrorCode.MissingRequiredProperty:
      case IVaultsErrorCode.MissingRequiredParameter:
      case IVaultsErrorCode.MissingRequiredHeader:
      case IVaultsErrorCode.InvalidChange: // returned when, for example, user attempts to complete Baseline file upload while it is not in progress
      case IVaultsErrorCode.DataConflict: // returned when, for example, user attempts to complete Baseline file upload and the declared file size does not match actual uploaded file size
        return true;
      default:
        return false;
    }
  }

  private static isAPIErrorWithoutCorrespondingStatus(
    apiErrorCode: IVaultsErrorCode
  ): boolean {
    switch (apiErrorCode) {
      case IVaultsErrorCode.NamedVersionNotFound:
      case IVaultsErrorCode.UserNotFound:
      case IVaultsErrorCode.ChangesetGroupNotFound:
      case IVaultsErrorCode.BaselineFileNotFound:
      case IVaultsErrorCode.BaselineFileInitializationFailed:
      case IVaultsErrorCode.IVaultFromTemplateInitializationFailed:
      case IVaultsErrorCode.EmptyIVaultInitializationFailed:
      case IVaultsErrorCode.ClonedIVaultInitializationFailed:
      case IVaultsErrorCode.ChangesetDownloadFailed:
        return true;
      default:
        return false;
    }
  }

  private static adaptInvalidRequestErrorIfPossible(
    originalError: IVaultsError
  ): IVaultsError | SZEWTwinError {
    if (!originalError.details) return originalError;

    for (const errorDetail of originalError.details)
      if (
        errorDetail.innerError?.code ===
        IVaultsErrorCode.MaximumNumberOfBriefcasesPerUser
      )
        return SZEWTwinError.create<SZEWTwinError>({
          szewTwinErrorId: {
            key: IVaultsErrorCode.MaximumNumberOfBriefcasesPerUser,
            scope: IVaultsErrorScope,
          },
          message: originalError.message,
        });

    return originalError;
  }

  private static tryMapGenericErrorCode(
    apiErrorCode: IVaultsErrorCode,
    operationName?: OperationNameForErrorMapping
  ): IVaultsErrorCode | undefined {
    if (!operationName) return;

    if (
      apiErrorCode === IVaultsErrorCode.RateLimitExceeded &&
      operationName === "acquireBriefcase"
    )
      return IVaultsErrorCode.MaximumNumberOfBriefcasesPerUserPerMinute;

    if (
      apiErrorCode === IVaultsErrorCode.DownloadAborted &&
      operationName === "downloadChangesets"
    )
      return IVaultsErrorCode.DownloadCancelled;

    if (apiErrorCode === IVaultsErrorCode.ConflictWithAnotherUser) {
      if (operationName === "createChangeset")
        return IVaultsErrorCode.AnotherUserPushing;
      else if (operationName === "updateLocks")
        return IVaultsErrorCode.LockOwnedByAnotherBriefcase;
    }

    return undefined;
  }

  private static mapErrorCode(
    apiErrorCode: IVaultsErrorCode
  ): IVaultsErrorCode {
    switch (apiErrorCode) {
      case IVaultsErrorCode.Unknown:
      case IVaultsErrorCode.SZEWTwinNotFound:
      case IVaultsErrorCode.IVaultNotFound:
      case IVaultsErrorCode.ChangesetNotFound:
      case IVaultsErrorCode.BriefcaseNotFound:
      case IVaultsErrorCode.FileNotFound:
      case IVaultsErrorCode.CheckpointNotFound:
      case IVaultsErrorCode.LockNotFound:
      case IVaultsErrorCode.IVaultExists:
      case IVaultsErrorCode.VersionExists:
      case IVaultsErrorCode.ChangesetExists:
      case IVaultsErrorCode.NamedVersionOnChangesetExists:
      case IVaultsErrorCode.NewerChangesExist:
      case IVaultsErrorCode.BaselineFileInitializationTimedOut:
      case IVaultsErrorCode.IVaultFromTemplateInitializationTimedOut:
      case IVaultsErrorCode.ClonedIVaultInitializationTimedOut:
        return apiErrorCode;

      default:
        return IVaultsErrorCode.Unknown;
    }
  }
}
