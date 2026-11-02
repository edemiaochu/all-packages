/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { injectable } from "inversify";

import {
  DeleteIVaultParams,
  IVault,
  UtilityFunctions,
} from "@szewtwin/ivaults-client-management";

import { TestAuthorizationProvider } from "../auth/TestAuthorizationProvider";

import { ReusableTestIVaultProviderConfig } from "./ReusableTestIVaultProviderConfig";
import { TestIVaultCreator } from "./TestIVaultCreator";
import { ReusableIVaultMetadata } from "./TestIVaultInterfaces";
import { TestIVaultRetriever } from "./TestIVaultRetriever";
import { TestIVaultsClient } from "./TestIVaultsClient";

@injectable()
export class ReusableTestIVaultProvider {
  private _reusableIVault: ReusableIVaultMetadata | undefined;

  constructor(
    private readonly _config: ReusableTestIVaultProviderConfig,
    private readonly _iVaultsClient: TestIVaultsClient,
    private readonly _testAuthorizationProvider: TestAuthorizationProvider,
    private readonly _testIVaultRetriever: TestIVaultRetriever,
    private readonly _testIVaultCreator: TestIVaultCreator
  ) {}

  public async getOrCreate(): Promise<ReusableIVaultMetadata> {
    if (!this._reusableIVault) this._reusableIVault = await this.get();

    return this._reusableIVault;
  }

  private async get(): Promise<ReusableIVaultMetadata> {
    const existingReusableIVault =
      await this._testIVaultRetriever.findIVaultByName(
        this._config.testIVaultName
      );
    if (!existingReusableIVault)
      return this._testIVaultCreator.createReusable(
        this._config.testIVaultName
      );

    if (this._config.behaviorOptions.recreateReusableIVault) {
      await this.deleteIVault(existingReusableIVault.id);
      return this._testIVaultCreator.createReusable(
        this._config.testIVaultName
      );
    }

    return this.waitForInitializedIVault(existingReusableIVault);
  }

  private async waitForInitializedIVault(
    iVault: IVault
  ): Promise<ReusableIVaultMetadata> {
    const timeoutInMs = 3 * 60 * 1000; // 3 minutes
    const pollingIntervalInMs = 5 * 1000; // 5 seconds

    for (
      let attempt = 0;
      attempt < Math.ceil(timeoutInMs / pollingIntervalInMs);
      attempt++
    ) {
      if (this._testIVaultCreator.isReusableIVaultInitialized(iVault)) {
        return this._testIVaultRetriever.queryRelatedData(iVault);
      }

      await UtilityFunctions.sleep(pollingIntervalInMs);

      // eslint-disable-next-line no-param-reassign
      iVault = await this._iVaultsClient.iVaults.getSingle({
        authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
        iVaultId: iVault.id,
      });
    }

    throw Error(
      "Timed out while waiting for reusable iVault to be initialized."
    );
  }

  private async deleteIVault(iVaultId: string): Promise<void> {
    const deleteIVaultParams: DeleteIVaultParams = {
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      iVaultId,
    };
    return this._iVaultsClient.iVaults.delete(deleteIVaultParams);
  }
}
