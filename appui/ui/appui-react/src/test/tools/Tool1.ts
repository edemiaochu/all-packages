/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import type { Point3d } from "@szewtwin/core-geometry";
import type { BeButtonEvent } from "@szewtwin/core-frontend";
import { EventHandled, IVaultApp, PrimitiveTool } from "@szewtwin/core-frontend";

/** @internal */
export class Tool1 extends PrimitiveTool {
  public static override toolId = "Tool1";
  public readonly points: Point3d[] = [];

  public override requireWriteableTarget(): boolean {
    return false;
  }
  public override async onPostInstall() {
    await super.onPostInstall();
    this.setupAndPromptForNextAction();
  }

  public setupAndPromptForNextAction(): void {
    IVaultApp.notifications.outputPromptByKey(
      "SampleApp:tools.Tool1.Prompts.GetPoint"
    );
  }

  public override async onDataButtonDown(
    ev: BeButtonEvent
  ): Promise<EventHandled> {
    this.points.push(ev.point.clone());
    this.setupAndPromptForNextAction();
    return EventHandled.No;
  }

  public override async onResetButtonUp(
    _ev: BeButtonEvent
  ): Promise<EventHandled> {
    await IVaultApp.toolAdmin.startDefaultTool();
    return EventHandled.No;
  }

  public async onRestartTool() {
    const tool = new Tool1();
    if (!(await tool.run())) return this.exitTool();
  }
}
