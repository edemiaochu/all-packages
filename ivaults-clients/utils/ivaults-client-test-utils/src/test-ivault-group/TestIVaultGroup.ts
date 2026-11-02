/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  TestAuthorizationProvider,
  TestIVaultsClient,
  TestSZEWTwinProvider,
} from "../test-context-providers";

export interface TestRunContext {
  testRunId: string;
  packageName: string;
  testSuiteName?: string;
}

export class TestIVaultGroup {
  public readonly firstNamePrefix = "AAA";
  public readonly lastNamePrefix = "YYY";
  private _iVaultNamePrefix: string;

  constructor(
    private readonly _iVaultsClient: TestIVaultsClient,
    private readonly _testAuthorizationProvider: TestAuthorizationProvider,
    private readonly _testSZEWTwinProvider: TestSZEWTwinProvider,
    testRunContext: TestRunContext
  ) {
    this._iVaultNamePrefix = `[${testRunContext.testRunId}][${testRunContext.packageName}]`;
    if (testRunContext.testSuiteName)
      this._iVaultNamePrefix += `[${testRunContext.testSuiteName}]`;
  }

  public getPrefixedUniqueIVaultName(iVaultName: string): string {
    return `${this._iVaultNamePrefix} ${iVaultName}`;
  }

  public getFirstIVaultNameForOrderingTests(): string {
    return `${this.firstNamePrefix}${this._iVaultNamePrefix} Ordering tests`;
  }

  public getLastIVaultNameForOrderingTests(): string {
    return `${this.lastNamePrefix}${this._iVaultNamePrefix} Ordering tests`;
  }

  public async cleanupIVaults(): Promise<void> {
    const szewTwinId = await this._testSZEWTwinProvider.getOrCreate();
    const iVaults = this._iVaultsClient.iVaults.getMinimalList({
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      urlParams: {
        szewTwinId,
      },
    });
    for await (const iVault of iVaults)
      if (this.doesIVaultBelongToGroup(iVault.displayName))
        await this._iVaultsClient.iVaults.delete({
          authorization:
            this._testAuthorizationProvider.getAdmin1Authorization(),
          iVaultId: iVault.id,
        });
  }

  private doesIVaultBelongToGroup(iVaultName: string): boolean {
    return (
      iVaultName.startsWith(this._iVaultNamePrefix) ||
      iVaultName === this.getFirstIVaultNameForOrderingTests() ||
      iVaultName === this.getLastIVaultNameForOrderingTests()
    );
  }
}
