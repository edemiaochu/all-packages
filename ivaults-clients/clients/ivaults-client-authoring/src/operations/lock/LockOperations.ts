/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  Lock,
  LockResponse,
  LockOperations as ManagementLockOperations,
} from "@szewtwin/ivaults-client-management";

import { OperationOptions } from "../OperationOptions";

import { UpdateLockParams } from "./LockOperationParams";

export class LockOperations<
  TOptions extends OperationOptions
> extends ManagementLockOperations<TOptions> {
  /**
   * Updates Lock for a specific Briefcase. This operation is used to acquire new locks and change the lock level for
   * already existing ones. Wraps the {@link https://developer.szewec.com/apis/ivaults-v2/operations/update-ivault-locks/
   * Update iVault Locks} operation from iVaults API.
   * @param {UpdateLockParams} params parameters for this operation. See {@link UpdateLockParams}.
   * @returns {Promise<Lock>} updated Lock. See {@link Lock}.
   */
  public async update(params: UpdateLockParams): Promise<Lock> {
    const updateLockBody = this.getUpdateLockBody(params);
    const updateLockResponse = await this.sendPatchRequest<LockResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getLockListUrl({
        iVaultId: params.iVaultId,
      }),
      body: updateLockBody,
      headers: params.headers,
    });
    return updateLockResponse.body.lock;
  }

  private getUpdateLockBody(params: UpdateLockParams): object {
    return {
      briefcaseId: params.briefcaseId,
      changesetId: params.changesetId,
      lockedObjects: params.lockedObjects,
    };
  }
}
