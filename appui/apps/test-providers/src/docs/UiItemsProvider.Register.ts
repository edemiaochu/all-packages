/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { provider } from "./UiItemsProvider.Provider.js";
// __PUBLISH_EXTRACT_START__ AppUI.UiItemsProvider.Register
import { UiItemsManager } from "@szewtwin/appui-react";

UiItemsManager.register(provider);
// __PUBLISH_EXTRACT_END__
