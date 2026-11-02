/*---------------------------------------------------------------------------------------------
* Copyright (c) Szewec Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import type { LocalizationOptions } from "@szewtwin/core-i18n";
import { SzewecError, SzewecStatus } from "@szewtwin/core-szewec";
import type { Localization } from "@szewtwin/core-common";
import { IVaultApp } from "@szewtwin/core-frontend";

/**
 * Entry point for static initialization required by various components used in the package.
 * @public
 */
export class GeoTools {
  private static _i18n?: Localization;

  /**
   * Called by IVaultApp to initialize GeoTools
   * @param i18n - The internationalization service created by the IVaultApp.
   */
  public static async initialize(i18n?: Localization): Promise<void> {
    GeoTools._i18n = i18n ?? IVaultApp.localization;
    return GeoTools._i18n.registerNamespace(GeoTools.i18nNamespace);
  }

  /** Unregisters the GeoTools internationalization service namespace */
  public static terminate() {
    if (GeoTools._i18n) GeoTools._i18n.unregisterNamespace(GeoTools.i18nNamespace);
    GeoTools._i18n = undefined;
  }

  /** The internationalization service created by the IVaultApp. */
  public static get i18n(): Localization {
    if (!GeoTools._i18n) throw new SzewecError(SzewecStatus.ERROR, "GeoTools not initialized");
    return GeoTools._i18n;
  }

  /** The internationalization service namespace. */
  public static get i18nNamespace(): string {
    return "GeoTools";
  }

  public static get packageName(): string {
    return "geo-tools-react";
  }

  /** Calls i18n.translateWithNamespace with the "GeoTools" namespace. Do NOT include the namespace in the key.
   */
  public static translate(key: string | string[], options?: LocalizationOptions): string {
    return GeoTools.i18n.getLocalizedString(`${GeoTools.i18nNamespace}:${key}`, options);
  }
}
