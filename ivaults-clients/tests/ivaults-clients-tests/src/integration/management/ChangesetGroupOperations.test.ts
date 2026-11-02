/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import {
  AuthorizationCallback,
  GetChangesetGroupListParams,
  GetSingleChangesetGroupParams,
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
  assertChangesetGroup,
  assertCollection,
  assertError,
} from "@szewtwin/ivaults-client-test-utils";

import { getTestDIContainer } from "../common";

describe("[Management] ChangesetGroupOperations", () => {
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
    const getChangesetGroupListParams: GetChangesetGroupListParams = {
      authorization,
      iVaultId: testIVault.id,
    };

    // Act
    const changesetGroups = iVaultsClient.changesetGroups.getList(
      getChangesetGroupListParams
    );

    // Assert
    await assertCollection({
      asyncIterable: changesetGroups,
      isEntityCountCorrect: (count) =>
        count > 0 && count === testIVault.changesetGroups.length,
    });
  });

  it("should get valid changeset group when querying collection", async () => {
    // Arrange
    const getChangesetGroupListParams: GetChangesetGroupListParams = {
      authorization,
      iVaultId: testIVault.id,
      urlParams: {
        $top: 1,
      },
    };

    // Act
    const changesetGroups = iVaultsClient.changesetGroups.getList(
      getChangesetGroupListParams
    );

    // Assert
    const changesetGroupList = await take(changesetGroups, 1);
    expect(changesetGroupList.length).to.be.equal(1);
    const actualChangesetGroup = changesetGroupList[0];
    const expectedChangesetGroup = testIVault.changesetGroups.find(
      (x) => x.id === actualChangesetGroup.id
    );
    expect(expectedChangesetGroup).to.exist;
    await assertChangesetGroup({
      actualChangesetGroup,
      expectedChangesetGroupProperties: expectedChangesetGroup!,
    });
  });

  it("should get changeset group by id", async () => {
    // Arrange
    const expectedChangesetGroup = testIVault.changesetGroups[0];
    const expectedChangesetGroupProperties = {
      description: expectedChangesetGroup.description,
    };
    const getSingleChangesetGroupParams: GetSingleChangesetGroupParams = {
      authorization,
      iVaultId: testIVault.id,
      changesetGroupId: expectedChangesetGroup.id,
    };

    // Act
    const changesetGroup = await iVaultsClient.changesetGroups.getSingle(
      getSingleChangesetGroupParams
    );

    // Assert
    await assertChangesetGroup({
      actualChangesetGroup: changesetGroup,
      expectedChangesetGroupProperties,
    });
  });

  it("should return error when querying non-existent changeset group", async () => {
    // Arrange
    const getSingleChangesetGroupParams: GetSingleChangesetGroupParams = {
      authorization,
      iVaultId: testIVault.id,
      changesetGroupId: "invalid group id",
    };

    // Act
    let objectThrown: unknown;
    try {
      await iVaultsClient.changesetGroups.getSingle(
        getSingleChangesetGroupParams
      );
    } catch (e) {
      objectThrown = e;
    }

    // Assert
    assertError({
      objectThrown,
      expectedError: {
        code: IVaultsErrorCode.ChangesetGroupNotFound,
        message: "Requested Changeset Group is not available.",
      },
    });
  });
});
