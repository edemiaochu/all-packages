/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/** Error scope */
export const IVaultsErrorScope = "ivaults-clients";

/** Possible error codes. */
export enum IVaultsErrorCode {
  AnotherUserPushing = "AnotherUserPushing",
  BaselineFileInitializationFailed = "BaselineFileInitializationFailed",
  BaselineFileInitializationTimedOut = "BaselineFileInitializationTimedOut",
  BaselineFileNotFound = "BaselineFileNotFound",
  BriefcaseNotFound = "BriefcaseNotFound",
  CannotAcquire = "CannotAcquire",
  ChangesetDownloadFailed = "ChangesetDownloadFailed",
  ChangesetExists = "ChangesetExists",
  ChangesetExtendedDataNotFound = "ChangesetExtendedDataNotFound",
  ChangesetGroupNotFound = "ChangesetGroupNotFound",
  ChangesetNotFound = "ChangesetNotFound",
  CheckpointNotFound = "CheckpointNotFound",
  ClonedIVaultInitializationFailed = "ClonedIVaultInitializationFailed",
  ClonedIVaultInitializationTimedOut = "ClonedIVaultInitializationTimedOut",
  ConflictWithAnotherUser = "ConflictWithAnotherUser",
  DataConflict = "DataConflict",
  DownloadAborted = "DownloadAborted",
  DownloadCancelled = "DownloadCancelled",
  EmptyIVaultInitializationFailed = "EmptyIVaultInitializationFailed",
  FileNotFound = "FileNotFound",
  IVaultExists = "iVaultExists",
  IVaultForkInitializationFailed = "IVaultForkInitializationFailed",
  IVaultForkInitializationTimedOut = "IVaultForkInitializationTimedOut",
  IVaultFromTemplateInitializationFailed = "IVaultFromTemplateInitializationFailed",
  IVaultFromTemplateInitializationTimedOut = "IVaultFromTemplateInitializationTimedOut",
  IVaultNotFound = "iVaultNotFound",
  InsufficientPermissions = "InsufficientPermissions",
  InvalidChange = "InvalidChange",
  InvalidHeaderValue = "InvalidHeaderValue",
  InvalidIVaultGCSCreationMode = "InvalidIVaultGCSCreationMode",
  InvalidIVaultsRequest = "InvalidiVaultsRequest",
  InvalidRequestBody = "InvalidRequestBody",
  InvalidThumbnailFormat = "InvalidThumbnailFormat",
  InvalidValue = "InvalidValue",
  SZEWTwinNotFound = "szewTwinNotFound",
  LockNotFound = "LockNotFound",
  LockOwnedByAnotherBriefcase = "LockOwnedByAnotherBriefcase",
  MainIVaultIsMissingFederationGuids = "MainIVaultIsMissingFederationGuids",
  MaximumNumberOfBriefcasesPerUser = "MaximumNumberOfBriefcasesPerUser",
  MaximumNumberOfBriefcasesPerUserPerMinute = "MaximumNumberOfBriefcasesPerUserPerMinute",
  MissingRequestBody = "MissingRequestBody",
  MissingRequiredHeader = "MissingRequiredHeader",
  MissingRequiredParameter = "MissingRequiredParameter",
  MissingRequiredProperty = "MissingRequiredProperty",
  MutuallyExclusiveParametersProvided = "MutuallyExclusiveParametersProvided",
  MutuallyExclusivePropertiesProvided = "MutuallyExclusivePropertiesProvided",
  NamedVersionNotFound = "NamedVersionNotFound",
  NamedVersionOnChangesetExists = "NamedVersionOnChangesetExists",
  NewerChangesExist = "NewerChangesExist",
  RateLimitExceeded = "RateLimitExceeded",
  RequestTooLarge = "RequestTooLarge",
  ResourceQuotaExceeded = "ResourceQuotaExceeded",
  StorageTypeNotSupported = "StorageTypeNotSupported",
  TooManyRequests = "TooManyRequests",
  Unauthorized = "Unauthorized",
  Unknown = "Unknown",
  Unrecognized = "Unrecognized",
  UserNotFound = "UserNotFound",
  VersionExists = "NamedVersionExists",
}

/** Error detail information. */
export interface IVaultsErrorDetail {
  /** Error detail code. See {@link IVaultsErrorCode}. */
  code: IVaultsErrorCode;
  /** Message that describes the error detail. */
  message: string;
  /** Name of the property or parameter which is related to the issue. */
  target?: string;
  /** Inner error that potentially narrows down the issue specified in the `IVaultsErrorDetail.code` property. */
  innerError?: ErrorDetailInnerError;
}

/** Additional information that extends IVaultsErrorDetail. See {@link IVaultsErrorDetail} . */
export interface ErrorDetailInnerError {
  /** Error detail code. See {@link IVaultsErrorCode}. */
  code: IVaultsErrorCode;
}

/**
 * Original error that is thrown from `RestClient` implementation in case of http failure.
 * This error can be platform-dependent and vary based on `RestClient` implementation, so users should be
 * careful when implementing error handling.
 */
export interface IVaultsOriginalError extends Error {
  /** Original error code. */
  code?: string;
}

/** Base interface for all errors returned from iVaults API. */
export interface IVaultsErrorBase extends Error {
  /** Error code. See {@link iVaultsErrorCode}. */
  code: IVaultsErrorCode;
  /** Original error thrown when sending http request. */
  originalError?: IVaultsOriginalError;
}

/**
 * Most common error returned in the majority of error cases by iVaults API and the only error returned from iVaults
 * API operations that are surfaced in this library. Other types of errors may be returned from libraries that extend
 * this one.
 */
export interface IVaultsError extends IVaultsErrorBase {
  /** Data that describes the error in more detail. See {@link iVaultsErrorDetail}. */
  details?: IVaultsErrorDetail[];
  /** HTTP response status code. */
  statusCode?: number;
}

export function isIVaultsApiError(error: unknown): error is IVaultsError {
  const errorCode: unknown = (error as IVaultsError)?.code;
  return errorCode !== undefined && typeof errorCode === "string";
}
