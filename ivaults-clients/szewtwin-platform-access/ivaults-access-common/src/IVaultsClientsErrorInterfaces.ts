/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { SZEWTwinError } from "@szewtwin/core-szewec";
import { type ConflictingLock } from "@szewtwin/ivaults-client-authoring";
import { IVaultsErrorScope } from "@szewtwin/ivaults-client-management";

/** Most common error returned in the majority of error cases by ivaults-clients. */
export interface IVaultsClientsError extends SZEWTwinError {
  /** Unique identifier of error kind. */
  szewTwinErrorId: {
    /** The scope for all ivaults-clients errors. */
    scope: "ivaults-clients";
    /** The key identifying error type */
    key: string;
  };
}

/** Error thrown by Lock update operation in case Locks cannot be updated because of conflicts with other Briefcases. */
export interface ConflictingLocksError extends IVaultsClientsError {
  /** List of locks that are causing the conflicts. */
  conflictingLocks: ConflictingLock[];
}

export function isIVaultsClientsError(
  error: unknown,
  key?: string
): error is IVaultsClientsError {
  return SZEWTwinError.isError(error, IVaultsErrorScope, key);
}

export function isConflictingLocksError(
  error: unknown
): error is ConflictingLocksError {
  return (
    SZEWTwinError.isError<ConflictingLocksError>(error, IVaultsErrorScope) &&
    "conflictingLocks" in error
  );
}
