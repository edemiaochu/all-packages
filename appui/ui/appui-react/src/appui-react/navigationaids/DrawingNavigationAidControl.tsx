/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module NavigationAids
 */

import * as React from "react";
import { DrawingNavigationAid } from "@szewtwin/ivault-components-react";
import type { ConfigurableCreateInfo } from "../configurableui/ConfigurableUiControl.js";
import { NavigationAidControl } from "./NavigationAidControl.js";

/** Navigation Aid that displays an interactive mini-map for Drawing views that synchronizes with the iVault Viewport.
 * @public
 * @deprecated in 4.16.0. Use {@link @szewtwin/ivault-components-react#DrawingNavigationAid} component instead.
 */
// eslint-disable-next-line @typescript-eslint/no-deprecated
export class DrawingNavigationAidControl extends NavigationAidControl {
  public static navigationAidId = "DrawingNavigationAid";

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  constructor(info: ConfigurableCreateInfo, options: any) {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    super(info, options);
    this.reactNode = (
      <DrawingNavigationAid
        iVaultConnection={options.ivault}
        viewport={options.viewport}
      />
    );
  }

  public override getSize(): string | undefined {
    return "96px";
  }
}
