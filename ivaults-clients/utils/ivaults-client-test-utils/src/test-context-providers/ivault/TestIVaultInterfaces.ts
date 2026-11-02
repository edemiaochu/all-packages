/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IVaultsClient, Lock } from "@szewtwin/ivaults-client-authoring";
import { AuthorizationParam } from "@szewtwin/ivaults-client-management";

export interface BriefcaseMetadata {
  id: number;
  deviceName: string;
  ownerId: string;
}

export interface NamedVersionMetadata {
  id: string;
  name: string;
  changesetId: string;
  changesetIndex: number;
}

export interface ChangesetExtendedDataMetadata {
  changesetId: string;
  changesetIndex: number;
  data: object;
}

export interface ChangesetGroupMetadata {
  id: string;
  description: string;
  changesetIndexes: number[];
}

export interface IVaultMetadata {
  id: string;
  name: string;
  description: string;
}

export interface ReusableIVaultMetadata extends IVaultMetadata {
  briefcases: BriefcaseMetadata[];
  namedVersions: NamedVersionMetadata[];
  lock: Lock;
  changesetExtendedData: ChangesetExtendedDataMetadata[];
  changesetGroups: ChangesetGroupMetadata[];
}

export interface TestIVaultSetupContext extends AuthorizationParam {
  iVaultsClient: IVaultsClient;
}

export interface IVaultIdentificationByNameParams {
  szewTwinId: string;
  iVaultName: string;
}

export interface IVaultIdParam {
  iVaultId: string;
}
