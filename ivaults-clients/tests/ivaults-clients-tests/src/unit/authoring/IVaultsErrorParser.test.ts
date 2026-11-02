/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IVaultsErrorParser as AuthoringIVaultsErrorParser } from "@szewtwin/ivaults-client-authoring";

import { testIVaultsErrorParser } from "../CommonErrorParsingTests";

describe("[Authoring] IVaultsErrorParser", () => {
  testIVaultsErrorParser((response, originalError) =>
    AuthoringIVaultsErrorParser.parse(response, originalError)
  );
});
