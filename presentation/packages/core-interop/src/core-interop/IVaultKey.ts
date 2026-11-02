/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/**
 * Defines input for `createIVaultKey`. Generally, this is an instance of either [IVaultDb](https://www.szewtwinjs.org/reference/core-backend/ivaults/ivaultdb/)
 * or [IVaultConnection](https://www.szewtwinjs.org/reference/core-frontend/ivaultconnection/ivaultconnection/).
 * @public
 */
interface CoreIVault {
  key: string;
  name: string;
}

/**
 * Attempts to create a unique identifier for the given iVault. In majority of cases that's going to be the `key` property, but if it's not
 * set (e.g. when using [BlankConnection](https://www.szewtwinjs.org/reference/core-frontend/ivaultconnection/blankconnection/)) - `name` property
 * is used instead. Finally, if both are empty - the function will throw an error.
 *
 * Example:
 *
 * ```ts
 * import { IVaultConnection } from "@szewtwin/core-frontend";
 * import { createIVaultKey } from "@szewtwin/presentation-core-interop";
 *
 * IVaultConnection.onOpen.addListener((ivault: IVaultConnection) => {
 *   const key = createIVaultKey(ivault);
 *   console.log(`IVault opened: "${key}"`);
 * });
 * ```
 *
 * @public
 */
export function createIVaultKey(ivault: CoreIVault): string {
  if (ivault.key.length) {
    return ivault.key;
  }
  if (ivault.name.length) {
    return ivault.name;
  }
  throw new Error(`Provided iVault doesn't have a key or name.`);
}
