/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
// __PUBLISH_EXTRACT_START__ AppUI.Frontstage.Activate.Imports
import { UiFramework } from "@szewtwin/appui-react";
// __PUBLISH_EXTRACT_END__

export async function activateCustomFrontstage() {
  // __PUBLISH_EXTRACT_START__ AppUI.Frontstage.Activate
  await UiFramework.frontstages.setActiveFrontstage("example:CustomFrontstage");
  // __PUBLISH_EXTRACT_END__
}
