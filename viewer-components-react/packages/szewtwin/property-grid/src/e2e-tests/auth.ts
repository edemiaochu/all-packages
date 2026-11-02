/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable no-console */

import { getTestAccessToken } from "@szewtwin/oidc-signin-tool";
import { test as setup } from "@playwright/test";

setup("authenticate", async ({ page }) => {
  if (!process.env.IVJS_USER_EMAIL || !process.env.IVJS_USER_PASSWORD) {
    throw new Error(`User credentials need to be supplied through IVJS_USER_EMAIL and IVJS_USER_PASSWORD environment variables.`);
  }
  if (!process.env.IVJS_AUTH_CLIENT_CLIENT_ID) {
    throw new Error(`Auth client id needs to be supplied through IVJS_AUTH_CLIENT_CLIENT_ID environment variable.`);
  }
  // eslint-disable-next-line @szewtwin/no-internal
  const accessToken = await getTestAccessToken(
    {
      authority: "https://qa-ims.szewec.com",
      scope: "szewtwin-platform",
      clientId: process.env.IVJS_AUTH_CLIENT_CLIENT_ID,
      redirectUri: "http://localhost:3000/signin-callback",
    },
    {
      email: process.env.IVJS_USER_EMAIL,
      password: process.env.IVJS_USER_PASSWORD,
    },
  );
  await page.context().addCookies([
    {
      name: "IVJS_USER_ACCESS_TOKEN",
      value: accessToken ?? "",
      domain: "localhost",
      path: "/",
    },
  ]);
  await page.context().storageState({ path: "e2e-out/.auth.json" });
  console.log(`Added an IVJS_USER_ACCESS_TOKEN cookie`);
});
