/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import {
  AcquireBriefcaseParams,
  IVaultsClient as AuthoringIVaultsClient,
  IVaultsClientOptions as AuthoringIVaultsClientOptions,
} from "@szewtwin/ivaults-client-authoring";
import {
  AuthorizationCallback,
  Briefcase,
  BriefcaseOrderByProperty,
  EntityListIterator,
  GetBriefcaseListParams,
  GetSingleBriefcaseParams,
  IVaultsClient,
  IVaultsClientOptions,
  OrderByOperator,
  ReleaseBriefcaseParams,
  SPECIAL_VALUES_ME,
  take,
  toArray,
} from "@szewtwin/ivaults-client-management";
import {
  IVaultMetadata,
  ReusableIVaultMetadata,
  ReusableTestIVaultProvider,
  TestAuthorizationProvider,
  TestIVaultCreator,
  TestIVaultGroup,
  TestIVaultGroupFactory,
  TestUtilTypes,
  assertBriefcase,
  assertCollection,
  assertMinimalBriefcase,
  createGuidValue,
} from "@szewtwin/ivaults-client-test-utils";

import { Constants, getTestDIContainer, getTestRunId } from "../common";

describe("[Management] BriefcaseOperations", () => {
  let iVaultsClient: IVaultsClient;
  let authorizationProvider: TestAuthorizationProvider;
  let authorization: AuthorizationCallback;

  let testIVaultGroup: TestIVaultGroup;
  let testIVaultForRelease: IVaultMetadata;
  let authoringClient: AuthoringIVaultsClient;

  let testIVault: ReusableIVaultMetadata;

  before(async () => {
    const container = getTestDIContainer();

    const iVaultsClientOptions = container.get<IVaultsClientOptions>(
      TestUtilTypes.IVaultsClientOptions
    );
    iVaultsClient = new IVaultsClient(iVaultsClientOptions);

    authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    const reusableTestIVaultProvider = container.get(
      ReusableTestIVaultProvider
    );
    testIVault = await reusableTestIVaultProvider.getOrCreate();

    const testIVaultGroupFactory = container.get(TestIVaultGroupFactory);
    testIVaultGroup = testIVaultGroupFactory.create({
      testRunId: getTestRunId(),
      packageName: Constants.PackagePrefix,
      testSuiteName: "ManagementBriefcaseOperations",
    });

    const authoringClientOptions = container.get<AuthoringIVaultsClientOptions>(
      TestUtilTypes.IVaultsClientOptions
    );
    authoringClient = new AuthoringIVaultsClient(authoringClientOptions);

    const testIVaultCreator = container.get(TestIVaultCreator);
    testIVaultForRelease = await testIVaultCreator.createEmpty(
      testIVaultGroup.getPrefixedUniqueIVaultName("Test iVault for release")
    );
  });

  after(async () => {
    await testIVaultGroup.cleanupIVaults();
  });

  [
    {
      label: "minimal",
      functionUnderTest: (params: GetBriefcaseListParams) =>
        iVaultsClient.briefcases.getMinimalList(params),
    },
    {
      label: "representation",
      functionUnderTest: (params: GetBriefcaseListParams) =>
        iVaultsClient.briefcases.getRepresentationList(params),
    },
  ].forEach((testCase) => {
    it(`should return all items when querying ${testCase.label} collection`, async () => {
      // Arrange
      const getBriefcaseListParams: GetBriefcaseListParams = {
        authorization,
        iVaultId: testIVault.id,
        urlParams: {
          $top: 5,
        },
      };

      // Act
      const briefcases = testCase.functionUnderTest(getBriefcaseListParams);

      // Assert
      await assertCollection({
        asyncIterable: briefcases,
        isEntityCountCorrect: (count) => count === testIVault.briefcases.length,
      });
    });
  });

  it("should return user owned briefcases when querying representation collection", async () => {
    // Arrange
    const getBriefcaseListParams: GetBriefcaseListParams = {
      authorization,
      iVaultId: testIVault.id,
      urlParams: {
        ownerId: SPECIAL_VALUES_ME,
        $orderBy: {
          property: BriefcaseOrderByProperty.AcquiredDateTime,
        },
      },
    };

    // Act
    const briefcases = iVaultsClient.briefcases.getRepresentationList(
      getBriefcaseListParams
    );

    // Assert
    const briefcaseList = await toArray(briefcases);
    expect(briefcaseList.length).to.equal(testIVault.briefcases.length);
    for (let i = 0; i < briefcaseList.length; i++) {
      await assertBriefcase({
        actualBriefcase: briefcaseList[i],
        expectedBriefcaseProperties: testIVault.briefcases[i],
      });
    }
  });

  it("should not return user owned briefcases if user does not own any when querying representation collection", async () => {
    // Arrange
    const authorizationForUser2 =
      authorizationProvider.getFullyFeaturedAdmin2Authorization();
    const getBriefcaseListParams: GetBriefcaseListParams = {
      authorization: authorizationForUser2,
      iVaultId: testIVault.id,
      urlParams: {
        ownerId: SPECIAL_VALUES_ME,
      },
    };

    // Act
    const briefcases = iVaultsClient.briefcases.getRepresentationList(
      getBriefcaseListParams
    );

    // Assert
    const briefcasesArray = await toArray(briefcases);
    expect(briefcasesArray.length).to.equal(0);
  });

  it("should return briefcases that match ownerId filter when querying representation collection", async () => {
    // Arrange
    const ownerId = testIVault.briefcases[0].ownerId;
    const getBriefcaseListParams: GetBriefcaseListParams = {
      authorization,
      iVaultId: testIVault.id,
      urlParams: {
        ownerId,
      },
    };

    // Act
    const briefcases = iVaultsClient.briefcases.getRepresentationList(
      getBriefcaseListParams
    );

    // Assert
    const briefcasesArray = await toArray(briefcases);
    expect(briefcasesArray.length).to.be.greaterThan(0);
    for (const actualBriefcase of briefcasesArray) {
      const expectedBriefcase = testIVault.briefcases.find(
        (briefcase) => briefcase.id === actualBriefcase.briefcaseId
      );
      expect(expectedBriefcase).to.exist;
      await assertBriefcase({
        actualBriefcase,
        expectedBriefcaseProperties: expectedBriefcase!,
      });
    }
  });

  it("should not return briefcases if none match the ownerId filter when querying representation collection", async () => {
    // Arrange
    const ownerId = createGuidValue();
    const getBriefcaseListParams: GetBriefcaseListParams = {
      authorization,
      iVaultId: testIVault.id,
      urlParams: {
        ownerId,
      },
    };

    // Act
    const briefcases = iVaultsClient.briefcases.getRepresentationList(
      getBriefcaseListParams
    );

    // Assert
    const briefcasesArray = await toArray(briefcases);
    expect(briefcasesArray.length).to.equal(0);
  });

  it("should get valid minimal briefcase when querying minimal collection", async () => {
    // Arrange
    const getBriefcaseListParams: GetBriefcaseListParams = {
      authorization,
      iVaultId: testIVault.id,
      urlParams: {
        $top: 1,
      },
    };

    // Act
    const minimalBriefcases = iVaultsClient.briefcases.getMinimalList(
      getBriefcaseListParams
    );

    // Assert
    const minimalBriefcaseList = await take(minimalBriefcases, 1);
    expect(minimalBriefcaseList.length).to.be.equal(1);
    const minimalBriefcase = minimalBriefcaseList[0];
    assertMinimalBriefcase({
      actualBriefcase: minimalBriefcase,
    });
  });

  it("should get valid full named version when querying representation collection", async () => {
    // Arrange
    const expectedBriefcase = testIVault.briefcases[0];
    const getBriefcaseListParams: GetBriefcaseListParams = {
      authorization,
      iVaultId: testIVault.id,
      urlParams: {
        $top: 1,
        $orderBy: {
          property: BriefcaseOrderByProperty.AcquiredDateTime,
        },
      },
    };

    // Act
    const briefcases: EntityListIterator<Briefcase> =
      iVaultsClient.briefcases.getRepresentationList(getBriefcaseListParams);

    // Assert
    const briefcaseList: Briefcase[] = await take(briefcases, 1);
    expect(briefcaseList.length).to.be.equal(1);
    const briefcase = briefcaseList[0];
    await assertBriefcase({
      actualBriefcase: briefcase,
      expectedBriefcaseProperties: expectedBriefcase,
    });
  });

  it("should get briefcase by id", async () => {
    // Arrange
    const expectedBriefcase = testIVault.briefcases[0];
    const getSingleBriefcaseParams: GetSingleBriefcaseParams = {
      authorization,
      iVaultId: testIVault.id,
      briefcaseId: expectedBriefcase.id,
    };

    // Act
    const briefcase: Briefcase = await iVaultsClient.briefcases.getSingle(
      getSingleBriefcaseParams
    );

    // Assert
    await assertBriefcase({
      actualBriefcase: briefcase,
      expectedBriefcaseProperties: expectedBriefcase,
    });
  });

  it("should order items by acquiredDateTime when querying representation collection (ascending order)", async () => {
    // Arrange
    const getBriefcaseListParams: GetBriefcaseListParams = {
      authorization,
      iVaultId: testIVault.id,
      urlParams: {
        $orderBy: {
          property: BriefcaseOrderByProperty.AcquiredDateTime,
        },
      },
    };

    // Act
    const briefcases = await toArray(
      iVaultsClient.briefcases.getRepresentationList(getBriefcaseListParams)
    );

    // Assert
    expect(briefcases.length).to.equal(testIVault.briefcases.length);
    for (let i = 0; i < briefcases.length - 1; i++)
      expect(new Date(briefcases[i].acquiredDateTime)).to.be.lessThan(
        new Date(briefcases[i + 1].acquiredDateTime)
      );
  });

  it("should order items by acquiredDateTime when querying representation collection (descending order)", async () => {
    // Arrange
    const getBriefcaseListParams: GetBriefcaseListParams = {
      authorization,
      iVaultId: testIVault.id,
      urlParams: {
        $orderBy: {
          property: BriefcaseOrderByProperty.AcquiredDateTime,
          operator: OrderByOperator.Descending,
        },
      },
    };

    // Act
    const briefcases = await toArray(
      iVaultsClient.briefcases.getRepresentationList(getBriefcaseListParams)
    );

    // Assert
    expect(briefcases.length).to.equal(testIVault.briefcases.length);
    for (let i = 0; i < briefcases.length - 1; i++)
      expect(new Date(briefcases[i].acquiredDateTime)).to.be.greaterThan(
        new Date(briefcases[i + 1].acquiredDateTime)
      );
  });

  it("should release briefcase", async () => {
    // Arrange
    const acquireBriefcaseParams: AcquireBriefcaseParams = {
      authorization,
      iVaultId: testIVaultForRelease.id,
    };
    const briefcase = await authoringClient.briefcases.acquire(
      acquireBriefcaseParams
    );

    const getBriefcaseListParams: GetBriefcaseListParams = {
      authorization,
      iVaultId: testIVaultForRelease.id,
    };
    const briefcasesBeforeRelease = await toArray(
      iVaultsClient.briefcases.getRepresentationList(getBriefcaseListParams)
    );
    expect(
      briefcasesBeforeRelease.some(
        (b) => b.briefcaseId === briefcase.briefcaseId
      )
    ).to.be.true;

    const releaseBriefcaseParams: ReleaseBriefcaseParams = {
      authorization,
      iVaultId: testIVaultForRelease.id,
      briefcaseId: briefcase.briefcaseId,
    };

    // Act
    await iVaultsClient.briefcases.release(releaseBriefcaseParams);

    // Assert
    const briefcasesAfterRelease = await toArray(
      iVaultsClient.briefcases.getRepresentationList(getBriefcaseListParams)
    );
    expect(
      briefcasesAfterRelease.find(
        (b) => b.briefcaseId === briefcase.briefcaseId
      )
    ).to.be.undefined;
  });
});
