/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import sinon from "sinon";
import { BeEvent } from "@szewtwin/core-szewec";
import { PerModelCategoryVisibility } from "@szewtwin/core-frontend";
import { SchemaContext } from "@szewtwin/dmschema-metadata";
import { DMSchemaRpcLocater } from "@szewtwin/dmschema-rpcinterface-common";
import { createDMSchemaProvider, createDMSqlQueryExecutor } from "@szewtwin/presentation-core-interop";
import { createLimitingDMSqlQueryExecutor } from "@szewtwin/presentation-hierarchies";
import { createCachingDMClassHierarchyInspector } from "@szewtwin/presentation-shared";

import type { QueryBinder, QueryOptions } from "@szewtwin/core-common";
import type { IVaultConnection, Viewport, ViewState } from "@szewtwin/core-frontend";

export function createIVaultMock(queryHandler?: (query: string, params?: QueryBinder, config?: QueryOptions) => any[] | Promise<any[]>) {
  return {
    isBriefcaseConnection: sinon.fake.returns(false),
    createQueryReader: sinon.fake(async function* (query: string, params?: QueryBinder, config?: QueryOptions): AsyncIterableIterator<any> {
      const result = (await queryHandler?.(query, params, config)) ?? [];
      for (const item of result) {
        yield { ...item, toRow: () => item, toArray: () => Object.values(item) };
      }
    }),
  } as unknown as IVaultConnection;
}

export function createFakeSinonViewport(
  props?: Partial<Omit<Viewport, "view" | "perModelCategoryVisibility">> & {
    view?: Partial<Omit<ViewState, "isSpatialView">> & { isSpatialView?: () => boolean };
    perModelCategoryVisibility?: Partial<PerModelCategoryVisibility.Overrides>;
    queryHandler?: Parameters<typeof createIVaultMock>[0];
  },
): Viewport {
  let alwaysDrawn = props?.alwaysDrawn;
  let neverDrawn = props?.neverDrawn;

  // Stubs are defined as partial to ensure that the overridden implementation is compatible with original interfaces
  const perModelCategoryVisibility: Partial<PerModelCategoryVisibility.Overrides> = {
    getOverride: sinon.fake.returns(PerModelCategoryVisibility.Override.None),
    setOverride: sinon.fake(),
    clearOverrides: sinon.fake(),
    ...props?.perModelCategoryVisibility,
  };

  const view: NonNullable<typeof props>["view"] = {
    isSpatialView: sinon.fake.returns(true),
    viewsCategory: sinon.fake.returns(true),
    viewsModel: sinon.fake.returns(true),
    ...props?.view,
  };

  const onAlwaysDrawnChanged = new BeEvent();
  const onNeverDrawnChanged = new BeEvent();

  const result: Partial<Viewport> = {
    addViewedModels: sinon.fake.resolves(undefined),
    changeCategoryDisplay: sinon.fake(),
    changeModelDisplay: sinon.fake.returns(true),
    isAlwaysDrawnExclusive: false,
    onViewedCategoriesPerModelChanged: new BeEvent(),
    onViewedCategoriesChanged: new BeEvent(),
    onViewedModelsChanged: new BeEvent(),
    onAlwaysDrawnChanged,
    onNeverDrawnChanged,
    ...props,
    get alwaysDrawn() {
      return alwaysDrawn;
    },
    get neverDrawn() {
      return neverDrawn;
    },
    setAlwaysDrawn: sinon.fake((x) => {
      alwaysDrawn = x;
      onAlwaysDrawnChanged.raiseEvent(result);
    }),
    setNeverDrawn: sinon.fake((x) => {
      neverDrawn = x;
      onNeverDrawnChanged.raiseEvent(result);
    }),
    clearAlwaysDrawn: sinon.fake(() => {
      if (alwaysDrawn?.size) {
        alwaysDrawn.clear();
        onAlwaysDrawnChanged.raiseEvent(result);
      }
    }),
    clearNeverDrawn: sinon.fake(() => {
      if (neverDrawn?.size) {
        neverDrawn.clear();
        onNeverDrawnChanged.raiseEvent(result);
      }
    }),
    perModelCategoryVisibility: perModelCategoryVisibility as PerModelCategoryVisibility.Overrides,
    view: view as ViewState,
    iVault: createIVaultMock(props?.queryHandler),
  };

  return result as Viewport;
}

export function createIVaultAccess(ivault: IVaultConnection) {
  const schemas = new SchemaContext();
  // eslint-disable-next-line @szewtwin/no-internal
  schemas.addLocater(new DMSchemaRpcLocater(ivault.getRpcProps()));
  const schemaProvider = createDMSchemaProvider(schemas);
  return {
    ivaultKey: ivault.key,
    ...schemaProvider,
    ...createCachingDMClassHierarchyInspector({ schemaProvider }),
    ...createLimitingDMSqlQueryExecutor(createDMSqlQueryExecutor(ivault), 1000),
  };
}

export async function collect<T>(items: AsyncIterableIterator<T>) {
  const result: T[] = [];
  for await (const item of items) {
    result.push(item);
  }
  return result;
}
