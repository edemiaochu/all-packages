/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import {
  AuthorizationCallback,
  Changeset,
  ChangesetOrderByProperty,
  EntityListIterator,
  GetChangesetListParams,
  GetSingleChangesetParams,
  IVaultsClient,
  IVaultsClientOptions,
  MinimalChangeset,
  OrderByOperator,
  toArray,
} from "@szewtwin/ivaults-client-management";
import {
  ReusableIVaultMetadata,
  ReusableTestIVaultProvider,
  TestAuthorizationProvider,
  TestIVaultFileProvider,
  TestUtilTypes,
  assertChangeset,
  assertCollection,
  assertMinimalChangeset,
} from "@szewtwin/ivaults-client-test-utils";

import { getTestDIContainer } from "../common";

describe("[Management] ChangesetOperations", () => {
  let iVaultsClient: IVaultsClient;
  let authorization: AuthorizationCallback;
  let testIVault: ReusableIVaultMetadata;
  let testIVaultFileProvider: TestIVaultFileProvider;

  before(async () => {
    const container = getTestDIContainer();

    const iVaultsClientOptions = container.get<IVaultsClientOptions>(
      TestUtilTypes.IVaultsClientOptions
    );
    iVaultsClient = new IVaultsClient(iVaultsClientOptions);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    testIVaultFileProvider = container.get(TestIVaultFileProvider);

    const reusableTestIVaultProvider = container.get(
      ReusableTestIVaultProvider
    );
    testIVault = await reusableTestIVaultProvider.getOrCreate();
  });

  [
    {
      label: "minimal",
      functionUnderTest: (params: GetChangesetListParams) =>
        iVaultsClient.changesets.getMinimalList(params),
    },
    {
      label: "representation",
      functionUnderTest: (params: GetChangesetListParams) =>
        iVaultsClient.changesets.getRepresentationList(params),
    },
  ].forEach((testCase) => {
    it(`should return all items when querying ${testCase.label} collection`, async () => {
      // Arrange
      const getChangesetListParams: GetChangesetListParams = {
        authorization,
        iVaultId: testIVault.id,
        urlParams: {
          $top: 5,
        },
      };

      // Act
      const changesets = testCase.functionUnderTest(getChangesetListParams);

      // Assert
      await assertCollection({
        asyncIterable: changesets,
        isEntityCountCorrect: (count) =>
          count === testIVaultFileProvider.changesets.length,
      });
    });

    it(`should return items in ascending order when querying ${testCase.label} collection`, async () => {
      // Arrange
      const getChangesetListParams: GetChangesetListParams = {
        authorization,
        iVaultId: testIVault.id,
        urlParams: {
          $orderBy: {
            property: ChangesetOrderByProperty.Index,
          },
        },
      };

      // Act
      const changesets = testCase.functionUnderTest(getChangesetListParams);

      // Assert
      const changesetIndexes = (await toArray(changesets)).map(
        (changeset) => changeset.index
      );
      for (let i = 0; i < changesetIndexes.length - 1; i++)
        expect(changesetIndexes[i]).to.be.lessThan(changesetIndexes[i + 1]);
    });

    it(`should return items in descending order when querying ${testCase.label} collection`, async () => {
      // Arrange
      const getChangesetListParams: GetChangesetListParams = {
        authorization,
        iVaultId: testIVault.id,
        urlParams: {
          $orderBy: {
            property: ChangesetOrderByProperty.Index,
            operator: OrderByOperator.Descending,
          },
        },
      };

      // Act
      const changesets = testCase.functionUnderTest(getChangesetListParams);

      // Assert
      const changesetIndexes = (await toArray(changesets)).map(
        (changeset) => changeset.index
      );
      for (let i = 0; i < changesetIndexes.length - 1; i++)
        expect(changesetIndexes[i]).to.be.greaterThan(changesetIndexes[i + 1]);
    });

    it(`should return items that belong to specified range when querying ${testCase.label} collection`, async () => {
      // Arrange
      const getChangesetListParams: GetChangesetListParams = {
        authorization,
        iVaultId: testIVault.id,
        urlParams: {
          afterIndex: 5,
          lastIndex: 10,
        },
      };

      // Act
      const changesets = testCase.functionUnderTest(getChangesetListParams);

      // Assert
      await assertCollection({
        asyncIterable: changesets,
        isEntityCountCorrect: (count) =>
          count ===
          getChangesetListParams.urlParams!.lastIndex! -
            getChangesetListParams.urlParams!.afterIndex!,
      });
    });

    it(`should allow to combine url parameters when querying ${testCase.label} collection`, async () => {
      // Arrange
      const getChangesetListParams: GetChangesetListParams = {
        authorization,
        iVaultId: testIVault.id,
        urlParams: {
          afterIndex: 5,
          lastIndex: 10,
          $orderBy: {
            property: ChangesetOrderByProperty.Index,
            operator: OrderByOperator.Descending,
          },
        },
      };

      // Act
      const changesets = testCase.functionUnderTest(getChangesetListParams);

      // Assert
      const changesetIndexes = (await toArray(changesets)).map(
        (changeset) => changeset.index
      );
      expect(changesetIndexes).to.deep.equal([10, 9, 8, 7, 6]);
    });
  });

  it("should get valid minimal changeset when querying minimal collection", async () => {
    // Arrange
    const getChangesetListParams: GetChangesetListParams = {
      authorization,
      iVaultId: testIVault.id,
      urlParams: {
        afterIndex: 0,
        lastIndex: 1,
        $orderBy: {
          property: ChangesetOrderByProperty.Index,
          operator: OrderByOperator.Descending,
        },
      },
    };

    // Act
    const minimalChangesets: EntityListIterator<MinimalChangeset> =
      iVaultsClient.changesets.getMinimalList(getChangesetListParams);

    // Assert
    const minimalChangesetList = await toArray(minimalChangesets);
    expect(minimalChangesetList.length).to.be.equal(1);
    const minimalChangeset = minimalChangesetList[0];
    const testChangesetFile =
      testIVaultFileProvider.changesets[minimalChangeset.index - 1];
    const groupId = testIVault.changesetGroups.find((csGroup) =>
      csGroup.changesetIndexes.includes(minimalChangeset.index)
    )?.id;
    await assertMinimalChangeset({
      actualChangeset: minimalChangeset,
      expectedChangesetProperties: {
        id: testChangesetFile.id,
        briefcaseId: testIVault.briefcases[0].id,
        parentId: testChangesetFile.parentId,
        description: testChangesetFile.description,
        containingChanges: testChangesetFile.containingChanges,
        groupId,
      },
      expectedTestChangesetFile: testChangesetFile,
    });
  });

  it("should get valid full changeset when querying representation collection", async () => {
    // Arrange
    const firstNamedVersion = testIVault.namedVersions[0];
    const getChangesetListParams: GetChangesetListParams = {
      authorization,
      iVaultId: testIVault.id,
      urlParams: {
        afterIndex: firstNamedVersion.changesetIndex - 1,
        lastIndex: firstNamedVersion.changesetIndex,
      },
    };

    // Act
    const changesets: EntityListIterator<Changeset> =
      iVaultsClient.changesets.getRepresentationList(getChangesetListParams);

    // Assert
    const changesetList: Changeset[] = await toArray(changesets);
    expect(changesetList.length).to.be.equal(1);
    const changeset = changesetList[0];
    const testChangesetFile =
      testIVaultFileProvider.changesets[changeset.index - 1];
    const groupId = testIVault.changesetGroups.find((csGroup) =>
      csGroup.changesetIndexes.includes(changeset.index)
    )?.id;
    await assertChangeset({
      actualChangeset: changeset,
      expectedChangesetProperties: {
        id: testChangesetFile.id,
        briefcaseId: testIVault.briefcases[0].id,
        parentId: testChangesetFile.parentId,
        description: testChangesetFile.description,
        containingChanges: testChangesetFile.containingChanges,
        synchronizationInfo: testChangesetFile.synchronizationInfo,
        groupId,
      },
      expectedTestChangesetFile: testChangesetFile,
      expectedLinks: {
        namedVersion: true,
        checkpoint: true,
      },
      isGetResponse: true,
    });
  });

  it("should get changeset by id", async () => {
    // Arrange
    const firstNamedVersion = testIVault.namedVersions[0];
    const changesetWithNamedVersionIndex = firstNamedVersion.changesetIndex;
    const testChangesetFile =
      testIVaultFileProvider.changesets[changesetWithNamedVersionIndex - 1];
    const groupId = testIVault.changesetGroups.find((csGroup) =>
      csGroup.changesetIndexes.includes(changesetWithNamedVersionIndex)
    )?.id;
    const getSingleChangesetParams: GetSingleChangesetParams = {
      authorization,
      iVaultId: testIVault.id,
      changesetId: testChangesetFile.id,
    };

    // Act
    const changeset: Changeset = await iVaultsClient.changesets.getSingle(
      getSingleChangesetParams
    );

    // Assert
    await assertChangeset({
      actualChangeset: changeset,
      expectedChangesetProperties: {
        id: testChangesetFile.id,
        briefcaseId: testIVault.briefcases[0].id,
        parentId: testChangesetFile.parentId,
        description: testChangesetFile.description,
        containingChanges: testChangesetFile.containingChanges,
        synchronizationInfo: testChangesetFile.synchronizationInfo,
        groupId,
      },
      expectedTestChangesetFile: testChangesetFile,
      expectedLinks: {
        namedVersion: true,
        checkpoint: true,
      },
      isGetResponse: true,
    });
  });

  it("should get changeset that belongs to a changeset group by id", async () => {
    // Arrange
    const firstChangesetGroup = testIVault.changesetGroups[0];
    const changesetWithGroupIndex = firstChangesetGroup.changesetIndexes[0];
    const testChangesetFile =
      testIVaultFileProvider.changesets[changesetWithGroupIndex - 1];
    const changesetHasNamedVersion = !!testIVault.namedVersions.find(
      (version) => version.changesetIndex === changesetWithGroupIndex
    );
    const getSingleChangesetParams: GetSingleChangesetParams = {
      authorization,
      iVaultId: testIVault.id,
      changesetId: testChangesetFile.id,
    };

    // Act
    const changeset: Changeset = await iVaultsClient.changesets.getSingle(
      getSingleChangesetParams
    );

    // Assert
    await assertChangeset({
      actualChangeset: changeset,
      expectedChangesetProperties: {
        id: testChangesetFile.id,
        briefcaseId: testIVault.briefcases[0].id,
        parentId: testChangesetFile.parentId,
        description: testChangesetFile.description,
        containingChanges: testChangesetFile.containingChanges,
        synchronizationInfo: testChangesetFile.synchronizationInfo,
        groupId: firstChangesetGroup.id,
      },
      expectedTestChangesetFile: testChangesetFile,
      expectedLinks: {
        namedVersion: changesetHasNamedVersion,
        checkpoint: true,
      },
      isGetResponse: true,
    });
  });
});
