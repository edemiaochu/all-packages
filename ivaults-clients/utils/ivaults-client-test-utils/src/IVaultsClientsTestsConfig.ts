/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as dotenv from "dotenv";
import { injectable } from "inversify";

import { TestSetupError } from "./CommonTestUtils";

export interface AuthConfigValues {
  authority: string;
  clientId: string;
  clientSecret: string;
  redirectUrl: string;
}

export interface ApiConfigValues {
  baseUrl: string;
  version?: string;
  scopes: string;
}

export interface ApisConfigValues {
  szewTwins: ApiConfigValues;
  iVaults: ApiConfigValues;
}

export interface TestUserConfigValues {
  email: string;
  password: string;
}

export interface TestUsersConfigValues {
  admin1: TestUserConfigValues;
  admin2FullyFeatured: TestUserConfigValues;
}

export interface BehaviorOptions {
  /**
   * Instructs the test setup to delete the existing reusable iVault and create a new one. Used
   * in scenarios there are new features added to the API and we want to update the reusable iVault have more configured properties.
   */
  recreateReusableIVault: boolean;
}

@injectable()
export class IVaultsClientsTestsConfig {
  public readonly testSZEWTwinName: string;
  public readonly testIVaultName: string;
  public readonly auth: AuthConfigValues;
  public readonly apis: ApisConfigValues;
  public readonly testUsers: TestUsersConfigValues;
  public readonly behaviorOptions: BehaviorOptions;

  constructor(envFilePath: string) {
    dotenv.config({ path: envFilePath });
    this.validateAllValuesPresent();

    this.testSZEWTwinName = process.env.TEST_SZEWTWIN_NAME!;
    this.testIVaultName = process.env.TEST_IVAULT_NAME!;

    this.auth = {
      authority: process.env.AUTH_AUTHORITY!,
      clientId: process.env.AUTH_CLIENT_ID!,
      clientSecret: process.env.AUTH_CLIENT_SECRET!,
      redirectUrl: process.env.AUTH_REDIRECT_URL!,
    };

    this.apis = {
      iVaults: {
        baseUrl: process.env.APIS_IVAULTS_BASE_URL!,
        version: process.env.APIS_IVAULTS_VERSION!,
        scopes: process.env.APIS_IVAULTS_SCOPES!,
      },
      szewTwins: {
        baseUrl: process.env.APIS_SZEWTWINS_BASE_URL!,
        scopes: process.env.APIS_SZEWTWINS_SCOPES!,
      },
    };

    this.testUsers = {
      admin1: {
        email: process.env.TEST_USERS_ADMIN1_EMAIL!,
        password: process.env.TEST_USERS_ADMIN1_PASSWORD!,
      },
      admin2FullyFeatured: {
        email: process.env.TEST_USERS_ADMIN2_FULLY_FEATURED_EMAIL!,
        password: process.env.TEST_USERS_ADMIN2_FULLY_FEATURED_PASSWORD!,
      },
    };

    this.behaviorOptions = {
      recreateReusableIVault:
        Number(process.env.TEST_BEHAVIOR_OPTIONS_RECREATE_IVAULT) > 0,
    };
  }

  private validateAllValuesPresent(): void {
    this.validateConfigValue("TEST_SZEWTWIN_NAME");
    this.validateConfigValue("TEST_IVAULT_NAME");

    this.validateConfigValue("AUTH_AUTHORITY");
    this.validateConfigValue("AUTH_CLIENT_ID");
    this.validateConfigValue("AUTH_CLIENT_SECRET");
    this.validateConfigValue("AUTH_REDIRECT_URL");

    this.validateConfigValue("APIS_IVAULTS_BASE_URL");
    this.validateConfigValue("APIS_IVAULTS_VERSION");
    this.validateConfigValue("APIS_IVAULTS_SCOPES");

    this.validateConfigValue("APIS_SZEWTWINS_BASE_URL");
    this.validateConfigValue("APIS_SZEWTWINS_SCOPES");

    this.validateConfigValue("TEST_USERS_ADMIN1_EMAIL");
    this.validateConfigValue("TEST_USERS_ADMIN1_PASSWORD");

    this.validateConfigValue("TEST_USERS_ADMIN2_FULLY_FEATURED_EMAIL");
    this.validateConfigValue("TEST_USERS_ADMIN2_FULLY_FEATURED_PASSWORD");

    this.validateConfigOptionalNumericValue(
      "TEST_BEHAVIOR_OPTIONS_RECREATE_IVAULT"
    );
  }

  private validateConfigValue(key: string): void {
    if (!process.env[key])
      throw new TestSetupError(`Invalid configuration: missing ${key} value.`);
  }

  private validateConfigOptionalNumericValue(key: string): void {
    const value = process.env[key];
    if (value === undefined) return;

    if (isNaN(Number(value)))
      throw new TestSetupError(
        `Invalid configuration: ${key} value must be a number.`
      );
  }
}
