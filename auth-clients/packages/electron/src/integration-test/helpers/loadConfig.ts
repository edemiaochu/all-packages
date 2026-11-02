/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { config } from "dotenv";

/**
 * Load configuration from environment variables.
 */
export function loadConfig() {
  config();

  if (
    !process.env.IVJS_TEST_ELECTRON_CLIENT_ID ||
    !process.env.IVJS_TEST_REGULAR_USER_NAME ||
    !process.env.IVJS_TEST_REGULAR_USER_PASSWORD
  ) {
    throw new Error(
      "Please expose IVJS_TEST_ELECTRON_CLIENT_ID, IVJS_TEST_REGULAR_USER_NAME and IVJS_TEST_REGULAR_USER_PASSWORD as env variables",
    );
  }

  return {
    clientId: process.env.IVJS_TEST_ELECTRON_CLIENT_ID,
    email: process.env.IVJS_TEST_REGULAR_USER_NAME,
    password: process.env.IVJS_TEST_REGULAR_USER_PASSWORD,
    envPrefix: process.env.IVJS_URL_PREFIX || "",
  };
}
