/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IVaultsErrorParser as ManagementIVaultsErrorParser } from "@szewtwin/ivaults-client-management";

import { testIVaultsErrorParser } from "../CommonErrorParsingTests";

describe("[Management] IVaultsErrorParser", () => {
  testIVaultsErrorParser((response, originalError) =>
    ManagementIVaultsErrorParser.parse(response, originalError)
  );
});
