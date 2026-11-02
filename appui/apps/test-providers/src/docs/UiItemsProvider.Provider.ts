/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
// __PUBLISH_EXTRACT_START__ AppUI.UiItemsProvider.Provider
import { UiItemsProvider } from "@szewtwin/appui-react";

const provider: UiItemsProvider = {
  id: "example:Provider",
  getWidgets: () => [],
  getToolbarItems: () => [],
};
// __PUBLISH_EXTRACT_END__

export { provider };
