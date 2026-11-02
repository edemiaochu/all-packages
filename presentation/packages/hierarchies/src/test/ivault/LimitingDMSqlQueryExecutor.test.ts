/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { collect, createAsyncIterator } from "presentation-test-utilities";
import { describe, expect, it, vi } from "vitest";
import { DMSqlQueryExecutor, trimWhitespace } from "@szewtwin/presentation-shared";
import { RowsLimitExceededError } from "../../hierarchies/HierarchyErrors.js";
import { createLimitingDMSqlQueryExecutor } from "../../hierarchies/ivault/LimitingDMSqlQueryExecutor.js";

describe("createLimitingDMSqlQueryExecutor", () => {
  const baseExecutor = { createQueryReader: vi.fn<DMSqlQueryExecutor["createQueryReader"]>() };

  it("returns base executor's result", async () => {
    const row = [1, 2, 3];
    baseExecutor.createQueryReader.mockReturnValue(createAsyncIterator([row]));
    const limitingExecutor = createLimitingDMSqlQueryExecutor(baseExecutor, 1);
    const rows = await collect(limitingExecutor.createQueryReader({ dmsql: "query" }));
    expect(rows).toEqual([row]);
  });

  it("throws when base executor returns more rows than the limit", async () => {
    baseExecutor.createQueryReader.mockReturnValue(createAsyncIterator([{}, {}]));
    const limitingExecutor = createLimitingDMSqlQueryExecutor(baseExecutor, 1);
    await expect(collect(limitingExecutor.createQueryReader({ dmsql: "query" }))).rejects.toBeInstanceOf(
      RowsLimitExceededError,
    );
  });

  it(`calls base executor with original query when limit is "unbounded"`, async () => {
    baseExecutor.createQueryReader.mockReturnValue(createAsyncIterator([{}]));
    await collect(createLimitingDMSqlQueryExecutor(baseExecutor, "unbounded").createQueryReader({ dmsql: "query" }));
    expect(baseExecutor.createQueryReader).toHaveBeenCalledOnce();
    expect(baseExecutor.createQueryReader.mock.calls[0][0]).toEqual({ dmsql: "query" });
  });

  it(`calls base executor with added CTEs`, async () => {
    baseExecutor.createQueryReader.mockReturnValue(createAsyncIterator([{}]));
    await collect(
      createLimitingDMSqlQueryExecutor(baseExecutor, "unbounded").createQueryReader({
        dmsql: "query",
        ctes: ["cte1", "cte2"],
      }),
    );
    expect(baseExecutor.createQueryReader).toHaveBeenCalledOnce();
    expect(baseExecutor.createQueryReader.mock.calls[0][0]).toEqual({ dmsql: "query", ctes: ["cte1", "cte2"] });
  });

  it(`calls base executor with added limits`, async () => {
    baseExecutor.createQueryReader.mockReturnValue(createAsyncIterator([{}]));
    await collect(createLimitingDMSqlQueryExecutor(baseExecutor, 1).createQueryReader({ dmsql: "query" }));
    expect(baseExecutor.createQueryReader).toHaveBeenCalledOnce();
    const calledArgs = baseExecutor.createQueryReader.mock.calls[0][0];
    expect(trimWhitespace(calledArgs.dmsql)).toBe(trimWhitespace("SELECT * FROM (query) LIMIT 2"));
  });
});
