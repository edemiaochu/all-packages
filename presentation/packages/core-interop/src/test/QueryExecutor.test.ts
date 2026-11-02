/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, it, vi } from "vitest";
import { QueryBinder, QueryOptions, QueryRowFormat } from "@szewtwin/core-common";
import { Point2d, Point3d } from "@szewtwin/core-geometry";
import { DMSqlBinding } from "@szewtwin/presentation-shared";
import { createDMSqlQueryExecutor } from "../core-interop/QueryExecutor.js";

describe("createDMSqlQueryExecutor", () => {
  describe("createQueryReader", () => {
    it("calls IVault's `createQueryReader` with default params", async () => {
      const ivault = { createQueryReader: vi.fn().mockReturnValue(createCoreDMSqlReaderStub([{}, {}])) };

      const executor = createDMSqlQueryExecutor(ivault);
      const reader = executor.createQueryReader({ dmsql: "dmsql" });
      for await (const _ of reader) {
      }

      expect(ivault.createQueryReader).toHaveBeenCalledOnce();
      const [dmsql, binder, options] = ivault.createQueryReader.mock.calls[0];
      expect(dmsql).toBe("dmsql");
      expect(Object.keys((binder as QueryBinder).serialize())).toHaveLength(0);
      expect(Object.keys(options as QueryOptions)).toHaveLength(0);
    });

    it("calls IVault's `createQueryReader` with CTEs", async () => {
      const ivault = { createQueryReader: vi.fn().mockReturnValue(createCoreDMSqlReaderStub([{}, {}])) };

      const executor = createDMSqlQueryExecutor(ivault);
      const reader = executor.createQueryReader({ ctes: ["cte1", "cte2"], dmsql: "dmsql" });
      for await (const _ of reader) {
      }

      expect(ivault.createQueryReader).toHaveBeenCalledOnce();
      expect(ivault.createQueryReader.mock.calls[0][0]).toBe("WITH RECURSIVE cte1, cte2 dmsql");
    });

    it("calls IVault's `createQueryReader` with whitespace removed from DMSQL and CTEs", async () => {
      const ivault = { createQueryReader: vi.fn().mockReturnValue(createCoreDMSqlReaderStub([])) };

      const executor = createDMSqlQueryExecutor(ivault);
      const reader = executor.createQueryReader({
        ctes: [" cte  with   whitespace "],
        dmsql: " ( dmsql , with   whitespace) ",
      });
      for await (const _ of reader) {
      }

      expect(ivault.createQueryReader).toHaveBeenCalledOnce();
      expect(ivault.createQueryReader.mock.calls[0][0]).toBe(
        "WITH RECURSIVE cte with whitespace (dmsql, with whitespace)",
      );
    });

    it("calls IVault's `createQueryReader` with `DMSqlPropertyNames` row format", async () => {
      const ivault = { createQueryReader: vi.fn().mockReturnValue(createCoreDMSqlReaderStub([])) };

      const executor = createDMSqlQueryExecutor(ivault);
      const reader = executor.createQueryReader({ dmsql: "dmsql" }, { rowFormat: "DMSqlPropertyNames" });
      for await (const _ of reader) {
      }

      expect(ivault.createQueryReader).toHaveBeenCalledOnce();
      const [dmsql, binder, options] = ivault.createQueryReader.mock.calls[0];
      expect(dmsql).toBe("dmsql");
      expect(Object.keys((binder as QueryBinder).serialize())).toHaveLength(0);
      expect((options as QueryOptions).rowFormat).toBe(QueryRowFormat.UseDMSqlPropertyNames);
    });

    it("calls IVault's `createQueryReader` with `Indexes` row format", async () => {
      const ivault = { createQueryReader: vi.fn().mockReturnValue(createCoreDMSqlReaderStub([])) };

      const executor = createDMSqlQueryExecutor(ivault);
      const reader = executor.createQueryReader({ dmsql: "dmsql" }, { rowFormat: "Indexes" });
      for await (const _ of reader) {
      }

      expect(ivault.createQueryReader).toHaveBeenCalledOnce();
      const [dmsql, binder, options] = ivault.createQueryReader.mock.calls[0];
      expect(dmsql).toBe("dmsql");
      expect(Object.keys((binder as QueryBinder).serialize())).toHaveLength(0);
      expect((options as QueryOptions).rowFormat).toBe(QueryRowFormat.UseDMSqlPropertyIndexes);
    });

    it("calls IVault's `createQueryReader` with `restartToken`", async () => {
      const ivault = { createQueryReader: vi.fn().mockReturnValue(createCoreDMSqlReaderStub([])) };

      const executor = createDMSqlQueryExecutor(ivault);
      const reader = executor.createQueryReader({ dmsql: "dmsql" }, { restartToken: "TestToken" });
      for await (const _ of reader) {
      }

      expect(ivault.createQueryReader).toHaveBeenCalledOnce();
      const [dmsql, binder, options] = ivault.createQueryReader.mock.calls[0];
      expect(dmsql).toBe("dmsql");
      expect(Object.keys((binder as QueryBinder).serialize())).toHaveLength(0);
      expect((options as QueryOptions).restartToken).toBe("TestToken");
    });

    it("calls IVault's `createQueryReader` with different bindings", async () => {
      const ivault = { createQueryReader: vi.fn().mockReturnValue(createCoreDMSqlReaderStub([])) };

      const bindings: DMSqlBinding[] = [
        { type: "boolean", value: true },
        { type: "double", value: 1.23 },
        { type: "id", value: "0x123" },
        { type: "idset", value: ["0x123", "0x456"] },
        { type: "int", value: 123 },
        { type: "long", value: 456 },
        { type: "point2d", value: { x: 1.23, y: 4.56 } },
        { type: "point3d", value: { x: 1.23, y: 4.56, z: 7.89 } },
        { type: "string", value: "xxx" },
        { type: "string", value: undefined },
      ];

      const expectedBinder = new QueryBinder();
      expectedBinder.bindBoolean(1, true);
      expectedBinder.bindDouble(2, 1.23);
      expectedBinder.bindId(3, "0x123");
      expectedBinder.bindIdSet(4, ["0x123", "0x456"]);
      expectedBinder.bindInt(5, 123);
      expectedBinder.bindLong(6, 456);
      expectedBinder.bindPoint2d(7, Point2d.create(1.23, 4.56));
      expectedBinder.bindPoint3d(8, Point3d.create(1.23, 4.56, 7.89));
      expectedBinder.bindString(9, "xxx");
      expectedBinder.bindNull(10);

      const executor = createDMSqlQueryExecutor(ivault);
      const reader = executor.createQueryReader({ dmsql: "dmsql", bindings }, undefined);
      for await (const _ of reader) {
      }

      expect(ivault.createQueryReader).toHaveBeenCalledOnce();
      const [dmsql, binder, options] = ivault.createQueryReader.mock.calls[0];
      expect(dmsql).toBe("dmsql");
      expect(JSON.stringify((binder as QueryBinder).serialize())).toBe(JSON.stringify(expectedBinder.serialize()));
      expect(Object.keys(options as QueryOptions)).toHaveLength(0);
    });

    it("creates iterable reader for rows as objects", async () => {
      const rows = [{ x: 1 }, { y: 2 }];
      const ivault = { createQueryReader: vi.fn().mockReturnValue(createCoreDMSqlReaderStub(rows)) };

      const executor = createDMSqlQueryExecutor(ivault);
      const reader = executor.createQueryReader({ dmsql: "dmsql" }, { rowFormat: "DMSqlPropertyNames" });

      const resultRows = new Array<any>();
      for await (const row of reader) {
        resultRows.push(row);
      }

      expect(resultRows).toEqual(rows);
    });

    it("creates iterable reader for rows as arrays", async () => {
      const rows = [
        [1, 2],
        [3, 4],
      ];
      const ivault = { createQueryReader: vi.fn().mockReturnValue(createCoreDMSqlReaderStub(rows)) };

      const executor = createDMSqlQueryExecutor(ivault);
      const reader = executor.createQueryReader({ dmsql: "dmsql" }, { rowFormat: "Indexes" });

      const resultRows = new Array<any>();
      for await (const row of reader) {
        resultRows.push(row);
      }

      expect(resultRows).toEqual(rows);
    });
  });
});

function createCoreDMSqlReaderStub(rows: object[]) {
  let curr = -1;
  const reader = {
    next: vi.fn(async () => {
      ++curr;
      if (curr < rows.length) {
        return { done: false, value: createQueryRowProxy(rows[curr]) };
      }
      return { done: true, value: undefined };
    }),
  };
  return {
    ...reader,
    async *[Symbol.asyncIterator]() {
      return reader;
    },
  };
}

function createQueryRowProxy(data: object) {
  return { ...data, toArray: () => data, toRow: () => data };
}
