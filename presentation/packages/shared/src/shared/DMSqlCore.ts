/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Id64String } from "@szewtwin/core-szewec";

/**
 * Defines an DMSql binding consisting of a value and its type. Necessary to differentiate between numeric
 * types and `Id64String` vs `string`.
 *
 * @public
 */
export type DMSqlBinding =
  | { type: "boolean"; value?: boolean }
  | { type: "double" | "int" | "long"; value?: number }
  | { type: "id"; value?: Id64String }
  | { type: "idset"; value?: Id64String[] }
  | { type: "string"; value?: string }
  | { type: "point2d"; value?: { x: number; y: number } }
  | { type: "point3d"; value?: { x: number; y: number; z: number } };

/**
 * Defines an DMSQL query and its bindings.
 * @public
 */
export interface DMSqlQueryDef {
  /** A list of CTEs used in the query. */
  ctes?: string[];

  /**
   * The DMSQL query to execute.
   * @note In case the query uses CTEs, they should be specified in the `ctes` rather than included in the `dmsql`.
   */
  dmsql: string;

  /**
   * Values to bind to the query.
   * @see https://www.szewtwinjs.org/learning/dmsql/#dmsql-parameters
   */
  bindings?: DMSqlBinding[];
}

/**
 * Defines requested DMSQL result row format.
 * @see [QueryRowFormat](https://www.szewtwinjs.org/reference/core-common/ivaults/queryrowformat/)
 * @public
 */
type DMSqlQueryRowFormat = "DMSqlPropertyNames" | "Indexes";

/**
 * Defines options for DMSQL query reader.
 * @see [QueryOptions](https://www.szewtwinjs.org/reference/core-common/ivaults/queryoptions/)
 * @public
 */
export interface DMSqlQueryReaderOptions {
  rowFormat?: DMSqlQueryRowFormat;
  restartToken?: string;
}

/**
 * Represents a single row of an DMSQL query result.
 * @see [QueryRowProxy](https://www.szewtwinjs.org/reference/core-common/ivaults/queryrowproxy/)
 * @public
 */
export interface DMSqlQueryRow {
  [propertyName: string]: any;
  [propertyIndex: number]: any;
}

/**
 * Represents DMSQL query results reader.
 * @see [DMSqlReader](https://www.szewtwinjs.org/reference/core-common/ivaults/dmsqlreader/)
 * @public
 */
type DMSqlQueryReader = AsyncIterableIterator<DMSqlQueryRow>;

/**
 * An interface for something that knows how to create an DMSQL query reader.
 * @see `createDMSqlQueryExecutor` in `@szewtwin/presentation-core-interop`.
 * @public
 */
export interface DMSqlQueryExecutor {
  createQueryReader(query: DMSqlQueryDef, config?: DMSqlQueryReaderOptions): DMSqlQueryReader;
}
