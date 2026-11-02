/*---------------------------------------------------------------------------------------------
* Copyright (c) Szewec Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import React from "react";
import { ToolbarItemUtilities } from "@szewtwin/appui-react";
import { SvgGeosearch } from "@szewtwin/szewtwinui-icons-react";
import { BingAddressProvider } from "./BingAddressProvider";
import { GeoAddressSearch } from "./components/GeoAddressSearch";
import { GeoTools } from "./GeoTools";

import type { ToolbarCustomItem} from "@szewtwin/appui-react";
import type { AddressProvider } from "./AddressProvider";
export interface GeoToolsOptions {
  addressProvider?: AddressProvider
}

/** Utility Class that provides definitions of tools. These definitions can be used to populate the UI.
 * @public
 */
// istanbul ignore next
export class GeoToolsItemDef {
  public static getItemDef(opts?: GeoToolsOptions): ToolbarCustomItem {
    return ToolbarItemUtilities.createCustomItem({
      id: "geo-tools:geoAddressSearch",
      icon: <SvgGeosearch />,
      label: GeoTools.translate("geoAddressSearch.label"),
      panelContent: <GeoAddressSearch provider={opts?.addressProvider?? new BingAddressProvider()}/>,
    });
  }
}
