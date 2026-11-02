/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  AtLeastOneProperty,
  ChangesetGroupState,
  IVaultScopedOperationParams,
} from "@szewtwin/ivaults-client-management";

/** Properties that should be specified when creating a new Changeset Group. */
export interface ChangesetGroupPropertiesForCreate {
  /** Changeset Group description. */
  description: string;
}

/** Parameters for create Changeset Group operation. */
export interface CreateChangesetGroupParams
  extends IVaultScopedOperationParams {
  /** Properties of the new Changeset Group. */
  changesetGroupProperties: ChangesetGroupPropertiesForCreate;
}

/** Changeset Group properties that can be updated. */
export interface EditableChangesetGroupProperties {
  /** State of the Changeset Group. Should be set to {@link ChangesetGroupState.Completed}. */
  state: ChangesetGroupState;
}

/**
 * Properties that can be specified when updating a Changeset Group.
 * At least one of the editable properties should be specified.
 */
export type ChangesetGroupPropertiesForUpdate =
  AtLeastOneProperty<EditableChangesetGroupProperties>;

/** Parameters for Changeset Group operation. */
export interface UpdateChangesetGroupParams
  extends IVaultScopedOperationParams {
  /** Changeset Group id. */
  changesetGroupId: string;
  /** New values for some of the Changeset Group properties. */
  changesetGroupProperties: ChangesetGroupPropertiesForUpdate;
}
