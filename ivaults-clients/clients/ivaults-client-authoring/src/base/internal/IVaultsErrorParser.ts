/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  IVaultsApiError,
  IVaultsErrorBaseImpl,
  IVaultsErrorCode,
  IVaultsOriginalError,
  IVaultsErrorParser as ManagementIVaultsErrorParser,
  ResponseInfo,
} from "@szewtwin/ivaults-client-management";

import {
  ConflictingLock,
  ConflictingLocksError,
  LocksError,
} from "../types/apiEntities/LockErrorInterfaces";

interface AuthoringIVaultsApiErrorWrapper {
  error: AuthoringIVaultsApiError;
}

interface AuthoringIVaultsApiError extends IVaultsApiError {
  objectIds?: string[];
  conflictingLocks?: ConflictingLock[];
}

class LocksErrorImpl extends IVaultsErrorBaseImpl implements LocksError {
  public objectIds?: string[];

  constructor(params: {
    code: IVaultsErrorCode;
    message: string;
    originalError: IVaultsOriginalError | undefined;
    objectIds?: string[];
  }) {
    super(params);
    this.objectIds = params.objectIds;
  }
}

class ConflictingLocksErrorImpl
  extends IVaultsErrorBaseImpl
  implements ConflictingLocksError
{
  public conflictingLocks?: ConflictingLock[];

  constructor(params: {
    code: IVaultsErrorCode;
    message: string;
    originalError: IVaultsOriginalError | undefined;
    conflictingLocks?: ConflictingLock[];
  }) {
    super(params);
    this.conflictingLocks = params.conflictingLocks;
  }
}

export class IVaultsErrorParser extends ManagementIVaultsErrorParser {
  public static override parse(
    response: ResponseInfo,
    originalError: IVaultsOriginalError
  ): Error {
    const errorFromApi: AuthoringIVaultsApiErrorWrapper | undefined =
      response.body as AuthoringIVaultsApiErrorWrapper;
    const errorCode: IVaultsErrorCode = IVaultsErrorParser.parseCode(
      errorFromApi?.error?.code
    );

    if (errorCode === IVaultsErrorCode.NewerChangesExist) {
      const errorMessage = IVaultsErrorParser.parseAndFormatLockErrorMessage(
        errorFromApi?.error?.message,
        errorFromApi?.error?.objectIds
      );
      return new LocksErrorImpl({
        code: errorCode,
        message: errorMessage,
        originalError,
        objectIds: errorFromApi?.error?.objectIds,
      });
    }

    if (errorCode === IVaultsErrorCode.ConflictWithAnotherUser) {
      const errorMessage =
        IVaultsErrorParser.parseAndFormatLockConflictErrorMessage(
          errorFromApi?.error?.message,
          errorFromApi?.error?.conflictingLocks
        );
      return new ConflictingLocksErrorImpl({
        code: errorCode,
        message: errorMessage,
        originalError,
        conflictingLocks: errorFromApi?.error?.conflictingLocks,
      });
    }

    return ManagementIVaultsErrorParser.parse(response, originalError);
  }

  private static parseAndFormatLockErrorMessage(
    message: string | undefined,
    objectIds: string[] | undefined
  ): string {
    let result = message ?? ManagementIVaultsErrorParser._defaultErrorMessage;
    if (!objectIds || objectIds.length === 0) return result;

    result += ` Object ids: ${objectIds.join(" ,")}`;
    return result;
  }

  private static parseAndFormatLockConflictErrorMessage(
    message: string | undefined,
    conflictingLocks: ConflictingLock[] | undefined
  ) {
    let result = message ?? ManagementIVaultsErrorParser._defaultErrorMessage;
    if (!conflictingLocks || conflictingLocks.length === 0) return result;

    result += " Conflicting locks:\n";
    for (let i = 0; i < conflictingLocks.length; i++) {
      result += `${i + 1}. Object id: ${
        conflictingLocks[i].objectId
      }, lock level: ${
        conflictingLocks[i].lockLevel
      }, briefcase ids: ${conflictingLocks[i].briefcaseIds.join(", ")}\n`;
    }
    return result;
  }
}
