import { config } from "dotenv";
import { expand as dotenvExpand } from "dotenv-expand";
import * as path from "path";
import type { TestBrowserAuthorizationClientConfiguration } from "../TestUsers";

/**
 * Determines auth sign in flow.
 */
export enum TestConfigType {
  OIDC,
  AZURE,
  AUTHING,
}

function loadEnv(envFile: string) {
  const envResult = config({ path: envFile });
  if (!envResult.error) {
    dotenvExpand(envResult);
  }
}

/**
 * Loads configuration from environment variables
 */
export function loadConfig(
  configType: TestConfigType,
): TestBrowserAuthorizationClientConfiguration {
  loadEnv(path.join(__dirname, "..", "..", ".env"));
  config();

  if (configType === TestConfigType.OIDC) {
    if (!process.env.IVJS_OIDC_BROWSER_TEST_CLIENT_ID)
      // IMS oidc config
      throw new Error("Could not find IVJS_OIDC_BROWSER_TEST_CLIENT_ID");

    if (!process.env.IVJS_OIDC_BROWSER_TEST_REDIRECT_URI)
      throw new Error("Could not find IVJS_OIDC_BROWSER_TEST_REDIRECT_URI");

    if (!process.env.IVJS_OIDC_BROWSER_TEST_SCOPES)
      throw new Error("Could not find IVJS_OIDC_BROWSER_TEST_SCOPES");

    return {
      clientId: process.env.IVJS_OIDC_BROWSER_TEST_CLIENT_ID,
      redirectUri: process.env.IVJS_OIDC_BROWSER_TEST_REDIRECT_URI,
      scope: process.env.IVJS_OIDC_BROWSER_TEST_SCOPES,
    };
  }

  if (configType === TestConfigType.AZURE) {
    if (!process.env.IVJS_OIDC_AZUREAD_BROWSER_TEST_AUTHORITY)
      throw new Error(
        "Could not find IVJS_OIDC_AZUREAD_BROWSER_TEST_AUTHORITY",
      );
    if (!process.env.IVJS_OIDC_AZUREAD_BROWSER_TEST_CLIENT_ID)
      throw new Error(
        "Could not find IVJS_OIDC_AZUREAD_BROWSER_TEST_CLIENT_ID",
      );
    if (!process.env.IVJS_OIDC_AZUREAD_BROWSER_TEST_REDIRECT_URI)
      throw new Error(
        "Could not find IVJS_OIDC_AZUREAD_BROWSER_TEST_REDIRECT_URI",
      );
    if (!process.env.IVJS_OIDC_AZUREAD_BROWSER_TEST_SCOPES)
      throw new Error("Could not find IVJS_OIDC_AZUREAD_BROWSER_TEST_SCOPES");

    return {
      authority: process.env.IVJS_OIDC_AZUREAD_BROWSER_TEST_AUTHORITY,
      clientId: process.env.IVJS_OIDC_AZUREAD_BROWSER_TEST_CLIENT_ID,
      redirectUri: process.env.IVJS_OIDC_AZUREAD_BROWSER_TEST_REDIRECT_URI,
      scope: process.env.IVJS_OIDC_AZUREAD_BROWSER_TEST_SCOPES,
    };
  }

  if (configType === TestConfigType.AUTHING) {
    if (!process.env.IVJS_OIDC_AUTHING_BROWSER_TEST_AUTHORITY)
      throw new Error(
        "Could not find IVJS_OIDC_AUTHING_BROWSER_TEST_AUTHORITY",
      );

    if (!process.env.IVJS_OIDC_AUTHING_BROWSER_TEST_CLIENT_ID)
      throw new Error(
        "Could not find IVJS_OIDC_AUTHING_BROWSER_TEST_CLIENT_ID",
      );

    if (!process.env.IVJS_OIDC_AUTHING_BROWSER_TEST_REDIRECT_URI)
      throw new Error(
        "Could not find IVJS_OIDC_AUTHING_BROWSER_TEST_REDIRECT_URI",
      );

    if (!process.env.IVJS_OIDC_AUTHING_BROWSER_TEST_SCOPES)
      throw new Error("Could not find IVJS_OIDC_AUTHING_BROWSER_TEST_SCOPES");

    return {
      authority: process.env.IVJS_OIDC_AUTHING_BROWSER_TEST_AUTHORITY,
      clientId: process.env.IVJS_OIDC_AUTHING_BROWSER_TEST_CLIENT_ID,
      redirectUri: process.env.IVJS_OIDC_AUTHING_BROWSER_TEST_REDIRECT_URI,
      scope: process.env.IVJS_OIDC_AUTHING_BROWSER_TEST_SCOPES,
      clientSecret: process.env.IVJS_OIDC_AUTHING_BROWSER_TEST_CLIENT_SECRET,
    };
  }

  throw new Error("Undefined or incorrexct TestConfigType provided");
}
