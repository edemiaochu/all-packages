/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module ToolSettings
 */

import type { InteractiveTool } from "@szewtwin/core-frontend";
import { IVaultApp } from "@szewtwin/core-frontend";
import type { DialogItem, DialogPropertySyncItem } from "@szewtwin/appui-abstract";
import { focusIntoContainer } from "@szewtwin/core-react/internal";
import type { SyncToolSettingsPropertiesEventArgs } from "../framework/FrameworkToolSettings.js";
import { SyncUiEventDispatcher } from "../syncui/SyncUiEventDispatcher.js";
import { BeUiEvent } from "@szewtwin/core-szewec";

/** Tool Settings Manager class. Used to generate UI components for Tool Settings.
 * @internal
 */
export class InternalToolSettingsManager {
  private static _useDefaultToolSettingsProvider = false;
  private static _toolIdForToolSettings: string = "";
  private static _activeToolLabel: string = "";
  private static _activeToolDescription: string = "";

  private static syncToolSettingsProperties(
    toolId: string,
    syncProperties: DialogPropertySyncItem[]
  ): void {
    InternalToolSettingsManager.onSyncToolSettingsProperties.emit({
      toolId,
      syncProperties,
    });
  }

  private static reloadToolSettingsProperties(): void {
    InternalToolSettingsManager.onReloadToolSettingsProperties.emit();
  }

  private static dispatchSyncUiEvent(
    syncEventId: string,
    useImmediateDispatch?: boolean
  ): void {
    if (useImmediateDispatch)
      SyncUiEventDispatcher.dispatchImmediateSyncUiEvent(syncEventId);
    else SyncUiEventDispatcher.dispatchSyncUiEvent(syncEventId);
  }

  /** Initializes the ToolSettingsManager
   * @internal
   */
  public static initialize() {
    if (IVaultApp && IVaultApp.toolAdmin) {
      IVaultApp.toolAdmin.toolSettingsChangeHandler =
        InternalToolSettingsManager.syncToolSettingsProperties;
      IVaultApp.toolAdmin.reloadToolSettingsHandler =
        InternalToolSettingsManager.reloadToolSettingsProperties;
      IVaultApp.toolAdmin.toolSyncUiEventDispatcher =
        InternalToolSettingsManager.dispatchSyncUiEvent;
    }
  }

  /** clear cached Tool Settings properties. */
  public static clearToolSettingsData() {
    InternalToolSettingsManager.useDefaultToolSettingsProvider = false;
    InternalToolSettingsManager._activeToolLabel = "";
    InternalToolSettingsManager._activeToolDescription = "";
    InternalToolSettingsManager._toolIdForToolSettings = "";
  }

  /** Cache Tool Settings properties */
  public static initializeToolSettingsData(
    toolSettingsProperties: DialogItem[] | undefined,
    toolId?: string,
    toolLabel?: string,
    toolDescription?: string
  ): boolean {
    InternalToolSettingsManager.clearToolSettingsData();
    if (toolLabel) InternalToolSettingsManager._activeToolLabel = toolLabel;

    if (toolDescription)
      InternalToolSettingsManager._activeToolDescription = toolDescription;

    if (toolSettingsProperties && toolSettingsProperties.length > 0) {
      if (toolId) InternalToolSettingsManager._toolIdForToolSettings = toolId;

      InternalToolSettingsManager._useDefaultToolSettingsProvider = true;
      return true;
    }
    return false;
  }

  /** Set of data used in Tool Settings for the specified tool. The tool specified should be the "active" tool.
   */
  public static initializeDataForTool(tool: InteractiveTool) {
    InternalToolSettingsManager.initializeToolSettingsData(
      tool.supplyToolSettingsProperties(),
      tool.toolId,
      tool.flyover,
      tool.description
    );
  }

  /** Returns the toolSettings properties that can be used to populate the tool settings widget. */
  public static get toolSettingsProperties(): DialogItem[] {
    if (
      IVaultApp.toolAdmin &&
      IVaultApp.toolAdmin.activeTool &&
      IVaultApp.toolAdmin.activeTool.toolId ===
        InternalToolSettingsManager._toolIdForToolSettings
    ) {
      const properties =
        IVaultApp.toolAdmin.activeTool.supplyToolSettingsProperties();
      if (properties) return properties;
    }

    return [];
  }

  /** Returns true if the Tool Settings are to be auto populated from the toolSettingsProperties.
   * The setter is chiefly for testing.
   */
  public static get useDefaultToolSettingsProvider(): boolean {
    return InternalToolSettingsManager._useDefaultToolSettingsProvider;
  }
  public static set useDefaultToolSettingsProvider(
    useDefaultToolSettings: boolean
  ) {
    InternalToolSettingsManager._useDefaultToolSettingsProvider =
      useDefaultToolSettings;
  }

  /** The name of the active tool. This is typically the flyover text specified for the tool. */
  public static get activeToolLabel(): string {
    return InternalToolSettingsManager._activeToolLabel;
  }
  public static set activeToolLabel(label: string) {
    InternalToolSettingsManager._activeToolLabel = label;
  }

  /** Returns the description of the active tool. */
  public static get activeToolDescription(): string {
    return InternalToolSettingsManager._activeToolDescription;
  }

  /** Get ToolSettings Properties sync event. */
  public static readonly onSyncToolSettingsProperties =
    new BeUiEvent<SyncToolSettingsPropertiesEventArgs>(); // eslint-disable-line @typescript-eslint/no-deprecated

  public static readonly onReloadToolSettingsProperties = new BeUiEvent<void>();

  /** Gets the Id of the active tool. If a tool is not active, blank is returned.
   * @return  Id of the active tool, or blank if one is not active.
   */
  public static get toolIdForToolSettings(): string {
    return InternalToolSettingsManager._toolIdForToolSettings;
  }

  public static focusIntoToolSettings(): boolean {
    let divElement = document.querySelector("div.uifw-toolSettings-docked");
    if (divElement) {
      if (focusIntoContainer(divElement as HTMLDivElement)) return true;
    }

    divElement = document.querySelector(
      "div.uifw-tool-settings-grid-container"
    );
    if (divElement) {
      if (focusIntoContainer(divElement as HTMLDivElement)) return true;
    }

    return false;
  }
}
