/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import {
  IVaultsClient,
  IVaultsErrorCode,
} from "@szewtwin/ivaults-client-management";
import { assertError } from "@szewtwin/ivaults-client-test-utils/lib/assertions/BrowserFriendlyAssertions";

describe(`[Management] ${IVaultsClient.name}`, () => {
  it("should return original error information in case of network issue", function (done) {
    // Arrange
    const iVaultsClient = new IVaultsClient({
      api: { baseUrl: "http://foo.bar" },
    });

    // Act
    iVaultsClient.iVaults
      .getSingle({
        authorization: () => Promise.resolve({ scheme: "", token: "" }),
        iVaultId: "foo",
      })
      .catch((err) => {
        // Assert
        assertError({
          objectThrown: err,
          expectedError: {
            code: IVaultsErrorCode.Unrecognized,
            message:
              "Unknown error occurred.\n" +
              "Original error message: Network Error,\n" +
              "original error code: ERR_NETWORK,\n" +
              "response status code: undefined,\n" +
              "response body: undefined",
            originalError: {
              code: "ERR_NETWORK",
              name: "Error",
              message: "Network Error",
            },
          },
        });

        done();
      });
  });
});
