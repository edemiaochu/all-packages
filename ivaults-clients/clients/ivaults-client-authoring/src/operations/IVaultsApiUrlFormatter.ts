/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IVaultsApiUrlFormatter as ManamegentIVaultsApiUrlFormatter } from "@szewtwin/ivaults-client-management";

export class IVaultsApiUrlFormatter extends ManamegentIVaultsApiUrlFormatter {
  public getBaselineUrl(params: { iVaultId: string }): string {
    return `${this.baseUrl}/${params.iVaultId}/baselinefile`;
  }
}
