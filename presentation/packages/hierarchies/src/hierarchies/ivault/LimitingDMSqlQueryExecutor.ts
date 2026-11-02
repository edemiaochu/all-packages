/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Guid, StopWatch } from "@szewtwin/core-szewec";
import {
  createMainThreadReleaseOnTimePassedHandler,
  DMSqlQueryDef,
  DMSqlQueryExecutor,
  DMSqlQueryReaderOptions,
  DMSqlQueryRow,
  trimWhitespace,
} from "@szewtwin/presentation-shared";
import { RowsLimitExceededError } from "../HierarchyErrors.js";
import {
  LOGGING_NAMESPACE as BASE_LOGGING_NAMESPACE,
  LOGGING_NAMESPACE_PERFORMANCE as BASE_LOGGING_NAMESPACE_PERFORMANCE,
} from "../internal/Common.js";
import { doLog } from "../internal/LoggingUtils.js";

/**
 * An interface for something that knows how to create a limiting DMSQL query reader.
 * @public
 */
export interface LimitingDMSqlQueryExecutor {
  /**
   * Creates a query reader for given query, but makes sure it doesn't return more than the configured
   * limit of rows.
   * @throws `RowsLimitExceededError` when the query returns more than configured limit of rows.
   */
  createQueryReader(
    query: DMSqlQueryDef,
    config?: DMSqlQueryReaderOptions & { limit?: number | "unbounded" },
  ): ReturnType<DMSqlQueryExecutor["createQueryReader"]>;
}

/**
 * Creates an `LimitingDMSqlQueryExecutor` that throws `RowsLimitExceededError` if the query exceeds given amount of rows.
 * @public
 */
export function createLimitingDMSqlQueryExecutor(
  baseExecutor: DMSqlQueryExecutor,
  defaultLimit: number | "unbounded",
): LimitingDMSqlQueryExecutor {
  return {
    async *createQueryReader(
      query: DMSqlQueryDef,
      config?: DMSqlQueryReaderOptions & { limit?: number | "unbounded" },
    ) {
      const { limit: configLimit, ...restConfig } = config ?? {};
      const limit = configLimit ?? defaultLimit;
      const queryLogger = createQueryLogger(query);
      const releaseMainThread = createMainThreadReleaseOnTimePassedHandler();

      // handle "unbounded" case without a buffer
      const reader = baseExecutor.createQueryReader({ ...query, dmsql: addLimit(query.dmsql, limit) }, restConfig);
      if (limit === "unbounded") {
        try {
          for await (const row of reader) {
            await releaseMainThread();
            queryLogger.onStep();
            yield row;
          }
        } finally {
          queryLogger.onComplete();
        }
        return;
      }

      // avoid streaming until we know the number of rows is okay
      const buffer: DMSqlQueryRow[] = [];
      try {
        for await (const row of reader) {
          await releaseMainThread();
          queryLogger.onStep();
          buffer.push(row);
          if (buffer.length > limit) {
            throw new RowsLimitExceededError(limit);
          }
        }
      } finally {
        queryLogger.onComplete();
      }

      for (const row of buffer) {
        await releaseMainThread();
        yield row;
      }
    },
  };
}

function addLimit(dmsql: string, limit: number | "unbounded") {
  if (limit === "unbounded") {
    return dmsql;
  }
  return `
    SELECT *
    FROM (${dmsql})
    LIMIT ${limit + 1}
  `;
}

const LOGGING_NAMESPACE = `${BASE_LOGGING_NAMESPACE}.Queries`;
const LOGGING_NAMESPACE_PERFORMANCE = `${BASE_LOGGING_NAMESPACE_PERFORMANCE}.Queries`;
function createQueryLogger(query: DMSqlQueryDef, firstStepWarningThreshold = 3000, allRowsWarningThreshold = 5000) {
  const queryId = Guid.createValue();
  /* v8 ignore next -- @preserve */
  doLog({
    category: LOGGING_NAMESPACE,
    message: () => `Executing query [${queryId}]: ${createQueryLogMessage(query)}`,
  });

  let firstStep = true;
  let rowsCount = 0;
  const timer = new StopWatch(undefined, true);
  return {
    onStep() {
      if (firstStep) {
        /* v8 ignore start */
        doLog({
          category: LOGGING_NAMESPACE_PERFORMANCE,
          severity: timer.current.milliseconds >= firstStepWarningThreshold ? "warning" : "trace",
          message: () => `[${queryId}] First step took ${timer.currentSeconds} s.`,
        });
        /* v8 ignore stop */
        firstStep = false;
      }
      ++rowsCount;
    },
    onComplete() {
      /* v8 ignore start */
      doLog({
        category: LOGGING_NAMESPACE_PERFORMANCE,
        severity: timer.current.milliseconds >= allRowsWarningThreshold ? "warning" : "trace",
        message: () => `[${queryId}] Query took ${timer.currentSeconds} s. for ${rowsCount} rows.`,
      });
      /* v8 ignore stop */
    },
  };
}

/* v8 ignore start */
function createQueryLogMessage(query: DMSqlQueryDef): string {
  const ctes = query.ctes?.map((cte) => `    ${trimWhitespace(cte)}`).join(", \n");
  const bindings = query.bindings?.map((b) => JSON.stringify(b.value)).join(", ");
  let output = "{\n";
  if (ctes) {
    output += `  ctes: [ \n${ctes} \n], \n`;
  }
  output += `  dmsql: ${trimWhitespace(query.dmsql)}, \n`;
  if (bindings) {
    output += `  bindings: [${bindings}], \n`;
  }
  output += "}";
  return output;
}
/* v8 ignore stop */
