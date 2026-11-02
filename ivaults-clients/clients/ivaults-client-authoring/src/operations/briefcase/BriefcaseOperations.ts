/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  Briefcase,
  BriefcaseResponse,
  BriefcaseOperations as ManagementBriefcaseOperations,
} from "@szewtwin/ivaults-client-management";

import { OperationOptions } from "../OperationOptions";

import {
  AcquireBriefcaseParams,
  BriefcaseProperties,
} from "./BriefcaseOperationParams";

export class BriefcaseOperations<
  TOptions extends OperationOptions
> extends ManagementBriefcaseOperations<TOptions> {
  /**
   * Acquires a new Briefcase with specified properties. Wraps the
   * {@link https://developer.szewec.com/apis/ivaults-v2/operations/acquire-ivault-briefcase/ Acquire iVault Briefcase}
   * operation from iVaults API.
   * @param {AcquireBriefcaseParams} params parameters for this operation. See {@link AcquireBriefcaseParams}.
   * @returns {Promise<Briefcase>} newly acquired Briefcase. See {@link Briefcase}.
   */
  public async acquire(params: AcquireBriefcaseParams): Promise<Briefcase> {
    const acquireBriefcaseBody = this.getAcquireBriefcaseRequestBody(
      params.briefcaseProperties
    );
    const acquireBriefcaseResponse =
      await this.sendPostRequest<BriefcaseResponse>({
        authorization: params.authorization,
        url: this._options.urlFormatter.getBriefcaseListUrl({
          iVaultId: params.iVaultId,
        }),
        body: acquireBriefcaseBody,
        headers: params.headers,
      });
    const result = this.appendRelatedEntityCallbacks(
      params.authorization,
      acquireBriefcaseResponse.body.briefcase,
      params.headers
    );
    return result;
  }

  private getAcquireBriefcaseRequestBody(
    briefcaseProperties: BriefcaseProperties | undefined
  ): object | undefined {
    if (!briefcaseProperties) return undefined;

    return {
      deviceName: briefcaseProperties.deviceName,
    };
  }
}
