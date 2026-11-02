/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import {
  AuthorizationCallback,
  GetChangesetExtendedDataListParams,
  GetSingleChangesetExtendedDataParams,
  IVaultsClient,
  IVaultsClientOptions,
  IVaultsErrorCode,
  take,
} from "@szewtwin/ivaults-client-management";
import {
  ReusableIVaultMetadata,
  ReusableTestIVaultProvider,
  TestAuthorizationProvider,
  TestUtilTypes,
  assertChangesetExtendedData,
  assertCollection,
  assertError,
} from "@szewtwin/ivaults-client-test-utils";

import { getTestDIContainer } from "../common";

describe("[Management] ChangesetExtendedDataOperations", () => {
  let iVaultsClient: IVaultsClient;
  let authorization: AuthorizationCallback;
  let testIVault: ReusableIVaultMetadata;

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
    testIVault = await reusableTestIVaultProvider.getOrCreate();
  });

  it("should return all items when querying collection", async () => {
    // Arrange
    const getChangesetExtendedDataListParams: GetChangesetExtendedDataListParams =
      {
        authorization,
        iVaultId: testIVault.id,
      };
    // Act
    const changesetExtendedData = iVaultsClient.changesetExtendedData.getList(
      getChangesetExtendedDataListParams
    );

    // Assert
    await assertCollection({
      asyncIterable: changesetExtendedData,
      isEntityCountCorrect: (count) =>
        count > 0 && count === testIVault.changesetExtendedData.length,
    });
  });

  it("should get valid changeset extended data when querying collection", async () => {
    // Arrange
    const getChangesetExtendedDataListParams: GetChangesetExtendedDataListParams =
      {
        authorization,
        iVaultId: testIVault.id,
        urlParams: {
          $top: 1,
        },
      };
    // Act
    const changesetExtendedData = iVaultsClient.changesetExtendedData.getList(
      getChangesetExtendedDataListParams
    );

    // Assert
    const changesetExtendedDataList = await take(changesetExtendedData, 1);
    expect(changesetExtendedDataList.length).to.be.equal(1);
    const actualChangesetExtendedData = changesetExtendedDataList[0];
    const expectedChangesetExtendedData = testIVault.changesetExtendedData.find(
      (x) => x.changesetIndex === actualChangesetExtendedData.changesetIndex
    );
    expect(actualChangesetExtendedData).to.exist;
    assertChangesetExtendedData({
      actualChangesetExtendedData,
      expectedChangesetExtendedData: expectedChangesetExtendedData!,
    });
  });

  it("should get changeset extended data by changeset index", async () => {
    // Arrange
    const expectedChangesetExtendedData = testIVault.changesetExtendedData[0];
    const getSingleChangesetExtendedDataParams: GetSingleChangesetExtendedDataParams =
      {
        authorization,
        iVaultId: testIVault.id,
        changesetIndex: expectedChangesetExtendedData.changesetIndex,
      };

    // Act
    const changesetExtendedData =
      await iVaultsClient.changesetExtendedData.getSingle(
        getSingleChangesetExtendedDataParams
      );

    // Assert
    assertChangesetExtendedData({
      actualChangesetExtendedData: changesetExtendedData,
      expectedChangesetExtendedData,
    });
  });

  it("should return error when querying non-existent changeset extended data", async () => {
    // Arrange
    const notExistingChangesetExtendedData =
      testIVault.changesetExtendedData.length + 1;
    const getSingleChangesetExtendedDataParams: GetSingleChangesetExtendedDataParams =
      {
        authorization,
        iVaultId: testIVault.id,
        changesetIndex: notExistingChangesetExtendedData,
      };

    // Act
    let objectThrown: unknown;
    try {
      await iVaultsClient.changesetExtendedData.getSingle(
        getSingleChangesetExtendedDataParams
      );
    } catch (e) {
      objectThrown = e;
    }

    // Assert
    assertError({
      objectThrown,
      expectedError: {
        code: IVaultsErrorCode.ChangesetExtendedDataNotFound,
        message: "Requested Changeset Extended Data is not available.",
      },
    });
  });
});
