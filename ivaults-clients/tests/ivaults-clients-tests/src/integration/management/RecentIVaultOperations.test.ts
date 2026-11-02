/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import {
  AddIVaultToRecentsParams,
  AuthorizationCallback,
  EntityListIterator,
  GetRecentIVaultListParams,
  IVault,
  IVaultsClient,
  IVaultsClientOptions,
  MinimalIVault,
  RemoveIVaultFromRecentsParams,
  take,
  toArray,
  UtilityFunctions,
} from "@szewtwin/ivaults-client-management";
import {
  IVaultMetadata,
  TestAuthorizationProvider,
  TestIVaultCreator,
  TestIVaultGroup,
  TestIVaultGroupFactory,
  TestSZEWTwinProvider,
  TestUtilTypes,
  assertCollection,
  assertMinimalIVault,
} from "@szewtwin/ivaults-client-test-utils";

import { Constants, getTestDIContainer, getTestRunId } from "../common";

describe("[Management] RecentIVaultOperations", () => {
  let iVaultsClient: IVaultsClient;
  let authorization: AuthorizationCallback;
  let szewTwinId: string;

  let testIVaultGroup: TestIVaultGroup;
  let testIVaultForRecents1: IVaultMetadata;
  let testIVaultForRecents2: IVaultMetadata;
  let testIVaultForRecents3: IVaultMetadata;

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

    const testIVaultGroupFactory = container.get(TestIVaultGroupFactory);
    testIVaultGroup = testIVaultGroupFactory.create({
      testRunId: getTestRunId(),
      packageName: Constants.PackagePrefix,
      testSuiteName: "RecentIVaultOperations",
    });

    const testIVaultCreator = container.get(TestIVaultCreator);
    testIVaultForRecents1 = await testIVaultCreator.createEmpty(
      testIVaultGroup.getPrefixedUniqueIVaultName("Test iVault for recents 1")
    );
    testIVaultForRecents2 = await testIVaultCreator.createEmpty(
      testIVaultGroup.getPrefixedUniqueIVaultName("Test iVault for recents 2")
    );
    testIVaultForRecents3 = await testIVaultCreator.createEmpty(
      testIVaultGroup.getPrefixedUniqueIVaultName("Test iVault for recents 3")
    );
  });

  after(async () => {
    await testIVaultGroup.cleanupIVaults();
  });

  afterEach(async () => {
    // Clean up: ensure all test iVaults are removed from recents
    for (const testIVault of [
      testIVaultForRecents1,
      testIVaultForRecents2,
      testIVaultForRecents3,
    ]) {
      try {
        const removeFromRecentsParams: RemoveIVaultFromRecentsParams = {
          authorization,
          iVaultId: testIVault.id,
        };
        await iVaultsClient.recentIVaults.remove(removeFromRecentsParams);
      } catch {
        // Ignore errors if iVault was not in recents
      }
    }
  });

  it("should add iVault to recents", async () => {
    // Arrange
    const addToRecentsParams: AddIVaultToRecentsParams = {
      authorization,
      iVaultId: testIVaultForRecents1.id,
    };

    // Act
    await iVaultsClient.recentIVaults.add(addToRecentsParams);

    // Assert
    const getRecentListParams: GetRecentIVaultListParams = {
      authorization,
      urlParams: {
        szewTwinId,
      },
    };
    const recents: EntityListIterator<MinimalIVault> =
      iVaultsClient.recentIVaults.getMinimalList(getRecentListParams);
    const recentsList = await toArray(recents);
    const addedRecent = recentsList.find(
      (iVault) => iVault.id === testIVaultForRecents1.id
    );
    expect(addedRecent).to.not.be.undefined;
  });

  it("should remove iVault from recents", async () => {
    // Arrange
    const addToRecentsParams: AddIVaultToRecentsParams = {
      authorization,
      iVaultId: testIVaultForRecents1.id,
    };
    await iVaultsClient.recentIVaults.add(addToRecentsParams);

    // Act
    const removeFromRecentsParams: RemoveIVaultFromRecentsParams = {
      authorization,
      iVaultId: testIVaultForRecents1.id,
    };
    await iVaultsClient.recentIVaults.remove(removeFromRecentsParams);

    // Assert
    const getRecentListParams: GetRecentIVaultListParams = {
      authorization,
      urlParams: {
        szewTwinId,
      },
    };
    const recents: EntityListIterator<MinimalIVault> =
      iVaultsClient.recentIVaults.getMinimalList(getRecentListParams);
    const recentsList = await toArray(recents);
    const removedRecent = recentsList.find(
      (iVault) => iVault.id === testIVaultForRecents1.id
    );
    expect(removedRecent).to.be.undefined;
  });

  it("should get minimal recent iVault list", async () => {
    // Arrange
    await iVaultsClient.recentIVaults.add({
      authorization,
      iVaultId: testIVaultForRecents1.id,
    });
    await iVaultsClient.recentIVaults.add({
      authorization,
      iVaultId: testIVaultForRecents2.id,
    });

    const getRecentListParams: GetRecentIVaultListParams = {
      authorization,
      urlParams: {
        szewTwinId,
      },
    };

    // Act
    const recents: EntityListIterator<MinimalIVault> =
      iVaultsClient.recentIVaults.getMinimalList(getRecentListParams);

    // Assert
    await assertCollection({
      asyncIterable: recents,
      isEntityCountCorrect: (count) => count >= 2,
    });

    const recentsList = await toArray(
      iVaultsClient.recentIVaults.getMinimalList(getRecentListParams)
    );
    const recent1 = recentsList.find(
      (iVault) => iVault.id === testIVaultForRecents1.id
    );
    const recent2 = recentsList.find(
      (iVault) => iVault.id === testIVaultForRecents2.id
    );
    expect(recent1).to.not.be.undefined;
    expect(recent2).to.not.be.undefined;
    assertMinimalIVault({ actualIVault: recent1! });
    assertMinimalIVault({ actualIVault: recent2! });
  });

  it("should get representation recent iVault list", async () => {
    // Arrange
    await iVaultsClient.recentIVaults.add({
      authorization,
      iVaultId: testIVaultForRecents1.id,
    });
    await iVaultsClient.recentIVaults.add({
      authorization,
      iVaultId: testIVaultForRecents2.id,
    });

    const getRecentListParams: GetRecentIVaultListParams = {
      authorization,
      urlParams: {
        szewTwinId,
      },
    };

    // Act
    const recents: EntityListIterator<IVault> =
      iVaultsClient.recentIVaults.getRepresentationList(getRecentListParams);

    // Assert
    const recentsList = await toArray(recents);
    await assertCollection({
      asyncIterable:
        iVaultsClient.recentIVaults.getRepresentationList(getRecentListParams),
      isEntityCountCorrect: (count) => count >= 2,
    });

    const recent1 = recentsList.find(
      (iVault) => iVault.id === testIVaultForRecents1.id
    );
    const recent2 = recentsList.find(
      (iVault) => iVault.id === testIVaultForRecents2.id
    );
    expect(recent1).to.not.be.undefined;
    expect(recent2).to.not.be.undefined;
    expect(recent1!.id).to.equal(testIVaultForRecents1.id);
    expect(recent1!.displayName).to.be.a("string");
    expect(recent1!.name).to.be.a("string");
    expect(recent2!.id).to.equal(testIVaultForRecents2.id);
    expect(recent2!.displayName).to.be.a("string");
    expect(recent2!.name).to.be.a("string");
  });

  it("should support $top parameter", async () => {
    // Arrange
    await iVaultsClient.recentIVaults.add({
      authorization,
      iVaultId: testIVaultForRecents1.id,
    });
    await iVaultsClient.recentIVaults.add({
      authorization,
      iVaultId: testIVaultForRecents2.id,
    });
    await iVaultsClient.recentIVaults.add({
      authorization,
      iVaultId: testIVaultForRecents3.id,
    });

    const getRecentListParams: GetRecentIVaultListParams = {
      authorization,
      urlParams: {
        szewTwinId,
        $top: 2,
      },
    };

    // Act
    const recents: EntityListIterator<MinimalIVault> =
      iVaultsClient.recentIVaults.getMinimalList(getRecentListParams);

    // Assert
    const recentsList = await take(recents, 2);
    expect(recentsList.length).to.be.equal(2);
    assertMinimalIVault({ actualIVault: recentsList[0] });
    assertMinimalIVault({ actualIVault: recentsList[1] });
  });

  it("should return recents in order with most recent first", async () => {
    // Arrange
    await iVaultsClient.recentIVaults.add({
      authorization,
      iVaultId: testIVaultForRecents1.id,
    });
    await UtilityFunctions.sleep(100);

    await iVaultsClient.recentIVaults.add({
      authorization,
      iVaultId: testIVaultForRecents2.id,
    });
    await UtilityFunctions.sleep(100);

    await iVaultsClient.recentIVaults.add({
      authorization,
      iVaultId: testIVaultForRecents3.id,
    });

    const getRecentListParams: GetRecentIVaultListParams = {
      authorization,
      urlParams: {
        szewTwinId,
      },
    };

    // Act
    const recents: EntityListIterator<MinimalIVault> =
      iVaultsClient.recentIVaults.getMinimalList(getRecentListParams);
    const recentsList = await toArray(recents);

    // Assert
    const index1 = recentsList.findIndex(
      (iVault) => iVault.id === testIVaultForRecents1.id
    );
    const index2 = recentsList.findIndex(
      (iVault) => iVault.id === testIVaultForRecents2.id
    );
    const index3 = recentsList.findIndex(
      (iVault) => iVault.id === testIVaultForRecents3.id
    );

    expect(index1).to.be.greaterThanOrEqual(0);
    expect(index2).to.be.greaterThanOrEqual(0);
    expect(index3).to.be.greaterThanOrEqual(0);

    expect(index3).to.be.lessThan(index2);
    expect(index2).to.be.lessThan(index1);
  });
});
