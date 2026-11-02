/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import { SZEWTwinError } from "@szewtwin/core-szewec";
import {
  ErrorAdapter,
  OperationNameForErrorMapping,
} from "@szewtwin/ivaults-access-common";
import { IVaultsErrorParser } from "@szewtwin/ivaults-client-authoring";
import {
  IVaultsErrorCode,
  IVaultsErrorImpl,
  IVaultsErrorScope,
} from "@szewtwin/ivaults-client-management";

describe("ErrorAdapter", () => {
  [
    { foo: "bar" },
    new IVaultsErrorImpl({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      code: 5 as any,
      message: "",
      originalError: undefined,
      statusCode: undefined,
      details: undefined,
    }),
  ].forEach((originalError: unknown) => {
    it("should return original error if it does not have a string error code", () => {
      const result = ErrorAdapter.toSZEWTwinError(originalError, undefined);

      expect(result).to.be.equal(originalError);
    });
  });

  [
    IVaultsErrorCode.Unrecognized,

    IVaultsErrorCode.Unauthorized,
    IVaultsErrorCode.InsufficientPermissions,

    IVaultsErrorCode.TooManyRequests,
    IVaultsErrorCode.RequestTooLarge,
    IVaultsErrorCode.InvalidIVaultsRequest,
    IVaultsErrorCode.InvalidValue,
    IVaultsErrorCode.InvalidHeaderValue,
    IVaultsErrorCode.InvalidRequestBody,
    IVaultsErrorCode.InvalidThumbnailFormat,
    IVaultsErrorCode.MutuallyExclusivePropertiesProvided,
    IVaultsErrorCode.MutuallyExclusiveParametersProvided,
    IVaultsErrorCode.MissingRequestBody,
    IVaultsErrorCode.MissingRequiredProperty,
    IVaultsErrorCode.MissingRequiredParameter,
    IVaultsErrorCode.MissingRequiredHeader,
    IVaultsErrorCode.InvalidChange,
    IVaultsErrorCode.DataConflict,
    IVaultsErrorCode.NamedVersionNotFound,
    IVaultsErrorCode.UserNotFound,
    IVaultsErrorCode.ChangesetGroupNotFound,
    IVaultsErrorCode.BaselineFileNotFound,
    IVaultsErrorCode.BaselineFileInitializationFailed,
    IVaultsErrorCode.EmptyIVaultInitializationFailed,
    IVaultsErrorCode.IVaultFromTemplateInitializationFailed,
    IVaultsErrorCode.ClonedIVaultInitializationFailed,
    IVaultsErrorCode.ChangesetDownloadFailed,
  ].forEach((originalErrorCode) => {
    it(`should return original error if error code is unrecognized, indicates auth issue or does not have a corresponding status in IVaultHubStatus (${originalErrorCode})`, () => {
      const error = new IVaultsErrorImpl({
        code: originalErrorCode,
        message: "",
        originalError: new Error(),
        statusCode: undefined,
        details: undefined,
      });

      const result = ErrorAdapter.toSZEWTwinError(error, undefined);

      expect(result).to.be.equal(error);
    });
  });

  [
    IVaultsErrorCode.Unknown,
    IVaultsErrorCode.SZEWTwinNotFound,
    IVaultsErrorCode.IVaultNotFound,
    IVaultsErrorCode.ChangesetNotFound,
    IVaultsErrorCode.BriefcaseNotFound,
    IVaultsErrorCode.FileNotFound,
    IVaultsErrorCode.CheckpointNotFound,
    IVaultsErrorCode.LockNotFound,
    IVaultsErrorCode.IVaultExists,
    IVaultsErrorCode.VersionExists,
    IVaultsErrorCode.ChangesetExists,
    IVaultsErrorCode.NamedVersionOnChangesetExists,
    IVaultsErrorCode.NewerChangesExist,
    IVaultsErrorCode.BaselineFileInitializationTimedOut,
    IVaultsErrorCode.IVaultFromTemplateInitializationTimedOut,
    IVaultsErrorCode.ClonedIVaultInitializationTimedOut,
  ].forEach((originalErrorCode: IVaultsErrorCode) => {
    it(`should return correct error code (${originalErrorCode})`, () => {
      const originalErrorMessage = "test error message";
      const originalError = new IVaultsErrorImpl({
        code: originalErrorCode,
        message: originalErrorMessage,
        originalError: new Error(),
        statusCode: 400,
        details: undefined,
      });

      const result = ErrorAdapter.toSZEWTwinError(originalError, undefined);

      const isszewTwinError = SZEWTwinError.isError(
        result,
        IVaultsErrorScope,
        originalErrorCode
      );
      expect(isszewTwinError).to.be.true;
      const szewTwinError = result as SZEWTwinError;
      expect(szewTwinError.message).to.be.equal(originalErrorMessage);
    });
  });

  [
    {
      originalErrorCode: IVaultsErrorCode.RateLimitExceeded,
      operationName: "acquireBriefcase" as const,
      expectedErrorCode:
        IVaultsErrorCode.MaximumNumberOfBriefcasesPerUserPerMinute,
    },
    {
      originalErrorCode: IVaultsErrorCode.DownloadAborted,
      operationName: "downloadChangesets" as const,
      expectedErrorCode: IVaultsErrorCode.DownloadCancelled,
    },
    {
      originalErrorCode: IVaultsErrorCode.ConflictWithAnotherUser,
      operationName: "createChangeset" as const,
      expectedErrorCode: IVaultsErrorCode.AnotherUserPushing,
    },
    {
      originalErrorCode: IVaultsErrorCode.ConflictWithAnotherUser,
      operationName: "updateLocks" as const,
      expectedErrorCode: IVaultsErrorCode.LockOwnedByAnotherBriefcase,
    },
  ].forEach(
    (testCase: {
      originalErrorCode: IVaultsErrorCode;
      operationName: OperationNameForErrorMapping;
      expectedErrorCode: IVaultsErrorCode;
    }) => {
      it(`should handle generic error codes for specific operation (${testCase.originalErrorCode}, ${testCase.operationName})`, () => {
        const originalErrorMessage = "test error message";
        const originalError = new IVaultsErrorImpl({
          code: testCase.originalErrorCode,
          message: originalErrorMessage,
          originalError: new Error(),
          statusCode: undefined,
          details: undefined,
        });

        const result = ErrorAdapter.toSZEWTwinError(
          originalError,
          testCase.operationName
        );

        const isszewTwinError = SZEWTwinError.isError(
          result,
          IVaultsErrorScope,
          testCase.expectedErrorCode
        );
        expect(isszewTwinError).to.be.true;
        const szewTwinError = result as SZEWTwinError;
        expect(szewTwinError.message).to.be.equal(originalErrorMessage);
      });
    }
  );

  [
    {
      originalErrorCode: "foo" as IVaultsErrorCode,
      operationName: undefined,
    },
    {
      originalErrorCode: IVaultsErrorCode.ResourceQuotaExceeded,
      operationName: "downloadChangesets" as const,
    },
    {
      originalErrorCode: IVaultsErrorCode.RateLimitExceeded,
      operationName: undefined,
    },
    {
      originalErrorCode: IVaultsErrorCode.DownloadAborted,
      operationName: "acquireBriefcase" as const,
    },
    {
      originalErrorCode: IVaultsErrorCode.ConflictWithAnotherUser,
      operationName: "acquireBriefcase" as const,
    },
  ].forEach(
    (testCase: {
      originalErrorCode: IVaultsErrorCode;
      operationName: OperationNameForErrorMapping | undefined;
    }) => {
      it(`should return IVaultsErrorCode.Unknown specific status could not be determined (${testCase.originalErrorCode})`, () => {
        const originalErrorMessage = "test error message";
        const originalError = new IVaultsErrorImpl({
          code: testCase.originalErrorCode,
          message: originalErrorMessage,
          statusCode: undefined,
          originalError: new Error(),
          details: undefined,
        });

        const result = ErrorAdapter.toSZEWTwinError(
          originalError,
          testCase.operationName
        );

        const isszewTwinError = SZEWTwinError.isError(
          result,
          IVaultsErrorScope,
          IVaultsErrorCode.Unknown
        );
        expect(isszewTwinError).to.be.true;
        const szewTwinError = result as SZEWTwinError;
        expect(szewTwinError.message).to.be.equal(originalErrorMessage);
      });
    }
  );

  it("should correctly parse MaximumNumberOfBriefcasesPerUser error", () => {
    const apiResponse = {
      error: {
        code: "InvalidiVaultsRequest",
        message: "Cannot acquire Briefcase.",
        details: [
          {
            code: "foo",
            message: "bar",
          },
          {
            code: "foo",
            message: "bar",
            innerError: {},
          },
          {
            code: "ResourceQuotaExceeded",
            message: "Maximum number of Briefcases per user limit reached.",
            innerError: {
              code: "MaximumNumberOfBriefcasesPerUser",
            },
          },
        ],
      },
    };
    const apiError = IVaultsErrorParser.parse(
      { statusCode: 422, body: apiResponse },
      new Error()
    );

    const result = ErrorAdapter.toSZEWTwinError(apiError);

    const isszewTwinError = SZEWTwinError.isError(
      result,
      IVaultsErrorScope,
      IVaultsErrorCode.MaximumNumberOfBriefcasesPerUser
    );
    expect(isszewTwinError).to.be.true;
    const szewTwinError = result as SZEWTwinError;
    expect(szewTwinError.message).to.be.equal(
      "Cannot acquire Briefcase. Details:\n" +
        "1. Unrecognized: bar\n" +
        "2. Unrecognized: bar\n" +
        "3. ResourceQuotaExceeded: Maximum number of Briefcases per user limit reached.\n"
    );
  });

  it("should correctly parse MaximumNumberOfBriefcasesPerUserPerMinute error", () => {
    const apiResponse = {
      error: {
        code: "RateLimitExceeded",
        message: "Maximum number of briefcases per user per minute reached.",
      },
    };
    const apiError = IVaultsErrorParser.parse(
      { statusCode: 429, body: apiResponse },
      new Error()
    );

    const result = ErrorAdapter.toSZEWTwinError(apiError, "acquireBriefcase");

    const isszewTwinError = SZEWTwinError.isError(
      result,
      IVaultsErrorScope,
      IVaultsErrorCode.MaximumNumberOfBriefcasesPerUserPerMinute
    );
    expect(isszewTwinError).to.be.true;
    const szewTwinError = result as SZEWTwinError;
    expect(szewTwinError.message).to.be.equal(
      "Maximum number of briefcases per user per minute reached."
    );
  });

  it("should retain conflicting locks error details", () => {
    const apiResponse = {
      error: {
        code: "ConflictWithAnotherUser",
        message: "Lock(s) is owned by another Briefcase.",
        conflictingLocks: [
          { objectId: "0x1", lockLevel: "exclusive", briefcaseIds: [1] },
          { objectId: "0x2", lockLevel: "exclusive", briefcaseIds: [1] },
        ],
      },
    };
    const apiError = IVaultsErrorParser.parse(
      { statusCode: 409, body: apiResponse },
      new Error()
    );

    const result = ErrorAdapter.toSZEWTwinError(apiError, "updateLocks");

    const isszewTwinError = SZEWTwinError.isError(
      result,
      IVaultsErrorScope,
      IVaultsErrorCode.LockOwnedByAnotherBriefcase
    );
    expect(isszewTwinError).to.be.true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const szewTwinError = result as any;
    const firstLock = apiResponse.error.conflictingLocks[0];
    const secondLock = apiResponse.error.conflictingLocks[1];
    expect(szewTwinError.conflictingLocks[0]).to.be.equal(firstLock);
    expect(szewTwinError.conflictingLocks[1]).to.be.equal(secondLock);
    expect(szewTwinError.message).to.be.equal(
      "Lock(s) is owned by another Briefcase. Conflicting locks:\n" +
        `1. Object id: ${firstLock.objectId}, lock level: ${firstLock.lockLevel}, briefcase ids: ${firstLock.briefcaseIds[0]}\n` +
        `2. Object id: ${secondLock.objectId}, lock level: ${secondLock.lockLevel}, briefcase ids: ${secondLock.briefcaseIds[0]}\n`
    );
  });
});
