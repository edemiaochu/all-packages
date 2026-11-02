/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { SvgPlaceholder as SvgIcon } from "@szewtwin/szewtwinui-icons-react";
// __PUBLISH_EXTRACT_START__ AppUI.UiItemsProvider.ToolbarItems
import {
  ToolbarItemUtilities,
  ToolbarOrientation,
  ToolbarUsage,
  UiItemsProvider,
} from "@szewtwin/appui-react";

const provider: UiItemsProvider = {
  id: "example:Provider",
  getToolbarItems: () => [
    ToolbarItemUtilities.createActionItem({
      id: "example:ToolbarItem",
      itemPriority: 100,
      icon: <SvgIcon />,
      label: "My custom toolbar item",
      layouts: {
        standard: {
          orientation: ToolbarOrientation.Horizontal,
          usage: ToolbarUsage.ContentManipulation,
        },
      },
    }),
  ],
};
// __PUBLISH_EXTRACT_END__

export { provider };
