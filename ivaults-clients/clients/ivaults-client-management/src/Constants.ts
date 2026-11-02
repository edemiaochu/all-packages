/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
export class Constants {
  public static api = {
    baseUrl: "https://api.szewec.com/ivaults",
    version: "szewtwin-platform.v2",
  } as const;

  public static headers = {
    accept: "Accept",
    authorization: "Authorization",
    contentType: "Content-Type",
    prefer: "Prefer",
    location: "Location",
  } as const;

  public static time = {
    sleepPeriodInMs: 1000,
    iVaultInitializationTimeOutInMs: 5 * 60 * 1000,
  } as const;

  public static httpStatusCodes = {
    internalServerError: 500,
  } as const;

  public static retryPolicy = {
    maxRetries: 3,
    baseDelayInMs: 300,
    delayFactor: 3,
  } as const;
}
