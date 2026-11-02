/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import {
  AuthorizationCallback,
  EntityListIterator,
  GetSingleUserParams,
  GetUserListParams,
  IVaultsClient,
  IVaultsClientOptions,
  MinimalUser,
  OrderByOperator,
  User,
  UserOrderByProperty,
  take,
  toArray,
} from "@szewtwin/ivaults-client-management";
import {
  IVaultsClientsTestsConfig,
  ReusableIVaultMetadata,
  ReusableTestIVaultProvider,
  TestAuthorizationProvider,
  TestUtilTypes,
  assertCollection,
  assertMinimalUser,
  assertUser,
  assertUserStatistics,
} from "@szewtwin/ivaults-client-test-utils";

import { getTestDIContainer } from "../common";

describe("[Management] UserOperations", () => {
  let iVaultsClient: IVaultsClient;
  let authorization: AuthorizationCallback;

  let testIVaultForRead: ReusableIVaultMetadata;

  let testConfig: IVaultsClientsTestsConfig;

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

    testConfig = container.get(IVaultsClientsTestsConfig);
  });

  [
    {
      label: "minimal",
      functionUnderTest: (params: GetUserListParams) =>
        iVaultsClient.users.getMinimalList(params),
    },
    {
      label: "representation",
      functionUnderTest: (params: GetUserListParams) =>
        iVaultsClient.users.getRepresentationList(params),
    },
  ].forEach((testCase) => {
    it(`should return all items when querying ${testCase.label} collection`, async () => {
      // Arrange
      const getUserListParams: GetUserListParams = {
        authorization,
        iVaultId: testIVaultForRead.id,
      };

      // Act
      const users: EntityListIterator<unknown> =
        testCase.functionUnderTest(getUserListParams);

      // Assert
      await assertCollection({
        asyncIterable: users,
        // both test users + there may be additional services that accessed iVault
        isEntityCountCorrect: (count) => count >= 2,
      });
    });
  });

  it("should get minimal user", async () => {
    // Arrange
    const getUserListParams: GetUserListParams = {
      authorization,
      iVaultId: testIVaultForRead.id,
      urlParams: {
        $top: 1,
      },
    };

    // Act
    const minimalUsers: EntityListIterator<MinimalUser> =
      iVaultsClient.users.getMinimalList(getUserListParams);

    // Assert
    const minimalUserList = await take(minimalUsers, 1);
    expect(minimalUserList.length).to.be.equal(1);
    const minimalUser = minimalUserList[0];
    assertMinimalUser({
      actualUser: minimalUser,
    });
  });

  it("should get user by id", async () => {
    // Arrange
    const users = await getMinimalUsersList();
    const admin1User = users.find(
      (user) => user.displayName === testConfig.testUsers.admin1.email
    );
    expect(admin1User).to.not.be.undefined;
    const getAdmin1UserParams: GetSingleUserParams = {
      authorization,
      iVaultId: testIVaultForRead.id,
      userId: admin1User!.id,
    };

    // Act
    const queriedAdmin1User: User = await iVaultsClient.users.getSingle(
      getAdmin1UserParams
    );

    // Assert
    assertUser({
      actualUser: queriedAdmin1User,
    });

    // Assert user statistics
    assertUserStatistics({
      actualUser: queriedAdmin1User,
      expectedUserStatistics: {
        briefcasesCount: 3,
        createdVersionsCount: 0,
        pushedChangesetsCount: 10,
        applications: [{ ownsLocks: true, ownsExclusiveRootElementLock: true }],
      },
    });
  });

  it("should order items by givenName when querying representation collection (ascending order)", async () => {
    // Arrange
    const getUserListParams: GetUserListParams = {
      authorization,
      iVaultId: testIVaultForRead.id,
      urlParams: {
        $orderBy: {
          property: UserOrderByProperty.GivenName,
          operator: OrderByOperator.Ascending,
        },
      },
    };

    // Act
    const users = iVaultsClient.users.getRepresentationList(getUserListParams);

    // Assert
    const userGivenNames = (await toArray(users)).map((user) => user.givenName);
    expect(userGivenNames.length).to.be.greaterThanOrEqual(2);
    for (let i = 0; i < userGivenNames.length - 1; i++)
      expect(userGivenNames[i].localeCompare(userGivenNames[i + 1]) <= 0).to.be
        .true;
  });

  it("should order items by givenName when querying representation collection (descending order)", async () => {
    // Arrange
    const getUserListParams: GetUserListParams = {
      authorization,
      iVaultId: testIVaultForRead.id,
      urlParams: {
        $orderBy: {
          property: UserOrderByProperty.GivenName,
          operator: OrderByOperator.Descending,
        },
      },
    };

    // Act
    const users = iVaultsClient.users.getRepresentationList(getUserListParams);

    // Assert
    const userGivenNames = (await toArray(users)).map((user) => user.givenName);
    expect(userGivenNames.length).to.be.greaterThanOrEqual(2);
    for (let i = 0; i < userGivenNames.length - 1; i++)
      expect(userGivenNames[i].localeCompare(userGivenNames[i + 1]) >= 0).to.be
        .true;
  });

  it("should order items by surname when querying representation collection (ascending order)", async () => {
    // Arrange
    const getUserListParams: GetUserListParams = {
      authorization,
      iVaultId: testIVaultForRead.id,
      urlParams: {
        $orderBy: {
          property: UserOrderByProperty.Surname,
          operator: OrderByOperator.Ascending,
        },
      },
    };

    // Act
    const users = iVaultsClient.users.getRepresentationList(getUserListParams);

    // Assert
    const userSurnames = (await toArray(users)).map((user) => user.surname);
    expect(userSurnames.length).to.be.greaterThanOrEqual(2);
    for (let i = 0; i < userSurnames.length - 1; i++)
      expect(userSurnames[i].localeCompare(userSurnames[i + 1]) <= 0).to.be
        .true;
  });

  it("should order items by surname when querying representation collection (descending order)", async () => {
    // Arrange
    const getUserListParams: GetUserListParams = {
      authorization,
      iVaultId: testIVaultForRead.id,
      urlParams: {
        $orderBy: {
          property: UserOrderByProperty.Surname,
          operator: OrderByOperator.Descending,
        },
      },
    };

    // Act
    const users = iVaultsClient.users.getRepresentationList(getUserListParams);

    // Assert
    const userSurnames = (await toArray(users)).map((user) => user.surname);
    expect(userSurnames.length).to.be.greaterThanOrEqual(2);
    for (let i = 0; i < userSurnames.length - 1; i++)
      expect(userSurnames[i].localeCompare(userSurnames[i + 1]) >= 0).to.be
        .true;
  });

  it("should order items by givenName and surname when querying representation collection", async () => {
    // Arrange
    const getUserListParams: GetUserListParams = {
      authorization,
      iVaultId: testIVaultForRead.id,
      urlParams: {
        $orderBy: [
          {
            property: UserOrderByProperty.GivenName,
            operator: OrderByOperator.Ascending,
          },
          {
            property: UserOrderByProperty.Surname,
            operator: OrderByOperator.Ascending,
          },
        ],
      },
    };

    // Act
    const users = iVaultsClient.users.getRepresentationList(getUserListParams);

    // Assert
    const userProperties = (await toArray(users)).map(
      (user) => `${user.givenName} ${user.surname}`
    );
    expect(userProperties.length).to.be.greaterThanOrEqual(2);
    for (let i = 0; i < userProperties.length - 1; i++)
      expect(userProperties[i].localeCompare(userProperties[i + 1]) <= 0).to.be
        .true;
  });

  async function getMinimalUsersList(): Promise<MinimalUser[]> {
    const users: EntityListIterator<MinimalUser> =
      iVaultsClient.users.getMinimalList({
        authorization,
        iVaultId: testIVaultForRead.id,
      });
    const userList: MinimalUser[] = await toArray(users);
    return userList;
  }
});
