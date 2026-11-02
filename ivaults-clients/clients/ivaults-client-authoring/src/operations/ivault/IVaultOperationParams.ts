/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  CreateEmptyIVaultParams,
  IVaultProperties,
} from "@szewtwin/ivaults-client-management";

/** Properties that should be specified when creating a new iVault from baseline file. */
export interface IVaultPropertiesForCreateFromBaseline
  extends IVaultProperties {
  /** Absolute path of the iVault baseline file. The file must exist. */
  filePath: string;
}

/** Parameters for create iVault from baseline file operation. */
export interface CreateIVaultFromBaselineParams
  extends CreateEmptyIVaultParams {
  /** Properties of the new iVault. See {@link iVaultPropertiesForCreateFromBaseline}. */
  iVaultProperties: IVaultPropertiesForCreateFromBaseline;
  /** Time period to wait until the iVault is initialized. Default value is 300,000 ms (5 minutes). */
  timeOutInMs?: number;
}
