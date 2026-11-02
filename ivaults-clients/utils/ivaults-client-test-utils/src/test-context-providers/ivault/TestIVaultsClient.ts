/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { decorate, inject, injectable } from "inversify";

import {
  IVaultsClient,
  IVaultsClientOptions,
} from "@szewtwin/ivaults-client-authoring";

import { TestUtilTypes } from "../../TestUtilTypes";

decorate(injectable(), IVaultsClient);

@injectable()
export class TestIVaultsClient extends IVaultsClient {
  constructor(
    @inject(TestUtilTypes.IVaultsClientOptions)
    options: IVaultsClientOptions
  ) {
    super(options);
  }
}
