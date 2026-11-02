/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import {
  AuthorizationCallback,
  CreateNamedVersionParams,
  EntityListIterator,
  GetNamedVersionListParams,
  GetSingleNamedVersionParams,
  IVaultScopedOperationParams,
  IVaultsClient,
  IVaultsClientOptions,
  MinimalNamedVersion,
  NamedVersion,
  NamedVersionOrderByProperty,
  NamedVersionState,
  OrderByOperator,
  UpdateNamedVersionParams,
  take,
  toArray,
} from "@szewtwin/ivaults-client-management";
import {
  IVaultMetadata,
  TestAuthorizationProvider,
  TestIVaultCreator,
  TestIVaultFileProvider,
  TestIVaultGroup,
  TestIVaultGroupFactory,
  TestSetupError,
  TestUtilTypes,
  assertCollection,
  assertMinimalNamedVersion,
  assertNamedVersion,
} from "@szewtwin/ivaults-client-test-utils";

import { Constants, getTestDIContainer, getTestRunId } from "../common";

describe("[Management] NamedVersionOperations", () => {
  let iVaultsClient: IVaultsClient;
  let authorization: AuthorizationCallback;
  let testIVaultGroup: TestIVaultGroup;
  let testIVault: IVaultMetadata;
  let testIVaultFileProvider: TestIVaultFileProvider;

  // We create several named versions in setup to have some entities for collection
  // query tests and persist them to use in entity update tests.
  const namedVersionCountCreatedInSetup = 3;
  const namedVersionsCreatedInSetup: NamedVersion[] = [];
  let updatedNamedVersions = 0;

  before(async () => {
    const container = getTestDIContainer();

    const iVaultsClientOptions = container.get<IVaultsClientOptions>(
      TestUtilTypes.IVaultsClientOptions
    );
    iVaultsClient = new IVaultsClient(iVaultsClientOptions);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    testIVaultFileProvider = container.get(TestIVaultFileProvider);

    const testIVaultGroupFactory = container.get(TestIVaultGroupFactory);
    testIVaultGroup = testIVaultGroupFactory.create({
      testRunId: getTestRunId(),
      packageName: Constants.PackagePrefix,
      testSuiteName: "ManagementNamedVersionOperations",
    });

    const testIVaultCreator = container.get(TestIVaultCreator);
    testIVault = await testIVaultCreator.createEmptyAndUploadChangesets(
      testIVaultGroup.getPrefixedUniqueIVaultName("Test iVault for write")
    );

    for (let i = 0; i < namedVersionCountCreatedInSetup; i++) {
      const changesetIndex = await getChangesetIndexForNewNamedVersion({
        authorization,
        iVaultId: testIVault.id,
      });
      namedVersionsCreatedInSetup.push(
        await iVaultsClient.namedVersions.create({
          authorization,
          iVaultId: testIVault.id,
          namedVersionProperties: {
            name: `Milestone ${changesetIndex}`,
            description: `Description for milestone ${changesetIndex}`,
            changesetId:
              testIVaultFileProvider.changesets[changesetIndex - 1].id,
          },
        })
      );
    }

    const hiddenNamedVersion = namedVersionsCreatedInSetup[1];
    await iVaultsClient.namedVersions.update({
      authorization,
      iVaultId: testIVault.id,
      namedVersionId: hiddenNamedVersion.id,
      namedVersionProperties: {
        state: NamedVersionState.Hidden,
      },
    });
  });

  after(async () => {
    await testIVaultGroup.cleanupIVaults();
  });

  [
    {
      label: "minimal",
      functionUnderTest: (params: GetNamedVersionListParams) =>
        iVaultsClient.namedVersions.getMinimalList(params),
    },
    {
      label: "representation",
      functionUnderTest: (params: GetNamedVersionListParams) =>
        iVaultsClient.namedVersions.getRepresentationList(params),
    },
  ].forEach((testCase) => {
    it(`should return all items when querying ${testCase.label} collection`, async () => {
      // Arrange
      const getNamedVersionListParams: GetNamedVersionListParams = {
        authorization,
        iVaultId: testIVault.id,
        urlParams: {
          $top: 2,
        },
      };

      // Act
      const namedVersions = testCase.functionUnderTest(
        getNamedVersionListParams
      );

      // Assert
      await assertCollection({
        asyncIterable: namedVersions,
        isEntityCountCorrect: (count) =>
          count >= namedVersionCountCreatedInSetup,
      });
    });
  });

  it("should order items by changeset index when querying minimal collection (ascending order)", async () => {
    // Arrange
    const getNamedVersionListParams: GetNamedVersionListParams = {
      authorization,
      iVaultId: testIVault.id,
      urlParams: {
        $orderBy: {
          property: NamedVersionOrderByProperty.ChangesetIndex,
        },
      },
    };

    // Act
    const namedVersions: EntityListIterator<MinimalNamedVersion> =
      iVaultsClient.namedVersions.getMinimalList(getNamedVersionListParams);

    // Assert
    const namedVersionChangesetIndexes = (await toArray(namedVersions)).map(
      (namedVersion) => namedVersion.changesetIndex
    );
    for (let i = 0; i < namedVersionChangesetIndexes.length - 1; i++)
      expect(namedVersionChangesetIndexes[i]).to.be.lessThan(
        namedVersionChangesetIndexes[i + 1]
      );
  });

  it("should order items by changeset index when querying minimal collection (descending order)", async () => {
    // Arrange
    const getNamedVersionListParams: GetNamedVersionListParams = {
      authorization,
      iVaultId: testIVault.id,
      urlParams: {
        $orderBy: {
          property: NamedVersionOrderByProperty.ChangesetIndex,
          operator: OrderByOperator.Descending,
        },
      },
    };

    // Act
    const namedVersions: EntityListIterator<MinimalNamedVersion> =
      iVaultsClient.namedVersions.getMinimalList(getNamedVersionListParams);

    // Assert
    const namedVersionChangesetIndexes = (await toArray(namedVersions)).map(
      (namedVersion) => namedVersion.changesetIndex
    );
    for (let i = 0; i < namedVersionChangesetIndexes.length - 1; i++)
      expect(namedVersionChangesetIndexes[i]).to.be.greaterThan(
        namedVersionChangesetIndexes[i + 1]
      );
  });

  it("should order items by createdDateTime when querying representation collection (ascending order)", async () => {
    // Arrange
    const getNamedVersionListParams: GetNamedVersionListParams = {
      authorization,
      iVaultId: testIVault.id,
      urlParams: {
        $orderBy: {
          property: NamedVersionOrderByProperty.CreatedDateTime,
        },
      },
    };

    // Act
    const namedVersions = await toArray(
      iVaultsClient.namedVersions.getRepresentationList(
        getNamedVersionListParams
      )
    );

    // Assert
    expect(namedVersions.length).to.equal(namedVersionsCreatedInSetup.length);
    for (let i = 0; i < namedVersions.length - 1; i++)
      expect(new Date(namedVersions[i].createdDateTime)).to.be.lessThan(
        new Date(namedVersions[i + 1].createdDateTime)
      );
  });

  it("should order items by createdDateTime when querying representation collection (descending order)", async () => {
    // Arrange
    const getNamedVersionListParams: GetNamedVersionListParams = {
      authorization,
      iVaultId: testIVault.id,
      urlParams: {
        $orderBy: {
          property: NamedVersionOrderByProperty.CreatedDateTime,
          operator: OrderByOperator.Descending,
        },
      },
    };

    // Act
    const namedVersions = await toArray(
      iVaultsClient.namedVersions.getRepresentationList(
        getNamedVersionListParams
      )
    );

    // Assert
    expect(namedVersions.length).to.equal(namedVersionsCreatedInSetup.length);
    for (let i = 0; i < namedVersions.length - 1; i++)
      expect(new Date(namedVersions[i].createdDateTime)).to.be.greaterThan(
        new Date(namedVersions[i + 1].createdDateTime)
      );
  });

  it("should return versions that match the name filter when querying representation collection", async () => {
    // Arrange
    const existingNamedVersion = namedVersionsCreatedInSetup[0];
    const getNamedVersionListParams: GetNamedVersionListParams = {
      authorization,
      iVaultId: testIVault.id,
      urlParams: {
        name: existingNamedVersion.name,
      },
    };

    // Act
    const namedVersions = iVaultsClient.namedVersions.getRepresentationList(
      getNamedVersionListParams
    );

    // Assert
    const namedVersionArray = await toArray(namedVersions);
    expect(namedVersionArray.length).to.equal(1);
    const namedVersion = namedVersionArray[0];
    expect(namedVersion.id).to.equal(existingNamedVersion.id);
    expect(namedVersion.name).to.equal(existingNamedVersion.name);
  });

  it("should not return versions if none match the name filter when querying representation collection", async () => {
    // Arrange
    const getNamedVersionListParams: GetNamedVersionListParams = {
      authorization,
      iVaultId: testIVault.id,
      urlParams: {
        name: "Non existent name",
      },
    };

    // Act
    const namedVersions = iVaultsClient.namedVersions.getRepresentationList(
      getNamedVersionListParams
    );

    // Assert
    const namedVersionArray = await toArray(namedVersions);
    expect(namedVersionArray.length).to.equal(0);
  });

  [NamedVersionState.Hidden, NamedVersionState.Visible].forEach((state) => {
    it(`should return versions that match the state filter (${state}) when querying representation collection`, async () => {
      // Arrange
      const getNamedVersionListParams: GetNamedVersionListParams = {
        authorization,
        iVaultId: testIVault.id,
        urlParams: {
          state,
        },
      };

      // Act
      const namedVersions = iVaultsClient.namedVersions.getRepresentationList(
        getNamedVersionListParams
      );

      // Assert
      const namedVersionArray = await toArray(namedVersions);
      expect(namedVersionArray.length).to.be.greaterThan(0);
      for (const namedVersion of namedVersionArray) {
        expect(namedVersion.state).to.be.equal(state);
      }
    });
  });

  it("should return versions that match the search filter when querying representation collection", async () => {
    // Arrange
    const expectedNamedVersions = namedVersionsCreatedInSetup.filter(
      (version) => version.changesetIndex === 1
    );
    expect(expectedNamedVersions.length).to.equal(1);

    const getNamedVersionListParams: GetNamedVersionListParams = {
      authorization,
      iVaultId: testIVault.id,
      urlParams: {
        $search: "Stone 1",
      },
    };

    // Act
    const namedVersions = iVaultsClient.namedVersions.getRepresentationList(
      getNamedVersionListParams
    );

    // Assert
    const namedVersionArray = await toArray(namedVersions);
    expect(namedVersionArray.length).to.equal(1);
    expect(namedVersionArray[0].id).to.equal(expectedNamedVersions[0].id);
  });

  it("should not return versions if none match the search filter when querying representation collection", async () => {
    // Arrange
    const getNamedVersionListParams: GetNamedVersionListParams = {
      authorization,
      iVaultId: testIVault.id,
      urlParams: {
        $search: "Non existent",
      },
    };

    // Act
    const namedVersions = iVaultsClient.namedVersions.getRepresentationList(
      getNamedVersionListParams
    );

    // Assert
    const namedVersionArray = await toArray(namedVersions);
    expect(namedVersionArray.length).to.equal(0);
  });

  it("should get valid minimal named version when querying minimal collection", async () => {
    // Arrange
    const getNamedVersionListParams: GetNamedVersionListParams = {
      authorization,
      iVaultId: testIVault.id,
      urlParams: {
        $top: 1,
        $orderBy: {
          property: NamedVersionOrderByProperty.ChangesetIndex,
          operator: OrderByOperator.Ascending,
        },
      },
    };

    // Act
    const minimalNamedVersions = iVaultsClient.namedVersions.getMinimalList(
      getNamedVersionListParams
    );

    // Assert
    const minimalNamedVersionList = await take(minimalNamedVersions, 1);
    expect(minimalNamedVersionList.length).to.be.equal(1);
    const minimalNamedVersion = minimalNamedVersionList[0];
    const existingFirstNamedVersion = namedVersionsCreatedInSetup[0];
    assertMinimalNamedVersion({
      actualNamedVersion: minimalNamedVersion,
      expectedNamedVersionProperties: {
        changesetId: existingFirstNamedVersion.changesetId!,
        changesetIndex: existingFirstNamedVersion.changesetIndex,
      },
    });
  });

  it("should get valid full named version when querying representation collection", async () => {
    // Arrange
    const getNamedVersionListParams: GetNamedVersionListParams = {
      authorization,
      iVaultId: testIVault.id,
      urlParams: {
        $top: 1,
        $orderBy: {
          property: NamedVersionOrderByProperty.ChangesetIndex,
          operator: OrderByOperator.Ascending,
        },
      },
    };

    // Act
    const namedVersions: EntityListIterator<NamedVersion> =
      iVaultsClient.namedVersions.getRepresentationList(
        getNamedVersionListParams
      );

    // Assert
    const namedVersionList: NamedVersion[] = await take(namedVersions, 1);
    expect(namedVersionList.length).to.be.equal(1);
    const namedVersion = namedVersionList[0];
    const existingFirstNamedVersion = namedVersionsCreatedInSetup[0];
    await assertNamedVersion({
      actualNamedVersion: namedVersion,
      expectedNamedVersionProperties: {
        name: existingFirstNamedVersion.name,
        description: existingFirstNamedVersion.description!,
        changesetId: existingFirstNamedVersion.changesetId!,
        changesetIndex: existingFirstNamedVersion.changesetIndex,
      },
      expectedLinks: {
        changeset: true,
      },
    });
  });

  it("should get named version by id", async () => {
    // Arrange
    const existingNamedVersion = namedVersionsCreatedInSetup[0];
    const getSingleNamedVersionParams: GetSingleNamedVersionParams = {
      authorization,
      iVaultId: testIVault.id,
      namedVersionId: existingNamedVersion.id,
    };

    // Act
    const namedVersion: NamedVersion =
      await iVaultsClient.namedVersions.getSingle(getSingleNamedVersionParams);

    // Assert
    await assertNamedVersion({
      actualNamedVersion: namedVersion,
      expectedNamedVersionProperties: {
        name: existingNamedVersion.name,
        description: existingNamedVersion.description!,
        changesetId: existingNamedVersion.changesetId!,
        changesetIndex: existingNamedVersion.changesetIndex,
      },
      expectedLinks: {
        changeset: true,
      },
    });
  });

  it("should create named version on baseline", async () => {
    // Arrange
    const createNamedVersionParams: CreateNamedVersionParams = {
      authorization,
      iVaultId: testIVault.id,
      namedVersionProperties: {
        name: "Named Version on baseline",
        description: "Some description for Named Version on baseline",
      },
    };

    // Act
    const namedVersion = await iVaultsClient.namedVersions.create(
      createNamedVersionParams
    );

    // Assert
    await assertNamedVersion({
      actualNamedVersion: namedVersion,
      expectedNamedVersionProperties: {
        ...createNamedVersionParams.namedVersionProperties,
        changesetIndex: 0,
      },
      expectedLinks: {
        changeset: false,
      },
    });
  });

  it("should create named version on a specific changeset", async () => {
    // Arrange
    const changesetIndex = await getChangesetIndexForNewNamedVersion({
      authorization,
      iVaultId: testIVault.id,
    });
    const createNamedVersionParams: CreateNamedVersionParams = {
      authorization,
      iVaultId: testIVault.id,
      namedVersionProperties: {
        name: `Named Version ${changesetIndex}`,
        description: `Some description for Named Version ${changesetIndex}`,
        changesetId: testIVaultFileProvider.changesets[changesetIndex - 1].id,
      },
    };

    // Act
    const namedVersion = await iVaultsClient.namedVersions.create(
      createNamedVersionParams
    );

    // Assert
    await assertNamedVersion({
      actualNamedVersion: namedVersion,
      expectedNamedVersionProperties: {
        ...createNamedVersionParams.namedVersionProperties,
        changesetIndex,
      },
      expectedLinks: {
        changeset: true,
      },
    });
  });

  it("should update named version name", async () => {
    // Arrange
    const namedVersionToUpdate =
      namedVersionsCreatedInSetup[updatedNamedVersions++];
    const newNamedVersionName = "Some other name";
    const updateNamedVersionParams: UpdateNamedVersionParams = {
      authorization,
      iVaultId: testIVault.id,
      namedVersionId: namedVersionToUpdate.id,
      namedVersionProperties: {
        name: newNamedVersionName,
      },
    };

    // Act
    const updatedNamedVersion = await iVaultsClient.namedVersions.update(
      updateNamedVersionParams
    );

    // Assert
    expect(updatedNamedVersion.name).to.equal(newNamedVersionName);
    expect(updatedNamedVersion.description).to.equal(
      namedVersionToUpdate.description
    );
    expect(updatedNamedVersion.state).to.equal(namedVersionToUpdate.state);
  });

  it("should update named version description", async () => {
    // Arrange
    const namedVersionToUpdate =
      namedVersionsCreatedInSetup[updatedNamedVersions++];
    const newNamedVersionDescription = "Some other description";
    const updateNamedVersionParams: UpdateNamedVersionParams = {
      authorization,
      iVaultId: testIVault.id,
      namedVersionId: namedVersionToUpdate.id,
      namedVersionProperties: {
        description: newNamedVersionDescription,
      },
    };

    // Act
    const updatedNamedVersion = await iVaultsClient.namedVersions.update(
      updateNamedVersionParams
    );

    // Assert
    expect(updatedNamedVersion.name).to.equal(namedVersionToUpdate.name);
    expect(updatedNamedVersion.description).to.equal(
      newNamedVersionDescription
    );
    expect(updatedNamedVersion.state).to.equal(namedVersionToUpdate.state);
  });

  it("should update named version state", async () => {
    // Arrange
    const namedVersionToUpdate =
      namedVersionsCreatedInSetup[updatedNamedVersions++];
    expect(namedVersionToUpdate.state).to.be.equal(NamedVersionState.Visible);

    const newNamedVersionState = NamedVersionState.Hidden;
    const updateNamedVersionParams: UpdateNamedVersionParams = {
      authorization,
      iVaultId: testIVault.id,
      namedVersionId: namedVersionToUpdate.id,
      namedVersionProperties: {
        state: newNamedVersionState,
      },
    };

    // Act
    const updatedNamedVersion = await iVaultsClient.namedVersions.update(
      updateNamedVersionParams
    );

    // Assert
    expect(updatedNamedVersion.name).to.equal(namedVersionToUpdate.name);
    expect(updatedNamedVersion.description).to.equal(
      namedVersionToUpdate.description
    );
    expect(updatedNamedVersion.state).to.equal(newNamedVersionState);
  });

  async function getChangesetIndexForNewNamedVersion(
    params: IVaultScopedOperationParams
  ): Promise<number> {
    for await (const changeset of iVaultsClient.changesets.getRepresentationList(
      params
    )) {
      const namedVersion = await changeset.getNamedVersion();
      if (!namedVersion) return changeset.index;
    }

    throw new TestSetupError(
      "Test iVault does not have any changesets without named versions."
    );
  }
});
