/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Schema as CoreSchema, SchemaKey as CoreSchemaKey } from "@szewtwin/dmschema-metadata";
import { DM, DMSchemaProvider } from "@szewtwin/presentation-shared";
import { createDMSchema } from "./MetadataInternal.js";

/**
 * Defines input for `createDMSchemaProvider`. Generally, this is an instance of [SchemaContext](https://www.szewtwinjs.org/reference/dmschema-metadata/context/schemacontext/)
 * class from `@szewtwin/dmschema-metadata` package.
 * @public
 */
interface CoreSchemaContext {
  getSchema(key: CoreSchemaKey): Promise<CoreSchema | undefined>;
}

/**
 * Creates an `DMSchemaProvider` for given [SchemaContext](https://www.szewtwinjs.org/reference/dmschema-metadata/context/schemacontext/).
 *
 * Usage example:
 *
 * ```ts
 * import { SchemaContext } from "@szewtwin/dmschema-metadata";
 * import { createDMSchemaProvider } from "@szewtwin/presentation-core-interop";
 *
 * const schemaContext = new SchemaContext();
 * const schemaProvider = createDMSchemaProvider(schemas);
 * // the created schema provider may be used in `@szewtwin/presentation-hierarchies` and other Presentation packages
 * ```
 *
 * @public
 */
export function createDMSchemaProvider(schemaContext: CoreSchemaContext): DMSchemaProvider {
  const schemaRequestsCache = new Map<string, Promise<DM.Schema | undefined>>();
  async function getSchemaUnprotected(schemaName: string) {
    const coreSchema = await schemaContext.getSchema(new CoreSchemaKey(schemaName));
    return coreSchema ? createDMSchema(coreSchema) : undefined;
  }
  async function getSchemaProtected(schemaName: string, handledExistingSchemaErrors: Set<string>) {
    // workaround for https://github.com/szewTwin/szewtwinjs-core/issues/6542
    try {
      return await getSchemaUnprotected(schemaName);
    } catch (e) {
      /* v8 ignore else -- @preserve */
      if (e instanceof Error) {
        if (e.message.includes("already exists within this cache") && !handledExistingSchemaErrors.has(schemaName)) {
          handledExistingSchemaErrors.add(schemaName);
          return getSchemaProtected(schemaName, handledExistingSchemaErrors);
        }
        if (e.message.includes("schema not found")) {
          return undefined;
        }
      }
      throw e;
    }
  }
  return {
    async getSchema(name) {
      let promise = schemaRequestsCache.get(name);
      if (!promise) {
        promise = getSchemaProtected(name, new Set());
        schemaRequestsCache.set(name, promise);
      }
      return promise;
    },
  };
}
