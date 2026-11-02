/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import {
  IVaultsError,
  IVaultsErrorCode,
  IVaultsOriginalError,
  ResponseInfo,
} from "@szewtwin/ivaults-client-management";
import { assertError } from "@szewtwin/ivaults-client-test-utils";

export function testIVaultsErrorParser(
  testedFunction: (
    response: ResponseInfo,
    originalError: IVaultsOriginalError
  ) => Error
): void {
  it("should parse valid iVaults API error", () => {
    // Arrange
    const errorResponse: unknown = {
      error: {
        code: "InvalidiVaultsRequest",
        message: "Cannot create iVault.",
        details: [
          {
            code: "InvalidValue",
            message:
              "Provided 'extent' value is not valid. Valid 'latitude' value range is -90 to 90.",
            target: "extent",
          },
          {
            code: "MissingRequiredProperty",
            message: "Required property is missing.",
            target: "name",
          },
          {
            code: "InvalidRequestBody",
            message:
              "Failed to parse request body. Make sure it is a valid JSON.",
          },
        ],
      },
    };

    // Act
    const parsedError: IVaultsError = testedFunction(
      { statusCode: 422, body: errorResponse },
      new Error()
    ) as IVaultsError;

    // Assert
    const expectedErrorMessage =
      "Cannot create iVault. Details:\n" +
      "1. InvalidValue: Provided 'extent' value is not valid. Valid 'latitude' value range is -90 to 90. Target: extent.\n" +
      "2. MissingRequiredProperty: Required property is missing. Target: name.\n" +
      "3. InvalidRequestBody: Failed to parse request body. Make sure it is a valid JSON.\n";
    assertError({
      objectThrown: parsedError,
      expectedError: {
        code: IVaultsErrorCode.InvalidIVaultsRequest,
        statusCode: 422,
        message: expectedErrorMessage,
        details: [
          {
            code: IVaultsErrorCode.InvalidValue,
            message:
              "Provided 'extent' value is not valid. Valid 'latitude' value range is -90 to 90.",
            target: "extent",
          },
          {
            code: IVaultsErrorCode.MissingRequiredProperty,
            message: "Required property is missing.",
            target: "name",
          },
          {
            code: IVaultsErrorCode.InvalidRequestBody,
            message:
              "Failed to parse request body. Make sure it is a valid JSON.",
          },
        ],
      },
    });
  });

  it("should parse unauthorized error when error is of regular iVaults API error format", () => {
    // Arrange
    const errorResponse: unknown = {
      error: {
        code: "iVaults API code",
        message: "iVaults API message",
      },
    };

    // Act
    const parsedError: IVaultsError = testedFunction(
      { statusCode: 401, body: errorResponse },
      new Error()
    ) as IVaultsError;

    // Assert
    assertError({
      objectThrown: parsedError,
      expectedError: {
        code: IVaultsErrorCode.Unauthorized,
        statusCode: 422,
        message: "iVaults API message",
      },
    });
  });

  it("should parse unauthorized error when error is of unwrapped error format", () => {
    // Arrange
    const errorResponse: unknown = {
      code: "unwrapped error code",
      message: "unwrapped error message",
    };

    // Act
    const parsedError: IVaultsError = testedFunction(
      { statusCode: 401, body: errorResponse },
      new Error()
    ) as IVaultsError;

    // Assert
    assertError({
      objectThrown: parsedError,
      expectedError: {
        code: IVaultsErrorCode.Unauthorized,
        statusCode: 401,
        message: "unwrapped error message",
      },
    });
  });

  it("should parse unauthorized error when error is of unknown format", () => {
    // Arrange
    const errorResponse: unknown = {};

    // Act
    const parsedError: IVaultsError = testedFunction(
      { statusCode: 401, body: errorResponse },
      new Error()
    ) as IVaultsError;

    // Assert
    assertError({
      objectThrown: parsedError,
      expectedError: {
        code: IVaultsErrorCode.Unauthorized,
        statusCode: 401,
        message: "Authorization failed",
      },
    });
  });

  it("should return unknown error when error properties and response properties are undefined", () => {
    // Act
    const parsedError: IVaultsError = testedFunction(
      { statusCode: undefined, body: undefined },
      new Error()
    ) as IVaultsError;

    // Assert
    assertError({
      objectThrown: parsedError,
      expectedError: {
        code: IVaultsErrorCode.Unrecognized,
        message:
          "Unknown error occurred.\n" +
          "Original error message: ,\n" +
          "original error code: undefined,\n" +
          "response status code: undefined,\n" +
          "response body: undefined",
      },
    });
  });

  it("should include original error code in unrecognized error message", () => {
    // Act
    const originalError = new Error("originalErrorMessage");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (originalError as any).code = "originalErrorCode";
    const parsedError: IVaultsError = testedFunction(
      { statusCode: undefined, body: undefined },
      originalError
    ) as IVaultsError;

    // Assert
    assertError({
      objectThrown: parsedError,
      expectedError: {
        code: IVaultsErrorCode.Unrecognized,
        message:
          "Unknown error occurred.\n" +
          "Original error message: originalErrorMessage,\n" +
          "original error code: originalErrorCode,\n" +
          "response status code: undefined,\n" +
          "response body: undefined",
      },
    });
  });

  it("should return unknown error when error body is not defined", () => {
    // Act
    const parsedError: IVaultsError = testedFunction(
      { statusCode: 444, body: undefined },
      new Error("originalErrorMessage")
    ) as IVaultsError;

    // Assert
    assertError({
      objectThrown: parsedError,
      expectedError: {
        code: IVaultsErrorCode.Unrecognized,
        statusCode: 444,
        message:
          "Unknown error occurred.\n" +
          "Original error message: originalErrorMessage,\n" +
          "original error code: undefined,\n" +
          "response status code: 444,\n" +
          "response body: undefined",
      },
    });
  });

  it("should return unknown error when error body is null", () => {
    // Act
    const parsedError: IVaultsError = testedFunction(
      { statusCode: 445, body: null },
      new Error("originalErrorMessage")
    ) as IVaultsError;

    // Assert
    assertError({
      objectThrown: parsedError,
      expectedError: {
        code: IVaultsErrorCode.Unrecognized,
        statusCode: 445,
        message:
          "Unknown error occurred.\n" +
          "Original error message: originalErrorMessage,\n" +
          "original error code: undefined,\n" +
          "response status code: 445,\n" +
          "response body: null",
      },
    });
  });

  it("should return unknown error when error body is of unexpected format", () => {
    // Act
    const parsedError: IVaultsError = testedFunction(
      { statusCode: 446, body: { unknownProperty: "unknown value" } },
      new Error("originalErrorMessage")
    ) as IVaultsError;

    // Assert
    assertError({
      objectThrown: parsedError,
      expectedError: {
        code: IVaultsErrorCode.Unrecognized,
        statusCode: 446,
        message:
          "Unknown error occurred.\n" +
          "Original error message: originalErrorMessage,\n" +
          "original error code: undefined,\n" +
          "response status code: 446,\n" +
          'response body: {"unknownProperty":"unknown value"}',
      },
    });
  });
}
