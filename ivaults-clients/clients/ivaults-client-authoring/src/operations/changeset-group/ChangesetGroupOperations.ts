/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  ChangesetGroup,
  ChangesetGroupResponse,
  ChangesetGroupOperations as ManagementChangesetGroupOperations,
} from "@szewtwin/ivaults-client-management";

import { OperationOptions } from "../OperationOptions";

import {
  ChangesetGroupPropertiesForCreate,
  ChangesetGroupPropertiesForUpdate,
  CreateChangesetGroupParams,
  UpdateChangesetGroupParams,
} from "./ChangesetGroupOperationParams";

export class ChangesetGroupOperations<
  TOptions extends OperationOptions
> extends ManagementChangesetGroupOperations<TOptions> {
  /**
   * Creates a Changeset Group. Wraps the
   * {@link https://developer.szewec.com/apis/ivaults-v2/operations/create-ivault-changeset-group/ Create iVault Changeset Group}
   * operation from iVaults API.
   * @param {CreateChangesetGroupParams} params parameters for this operation. See {@link CreateChangesetGroupParams}.
   * @returns {Promise<ChangesetGroup>} newly created Changeset Group. See {@link ChangesetGroup}.
   */
  public async create(
    params: CreateChangesetGroupParams
  ): Promise<ChangesetGroup> {
    const createChangesetGroupBody = this.getCreateChangesetGroupRequestBody(
      params.changesetGroupProperties
    );
    const createChangesetGroupResponse =
      await this.sendPostRequest<ChangesetGroupResponse>({
        authorization: params.authorization,
        url: this._options.urlFormatter.getChangesetGroupListUrl({
          iVaultId: params.iVaultId,
        }),
        body: createChangesetGroupBody,
        headers: params.headers,
      });
    const result = this.appendRelatedEntityCallbacks(
      params.authorization,
      createChangesetGroupResponse.body.changesetGroup,
      params.headers
    );
    return result;
  }

  /**
   * Closes an existing Changeset Group. Wraps the
   * {@link https://developer.szewec.com/apis/ivaults-v2/operations/update-ivault-changeset-group/ Update iVault Changeset Group}
   * operation from iVaults API.
   * @param {UpdateChangesetGroupParams} params parameters for this operation. See {@link UpdateChangesetGroupParams}.
   * @returns {Promise<ChangesetGroup>} updated Changeset Group. See {@link ChangesetGroup}.
   */
  public async update(
    params: UpdateChangesetGroupParams
  ): Promise<ChangesetGroup> {
    const updateChangesetGroupBody = this.getUpdateChangesetGroupRequestBody(
      params.changesetGroupProperties
    );
    const updateChangesetGroupResponse =
      await this.sendPatchRequest<ChangesetGroupResponse>({
        authorization: params.authorization,
        url: this._options.urlFormatter.getSingleChangesetGroupUrl({
          iVaultId: params.iVaultId,
          changesetGroupId: params.changesetGroupId,
        }),
        body: updateChangesetGroupBody,
        headers: params.headers,
      });
    const result = this.appendRelatedEntityCallbacks(
      params.authorization,
      updateChangesetGroupResponse.body.changesetGroup,
      params.headers
    );
    return result;
  }

  private getCreateChangesetGroupRequestBody(
    changesetGroupProperties: ChangesetGroupPropertiesForCreate
  ): object {
    return {
      description: changesetGroupProperties.description,
    };
  }

  private getUpdateChangesetGroupRequestBody(
    changesetGroupProperties: ChangesetGroupPropertiesForUpdate
  ): object {
    return {
      state: changesetGroupProperties.state,
    };
  }
}
