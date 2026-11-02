/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/** Possible Create iVault Operation states. */
export enum IVaultCreationState {
  /** iVault creation process completed successfully. */
  Successful = "successful",
  /** iVault is being created from a Baseline File and the file upload to file storage has not been completed yet. */
  WaitingForFile = "waitingForFile",
  /** iVault creation process is scheduled or in progress. */
  Scheduled = "scheduled",
  /** iVault creation process failed. */
  Failed = "failed",
  /** iVault fork creation failed because some elements in the main iVault do not have FederationGuid property set. */
  MainIVaultIsMissingFederationGuids = "mainIVaultIsMissingFederationGuids",
}

/** Information about the source iVault of an iVault clone. */
export interface ClonedFrom {
  /** Id of the source iVault. */
  iVaultId: string;
  /**
   * Id of the latest source iVault Changeset which was copied to this iVault.
   * This corresponds to the Changeset specified in `changesetId` or `changesetIndex` properties when cloning an iVault.
   * The value will be an empty string if no Changesets were copied from the source iVault to this one, only iVault Baseline.
   */
  changesetId: string;
}

/** Information about the source iVault of an iVault fork. */
export interface ForkedFrom {
  /** Id of the source iVault. */
  iVaultId: string;
  /**
   * Id of the latest source iVault Changeset which was copied to this iVault when creating an iVault fork.
   * This corresponds to the Changeset specified in `changesetId` or `changesetIndex` properties when forking an iVault.
   * If `changesetId` is an empty string it means that no Changesets were copied from the source iVault to this one, only iVault Baseline.
   */
  changesetId: string;
  /** Id of the Relationship entity that links main and fork iVaults. */
  relationshipId: string;
}

/** Information about iVault creation process. */
export interface CreateIVaultOperationDetails {
  /** Indicates the current state of the iVault creation process. See {@link IVaultCreationState}. */
  state: IVaultCreationState;
  /**
   * Information about the source iVault of an iVault clone (see {@link ClonedFrom}).
   * If the iVault was not created using Clone iVault operation, the value of this property will be `null`.
   */
  clonedFrom: ClonedFrom | null;
  /**
   * Information about the source iVault of an iVault Fork (see {@link ForkedFrom}).
   * If the iVault was not created using Fork iVault operation, the value of this property will be `null`.
   */
  forkedFrom: ForkedFrom | null;
}
