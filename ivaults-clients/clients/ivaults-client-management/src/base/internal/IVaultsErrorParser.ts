/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  IVaultsError,
  IVaultsErrorCode,
  IVaultsErrorDetail,
  IVaultsOriginalError,
} from "../types";

interface UnwrappedError {
  message: string;
}

interface IVaultsApiErrorWrapper {
  error: IVaultsApiError;
}

export interface IVaultsApiError {
  code: string;
  statusCode?: number;
  message?: string;
  details?: IVaultsApiErrorDetail[];
}

interface IVaultsApiErrorDetail {
  code: string;
  message: string;
  target: string;
}

export class IVaultsErrorBaseImpl extends Error {
  public code: IVaultsErrorCode;
  public originalError: IVaultsOriginalError | undefined;

  constructor(params: {
    code: IVaultsErrorCode;
    message: string;
    originalError: IVaultsOriginalError | undefined;
  }) {
    super();
    this.name = this.code = params.code;
    this.message = params.message;
    this.originalError = params.originalError;
  }
}

export class IVaultsErrorImpl
  extends IVaultsErrorBaseImpl
  implements IVaultsError
{
  public details?: IVaultsErrorDetail[];
  public statusCode?: number;

  constructor(params: {
    code: IVaultsErrorCode;
    message: string;
    originalError: IVaultsOriginalError | undefined;
    details: IVaultsErrorDetail[] | undefined;
    statusCode: number | undefined;
  }) {
    super(params);
    this.details = params.details;
    this.statusCode = params.statusCode;
  }
}

export interface ResponseInfo {
  statusCode?: number;
  body?: unknown;
}

export class IVaultsErrorParser {
  protected static readonly _defaultErrorMessage = "Unknown error occurred";
  protected static readonly _defaultUnauthorizedMessage =
    "Authorization failed";

  public static parse(
    response: ResponseInfo,
    originalError: IVaultsOriginalError
  ): Error {
    if (!response.body)
      return IVaultsErrorParser.createUnrecognizedError(
        response,
        originalError
      );

    if (response.statusCode === 401)
      return IVaultsErrorParser.createUnauthorizedError(
        response,
        originalError
      );

    const errorFromApi: IVaultsApiErrorWrapper | undefined =
      response.body as IVaultsApiErrorWrapper;
    const errorCode: IVaultsErrorCode = IVaultsErrorParser.parseCode(
      errorFromApi?.error?.code
    );

    if (errorCode === IVaultsErrorCode.Unrecognized)
      return IVaultsErrorParser.createUnrecognizedError(
        response,
        originalError
      );

    const errorDetails: IVaultsErrorDetail[] | undefined =
      IVaultsErrorParser.parseDetails(errorFromApi.error?.details);
    const errorMessage: string = IVaultsErrorParser.parseAndFormatMessage(
      errorFromApi?.error?.message,
      errorDetails
    );

    return new IVaultsErrorImpl({
      code: errorCode,
      statusCode: response.statusCode,
      originalError,
      message: errorMessage,
      details: errorDetails,
    });
  }

  protected static parseCode(errorCode: string | undefined): IVaultsErrorCode {
    if (!errorCode) return IVaultsErrorCode.Unrecognized;

    const adjustedErrorCode =
      IVaultsErrorParser.adjustErrorCodeCaseToMatchEnum(errorCode);
    let parsedCode: IVaultsErrorCode | undefined =
      IVaultsErrorCode[adjustedErrorCode as keyof typeof IVaultsErrorCode];
    if (!parsedCode) parsedCode = IVaultsErrorCode.Unrecognized;

    return parsedCode;
  }

  private static adjustErrorCodeCaseToMatchEnum(errorCode: string): string {
    return errorCode.replace("iVault", "IVault").replace("szewTwin", "SZEWTwin");
  }

  private static parseDetails(
    details: IVaultsApiErrorDetail[] | undefined
  ): IVaultsErrorDetail[] | undefined {
    if (!details) return undefined;

    return details.map((unparsedDetail) => {
      return { ...unparsedDetail, code: this.parseCode(unparsedDetail.code) };
    });
  }

  private static parseAndFormatMessage(
    message: string | undefined,
    errorDetails: IVaultsErrorDetail[] | undefined
  ): string {
    let result = message ?? IVaultsErrorParser._defaultErrorMessage;
    if (!errorDetails || errorDetails.length === 0) return result;

    result += " Details:\n";
    for (let i = 0; i < errorDetails.length; i++) {
      result += `${i + 1}. ${errorDetails[i].code}: ${errorDetails[i].message}`;
      if (errorDetails[i].target)
        result += ` Target: ${errorDetails[i].target}.`;
      result += "\n";
    }

    return result;
  }

  private static createUnrecognizedError(
    response: ResponseInfo,
    originalError: IVaultsOriginalError
  ): Error {
    return new IVaultsErrorImpl({
      code: IVaultsErrorCode.Unrecognized,
      statusCode: response.statusCode,
      originalError,
      message:
        `${IVaultsErrorParser._defaultErrorMessage}.\n` +
        `Original error message: ${originalError.message},\n` +
        `original error code: ${originalError.code},\n` +
        `response status code: ${response.statusCode},\n` +
        `response body: ${JSON.stringify(response.body)}`,
      details: undefined,
    });
  }

  private static createUnauthorizedError(
    response: ResponseInfo,
    originalError: IVaultsOriginalError
  ): Error {
    const errorMessage =
      (response.body as IVaultsApiErrorWrapper)?.error?.message ??
      (response.body as UnwrappedError)?.message ??
      IVaultsErrorParser._defaultUnauthorizedMessage;
    return new IVaultsErrorImpl({
      code: IVaultsErrorCode.Unauthorized,
      statusCode: response.statusCode,
      originalError,
      message: errorMessage,
      details: undefined,
    });
  }
}
