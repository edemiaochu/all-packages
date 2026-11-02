/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as React from "react";
import {
  ToolbarItem,
  ToolbarItemUtilities,
  ToolbarOrientation,
  ToolbarUsage,
  UiItemsProvider,
} from "@szewtwin/appui-react";
import { BeDuration } from "@szewtwin/core-szewec";
import {
  ActivityMessageDetails,
  ActivityMessageEndReason,
  IVaultApp,
  NotifyMessageDetails,
  OutputMessagePriority,
  OutputMessageType,
} from "@szewtwin/core-frontend";
import { SvgPlaceholder } from "@szewtwin/szewtwinui-icons-react";

/** UiItemsProvider that provides tools to test message APIs. */
export class MessageUiItemsProvider implements UiItemsProvider {
  public static providerId = "appui-test-providers:MessageUiItemsProvider";
  public readonly id = MessageUiItemsProvider.providerId;

  public getToolbarItems(): readonly ToolbarItem[] {
    return [
      ToolbarItemUtilities.createGroupItem({
        id: `${this.id}:group`,
        itemPriority: 10,
        icon: <SvgPlaceholder />,
        label: "Messages",
        items: [
          ToolbarItemUtilities.createActionItem({
            id: `${this.id}:activity`,
            itemPriority: 1,
            icon: <SvgPlaceholder />,
            label: "Activity message",
            execute: async () => {
              let isCancelled = false;
              let progress = 0;

              if (details) return;

              details = new ActivityMessageDetails(true, true, true, true);
              details.onActivityCancelled = () => {
                isCancelled = true;
              };
              IVaultApp.notifications.setupActivityMessage(details);

              while (!isCancelled && progress <= 100) {
                IVaultApp.notifications.outputActivityMessage(
                  "Sample activity message",
                  progress
                );
                await BeDuration.wait(100);
                progress++;
              }

              IVaultApp.notifications.endActivityMessage(
                ActivityMessageEndReason.Completed
              );
              details = undefined;
            },
          }),
          ToolbarItemUtilities.createActionItem({
            id: `${this.id}:toast`,
            itemPriority: 1,
            icon: <SvgPlaceholder />,
            label: "Toast message",
            execute: () => {
              IVaultApp.notifications.outputMessage(
                new NotifyMessageDetails(
                  OutputMessagePriority.Info,
                  "Toast message",
                  undefined,
                  OutputMessageType.Toast
                )
              );
            },
          }),
          ToolbarItemUtilities.createActionItem({
            id: `${this.id}:sticky`,
            itemPriority: 1,
            icon: <SvgPlaceholder />,
            label: "Sticky message",
            execute: () => {
              IVaultApp.notifications.outputMessage(
                new NotifyMessageDetails(
                  OutputMessagePriority.Info,
                  "Sticky message",
                  "Additional message details",
                  OutputMessageType.Sticky
                )
              );
            },
          }),
          ToolbarItemUtilities.createActionItem({
            id: `${this.id}:alert`,
            itemPriority: 1,
            icon: <SvgPlaceholder />,
            label: "Alert message",
            execute: () => {
              IVaultApp.notifications.outputMessage(
                new NotifyMessageDetails(
                  OutputMessagePriority.Fatal,
                  "Alert message",
                  undefined,
                  OutputMessageType.Alert
                )
              );
            },
            badgeKind: "new",
          }),
        ],
        layouts: {
          standard: {
            usage: ToolbarUsage.ContentManipulation,
            orientation: ToolbarOrientation.Vertical,
          },
        },
      }),
    ];
  }
}

let details: ActivityMessageDetails | undefined;
