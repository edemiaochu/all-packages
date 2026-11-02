/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IVaultScopedOperationParams } from "@szewtwin/ivaults-client-management";

/** Properties that should be specified when acquiring a new Briefcase. */
export interface BriefcaseProperties {
  /** Name of the device which will hold the briefcase. */
  deviceName: string;
}

/** Parameters for acquire Briefcase operation. */
export interface AcquireBriefcaseParams extends IVaultScopedOperationParams {
  /** Properties of the new Briefcase. */
  briefcaseProperties?: BriefcaseProperties;
}
