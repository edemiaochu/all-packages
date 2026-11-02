/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import {
  BeButtonEvent,
  CoordinateLockOverrides,
  EventHandled,
  HitDetail,
  IVaultApp,
  LocateFilterStatus,
  LocateResponse,
  PrimitiveTool,
  SelectionMethod,
  SelectionMode,
} from "@szewtwin/core-frontend";
import { Point3d } from "@szewtwin/core-geometry";
import { UiFramework } from "@szewtwin/appui-react";
import { ToolbarItemUtilities } from "@szewtwin/appui-abstract";
import { AppUiTestProviders } from "../AppUiTestProviders.js";
import genericToolSvg from "./generic-tool.svg";

/** Sample Primitive tool where user selects an element for processing */
export class GenericLocateTool extends PrimitiveTool {
  public userPoint: Point3d | undefined;
  public elementId: string | undefined;
  public static override get toolId() {
    return "uiItemsProvidersTest-GenericLocateTool";
  }
  public static get toolStringKey() {
    return `tools.${GenericLocateTool.toolId}.`;
  }
  public static override iconSpec = genericToolSvg;
  public static useDefaultPosition = false;
  public override autoLockTarget(): void {} // NOTE: For selecting elements we only care about iVault, so don't lock target model automatically.
  protected wantSelectionClearOnMiss(_ev: BeButtonEvent): boolean {
    return SelectionMode.Replace === this.getSelectionMode();
  }
  protected wantPickableDecorations(): boolean {
    return false;
  } // Allow pickable decorations selection to be independent of manipulators...
  protected getSelectionMethod(): SelectionMethod {
    return SelectionMethod.Pick;
  }
  protected getSelectionMode(): SelectionMode {
    return SelectionMode.Replace;
  }
  public override requireWriteableTarget() {
    return false;
  }
  public override async filterHit(_hit: HitDetail, _out?: LocateResponse) {
    return Promise.resolve(LocateFilterStatus.Accept);
  }

  public static getPrompt(name: string): string {
    const key = `tools.${this.toolId}.Prompts.${name}`;
    return AppUiTestProviders.translate(key);
  }

  public async process(_elementId: string, _point?: Point3d) {
    // Exit the tool
    return this.exitTool();
  }

  public override async onDataButtonUp(
    ev: BeButtonEvent
  ): Promise<EventHandled> {
    const hit = await IVaultApp.locateManager.doLocate(
      new LocateResponse(),
      true,
      ev.point,
      ev.viewport,
      ev.inputSource
    );
    if (this.elementId === undefined) {
      if (hit !== undefined) {
        this.elementId = hit.sourceId;
        // Process right away if user wants default position
        if (GenericLocateTool.useDefaultPosition)
          await this.process(hit.sourceId);
        else this.setupAndPromptForNextAction();
      }
    } else if (!GenericLocateTool.useDefaultPosition) {
      this.userPoint = ev.point;
      if (hit !== undefined) this.userPoint = hit.hitPoint;
      // Process with the defined point
      await this.process(this.elementId, this.userPoint);
    }

    return EventHandled.Yes;
  }

  public override async onResetButtonUp(
    _ev: BeButtonEvent
  ): Promise<EventHandled> {
    await this.onReinitialize();
    return EventHandled.No;
  }

  protected outputMarkupPrompt(msg: string) {
    IVaultApp.notifications.outputPrompt(GenericLocateTool.getPrompt(msg));
  }

  public setupAndPromptForNextAction() {
    if (!this.elementId) {
      this.outputMarkupPrompt("identifyElement");
    } else if (!GenericLocateTool.useDefaultPosition) {
      this.outputMarkupPrompt("identifyPosition");
      // Enable snapping for accurate positions
      IVaultApp.accuSnap.enableSnap(true);
    }
  }

  public override async onPostInstall() {
    await super.onPostInstall();

    const iVaultConnection = UiFramework.getIVaultConnection();
    if (!iVaultConnection) return;

    if (iVaultConnection.selectionSet.size === 1) {
      // Process and exit tool
      iVaultConnection.selectionSet.elements.forEach(
        (elementId: string, _val: string, _set: Set<string>) => {
          void this.process(elementId);
        }
      );
      await IVaultApp.toolAdmin.startDefaultTool();
    } else {
      // Empty all before starting tool
      iVaultConnection.selectionSet.emptyAll();
      // Show prompt for identifying the element
      this.outputMarkupPrompt("identifyElement");

      IVaultApp.toolAdmin.setCursor("arrow");
      IVaultApp.toolAdmin.setLocateCircleOn(true);

      IVaultApp.toolAdmin.toolState.coordLockOvr = CoordinateLockOverrides.All;
      IVaultApp.locateManager.initToolLocate();
      IVaultApp.locateManager.options.allowDecorations = true; // Always locate to display tool tip even if we reject for adding to selection set...

      // Locate elements
      IVaultApp.accuSnap.enableLocate(true);
      IVaultApp.accuSnap.enableSnap(false);
    }
  }

  public async onRestartTool() {
    return this.exitTool();
  }

  public static async startTool(): Promise<boolean> {
    return new GenericLocateTool().run();
  }

  public static getActionButtonDef(
    itemPriority: number,
    groupPriority?: number
  ) {
    const overrides = undefined !== groupPriority ? { groupPriority } : {};
    const iconSpec = this.iconSpec;
    return ToolbarItemUtilities.createActionButton(
      GenericLocateTool.toolId,
      itemPriority,
      iconSpec,
      GenericLocateTool.flyover,
      async () => {
        await IVaultApp.tools.run(
          GenericLocateTool.toolId,
          IVaultApp.viewManager.selectedView,
          true
        );
      },
      overrides
    );
  }
}
