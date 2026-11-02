/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { OrderedId64Iterable } from "@szewtwin/core-szewec";
import { DMSqlReader, QueryBinder, QueryOptions, QueryOptionsBuilder, QueryRowFormat } from "@szewtwin/core-common";
import { Point2d, Point3d } from "@szewtwin/core-geometry";
import {
  DMSqlBinding,
  DMSqlQueryDef,
  DMSqlQueryExecutor,
  DMSqlQueryReaderOptions,
  DMSqlQueryRow,
  trimWhitespace,
} from "@szewtwin/presentation-shared";

/**
 * Defines input for `createDMSqlQueryExecutor`. Generally, this is an instance of either [IVaultDb](https://www.szewtwinjs.org/reference/core-backend/ivaults/ivaultdb/)
 * or [IVaultConnection](https://www.szewtwinjs.org/reference/core-frontend/ivaultconnection/ivaultconnection/).
 * @public
 */
interface CoreDMSqlReaderFactory {
  createQueryReader(dmsql: string, binder?: QueryBinder, options?: QueryOptions): DMSqlReader;
}

/**
 * Creates an `DMSqlQueryExecutor` from either [IVaultDb](https://www.szewtwinjs.org/reference/core-backend/ivaults/ivaultdb/) or
 * [IVaultConnection](https://www.szewtwinjs.org/reference/core-frontend/ivaultconnection/ivaultconnection/).
 *
 * Usage example:
 *
 * ```ts
 * import { IVaultDb } from "@szewtwin/core-backend";
 * import { createDMSqlQueryExecutor } from "@szewtwin/presentation-core-interop";
 *
 * const ivault: IVaultDb = getIVaultDb();
 * const executor = createDMSqlQueryExecutor(ivault);
 * for await (const row of executor.createQueryReader(MY_QUERY)) {
 *   // TODO: do something with `row`
 * }
 * ```
 *
 * @public
 */
export function createDMSqlQueryExecutor(ivault: CoreDMSqlReaderFactory): DMSqlQueryExecutor {
  return {
    createQueryReader(query: DMSqlQueryDef, config?: DMSqlQueryReaderOptions) {
      const { ctes, dmsql, bindings } = query;
      const opts = new QueryOptionsBuilder();
      switch (config?.rowFormat) {
        case "DMSqlPropertyNames":
          opts.setRowFormat(QueryRowFormat.UseDMSqlPropertyNames);
          break;
        case "Indexes":
          opts.setRowFormat(QueryRowFormat.UseDMSqlPropertyIndexes);
          break;
      }
      if (config?.restartToken) {
        opts.setRestartToken(config?.restartToken);
      }
      return new DMSqlQueryReaderImpl(
        ivault.createQueryReader(trimWhitespace(addCTEs(dmsql, ctes)), bind(bindings ?? []), opts.getOptions()),
        config?.rowFormat === "Indexes" ? "array" : "object",
      );
    },
  };
}

class DMSqlQueryReaderImpl implements ReturnType<DMSqlQueryExecutor["createQueryReader"]> {
  public constructor(
    private _coreReader: DMSqlReader,
    private _format: "array" | "object",
  ) {}
  public [Symbol.asyncIterator](): AsyncIterableIterator<DMSqlQueryRow> {
    return this;
  }
  public async next(): Promise<IteratorResult<DMSqlQueryRow>> {
    const res = await this._coreReader.next();
    if (res.done) {
      return { done: true, value: undefined };
    }
    return { done: false, value: this._format === "array" ? res.value.toArray() : res.value.toRow() };
  }
}

function bind(bindings: DMSqlBinding[]): QueryBinder {
  const binder = new QueryBinder();
  bindings.forEach((b, i) => {
    if (b.value === undefined) {
      binder.bindNull(i + 1);
      return;
    }
    switch (b.type) {
      case "boolean":
        binder.bindBoolean(i + 1, b.value);
        break;
      case "double":
        binder.bindDouble(i + 1, b.value);
        break;
      case "id":
        binder.bindId(i + 1, b.value);
        break;
      case "idset":
        binder.bindIdSet(i + 1, OrderedId64Iterable.sortArray(b.value));
        break;
      case "int":
        binder.bindInt(i + 1, b.value);
        break;
      case "long":
        binder.bindLong(i + 1, b.value);
        break;
      case "point2d":
        binder.bindPoint2d(i + 1, Point2d.fromJSON(b.value));
        break;
      case "point3d":
        binder.bindPoint3d(i + 1, Point3d.fromJSON(b.value));
        break;
      case "string":
        binder.bindString(i + 1, b.value);
        break;
    }
  });
  return binder;
}

function addCTEs(dmsql: string, ctes: string[] | undefined) {
  const ctesPrefix = ctes?.length ? `WITH RECURSIVE ${ctes.join(", ")} ` : "";
  return `${ctesPrefix}${dmsql}`;
}
