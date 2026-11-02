/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { LogLevel as CoreLogLevel } from "@szewtwin/core-szewec";
import { ILogger, LogLevel } from "@szewtwin/presentation-shared";

/**
 * Defines input for `createLogger`. Generally, this is the [Logger](https://www.szewtwinjs.org/reference/core-szewec/logging/logger/)
 * class from `@szewtwin/core-szewec` package.
 * @public
 */
interface ICoreLogger {
  isEnabled(category: string, level: CoreLogLevel): boolean;
  logError(category: string, message: string): void;
  logWarning(category: string, message: string): void;
  logInfo(category: string, message: string): void;
  logTrace(category: string, message: string): void;
}

/**
 * Creates a presentation `ILogger` instance that forwards all logging calls to the
 * [Logger](https://www.szewtwinjs.org/reference/core-szewec/logging/logger/) API.
 *
 * Usage example:
 *
 * ```ts
 * import { Logger } from "@szewtwin/core-szewec";
 * import { createLogger } from "@szewtwin/presentation-core-interop";
 * import { setLogger } from "@szewtwin/presentation-hierarchies";
 *
 * setLogger(createLogger(Logger));
 * ```
 *
 * @public
 */
export function createLogger(coreLogger: ICoreLogger): ILogger {
  return {
    isEnabled: (category, level) => coreLogger.isEnabled(category, getCoreLogLevel(level)),
    logError: (category, msg) => coreLogger.logError(category, msg),
    logWarning: (category, msg) => coreLogger.logWarning(category, msg),
    logInfo: (category, msg) => coreLogger.logInfo(category, msg),
    logTrace: (category, msg) => coreLogger.logTrace(category, msg),
  };
}

function getCoreLogLevel(level: LogLevel): CoreLogLevel {
  switch (level) {
    case "error":
      return CoreLogLevel.Error;
    case "warning":
      return CoreLogLevel.Warning;
    case "info":
      return CoreLogLevel.Info;
    case "trace":
      return CoreLogLevel.Trace;
  }
}
