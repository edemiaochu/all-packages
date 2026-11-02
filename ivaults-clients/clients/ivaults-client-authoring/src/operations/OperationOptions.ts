/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { OperationOptions as ManagementOperationOptions } from "@szewtwin/ivaults-client-management";

import { ClientStorage } from "@szewtwin/object-storage-core";

import { LocalFileSystem } from "../base/types";

import { IVaultsApiUrlFormatter } from "./IVaultsApiUrlFormatter";

export interface OperationOptions extends ManagementOperationOptions {
  urlFormatter: IVaultsApiUrlFormatter;
  localFileSystem: LocalFileSystem;
  cloudStorage: ClientStorage;
}
