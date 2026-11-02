/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import {
  AddIVaultToFavoritesParams,
  AuthorizationCallback,
  EntityListIterator,
  GetFavoriteIVaultListParams,
  IVault,
  IVaultsClient,
  IVaultsClientOptions,
  MinimalIVault,
  RemoveIVaultFromFavoritesParams,
  take,
  toArray,
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

describe("[Management] FavoriteIVaultOperations", () => {
  let iVaultsClient: IVaultsClient;
  let authorization: AuthorizationCallback;
  let szewTwinId: string;

  let testIVaultGroup: TestIVaultGroup;
  let testIVaultForFavorites1: IVaultMetadata;
  let testIVaultForFavorites2: IVaultMetadata;
  let testIVaultForFavorites3: IVaultMetadata;

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
      testSuiteName: "FavoriteIVaultOperations",
    });

    const testIVaultCreator = container.get(TestIVaultCreator);
    testIVaultForFavorites1 = await testIVaultCreator.createEmpty(
      testIVaultGroup.getPrefixedUniqueIVaultName("Test iVault for favorites 1")
    );
    testIVaultForFavorites2 = await testIVaultCreator.createEmpty(
      testIVaultGroup.getPrefixedUniqueIVaultName("Test iVault for favorites 2")
    );
    testIVaultForFavorites3 = await testIVaultCreator.createEmpty(
      testIVaultGroup.getPrefixedUniqueIVaultName("Test iVault for favorites 3")
    );
  });

  after(async () => {
    await testIVaultGroup.cleanupIVaults();
  });

  afterEach(async () => {
    // Clean up: ensure all test iVaults are removed from favorites
    for (const testIVault of [
      testIVaultForFavorites1,
      testIVaultForFavorites2,
      testIVaultForFavorites3,
    ]) {
      try {
        const removeFromFavoritesParams: RemoveIVaultFromFavoritesParams = {
          authorization,
          iVaultId: testIVault.id,
        };
        await iVaultsClient.favoriteIVaults.remove(removeFromFavoritesParams);
      } catch {
        // Ignore errors if iVault was not in favorites
      }
    }
  });

  it("should add iVault to favorites", async () => {
    // Arrange
    const addToFavoritesParams: AddIVaultToFavoritesParams = {
      authorization,
      iVaultId: testIVaultForFavorites1.id,
    };

    // Act
    await iVaultsClient.favoriteIVaults.add(addToFavoritesParams);

    // Assert
    const getFavoriteListParams: GetFavoriteIVaultListParams = {
      authorization,
      urlParams: {
        szewTwinId,
      },
    };
    const favorites: EntityListIterator<MinimalIVault> =
      iVaultsClient.favoriteIVaults.getMinimalList(getFavoriteListParams);
    const favoritesList = await toArray(favorites);
    const addedFavorite = favoritesList.find(
      (iVault) => iVault.id === testIVaultForFavorites1.id
    );
    expect(addedFavorite).to.not.be.undefined;
  });

  it("should remove iVault from favorites", async () => {
    // Arrange
    const addToFavoritesParams: AddIVaultToFavoritesParams = {
      authorization,
      iVaultId: testIVaultForFavorites1.id,
    };
    await iVaultsClient.favoriteIVaults.add(addToFavoritesParams);

    // Act
    const removeFromFavoritesParams: RemoveIVaultFromFavoritesParams = {
      authorization,
      iVaultId: testIVaultForFavorites1.id,
    };
    await iVaultsClient.favoriteIVaults.remove(removeFromFavoritesParams);

    // Assert
    const getFavoriteListParams: GetFavoriteIVaultListParams = {
      authorization,
      urlParams: {
        szewTwinId,
      },
    };
    const favorites: EntityListIterator<MinimalIVault> =
      iVaultsClient.favoriteIVaults.getMinimalList(getFavoriteListParams);
    const favoritesList = await toArray(favorites);
    const removedFavorite = favoritesList.find(
      (iVault) => iVault.id === testIVaultForFavorites1.id
    );
    expect(removedFavorite).to.be.undefined;
  });

  it("should get minimal favorite iVault list", async () => {
    // Arrange
    await iVaultsClient.favoriteIVaults.add({
      authorization,
      iVaultId: testIVaultForFavorites1.id,
    });
    await iVaultsClient.favoriteIVaults.add({
      authorization,
      iVaultId: testIVaultForFavorites2.id,
    });

    const getFavoriteListParams: GetFavoriteIVaultListParams = {
      authorization,
      urlParams: {
        szewTwinId,
      },
    };

    // Act
    const favorites: EntityListIterator<MinimalIVault> =
      iVaultsClient.favoriteIVaults.getMinimalList(getFavoriteListParams);

    // Assert
    await assertCollection({
      asyncIterable: favorites,
      isEntityCountCorrect: (count) => count >= 2,
    });

    const favoritesList = await toArray(
      iVaultsClient.favoriteIVaults.getMinimalList(getFavoriteListParams)
    );
    const favorite1 = favoritesList.find(
      (iVault) => iVault.id === testIVaultForFavorites1.id
    );
    const favorite2 = favoritesList.find(
      (iVault) => iVault.id === testIVaultForFavorites2.id
    );
    expect(favorite1).to.not.be.undefined;
    expect(favorite2).to.not.be.undefined;
    assertMinimalIVault({ actualIVault: favorite1! });
    assertMinimalIVault({ actualIVault: favorite2! });
  });

  it("should get representation favorite iVault list", async () => {
    // Arrange
    await iVaultsClient.favoriteIVaults.add({
      authorization,
      iVaultId: testIVaultForFavorites1.id,
    });
    await iVaultsClient.favoriteIVaults.add({
      authorization,
      iVaultId: testIVaultForFavorites2.id,
    });

    const getFavoriteListParams: GetFavoriteIVaultListParams = {
      authorization,
      urlParams: {
        szewTwinId,
      },
    };

    // Act
    const favorites: EntityListIterator<IVault> =
      iVaultsClient.favoriteIVaults.getRepresentationList(
        getFavoriteListParams
      );

    // Assert
    const favoritesList = await toArray(favorites);
    await assertCollection({
      asyncIterable: iVaultsClient.favoriteIVaults.getRepresentationList(
        getFavoriteListParams
      ),
      isEntityCountCorrect: (count) => count >= 2,
    });

    const favorite1 = favoritesList.find(
      (iVault) => iVault.id === testIVaultForFavorites1.id
    );
    const favorite2 = favoritesList.find(
      (iVault) => iVault.id === testIVaultForFavorites2.id
    );
    expect(favorite1).to.not.be.undefined;
    expect(favorite2).to.not.be.undefined;
    expect(favorite1!.id).to.equal(testIVaultForFavorites1.id);
    expect(favorite1!.displayName).to.be.a("string");
    expect(favorite1!.name).to.be.a("string");
    expect(favorite2!.id).to.equal(testIVaultForFavorites2.id);
    expect(favorite2!.displayName).to.be.a("string");
    expect(favorite2!.name).to.be.a("string");
  });

  it("should support $top parameter", async () => {
    // Arrange
    await iVaultsClient.favoriteIVaults.add({
      authorization,
      iVaultId: testIVaultForFavorites1.id,
    });
    await iVaultsClient.favoriteIVaults.add({
      authorization,
      iVaultId: testIVaultForFavorites2.id,
    });
    await iVaultsClient.favoriteIVaults.add({
      authorization,
      iVaultId: testIVaultForFavorites3.id,
    });

    const getFavoriteListParams: GetFavoriteIVaultListParams = {
      authorization,
      urlParams: {
        szewTwinId,
        $top: 2,
      },
    };

    // Act
    const favorites: EntityListIterator<MinimalIVault> =
      iVaultsClient.favoriteIVaults.getMinimalList(getFavoriteListParams);

    // Assert
    const favoritesList = await take(favorites, 2);
    expect(favoritesList.length).to.be.equal(2);
    assertMinimalIVault({ actualIVault: favoritesList[0] });
    assertMinimalIVault({ actualIVault: favoritesList[1] });
  });
});
