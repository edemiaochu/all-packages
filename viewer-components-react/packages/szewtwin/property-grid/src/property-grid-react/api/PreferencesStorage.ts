/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Logger } from "@szewtwin/core-szewec";
import { IVaultApp } from "@szewtwin/core-frontend";

const PROPERTY_GRID_NAMESPACE = "PropertyGridPreferences";
const LOGGER_CATEGORY = "PropertyGrid";

/**
 * Interface defining storage used by `PropertyGridComponent` to persist preferences.
 * @public
 */
export interface PreferencesStorage {
  set(key: string, value: string): Promise<void>;
  get(key: string): Promise<string | undefined>;
}

/**
 * Default storage used by `PropertyGridComponent` to persist preferences. It uses `IVaultApp.userPreferences`
 * and, by default, persists preferences under `PropertyGridPreferences` namespace.
 * @public
 */
export class IVaultAppUserPreferencesStorage implements PreferencesStorage {
  #nameSpace = PROPERTY_GRID_NAMESPACE;
  constructor(nameSpace = PROPERTY_GRID_NAMESPACE) {
    this.#nameSpace = nameSpace;
  }

  public async set(key: string, value: string): Promise<void> {
    if (!IVaultApp.userPreferences) {
      Logger.logError(LOGGER_CATEGORY, `Cannot save user preference ${key} because 'IVaultApp.userPreferences' not defined.`);
      return;
    }

    const accessToken = await IVaultApp.getAccessToken();
    try {
      await IVaultApp.userPreferences.save({
        accessToken,
        content: value,
        namespace: this.#nameSpace,
        key,
      });
    } catch (error) {
      Logger.logError(LOGGER_CATEGORY, `Error saving ${key} user preference: ${error}`);
    }
  }

  public async get(key: string): Promise<string | undefined> {
    if (!IVaultApp.userPreferences) {
      Logger.logError(LOGGER_CATEGORY, `Cannot get persisted user preference ${key} because 'IVaultApp.userPreferences' not defined.`);
      return undefined;
    }

    const accessToken = await IVaultApp.getAccessToken();
    try {
      return await IVaultApp.userPreferences.get({
        accessToken,
        namespace: this.#nameSpace,
        key,
      });
    } catch (error) {
      Logger.logError(LOGGER_CATEGORY, `Error getting ${key} user preference: ${error}`);
    }
    return undefined;
  }
}
