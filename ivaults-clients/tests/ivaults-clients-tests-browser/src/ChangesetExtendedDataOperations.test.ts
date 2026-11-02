/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  ApiOptions,
  Authorization,
  AuthorizationCallback,
  ChangesetExtendedData,
  ChangesetExtendedDataOperations,
  GetChangesetExtendedDataListParams,
  GetSingleChangesetExtendedDataParams,
  IVaultsClient,
} from "@szewtwin/ivaults-client-management";
import {
  assertChangesetExtendedDataBrowser,
  assertCollection,
} from "@szewtwin/ivaults-client-test-utils/lib/assertions/BrowserFriendlyAssertions";

import { FrontendTestEnvVariableKeys } from "./setup/FrontendTestEnvVariableKeys";

describe(`[Management] ${ChangesetExtendedDataOperations.name}`, () => {
  let iVaultsClient: IVaultsClient;
  let authorization: AuthorizationCallback;

  let testIVaultForReadId: string;

  before(() => {
    const iVaultsClientApiOptions: ApiOptions = JSON.parse(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      Cypress.env(FrontendTestEnvVariableKeys.iVaultsClientApiOptions)
    );
    iVaultsClient = new IVaultsClient({ api: iVaultsClientApiOptions });

    const admin1AuthorizationInfo: Authorization = JSON.parse(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      Cypress.env(FrontendTestEnvVariableKeys.admin1AuthorizationInfo)
    );
    authorization = () => Promise.resolve(admin1AuthorizationInfo);

    testIVaultForReadId = Cypress.env(
      FrontendTestEnvVariableKeys.testIVaultForReadId
    );
  });

  it("should get changeset extended data by changeset index", async () => {
    // Arrange
    const expectedChangesetExtendedData = {
      changesetIndex: 1,
      data: { someKey: "someValue" },
    };

    const getSingleChangesetExtendedDataParams: GetSingleChangesetExtendedDataParams =
      {
        authorization,
        iVaultId: testIVaultForReadId,
        changesetIndex: 1,
      };

    // Act
    const changesetExtendedData: ChangesetExtendedData =
      await iVaultsClient.changesetExtendedData.getSingle(
        getSingleChangesetExtendedDataParams
      );

    // Assert
    assertChangesetExtendedDataBrowser({
      actualChangesetExtendedData: changesetExtendedData,
      expectedChangesetExtendedData,
    });
  });

  it("should be able to get changeset extended data list", async () => {
    // Arrange
    const getChangesetExtendedDataListParams: GetChangesetExtendedDataListParams =
      {
        authorization,
        iVaultId: testIVaultForReadId,
      };
    // Act
    const changesetExtendedData = iVaultsClient.changesetExtendedData.getList(
      getChangesetExtendedDataListParams
    );
    expect(changesetExtendedData).to.not.be.undefined;

    // Assert
    await assertCollection({
      asyncIterable: changesetExtendedData,
      isEntityCountCorrect: (count) => count > 0,
    });
  });
});
