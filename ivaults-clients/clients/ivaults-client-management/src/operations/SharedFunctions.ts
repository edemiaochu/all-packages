/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  AuthorizationCallback,
  HeaderFactories,
  Link,
  User,
} from "../base/types";

import { IVaultsApiUrlFormatter } from "./IVaultsApiUrlFormatter";
import { OperationOptions } from "./OperationOptions";
import { UserOperations } from "./user/UserOperations";

export async function getUser(
  authorization: AuthorizationCallback,
  userOperations: UserOperations<OperationOptions>,
  urlFormatter: IVaultsApiUrlFormatter,
  userLink: string | undefined,
  headers?: HeaderFactories
): Promise<User | undefined> {
  if (!userLink) return undefined;

  const { iVaultId, userId } = urlFormatter.parseUserUrl(userLink);
  return userOperations.getSingle({
    authorization,
    iVaultId,
    userId,
    headers,
  });
}

export function assertStringHeaderValue(
  headerName: string,
  headerValue: unknown
): asserts headerValue is string {
  const isString =
    typeof headerValue === "string" || headerValue instanceof String;
  if (!isString)
    throw new Error(
      `Assertion failed: header's ${headerName} value is not a string.`
    );
}

export function assertLink(
  link: Link | null | undefined
): asserts link is Link {
  if (!link || !link.href) throw new Error("Assertion failed: link is falsy.");
}
