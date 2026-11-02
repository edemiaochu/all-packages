/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Common
 */

import { Logger } from "@szewtwin/core-szewec";
import { IVaultApp } from "@szewtwin/core-frontend";
import { UiComponents } from "@szewtwin/components-react";
import { EmptyLocalization } from "@szewtwin/core-common";

/**
 * Manages the localization service for the ivault-components-react package.
 * @public
 */
export class UiIVaultComponents {
  private static _initialized = false;

  /**
   * initialize UiIVaultComponents.
   */
  public static async initialize(): Promise<void> {
    if (UiIVaultComponents._initialized) {
      Logger.logInfo(
        UiIVaultComponents.loggerCategory("UiIVaultComponents"),
        `UiIVaultComponents.initialize already called`
      );
      return;
    }

    await IVaultApp.localization?.registerNamespace(
      UiIVaultComponents.localizationNamespace
    );

    if (!IVaultApp.localization) {
      // it should only get here in unit test where IVaultApp is not setup
      const localization = new EmptyLocalization();
      await localization.initialize();
      await UiComponents.initialize(localization);
    } else {
      await UiComponents.initialize(IVaultApp.localization);
    }

    UiIVaultComponents._initialized = true;
  }

  /** Unregisters the UiIVaultComponents localization namespace */
  public static terminate() {
    IVaultApp.localization?.unregisterNamespace(
      UiIVaultComponents.localizationNamespace
    );
    UiComponents.terminate();
    UiIVaultComponents._initialized = false;
  }

  /** Determines if UiIVaultComponents has been initialized */
  public static get initialized(): boolean {
    return UiIVaultComponents._initialized;
  }

  /** The internationalization service namespace. */
  public static get localizationNamespace(): string {
    return "UiIVaultComponents";
  }

  /** @internal */
  public static get packageName(): string {
    return "ivault-components-react";
  }

  /** Calls localization.getLocalizedString with the "UiIVaultComponents" namespace. Do NOT include the namespace in the key.
   * @internal
   */
  public static translate(key: string | string[]): string {
    if (!UiIVaultComponents.initialized || !IVaultApp.localization) {
      Logger.logError(
        UiIVaultComponents.loggerCategory("UiIVaultComponents"),
        `translate: IVaultApp.localization has not been setup. Returning blank string.`
      );
      return "";
    }
    return IVaultApp.localization.getLocalizedString(
      `${UiIVaultComponents.localizationNamespace}:${String(key)}`
    );
  }

  /** @internal */
  public static loggerCategory(name: string): string {
    return `${UiIVaultComponents.packageName}.${name}`;
  }
}
