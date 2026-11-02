/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { useMemo } from "react";
import { createDMSchemaProvider, createDMSqlQueryExecutor } from "@szewtwin/presentation-core-interop";
import { createLimitingDMSqlQueryExecutor } from "@szewtwin/presentation-hierarchies";
import { createCachingDMClassHierarchyInspector } from "@szewtwin/presentation-shared";

import type { IVaultConnection } from "@szewtwin/core-frontend";
import type { SchemaContext } from "@szewtwin/dmschema-metadata";
import type { useIVaultTree } from "@szewtwin/presentation-hierarchies-react";
import type { FunctionProps } from "./Utils.js";

type IVaultAccess = FunctionProps<typeof useIVaultTree>["ivaultAccess"];

export interface UseIVaultAccessProps {
  ivault: IVaultConnection;
  getSchemaContext: (ivault: IVaultConnection) => SchemaContext;
  ivaultAccess?: IVaultAccess;
  hierarchyLevelSizeLimit?: number;
}

/** @internal */
export function useIVaultAccess({ ivault, getSchemaContext, ivaultAccess: providedIVaultAccess, hierarchyLevelSizeLimit }: UseIVaultAccessProps): {
  ivaultAccess: IVaultAccess;
  currentHierarchyLevelSizeLimit: number;
} {
  const defaultHierarchyLevelSizeLimit = hierarchyLevelSizeLimit ?? 1000;
  const ivaultAccess = useMemo(() => {
    return providedIVaultAccess ?? createIVaultAccess({ getSchemaContext, ivault, hierarchyLevelSizeLimit: defaultHierarchyLevelSizeLimit });
  }, [providedIVaultAccess, getSchemaContext, ivault, defaultHierarchyLevelSizeLimit]);

  return {
    ivaultAccess,
    currentHierarchyLevelSizeLimit: defaultHierarchyLevelSizeLimit,
  };
}

function createIVaultAccess({
  ivault,
  getSchemaContext,
  hierarchyLevelSizeLimit,
}: {
  ivault: IVaultConnection;
  getSchemaContext: (ivault: IVaultConnection) => SchemaContext;
  hierarchyLevelSizeLimit: number;
}) {
  const schemas = getSchemaContext(ivault);
  const schemaProvider = createDMSchemaProvider(schemas);
  return {
    ivaultKey: ivault.key,
    ...schemaProvider,
    ...createCachingDMClassHierarchyInspector({ schemaProvider, cacheSize: 100 }),
    ...createLimitingDMSqlQueryExecutor(createDMSqlQueryExecutor(ivault), hierarchyLevelSizeLimit),
  };
}
