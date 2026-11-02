/*---------------------------------------------------------------------------------------------
* Copyright (c) Szewec Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

/** @packageDocumentation
 * @module Authorization
 */

/**
 * Returns the IMS authority URL.
 * A prefix will be prepended based on the value of the IVJS_URL_PREFIX environment variable.
 * The prefix "dev-" will automatically be converted to "qa-".
 * @deprecated in 1.1.0. Please set the authority in `BrowserAuthorizationClientConfiguration` configuration object.
 */
export function getImsAuthority(): string {
  try {
    let prefix = process.env.IVJS_URL_PREFIX;
    console.warn("getImsAuthority", "use of process.env.IVJS_URL_PREFIX is deprecated. Please set the authority in `BrowserAuthorizationClientConfiguration` configuration object."); // eslint-disable-line no-console

    if (prefix === "dev-")
      prefix = "qa-";

    return `https://${prefix}ims.szewec.com`;
  } catch {
    // swallow error
  }

  return "https://ims.szewec.com";
}
