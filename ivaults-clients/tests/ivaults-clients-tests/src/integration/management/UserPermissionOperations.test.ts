/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  AuthorizationCallback,
  GetUserPermissionsParams,
  IVaultPermission,
  IVaultsClient,
  IVaultsClientOptions,
  UserPermissions,
} from "@szewtwin/ivaults-client-management";
import {
  ReusableIVaultMetadata,
  ReusableTestIVaultProvider,
  TestAuthorizationProvider,
  TestUtilTypes,
  assertUserPermissions,
} from "@szewtwin/ivaults-client-test-utils";

import { getTestDIContainer } from "../common";

describe("[Management] UserPermissionOperations", () => {
  let iVaultsClient: IVaultsClient;
  let authorization: AuthorizationCallback;

  let testIVaultForRead: ReusableIVaultMetadata;

  before(async () => {
    const container = getTestDIContainer();

    const iVaultsClientOptions = container.get<IVaultsClientOptions>(
      TestUtilTypes.IVaultsClientOptions
    );
    iVaultsClient = new IVaultsClient(iVaultsClientOptions);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    const reusableTestIVaultProvider = container.get(
      ReusableTestIVaultProvider
    );
    testIVaultForRead = await reusableTestIVaultProvider.getOrCreate();
  });

  it("should get user permissions", async () => {
    // Arrange
    const getUserPermissionsParams: GetUserPermissionsParams = {
      authorization,
      iVaultId: testIVaultForRead.id,
    };

    // Act
    const permissions: UserPermissions =
      await iVaultsClient.userPermissions.get(getUserPermissionsParams);

    // Assert
    assertUserPermissions({
      actualPermissions: permissions,
      expectedPermissions: [
        IVaultPermission.WebView,
        IVaultPermission.Read,
        IVaultPermission.Write,
        IVaultPermission.Manage,
      ],
    });
  });
});
