/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { UiFramework } from "@szewtwin/appui-react";
import { IVaultApp, Tool } from "@szewtwin/core-frontend";
import * as React from "react";
import { SynchronizedFloatingView } from "../ui/dialogs/SynchronizedFloatingViewComponent.js";
import panoramaconSvg from "@szewec/icons-generic/icons/panorama.svg";
import { Dialog } from "@szewtwin/szewtwinui-react";

export class OpenSynchronizedViewTool extends Tool {
  private static _counter = 0;
  public static override toolId = "OpenViewDialog";
  public static override iconSpec = panoramaconSvg;
  public static get dialogId(): string {
    return `ui-test-app:popup-view-dialog-${OpenSynchronizedViewTool._counter}`;
  }

  public static override get minArgs() {
    return 0;
  }
  public static override get maxArgs() {
    return 0;
  }

  public override async run(): Promise<boolean> {
    await this._run();
    return true;
  }

  private async _run(): Promise<void> {
    OpenSynchronizedViewTool._counter = OpenSynchronizedViewTool._counter + 1;
    let x: number | undefined;
    let y: number | undefined;
    const stage = UiFramework.frontstages.activeFrontstageDef;
    if (stage && stage.nineZoneState) {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      const floatingContentCount = stage.floatingContentControls?.length ?? 0;
      // we should not really every support more than 8 floating views
      if (
        floatingContentCount < 1 &&
        stage.nineZoneState.size.width > 800 &&
        stage.nineZoneState.size.height > 600
      ) {
        x =
          0.3 * stage.nineZoneState.size.width +
          40 * (floatingContentCount - 1);
        y =
          0.3 * stage.nineZoneState.size.height +
          40 * (floatingContentCount - 1);
      }
    }
    UiFramework.dialogs.modeless.open(
      <IVaultViewDialog
        x={x}
        y={y}
        id={OpenSynchronizedViewTool.dialogId}
        title={`IVault View (${OpenSynchronizedViewTool._counter})`}
      />,
      OpenSynchronizedViewTool.dialogId
    );
  }

  public static override get flyover(): string {
    return "open synchronized view dialog";
  }

  // if supporting localized key-ins return a localized string
  public static override get keyin(): string {
    return "open synchronized view dialog";
  }

  public static override get englishKeyin(): string {
    return "open view dialog";
  }
}

function IVaultViewDialog({
  x,
  y,
  id,
  title,
}: {
  x?: number;
  y?: number;
  id: string;
  title: string;
}) {
  const [viewport] = React.useState(() => IVaultApp.viewManager.selectedView);
  const initialOffset =
    x || y
      ? {
          left: x ?? 0,
          top: y ?? 0,
          transform: "none",
        }
      : {};

  if (!viewport) return null;
  return (
    <Dialog
      isOpen={true}
      onClose={() => {
        UiFramework.dialogs.modeless.close(id);
      }}
      closeOnEsc
      isDraggable
      isResizable
      preventDocumentScroll={true}
    >
      <Dialog.Main style={{ width: "40vw", height: "40vh", ...initialOffset }}>
        <Dialog.TitleBar titleText={title} />
        <Dialog.Content style={{ padding: 0 }}>
          <SynchronizedFloatingView contentId={id} viewport={viewport} />
        </Dialog.Content>
      </Dialog.Main>
    </Dialog>
  );
}
