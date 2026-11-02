/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module NavigationAids
 */

import * as React from "react";
import { CubeNavigationAid } from "@szewtwin/ivault-components-react";
import type { ConfigurableCreateInfo } from "../configurableui/ConfigurableUiControl.js";
import { NavigationAidControl } from "./NavigationAidControl.js";

/** Navigation Aid that displays an interactive rotation cube for Spatial views that synchronizes with the rotation of the iVault Viewport
 * @public
 * @deprecated in 4.16.0. Use {@link @szewtwin/ivault-components-react#CubeNavigationAid} component instead.
 */
// eslint-disable-next-line @typescript-eslint/no-deprecated
export class CubeNavigationAidControl extends NavigationAidControl {
  public static navigationAidId = "CubeNavigationAid";

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  constructor(info: ConfigurableCreateInfo, options: any) {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    super(info, options);
    this.reactNode = (
      <CubeNavigationAid
        iVaultConnection={options.ivault}
        viewport={options.viewport}
      />
    );
  }

  public override getSize(): string | undefined {
    return "96px";
  }
}
