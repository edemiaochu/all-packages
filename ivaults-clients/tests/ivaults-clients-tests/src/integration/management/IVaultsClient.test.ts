/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import {
  IVaultsClient,
  IVaultsErrorCode,
} from "@szewtwin/ivaults-client-management";
import { assertError } from "@szewtwin/ivaults-client-test-utils";

describe("[Management] IVaultsClient", () => {
  it("should return original error information in case of network issue", async () => {
    // Arrange
    const iVaultsClient = new IVaultsClient({
      api: { baseUrl: "http://foo.bar" },
    });

    // Act
    let objectThrown: unknown;
    try {
      await iVaultsClient.iVaults.getSingle({
        authorization: async () => Promise.resolve({ scheme: "", token: "" }),
        iVaultId: "foo",
      });
    } catch (error: unknown) {
      objectThrown = error;
    }

    // Assert
    assertError({
      objectThrown,
      expectedError: {
        code: IVaultsErrorCode.Unrecognized,
        message:
          "Unknown error occurred.\n" +
          "Original error message: getaddrinfo ENOTFOUND foo.bar,\n" +
          "original error code: ENOTFOUND,\n" +
          "response status code: undefined,\n" +
          "response body: undefined",
        originalError: {
          code: "ENOTFOUND",
          name: "Error",
          message: "getaddrinfo ENOTFOUND foo.bar",
        },
      },
    });
  });
});
