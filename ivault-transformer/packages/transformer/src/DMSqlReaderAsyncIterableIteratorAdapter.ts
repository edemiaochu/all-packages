/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { DMSqlReader, QueryRowProxy } from "@szewtwin/core-common";

/**
 * Adapter class for DMSqlReader for AsyncIterableIterator interface.
 * It allows to iterate through query results in szewtwin 3.x using for await() syntax like using szewtwin 4.x version.
 * @internal
 */
export class DMSqlReaderAsyncIterableIteratorAdapter
  implements AsyncIterableIterator<QueryRowProxy>
{
  public constructor(private _dmSqlReader: DMSqlReader) {}

  public [Symbol.asyncIterator](): AsyncIterableIterator<QueryRowProxy> {
    return this;
  }

  public async next(): Promise<IteratorResult<QueryRowProxy, any>> {
    const done = !(await this._dmSqlReader.step());
    return {
      done,
      value: this._dmSqlReader.current,
    };
  }
}

/**
 * Wraps DMSqlReader with DMSqlReaderAsyncIterableIteratorAdapter if it's needed.
 * @param dmSqlReader DMSqlReader isntance from szewtwin 3.x or 4.x version
 * @internal
 */
export function ensureDMSqlReaderIsAsyncIterableIterator(
  dmSqlReader:
    | (DMSqlReader & AsyncIterableIterator<QueryRowProxy>)
    | Omit<DMSqlReader, keyof AsyncIterableIterator<QueryRowProxy>>
): AsyncIterableIterator<QueryRowProxy> {
  if (Symbol.asyncIterator in dmSqlReader) {
    // using szewtwin 4.x
    return dmSqlReader;
  } else {
    // using szewtwin 3.x
    return new DMSqlReaderAsyncIterableIteratorAdapter(
      dmSqlReader as DMSqlReader
    );
  }
}
