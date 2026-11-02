/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import "./ViewSelectorPanel.scss";
import * as React from "react";
import {
  ToolbarCustomItem,
  ToolbarItemUtilities,
  ToolbarOrientation,
  ToolbarUsage,
  useActiveIVaultConnection,
  useActiveViewport,
  ViewSelector,
} from "@szewtwin/appui-react";

export function getCustomViewSelectorPopupItem(
  overrides?: Omit<Partial<ToolbarCustomItem>, "icon">
) {
  return ToolbarItemUtilities.createCustomItem({
    id: "appui-test-providers:viewSelector",
    icon: <i className="icon icon-saved-view" />,
    label: "Load selected view into active content view",
    panelContent: <ViewSelectorPanel />,
    itemPriority: 20,
    groupPriority: 3000,
    layouts: {
      standard: {
        orientation: ToolbarOrientation.Vertical,
        usage: ToolbarUsage.ViewNavigation,
      },
    },
    ...overrides,
  });
}

function ViewSelectorPanel() {
  const iVault = useActiveIVaultConnection();
  const viewport = useActiveViewport();
  return (
    <ViewSelector
      ivault={iVault}
      panelOnly={true}
      onViewSelected={(args) => {
        if (!viewport) return;
        viewport.changeView(args.viewState);
      }}
    />
  );
}
