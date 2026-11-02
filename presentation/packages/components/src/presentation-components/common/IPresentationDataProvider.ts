/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Core
 */

import "./DisposePolyfill.js";

import { IVaultConnection } from "@szewtwin/core-frontend";

/**
 * Interface for a presentation data provider
 * @public
 */
export interface IPresentationDataProvider {
  /**
   * [IVaultConnection]($core-frontend) used by this data provider
   */
  readonly ivault: IVaultConnection;

  /**
   * Id of the ruleset used by this data provider
   */
  readonly rulesetId: string;

  /**
   * Disposes the provider.
   *
   * Optional to avoid breaking the API. Will be made required when the deprecated
   * `dispose` is removed.
   */
  [Symbol.dispose]?: () => void;

  /**
   * Disposes the provider.
   * @deprecated in 5.7. Use `[Symbol.dispose]` instead.
   */
  dispose(): void;
}
