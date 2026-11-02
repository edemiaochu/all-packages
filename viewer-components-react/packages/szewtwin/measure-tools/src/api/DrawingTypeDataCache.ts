/*---------------------------------------------------------------------------------------------
* Copyright (c) Szewec Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import type { Viewport } from "@szewtwin/core-frontend";
import { IVaultConnection } from "@szewtwin/core-frontend";
import { IVaultApp } from "@szewtwin/core-frontend";
import type { Id64String } from "@szewtwin/core-szewec";
import { SheetMeasurementHelper } from "./SheetMeasurementHelper.js";

export class DrawingDataCache {

  private _drawingDataCache: Map<IVaultConnection, Map<Id64String, SheetMeasurementHelper.DrawingTypeData[]>>;
  private _spatialDataCache: Map<IVaultConnection, Map<Id64String, SheetMeasurementHelper.SheetToWorldTransformProps>>;
  private _drawingTypeDataCache: Map<IVaultConnection, Map<Id64String, number>>;
  private _viewportModelChangedListeners: Map<Viewport, () => void>;
  private static _instance: DrawingDataCache | undefined;

  private constructor() {
    this._drawingDataCache = new Map<IVaultConnection, Map<Id64String, SheetMeasurementHelper.DrawingTypeData[]>>();
    this._drawingTypeDataCache = new Map<IVaultConnection, Map<Id64String, number>>();
    this._spatialDataCache = new Map<IVaultConnection, Map<Id64String, SheetMeasurementHelper.SheetToWorldTransformProps>>();
    this._viewportModelChangedListeners = new Map<Viewport, () => void>();

    this.setupEvents();

    // Populate initial viewports
    for (const vp of IVaultApp.viewManager)
      this.addViewport(vp);
  }

  public static getInstance(): DrawingDataCache {
    if (DrawingDataCache._instance === undefined) {
       DrawingDataCache._instance = new DrawingDataCache();
    }
    return DrawingDataCache._instance;
  }

  private setupEvents() {
    // If an ivault closes, clear the cache for it
    IVaultConnection.onClose.addListener((ivault) => {
      this._drawingDataCache.delete(ivault);
      this._drawingTypeDataCache.delete(ivault);
      this._spatialDataCache.delete(ivault);
    });

    // Listen for new viewports opening
    IVaultApp.viewManager.onViewOpen.addListener((vp) => {
      this.addViewport(vp);
    });

    // Listen for viewports closing, this also is called when IVaultApp shuts down
    IVaultApp.viewManager.onViewClose.addListener((vp) => {
      this.dropViewport(vp);
    });
  }

  private addViewport(vp: Viewport) {
    vp.onViewedModelsChanged.addListener((viewport) =>{
      if (!viewport.view.isSheetView())
        return;

      void this.querySheetDrawingData(viewport.iVault, viewport.view.id);
    });
  }

  private dropViewport(vp: Viewport) {
    const listener = this._viewportModelChangedListeners.get(vp);
    if (listener) {
      listener();
      this._viewportModelChangedListeners.delete(vp);
    }
  }

  public getSheetDrawingDataForViewport(vp: Viewport): ReadonlyArray<SheetMeasurementHelper.DrawingTypeData> {
    if (!vp.view.isSheetView())
      return [];

    const cache = this._drawingDataCache.get(vp.iVault);
    if (cache)
      return cache.get(vp.view.id) ?? [];

    return [];
  }

  public async queryDrawingType(ivault: IVaultConnection, drawingId: string) {
    let cache = this._drawingTypeDataCache.get(ivault);

    if (!cache) {
      cache = new Map<Id64String, number>();
      this._drawingTypeDataCache.set(ivault, cache);
    }

    let drawingType = cache?.get(drawingId);

    if (!drawingType) {
      this._drawingTypeDataCache.set(ivault, await SheetMeasurementHelper.getDrawingsTypes(ivault));
      drawingType = this._drawingTypeDataCache.get(ivault)?.get(drawingId);
    }

    return drawingType;
  }

  public async querySheetDrawingData(ivault: IVaultConnection, viewedModelID: string): Promise<SheetMeasurementHelper.DrawingTypeData[]> {
    let cache = this._drawingDataCache.get(ivault);
    if (!cache) {
      cache = new Map<Id64String, SheetMeasurementHelper.DrawingTypeData[]>();
      this._drawingDataCache.set(ivault, cache);
    }

    let sheetData = cache.get(viewedModelID);
    if (!sheetData) {
      sheetData = await SheetMeasurementHelper.getDrawingInfo(ivault, viewedModelID);
      cache.set(viewedModelID, sheetData);
    }

    return sheetData;
  }

  public async querySpatialInfo(ivault: IVaultConnection, drawing: SheetMeasurementHelper.DrawingTypeData): Promise<SheetMeasurementHelper.SheetToWorldTransformProps | undefined> {
    let cache = this._spatialDataCache.get(ivault);
    if (!cache) {
      cache = new Map<string, SheetMeasurementHelper.SheetToWorldTransformProps>();
      this._spatialDataCache.set(ivault, cache);
    }

    let transformProps = cache.get(drawing.id);
    if (!transformProps) {
      transformProps = await SheetMeasurementHelper.getSpatialInfo(ivault, drawing);
      if (transformProps)
        cache.set(drawing.id, transformProps);
    }
    return transformProps;
  }

}
