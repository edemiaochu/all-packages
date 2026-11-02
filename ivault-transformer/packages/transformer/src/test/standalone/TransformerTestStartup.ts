/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { IVaultHost, IVaultHostOptions } from "@szewtwin/core-backend";
import { Logger, LogLevel, ProcessDetector } from "@szewtwin/core-szewec";
import * as path from "path";

export async function transformerTestStartup() {
  Logger.initializeToConsole();
  Logger.setLevelDefault(LogLevel.Error);
  const cfg: IVaultHostOptions = {};
  if (ProcessDetector.isIOSAppBackend) {
    cfg.cacheDir = undefined; // Let the native side handle the cache.
  } else {
    cfg.cacheDir = path.join(__dirname, ".cache"); // Set the cache dir to be under the lib directory.
  }
  return IVaultHost.startup(cfg);
}

before(async () => transformerTestStartup());
after(async () => IVaultHost.shutdown());
