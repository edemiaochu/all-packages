/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { injectable } from "inversify";

import {
  TestAuthorizationProvider,
  TestIVaultsClient,
  TestSZEWTwinProvider,
} from "../test-context-providers";

import { TestIVaultGroup } from "./TestIVaultGroup";

@injectable()
export class TestIVaultGroupFactory {
  constructor(
    private readonly _iVaultsClient: TestIVaultsClient,
    private readonly _testAuthorizationProvider: TestAuthorizationProvider,
    private readonly _testSZEWTwinProvider: TestSZEWTwinProvider
  ) {}

  public create(testRunContext: {
    testRunId: string;
    packageName: string;
    testSuiteName?: string;
  }): TestIVaultGroup {
    return new TestIVaultGroup(
      this._iVaultsClient,
      this._testAuthorizationProvider,
      this._testSZEWTwinProvider,
      testRunContext
    );
  }
}
