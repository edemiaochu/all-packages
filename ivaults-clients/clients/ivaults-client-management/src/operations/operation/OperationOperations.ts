/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  CreateIVaultOperationDetailsResponse,
  OperationsBase,
} from "../../base/internal";
import { CreateIVaultOperationDetails } from "../../base/types";
import { OperationOptions } from "../OperationOptions";

import { GetCreateIVaultOperationDetailsParams } from "./OperationParams";

export class OperationOperations<
  TOptions extends OperationOptions
> extends OperationsBase<TOptions> {
  constructor(options: TOptions) {
    super(options);
  }

  /**
   * Returns the information about iVault creation process. Wraps the
   * {@link https://developer.szewec.com/apis/ivaults-v2/operations/get-create-ivault-operation-details/ Get Create iVault Operation Details}
   * operation from iVaults API.
   * @param {GetCreateIVaultOperationDetailsParams} params parameters for this operation. See {@link GetCreateIVaultOperationDetailsParams}.
   * @returns {Promise<CreateIVaultOperationDetails>} iVault creation details. See {@link CreateIVaultOperationDetails}.
   */
  public async getCreateIVaultDetails(
    params: GetCreateIVaultOperationDetailsParams
  ): Promise<CreateIVaultOperationDetails> {
    const response =
      await this.sendGetRequest<CreateIVaultOperationDetailsResponse>({
        authorization: params.authorization,
        url: this._options.urlFormatter.getCreateIVaultOperationDetailsUrl({
          iVaultId: params.iVaultId,
        }),
        headers: params.headers,
      });
    return response.body.createOperation;
  }
}
