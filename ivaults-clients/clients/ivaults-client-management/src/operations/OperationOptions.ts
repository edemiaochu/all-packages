/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { OperationsBaseOptions } from "../base/internal";

import { IVaultsApiUrlFormatter } from "./IVaultsApiUrlFormatter";

export interface OperationOptions extends OperationsBaseOptions {
  urlFormatter: IVaultsApiUrlFormatter;
}
