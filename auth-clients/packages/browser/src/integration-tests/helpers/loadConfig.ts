/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

// eslint@typescript-eslint/naming-convention
import { config } from "dotenv";

export function loadConfig() {
  config();

  if (
    !process.env.IVJS_TEST_REGULAR_USER_NAME ||
    !process.env.IVJS_TEST_REGULAR_USER_PASSWORD ||
    !process.env.ITJS_AUTH_CLIENTS_BROWSER_BASE_URL ||
    !process.env.ITJS_AUTH_CLIENTS_BROWSER_CLIENT_ID
  ) {
    throw new Error(
      "Please expose IVJS_TEST_REGULAR_USER_NAME, IVJS_TEST_REGULAR_USER_PASSWORD, BASE_URL, and CLIENT_ID as env variables"
    );
  }

  return {
    email: process.env.IVJS_TEST_REGULAR_USER_NAME,
    password: process.env.IVJS_TEST_REGULAR_USER_PASSWORD,
    url: process.env.ITJS_AUTH_CLIENTS_BROWSER_BASE_URL,
    clientId: process.env.ITJS_AUTH_CLIENTS_BROWSER_CLIENT_ID,
    envPrefix: process.env.IVJS_URL_PREFIX || "",
  };
}
