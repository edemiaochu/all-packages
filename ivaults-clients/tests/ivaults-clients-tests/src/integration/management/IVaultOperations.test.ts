/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { randomUUID } from "crypto";

import { expect } from "chai";

import {
  AuthorizationCallback,
  CloneIVaultParams,
  ContainerTypes,
  CreateEmptyIVaultParams,
  CreateIVaultFromTemplateParams,
  EntityListIterator,
  Extent,
  ForkIVaultParams,
  GetIVaultListParams,
  GetSingleIVaultParams,
  IVault,
  IVaultOrderByProperty,
  IVaultState,
  IVaultsClient,
  IVaultsClientOptions,
  IVaultsErrorCode,
  MinimalIVault,
  OrderByOperator,
  UpdateIVaultParams,
  take,
  toArray,
} from "@szewtwin/ivaults-client-management";
import {
  IVaultMetadata,
  ReusableIVaultMetadata,
  ReusableTestIVaultProvider,
  TestAuthorizationProvider,
  TestIVaultCreator,
  TestIVaultFileProvider,
  TestIVaultGroup,
  TestIVaultGroupFactory,
  TestSZEWTwinProvider,
  TestUtilTypes,
  assertCollection,
  assertError,
  assertIVault,
  assertMinimalIVault,
} from "@szewtwin/ivaults-client-test-utils";

import { Constants, getTestDIContainer, getTestRunId } from "../common";

describe("[Management] IVaultOperations", () => {
  let iVaultsClient: IVaultsClient;
  let authorization: AuthorizationCallback;
  let szewTwinId: string;
  const testsIVaultTimeOutInMs = 8 * 60000;

  let testIVaultFileProvider: TestIVaultFileProvider;
  let testIVaultGroup: TestIVaultGroup;
  let testIVaultForRead: ReusableIVaultMetadata;
  let testIVaultForUpdate: IVaultMetadata;

  before(async () => {
    const container = getTestDIContainer();

    const iVaultsClientOptions = container.get<IVaultsClientOptions>(
      TestUtilTypes.IVaultsClientOptions
    );
    iVaultsClient = new IVaultsClient(iVaultsClientOptions);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    const testSZEWTwinProvider = container.get(TestSZEWTwinProvider);
    szewTwinId = await testSZEWTwinProvider.getOrCreate();

    testIVaultFileProvider = container.get(TestIVaultFileProvider);

    const testIVaultGroupFactory = container.get(TestIVaultGroupFactory);
    testIVaultGroup = testIVaultGroupFactory.create({
      testRunId: getTestRunId(),
      packageName: Constants.PackagePrefix,
      testSuiteName: "ManagementIVaultOperations",
    });

    const reusableTestIVaultProvider = container.get(
      ReusableTestIVaultProvider
    );
    testIVaultForRead = await reusableTestIVaultProvider.getOrCreate();

    const testIVaultCreator = container.get(TestIVaultCreator);
    testIVaultForUpdate = await testIVaultCreator.createEmpty(
      testIVaultGroup.getPrefixedUniqueIVaultName(
        "Test iVault for update and for search"
      )
    );
  });

  after(async () => {
    await testIVaultGroup.cleanupIVaults();
  });

  [
    {
      label: "minimal",
      functionUnderTest: (params: GetIVaultListParams) =>
        iVaultsClient.iVaults.getMinimalList(params),
    },
    {
      label: "representation",
      functionUnderTest: (params: GetIVaultListParams) =>
        iVaultsClient.iVaults.getRepresentationList(params),
    },
  ].forEach((testCase) => {
    it(`should return all items when querying ${testCase.label} collection`, async () => {
      // Arrange
      const getIVaultListParams: GetIVaultListParams = {
        authorization,
        urlParams: {
          szewTwinId,
          $top: 5,
        },
        headers: {
          "X-Correlation-Id": randomUUID(),
        },
      };

      // Act
      const iVaults = testCase.functionUnderTest(getIVaultListParams);

      // Assert
      await assertCollection({
        asyncIterable: iVaults,
        isEntityCountCorrect: (count) => count >= 2,
      });
    });
  });

  it("should return an iVault by id", async () => {
    // Arrange
    const getSingleiVaultParams: GetSingleIVaultParams = {
      authorization,
      iVaultId: testIVaultForRead.id,
      headers: {
        "X-Correlation-Id": randomUUID(),
      },
    };

    // Act
    const iVault: IVault = await iVaultsClient.iVaults.getSingle(
      getSingleiVaultParams
    );

    // Assert
    await assertIVault({
      actualIVault: iVault,
      expectedIVaultProperties: {
        szewTwinId,
        name: testIVaultForRead.name,
        description: testIVaultForRead.description,
        containersEnabled: ContainerTypes.None,
      },
    });
  });

  it("should return items in ascending/descending order by name when querying representation collection", async () => {
    // Arrange
    const correlationId = randomUUID();
    await iVaultsClient.iVaults.createEmpty({
      authorization,
      iVaultProperties: {
        szewTwinId,
        name: testIVaultGroup.getFirstIVaultNameForOrderingTests(),
      },
      headers: {
        "X-Correlation-Id": correlationId,
      },
    });
    await iVaultsClient.iVaults.createEmpty({
      authorization,
      iVaultProperties: {
        szewTwinId,
        name: testIVaultGroup.getLastIVaultNameForOrderingTests(),
      },
      headers: {
        "X-Correlation-Id": correlationId,
      },
    });

    const getAscendingIVaultListParams: GetIVaultListParams = {
      authorization,
      urlParams: {
        szewTwinId,
        $orderBy: {
          property: IVaultOrderByProperty.Name,
        },
      },
      headers: {
        "X-Correlation-Id": correlationId,
      },
    };
    const getDescendingIVaultListParams: GetIVaultListParams = {
      authorization,
      urlParams: {
        szewTwinId,
        $orderBy: {
          property: IVaultOrderByProperty.Name,
          operator: OrderByOperator.Descending,
        },
      },
      headers: {
        "X-Correlation-Id": correlationId,
      },
    };

    // Act
    const ascendingIVaultArray = await toArray(
      iVaultsClient.iVaults.getRepresentationList(getAscendingIVaultListParams)
    );
    const descendingIVaultArray = await toArray(
      iVaultsClient.iVaults.getRepresentationList(getDescendingIVaultListParams)
    );

    // Assert
    expect(ascendingIVaultArray.length).to.be.greaterThanOrEqual(2);
    const {
      firstIVaultIndex: firstIVaultIndexInAscArray,
      lastIVaultIndex: lastIVaultIndexInAscArray,
    } = assertAscendingiVaultArray(ascendingIVaultArray);
    expect(lastIVaultIndexInAscArray).to.be.greaterThan(
      firstIVaultIndexInAscArray
    );

    expect(descendingIVaultArray.length).to.be.greaterThanOrEqual(2);
    const {
      firstIVaultIndex: firstIVaultIndexInDescArray,
      lastIVaultIndex: lastIVaultIndexInDescArray,
    } = assertAscendingiVaultArray(descendingIVaultArray);
    expect(firstIVaultIndexInDescArray).to.be.greaterThan(
      lastIVaultIndexInDescArray
    );
  });

  function assertAscendingiVaultArray(iVaultArray: IVault[]): {
    firstIVaultIndex: number;
    lastIVaultIndex: number;
  } {
    const firstIVaultIndex = iVaultArray.findIndex((iVault) =>
      iVault.name.startsWith(testIVaultGroup.firstNamePrefix)
    );
    expect(firstIVaultIndex).to.not.be.equal(-1);
    const lastIVaultIndex = iVaultArray.findIndex((iVault) =>
      iVault.name.startsWith(testIVaultGroup.lastNamePrefix)
    );
    expect(lastIVaultIndex).to.not.be.equal(-1);
    return { firstIVaultIndex, lastIVaultIndex };
  }

  it("should return items in ascending/descending order by createdDateTime when querying representation collection", async () => {
    // Arrange
    const correlationId = randomUUID();
    const getAscendingIVaultListParams: GetIVaultListParams = {
      authorization,
      urlParams: {
        szewTwinId,
        $orderBy: {
          property: IVaultOrderByProperty.CreatedDateTime,
        },
      },
      headers: {
        "X-Correlation-Id": correlationId,
      },
    };
    const getDescendingIVaultListParams: GetIVaultListParams = {
      authorization,
      urlParams: {
        szewTwinId,
        $orderBy: {
          property: IVaultOrderByProperty.CreatedDateTime,
          operator: OrderByOperator.Descending,
        },
      },
      headers: {
        "X-Correlation-Id": correlationId,
      },
    };

    // Act
    const ascendingIVaultArray = await toArray(
      iVaultsClient.iVaults.getRepresentationList(getAscendingIVaultListParams)
    );

    // Assert
    expect(ascendingIVaultArray.length).to.be.greaterThanOrEqual(2);
    const firstAscendingArrayItem = ascendingIVaultArray[0];
    const lastAscendingArrayItem =
      ascendingIVaultArray[ascendingIVaultArray.length - 1];
    expect(new Date(firstAscendingArrayItem.createdDateTime)).to.be.lessThan(
      new Date(lastAscendingArrayItem.createdDateTime)
    );

    // Act
    const descendingIVaultArray = await toArray(
      iVaultsClient.iVaults.getRepresentationList(getDescendingIVaultListParams)
    );

    // Assert
    expect(descendingIVaultArray.length).to.be.greaterThanOrEqual(2);
    const firstDescendingArrayItem = descendingIVaultArray[0];
    const lastDescendingArrayItem =
      descendingIVaultArray[descendingIVaultArray.length - 1];
    expect(
      new Date(firstDescendingArrayItem.createdDateTime)
    ).to.be.greaterThan(new Date(lastDescendingArrayItem.createdDateTime));
  });

  it("should return iVaults that match the name filter when querying representation collection", async () => {
    // Arrange
    const getIVaultListParams: GetIVaultListParams = {
      authorization,
      urlParams: {
        szewTwinId,
        name: testIVaultForRead.name,
      },
      headers: {
        "X-Correlation-Id": randomUUID(),
      },
    };

    // Act
    const iVaults =
      iVaultsClient.iVaults.getRepresentationList(getIVaultListParams);

    // Assert
    const iVaultArray = await toArray(iVaults);
    expect(iVaultArray.length).to.equal(1);
    const iVault = iVaultArray[0];
    expect(iVault.id).to.equal(testIVaultForRead.id);
    expect(iVault.name).to.equal(testIVaultForRead.name);
  });

  it("should return iVaults that match the search filter when querying representation collection", async () => {
    // Arrange
    const getIVaultListParams: GetIVaultListParams = {
      authorization,
      urlParams: {
        szewTwinId,
        $search: testIVaultGroup.getPrefixedUniqueIVaultName(
          "test iVault for update and for Sear"
        ),
      },
      headers: {
        "X-Correlation-Id": randomUUID(),
      },
    };

    // Act
    const iVaults =
      iVaultsClient.iVaults.getRepresentationList(getIVaultListParams);

    // Assert
    const iVaultArray = await toArray(iVaults);
    expect(iVaultArray.length).to.equal(1);
    const iVault = iVaultArray[0];
    expect(iVault.id).to.equal(testIVaultForUpdate.id);
  });

  it("should return iVaults that match the provided state (notInitialized)", async () => {
    // Arrange
    const getIVaultListParams: GetIVaultListParams = {
      authorization,
      urlParams: {
        szewTwinId,
        state: IVaultState.NotInitialized,
      },
      headers: {
        "X-Correlation-Id": randomUUID(),
      },
    };

    // Act
    const iVaults =
      iVaultsClient.iVaults.getRepresentationList(getIVaultListParams);

    // Assert
    const iVaultArray = await toArray(iVaults);
    iVaultArray.forEach((iVault) => {
      expect(iVault.state).to.be.equal(IVaultState.NotInitialized);
    });
  });

  it("should return iVaults that match the provided state (initialized)", async () => {
    // Arrange
    const getIVaultListParams: GetIVaultListParams = {
      authorization,
      urlParams: {
        szewTwinId,
        state: IVaultState.Initialized,
      },
      headers: {
        "X-Correlation-Id": randomUUID(),
      },
    };

    // Act
    const iVaults =
      iVaultsClient.iVaults.getRepresentationList(getIVaultListParams);

    // Assert
    const iVaultArray = await toArray(iVaults);
    iVaultArray.forEach((iVault) => {
      expect(iVault.state).to.be.equal(IVaultState.Initialized);
    });
  });

  it("should get minimal iVault", async () => {
    // Arrange
    const getIVaultListParams: GetIVaultListParams = {
      authorization,
      urlParams: {
        szewTwinId,
        $top: 1,
      },
      headers: {
        "X-Correlation-Id": randomUUID(),
      },
    };

    // Act
    const minimalIVaults: EntityListIterator<MinimalIVault> =
      iVaultsClient.iVaults.getMinimalList(getIVaultListParams);

    // Assert
    const minimalIVaultList = await take(minimalIVaults, 1);
    expect(minimalIVaultList.length).to.be.equal(1);
    const minimalIVault = minimalIVaultList[0];
    assertMinimalIVault({
      actualIVault: minimalIVault,
    });
  });

  it("should not return iVaults if none match the name filter when querying representation collection", async () => {
    // Arrange
    const getIVaultListParams: GetIVaultListParams = {
      authorization,
      urlParams: {
        szewTwinId,
        name: "Non existent name",
      },
      headers: {
        "X-Correlation-Id": randomUUID(),
      },
    };

    // Act
    const iVaults =
      iVaultsClient.iVaults.getRepresentationList(getIVaultListParams);

    // Assert
    const iVaultArray = await toArray(iVaults);
    expect(iVaultArray.length).to.equal(0);
  });

  it("should not return iVaults if none match the search filter when querying representation collection", async () => {
    // Arrange
    const getIVaultListParams: GetIVaultListParams = {
      authorization,
      urlParams: {
        szewTwinId,
        $search: "Non existent",
      },
      headers: {
        "X-Correlation-Id": randomUUID(),
      },
    };

    // Act
    const iVaults =
      iVaultsClient.iVaults.getRepresentationList(getIVaultListParams);

    // Assert
    const iVaultArray = await toArray(iVaults);
    expect(iVaultArray.length).to.equal(0);
  });

  it("should create an empty IVault", async () => {
    // Arrange
    const createIVaultParams: CreateEmptyIVaultParams = {
      authorization,
      iVaultProperties: {
        szewTwinId,
        name: testIVaultGroup.getPrefixedUniqueIVaultName("Empty Test IVault"),
        description: "Sample iVault description",
        extent: {
          southWest: { latitude: 1, longitude: 2 },
          northEast: { latitude: 3, longitude: 4 },
        },
        containersEnabled: ContainerTypes.None,
      },
      headers: {
        "X-Correlation-Id": randomUUID(),
      },
    };

    // Act
    const iVault: IVault = await iVaultsClient.iVaults.createEmpty(
      createIVaultParams
    );

    // Assert
    await assertIVault({
      actualIVault: iVault,
      expectedIVaultProperties: createIVaultParams.iVaultProperties,
    });
  });

  it("should create an empty iVault with defined GCS", async () => {
    const createIVaultParams: CreateEmptyIVaultParams = {
      authorization,
      iVaultProperties: {
        szewTwinId,
        name: testIVaultGroup.getPrefixedUniqueIVaultName(
          "Empty Test IVault with GCS"
        ),
        description: "Sample iVault description",
        extent: {
          southWest: { latitude: 1, longitude: 2 },
          northEast: { latitude: 3, longitude: 4 },
        },
        containersEnabled: ContainerTypes.None,
        geographicCoordinateSystem: {
          horizontalCRSId: "EPSG:3857",
        },
        creationMode: "empty",
      },
      headers: {
        "X-Correlation-Id": randomUUID(),
      },
    };

    const iVault: IVault = await iVaultsClient.iVaults.createEmpty(
      createIVaultParams
    );

    await assertIVault({
      actualIVault: iVault,
      expectedIVaultProperties: createIVaultParams.iVaultProperties,
    });
  });

  it("should create iVault from template (without changeset id specified)", async () => {
    // Arrange
    const createIVaultFromTemplateParams: CreateIVaultFromTemplateParams = {
      authorization,
      iVaultProperties: {
        szewTwinId,
        name: testIVaultGroup.getPrefixedUniqueIVaultName(
          "iVault from template (without changeset)"
        ),
        template: {
          iVaultId: testIVaultForRead.id,
        },
        containersEnabled:
          ContainerTypes.SchemaSync |
          ContainerTypes.CodeStore |
          ContainerTypes.ViewStore,
      },
      timeOutInMs: testsIVaultTimeOutInMs,
      headers: {
        "X-Correlation-Id": randomUUID(),
      },
    };

    // Act
    const iVault: IVault = await iVaultsClient.iVaults.createFromTemplate(
      createIVaultFromTemplateParams
    );

    // Assert
    await assertIVault({
      actualIVault: iVault,
      expectedIVaultProperties: createIVaultFromTemplateParams.iVaultProperties,
    });
  });

  it("should create iVault from template (without changeset id specified and with defined GCS)", async () => {
    // Arrange
    const createIVaultFromTemplateParams: CreateIVaultFromTemplateParams = {
      authorization,
      iVaultProperties: {
        szewTwinId,
        name: testIVaultGroup.getPrefixedUniqueIVaultName(
          "iVault from template (without changeset) (with GCS)"
        ),
        template: {
          iVaultId: testIVaultForRead.id,
        },
        geographicCoordinateSystem: {
          horizontalCRSId: "EPSG:3857",
        },
        containersEnabled:
          ContainerTypes.SchemaSync |
          ContainerTypes.CodeStore |
          ContainerTypes.ViewStore,
      },
      timeOutInMs: testsIVaultTimeOutInMs,
      headers: {
        "X-Correlation-Id": randomUUID(),
      },
    };

    // Act
    const iVault: IVault = await iVaultsClient.iVaults.createFromTemplate(
      createIVaultFromTemplateParams
    );

    // Assert
    await assertIVault({
      actualIVault: iVault,
      expectedIVaultProperties: createIVaultFromTemplateParams.iVaultProperties,
    });
  });

  it("should create iVault from template (with changeset id specified)", async () => {
    // Arrange
    const createIVaultFromTemplateParams: CreateIVaultFromTemplateParams = {
      authorization,
      iVaultProperties: {
        szewTwinId,
        name: testIVaultGroup.getPrefixedUniqueIVaultName(
          "iVault from template (with changeset)"
        ),
        template: {
          iVaultId: testIVaultForRead.id,
          changesetId: testIVaultFileProvider.changesets[5].id,
        },
        containersEnabled:
          ContainerTypes.SchemaSync |
          ContainerTypes.CodeStore |
          ContainerTypes.ViewStore,
      },
      timeOutInMs: testsIVaultTimeOutInMs,
      headers: {
        "X-Correlation-Id": randomUUID(),
      },
    };

    // Act
    const iVault: IVault = await iVaultsClient.iVaults.createFromTemplate(
      createIVaultFromTemplateParams
    );

    // Assert
    await assertIVault({
      actualIVault: iVault,
      expectedIVaultProperties: createIVaultFromTemplateParams.iVaultProperties,
    });
  });

  it("should clone iVault (with non-empty changeset index specified)", async () => {
    // Arrange
    const sourceIVault = await iVaultsClient.iVaults.getSingle({
      authorization,
      iVaultId: testIVaultForRead.id,
    });
    const changesetIndex = 3;
    const cloneIVaultParams: CloneIVaultParams = {
      authorization,
      iVaultId: testIVaultForRead.id,
      iVaultProperties: {
        szewTwinId,
        name: testIVaultGroup.getPrefixedUniqueIVaultName("cloned iVault"),
        changesetIndex,
        containersEnabled:
          ContainerTypes.SchemaSync |
          ContainerTypes.CodeStore |
          ContainerTypes.ViewStore,
      },
      timeOutInMs: testsIVaultTimeOutInMs,
    };

    // Act
    const newIVault = await iVaultsClient.iVaults.clone(cloneIVaultParams);

    // Assert
    await assertIVault({
      actualIVault: newIVault,
      expectedIVaultProperties: {
        szewTwinId,
        name: cloneIVaultParams.iVaultProperties.name!,
        description: sourceIVault.description ?? undefined,
        extent: sourceIVault.extent ?? undefined,
        containersEnabled: cloneIVaultParams.iVaultProperties.containersEnabled,
      },
    });
    const changesets = await toArray(
      iVaultsClient.changesets.getMinimalList({
        authorization,
        iVaultId: newIVault.id,
      })
    );
    expect(changesets.length).to.equal(changesetIndex);
  });

  it("should fork iVault", async () => {
    // Arrange
    const sourceIVault = await iVaultsClient.iVaults.getSingle({
      authorization,
      iVaultId: testIVaultForRead.id,
    });
    const forkIVaultParams: ForkIVaultParams = {
      authorization,
      iVaultId: testIVaultForRead.id,
      iVaultProperties: {
        szewTwinId,
        name: testIVaultGroup.getPrefixedUniqueIVaultName("iVault fork"),
        preserveHistory: true,
        containersEnabled:
          ContainerTypes.SchemaSync |
          ContainerTypes.CodeStore |
          ContainerTypes.ViewStore,
      },
      timeOutInMs: testsIVaultTimeOutInMs,
    };

    // Act
    const iVaultFork = await iVaultsClient.iVaults.fork(forkIVaultParams);

    // Assert
    await assertIVault({
      actualIVault: iVaultFork,
      expectedIVaultProperties: {
        szewTwinId,
        name: forkIVaultParams.iVaultProperties.name!,
        description: sourceIVault.description!,
        extent: undefined,
        containersEnabled: forkIVaultParams.iVaultProperties.containersEnabled,
      },
    });
    const changesets = await toArray(
      iVaultsClient.changesets.getMinimalList({
        authorization,
        iVaultId: iVaultFork.id,
      })
    );
    expect(changesets.length).to.equal(
      testIVaultFileProvider.changesets.length
    );
  });

  it("should update iVault name", async () => {
    // Arrange
    const correlationId = randomUUID();
    const iVaultBeforeUpdate: IVault = await iVaultsClient.iVaults.getSingle({
      authorization,
      iVaultId: testIVaultForUpdate.id,
      headers: {
        "X-Correlation-Id": correlationId,
      },
    });

    const newIVaultName = testIVaultGroup.getPrefixedUniqueIVaultName(
      "Test iVault for update and for search updated"
    );
    const updateIVaultParams: UpdateIVaultParams = {
      authorization,
      iVaultId: testIVaultForUpdate.id,
      iVaultProperties: {
        name: newIVaultName,
      },
      headers: {
        "X-Correlation-Id": correlationId,
      },
    };

    // Act
    const iVault: IVault = await iVaultsClient.iVaults.update(
      updateIVaultParams
    );

    // Assert
    await assertIVault({
      actualIVault: iVault,
      expectedIVaultProperties: {
        name: newIVaultName,
        szewTwinId: iVaultBeforeUpdate.szewTwinId,
        description: iVaultBeforeUpdate.description!,
        extent: iVaultBeforeUpdate.extent!,
        containersEnabled: iVaultBeforeUpdate.containersEnabled,
      },
    });
  });

  it("should update iVault description", async () => {
    // Arrange
    const correlationId = randomUUID();
    const iVaultBeforeUpdate: IVault = await iVaultsClient.iVaults.getSingle({
      authorization,
      iVaultId: testIVaultForUpdate.id,
      headers: {
        "X-Correlation-Id": correlationId,
      },
    });

    const newIVaultDescription = "new description";
    const updateIVaultParams: UpdateIVaultParams = {
      authorization,
      iVaultId: testIVaultForUpdate.id,
      iVaultProperties: {
        description: newIVaultDescription,
      },
      headers: {
        "X-Correlation-Id": correlationId,
      },
    };

    // Act
    const iVault: IVault = await iVaultsClient.iVaults.update(
      updateIVaultParams
    );

    // Assert
    await assertIVault({
      actualIVault: iVault,
      expectedIVaultProperties: {
        name: iVaultBeforeUpdate.name,
        szewTwinId: iVaultBeforeUpdate.szewTwinId,
        description: newIVaultDescription,
        extent: iVaultBeforeUpdate.extent!,
        containersEnabled: iVaultBeforeUpdate.containersEnabled,
      },
    });
  });

  it("should update iVault extent", async () => {
    // Arrange
    const correlationId = randomUUID();
    const iVaultBeforeUpdate: IVault = await iVaultsClient.iVaults.getSingle({
      authorization,
      iVaultId: testIVaultForUpdate.id,
      headers: {
        "X-Correlation-Id": correlationId,
      },
    });

    const newIVaultExtent: Extent = {
      southWest: {
        latitude: 80,
        longitude: 170,
      },
      northEast: {
        latitude: -80,
        longitude: -170,
      },
    };
    const updateIVaultParams: UpdateIVaultParams = {
      authorization,
      iVaultId: testIVaultForUpdate.id,
      iVaultProperties: {
        extent: newIVaultExtent,
      },
      headers: {
        "X-Correlation-Id": correlationId,
      },
    };

    // Act
    const iVault: IVault = await iVaultsClient.iVaults.update(
      updateIVaultParams
    );

    // Assert
    await assertIVault({
      actualIVault: iVault,
      expectedIVaultProperties: {
        name: iVaultBeforeUpdate.name,
        szewTwinId: iVaultBeforeUpdate.szewTwinId,
        description: iVaultBeforeUpdate.description!,
        extent: newIVaultExtent,
        containersEnabled: iVaultBeforeUpdate.containersEnabled,
      },
    });
  });

  it("should return unauthorized error when calling API with invalid access token", async () => {
    // Arrange
    const createIVaultParams: CreateEmptyIVaultParams = {
      authorization: () =>
        Promise.resolve({ scheme: "Bearer", token: "invalid token" }),
      iVaultProperties: {
        szewTwinId,
        name: testIVaultGroup.getPrefixedUniqueIVaultName(
          "Sample iVault (unauthorized)"
        ),
      },
      headers: {
        "X-Correlation-Id": randomUUID(),
      },
    };

    // Act
    let objectThrown: unknown;
    try {
      await iVaultsClient.iVaults.createEmpty(createIVaultParams);
    } catch (e) {
      objectThrown = e;
    }

    // Assert
    assertError({
      objectThrown,
      expectedError: {
        code: IVaultsErrorCode.Unauthorized,
        message:
          "Access denied due to invalid access_token. Make sure that issuer is correct, the token is not expired and is not corrupted.",
      },
    });
  });

  it("should return a detailed error when attempting to create iVault with invalid description", async () => {
    // Arrange
    const createIVaultParams: CreateEmptyIVaultParams = {
      authorization,
      iVaultProperties: {
        szewTwinId,
        name: testIVaultGroup.getPrefixedUniqueIVaultName(
          "Sample iVault (invalid)"
        ),
        description: "x".repeat(256),
      },
      headers: {
        "X-Correlation-Id": randomUUID(),
      },
    };

    // Act
    let objectThrown: unknown;
    try {
      await iVaultsClient.iVaults.createEmpty(createIVaultParams);
    } catch (e) {
      objectThrown = e;
    }

    // Assert
    assertError({
      objectThrown,
      expectedError: {
        code: IVaultsErrorCode.InvalidIVaultsRequest,
        message:
          "Cannot create iVault. Details:\n1. InvalidValue: Provided 'description' value is not valid. The value exceeds allowed 255 characters. Target: description.\n",
        details: [
          {
            code: IVaultsErrorCode.InvalidValue,
            message:
              "Provided 'description' value is not valid. The value exceeds allowed 255 characters.",
            target: "description",
          },
        ],
      },
    });
  });
});
