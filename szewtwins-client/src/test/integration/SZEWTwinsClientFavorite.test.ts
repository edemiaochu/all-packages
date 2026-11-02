/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import type { AccessToken } from "@szewtwin/core-szewec";
import { beforeAll, describe, expect, it } from "vitest";
import { SZEWTwinsClient } from "../../szewTwinsClient";
import type { SzewecAPIResponse } from "../../types/CommonApiTypes";
import type { SZEWtwinCreate } from "../../types/SZEWTwin";
import { TestConfig } from "../TestConfig";

describe("szewTwinsClient Favorites Functionality", () => {
  const szewTwinsAccessClient: SZEWTwinsClient = new SZEWTwinsClient();
  let accessToken: AccessToken;

  beforeAll(async () => {
    accessToken = await TestConfig.getAccessToken();
  }, 120000);

  it("should get a list of favorited project szewTwins", async () => {
    /* CREATE THE SZEWTWIN */
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM Project szewTwin Test ${new Date().toISOString()}`,
      number: `APIM Project szewTwin Number ${new Date().toISOString()}`,
      type: "Portfolio",
      subClass: "Project",
      class: "Endeavor",
      dataCenterLocation: "East US",
      ianaTimeZone: "America/New_York",
      status: "Trial",
    };

    // Act
    const createResponse =
      await szewTwinsAccessClient.createSZEWTwin(accessToken, newszewTwin);
    const szewTwinId = createResponse.data?.szewTwin?.id;

    try {
      // Assert
      expect(createResponse.status).toBe(201);
      expect(createResponse.data?.szewTwin?.displayName).toBe(newszewTwin.displayName);
      expect(createResponse.data?.szewTwin?.class).toBe(newszewTwin.class);
      expect(createResponse.data?.szewTwin?.subClass).toBe(newszewTwin.subClass);

      /* ADD SZEWTWIN TO FAVORITES */
      const addFavoriteResponse: SzewecAPIResponse<undefined> =
        await szewTwinsAccessClient.addSZEWTwinToFavorites(accessToken, szewTwinId);

      expect(addFavoriteResponse.status).toBe(204);

      /* VERIFY SZEWTWIN IS IN FAVORITES */
      const szewTwinsResponse =
        await szewTwinsAccessClient.getFavoritesSZEWTwins(accessToken, {
          subClass: "Project",
        });

      // Assert
      expect(szewTwinsResponse.status).toBe(200);
      expect(szewTwinsResponse.data?.szewTwins).not.toHaveLength(0);
      const createdTwin = szewTwinsResponse.data?.szewTwins!.find(twin => twin.id === szewTwinId);
      expect(createdTwin).toBeDefined();
      expect(createdTwin?.class).toBe("Endeavor");
      expect(createdTwin?.subClass).toBe("Project");
    } finally {
      // Clean up - Remove from favorites and delete the test szewTwin
      await szewTwinsAccessClient.removeSZEWTwinFromFavorites(accessToken, szewTwinId!);
      const deleteResponse: SzewecAPIResponse<undefined> =
        await szewTwinsAccessClient.deleteSZEWtwin(accessToken, szewTwinId!);
      expect(deleteResponse.status).toBe(204);
    }
  });

  it("should get a list of favorited asset szewTwins", async () => {
    /* CREATE THE SZEWTWIN */
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM Asset szewTwin Test ${new Date().toISOString()}`,
      number: `APIM Asset szewTwin Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      ianaTimeZone: "America/New_York",
      status: "Trial",
    };

    // Act
    const createResponse =
      await szewTwinsAccessClient.createSZEWTwin(accessToken, newszewTwin);
    const szewTwinId = createResponse.data?.szewTwin?.id;

    try {
      // Assert
      expect(createResponse.status).toBe(201);
      expect(createResponse.data?.szewTwin?.displayName).toBe(newszewTwin.displayName);
      expect(createResponse.data?.szewTwin?.class).toBe(newszewTwin.class);
      expect(createResponse.data?.szewTwin?.subClass).toBe(newszewTwin.subClass);

      /* ADD SZEWTWIN TO FAVORITES */
      const addFavoriteResponse: SzewecAPIResponse<undefined> =
        await szewTwinsAccessClient.addSZEWTwinToFavorites(accessToken, szewTwinId);

      expect(addFavoriteResponse.status).toBe(204);

      /* VERIFY SZEWTWIN IS IN FAVORITES */
      const szewTwinsResponse =
        await szewTwinsAccessClient.getFavoritesSZEWTwins(accessToken, {
          subClass: "Asset",
        });

      // Assert
      expect(szewTwinsResponse.status).toBe(200);
      expect(szewTwinsResponse.data?.szewTwins).not.toHaveLength(0);
      const createdTwin = szewTwinsResponse.data!.szewTwins.find(twin => twin.id === szewTwinId);
      expect(createdTwin).toBeDefined();
      expect(createdTwin?.class).toBe("Thing");
      expect(createdTwin?.subClass).toBe("Asset");
    } finally {
      // Clean up - Remove from favorites and delete the test szewTwin
      await szewTwinsAccessClient.removeSZEWTwinFromFavorites(accessToken, szewTwinId!);
      const deleteResponse: SzewecAPIResponse<undefined> =
        await szewTwinsAccessClient.deleteSZEWtwin(accessToken, szewTwinId!);
      expect(deleteResponse.status).toBe(204);
    }
  });

  it("should get a list of favorited project szewTwins without subClass query", async () => {
    /* CREATE THE SZEWTWIN */
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin No SubClass Test ${new Date().toISOString()}`,
      number: `APIM szewTwin No SubClass Number ${new Date().toISOString()}`,
      type: "Portfolio",
      subClass: "Project",
      class: "Endeavor",
      dataCenterLocation: "East US",
      ianaTimeZone: "America/New_York",
      status: "Trial",
    };

    // Act
    const createResponse =
      await szewTwinsAccessClient.createSZEWTwin(accessToken, newszewTwin);
    const szewTwinId = createResponse.data?.szewTwin?.id;

    try {
      // Assert
      expect(createResponse.status).toBe(201);
      expect(createResponse.data?.szewTwin?.displayName).toBe(newszewTwin.displayName);
      expect(createResponse.data?.szewTwin?.class).toBe(newszewTwin.class);
      expect(createResponse.data?.szewTwin?.subClass).toBe(newszewTwin.subClass);

      /* ADD SZEWTWIN TO FAVORITES */
      const addFavoriteResponse: SzewecAPIResponse<undefined> =
        await szewTwinsAccessClient.addSZEWTwinToFavorites(accessToken, szewTwinId);

      expect(addFavoriteResponse.status).toBe(204);

      /* VERIFY SZEWTWIN IS IN FAVORITES */
      const szewTwinsResponse =
        await szewTwinsAccessClient.getFavoritesSZEWTwins(accessToken);

      // Assert
      expect(szewTwinsResponse.status).toBe(200);
      expect(szewTwinsResponse.data?.szewTwins).not.toHaveLength(0);
      const createdTwin = szewTwinsResponse.data?.szewTwins!.find(twin => twin.id === szewTwinId);
      expect(createdTwin).toBeDefined();
    } finally {
      // Clean up - Remove from favorites and delete the test szewTwin
      await szewTwinsAccessClient.removeSZEWTwinFromFavorites(accessToken, szewTwinId!);
      const deleteResponse: SzewecAPIResponse<undefined> =
        await szewTwinsAccessClient.deleteSZEWtwin(accessToken, szewTwinId!);
      expect(deleteResponse.status).toBe(204);
    }
  });

  it("should get more properties of favorited project szewTwins in representation result mode", async () => {
    /* CREATE THE SZEWTWIN */
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM Representation Mode Test ${new Date().toISOString()}`,
      number: `APIM Representation Mode Number ${new Date().toISOString()}`,
      type: "Portfolio",
      subClass: "Project",
      class: "Endeavor",
      dataCenterLocation: "East US",
      ianaTimeZone: "America/New_York",
      status: "Trial",
    };

    // Act
    const createResponse =
      await szewTwinsAccessClient.createSZEWTwin(accessToken, newszewTwin);
    const szewTwinId = createResponse.data?.szewTwin?.id;

    try {
      // Assert
      expect(createResponse.status).toBe(201);
      expect(createResponse.data?.szewTwin?.displayName).toBe(newszewTwin.displayName);
      expect(createResponse.data?.szewTwin?.class).toBe(newszewTwin.class);
      expect(createResponse.data?.szewTwin?.subClass).toBe(newszewTwin.subClass);

      /* ADD SZEWTWIN TO FAVORITES */
      const addFavoriteResponse: SzewecAPIResponse<undefined> =
        await szewTwinsAccessClient.addSZEWTwinToFavorites(accessToken, szewTwinId);

      expect(addFavoriteResponse.status).toBe(204);

      /* VERIFY SZEWTWIN IS IN FAVORITES WITH REPRESENTATION MODE */
      const szewTwinsResponse =
        await szewTwinsAccessClient.getFavoritesSZEWTwins(accessToken, {
          subClass: "Project",
          resultMode: "representation",
        });

      // Assert
      expect(szewTwinsResponse.data?.szewTwins).not.toHaveLength(0);
      const createdTwin = szewTwinsResponse.data!.szewTwins.find(twin => twin.id === szewTwinId);
      expect(createdTwin).toBeDefined();
      expect(createdTwin?.parentId).toBeTypeOf("string");
      expect(createdTwin?.szewTwinAccountId).toBeTypeOf("string");
      expect(createdTwin?.createdDateTime).toBeTypeOf("string");
      expect(createdTwin?.createdBy).toBeTypeOf("string");
    } finally {
      // Clean up - Remove from favorites and delete the test szewTwin
      await szewTwinsAccessClient.removeSZEWTwinFromFavorites(accessToken, szewTwinId!);
      const deleteResponse: SzewecAPIResponse<undefined> =
        await szewTwinsAccessClient.deleteSZEWtwin(accessToken, szewTwinId!);
      expect(deleteResponse.status).toBe(204);
    }
  });

  it("should get a list of favorited project szewTwins using all query scope", async () => {
    /* CREATE THE SZEWTWIN */
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM All Query Scope Test ${new Date().toISOString()}`,
      number: `APIM All Query Scope Number ${new Date().toISOString()}`,
      type: "Portfolio",
      subClass: "Project",
      class: "Endeavor",
      dataCenterLocation: "East US",
      ianaTimeZone: "America/New_York",
      status: "Trial",
    };

    // Act
    const createResponse =
      await szewTwinsAccessClient.createSZEWTwin(accessToken, newszewTwin);
    const szewTwinId = createResponse.data?.szewTwin?.id;

    try {
      // Assert
      expect(createResponse.status).toBe(201);
      expect(createResponse.data?.szewTwin?.displayName).toBe(newszewTwin.displayName);
      expect(createResponse.data?.szewTwin?.class).toBe(newszewTwin.class);
      expect(createResponse.data?.szewTwin?.subClass).toBe(newszewTwin.subClass);

      /* ADD SZEWTWIN TO FAVORITES */
      const addFavoriteResponse: SzewecAPIResponse<undefined> =
        await szewTwinsAccessClient.addSZEWTwinToFavorites(accessToken, szewTwinId);

      expect(addFavoriteResponse.status).toBe(204);

      /* VERIFY SZEWTWIN IS IN FAVORITES WITH ALL QUERY SCOPE */
      const szewTwinsResponse =
        await szewTwinsAccessClient.getFavoritesSZEWTwins(accessToken, {
          queryScope: "all",
          subClass: "Project",
        });

      // Assert
      expect(szewTwinsResponse.status).toBe(200);
      expect(szewTwinsResponse.data?.szewTwins).not.toHaveLength(0);
      const createdTwin = szewTwinsResponse.data!.szewTwins.find(twin => twin.id === szewTwinId);
      expect(createdTwin).toBeDefined();
      expect(createdTwin?.class).toBe("Endeavor");
      expect(createdTwin?.subClass).toBe("Project");
    } finally {
      // Clean up - Remove from favorites and delete the test szewTwin
      await szewTwinsAccessClient.removeSZEWTwinFromFavorites(accessToken, szewTwinId!);
      const deleteResponse: SzewecAPIResponse<undefined> =
        await szewTwinsAccessClient.deleteSZEWtwin(accessToken, szewTwinId!);
      expect(deleteResponse.status).toBe(204);
    }
  });

  it("should get a list of favorited project szewTwins using all query scope (second test)", async () => {
    /* CREATE THE SZEWTWIN */
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM All Query Scope Test 2 ${new Date().toISOString()}`,
      number: `APIM All Query Scope Number 2 ${new Date().toISOString()}`,
      type: "Portfolio",
      subClass: "Project",
      class: "Endeavor",
      dataCenterLocation: "East US",
      ianaTimeZone: "America/New_York",
      status: "Trial",
    };

    // Act
    const createResponse =
      await szewTwinsAccessClient.createSZEWTwin(accessToken, newszewTwin);
    const szewTwinId = createResponse.data?.szewTwin?.id;

    try {
      // Assert
      expect(createResponse.status).toBe(201);
      expect(createResponse.data?.szewTwin?.displayName).toBe(newszewTwin.displayName);
      expect(createResponse.data?.szewTwin?.class).toBe(newszewTwin.class);
      expect(createResponse.data?.szewTwin?.subClass).toBe(newszewTwin.subClass);

      /* ADD SZEWTWIN TO FAVORITES */
      const addFavoriteResponse: SzewecAPIResponse<undefined> =
        await szewTwinsAccessClient.addSZEWTwinToFavorites(accessToken, szewTwinId);

      expect(addFavoriteResponse.status).toBe(204);

      /* VERIFY SZEWTWIN IS IN FAVORITES WITH ALL QUERY SCOPE */
      const szewTwinsResponse =
        await szewTwinsAccessClient.getFavoritesSZEWTwins(accessToken, {
          queryScope: "all",
          subClass: "Project",
        });

      // Assert
      expect(szewTwinsResponse.status).toBe(200);
      expect(szewTwinsResponse.data?.szewTwins).not.toHaveLength(0);
      const createdTwin = szewTwinsResponse.data?.szewTwins!.find(twin => twin.id === szewTwinId);
      expect(createdTwin).toBeDefined();
      expect(createdTwin?.class).toBe("Endeavor");
      expect(createdTwin?.subClass).toBe("Project");
    } finally {
      // Clean up - Remove from favorites and delete the test szewTwin
      await szewTwinsAccessClient.removeSZEWTwinFromFavorites(accessToken, szewTwinId!);
      const deleteResponse: SzewecAPIResponse<undefined> =
        await szewTwinsAccessClient.deleteSZEWtwin(accessToken, szewTwinId!);
      expect(deleteResponse.status).toBe(204);
    }
  });

  it("should return 422 when top query option exceeds maximum allowed value", async () => {
    // Act
    const szewTwinsResponse =
      await szewTwinsAccessClient.getFavoritesSZEWTwins(accessToken, {
        top: 1001, // Exceeds maximum of 1000
      });

    // Assert
    expect(szewTwinsResponse.status).toBe(422);
  });

  it("should return 422 when top query option is negative", async () => {
    // Act
    const szewTwinsResponse =
      await szewTwinsAccessClient.getFavoritesSZEWTwins(accessToken, {
        top: -1, // Negative value not allowed
      });

    // Assert
    expect(szewTwinsResponse.status).toBe(422);
  });

  it("should return 422 when skip query option is negative", async () => {
    // Act
    const szewTwinsResponse =
      await szewTwinsAccessClient.getFavoritesSZEWTwins(accessToken, {
        skip: -1, // Negative value not allowed
      });

    // Assert
    expect(szewTwinsResponse.status).toBe(422);
  });

  it("should return 422 when invalid subClass is provided", async () => {
    // Act
    const szewTwinsResponse =
      await szewTwinsAccessClient.getFavoritesSZEWTwins(accessToken, {
        subClass: "InvalidSubClass" as any, // Invalid subClass value
      });

    // Assert
    expect(szewTwinsResponse.status).toBe(422);
  });

  it("should return 422 when invalid status is provided", async () => {
    // Act
    const szewTwinsResponse =
      await szewTwinsAccessClient.getFavoritesSZEWTwins(accessToken, {
        status: "InvalidStatus" as any, // Invalid status value
      });

    // Assert
    expect(szewTwinsResponse.status).toBe(422);
  });

  it("should return 422 when includeInactive is used with status parameter", async () => {
    // Act
    const szewTwinsResponse =
      await szewTwinsAccessClient.getFavoritesSZEWTwins(accessToken, {
        status: "Active",
        includeInactive: true, // Should not be used together with status
      });

    // Assert
    expect(szewTwinsResponse.status).toBe(422);
  });

  it("should return 404 when trying to add non-existent szewTwin to favorites", async () => {
    // Arrange - Use a random UUID that doesn't exist
    const nonExistentSZEWTwinId = "12345678-1234-1234-1234-123456789abc";

    // Act
    const addFavoriteResponse: SzewecAPIResponse<undefined> =
      await szewTwinsAccessClient.addSZEWTwinToFavorites(accessToken, nonExistentSZEWTwinId);

    // Assert
    expect(addFavoriteResponse.status).toBe(404);
  });

  it("should return 404 when trying to remove non-existent szewTwin from favorites", async () => {
    // Arrange - Use a random UUID that doesn't exist
    const nonExistentSZEWTwinId = "87654321-4321-4321-4321-ba9876543210";

    // Act
    const removeFavoriteResponse: SzewecAPIResponse<undefined> =
      await szewTwinsAccessClient.removeSZEWTwinFromFavorites(accessToken, nonExistentSZEWTwinId);

    // Assert
    expect(removeFavoriteResponse.status).toBe(404);
  });

  it("should create, favorite, and delete an szewTwin", async () => {
    /* CREATE THE SZEWTWIN */
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      ianaTimeZone: "America/New_York",
      status: "Trial",
    };

    // Act
    const createResponse =
      await szewTwinsAccessClient.createSZEWTwin(accessToken, newszewTwin);
    const szewTwinId = createResponse.data?.szewTwin?.id;

    try {
      // Assert
      expect(createResponse.status).toBe(201);
      expect(createResponse.data?.szewTwin?.displayName).toBe(newszewTwin.displayName);
      expect(createResponse.data?.szewTwin?.class).toBe(newszewTwin.class);
      expect(createResponse.data?.szewTwin?.subClass).toBe(newszewTwin.subClass);

      /* ADD SZEWTWIN TO FAVORITES */

      // Act add to favorites
      const addFavoriteResponse: SzewecAPIResponse<undefined> =
        await szewTwinsAccessClient.addSZEWTwinToFavorites(accessToken, szewTwinId);

      // Assert
      expect(addFavoriteResponse.status).toBe(204);
      expect(addFavoriteResponse.data).toBeUndefined();

      /* VERIFY SZEWTWIN IS IN FAVORITES */
      // Act
      let getFavoritesResponse =
        await szewTwinsAccessClient.getFavoritesSZEWTwins(accessToken, {
          displayName: newszewTwin.displayName,
        });
      // Assert
      expect(getFavoritesResponse.status).toBe(200);
      expect(getFavoritesResponse.data?.szewTwins).toHaveLength(1);
      expect(getFavoritesResponse.data?.szewTwins![0].id).toBe(szewTwinId);

      /* DELETE SZEWTWIN FROM FAVORITES */
      const removeFavoriteResponse: SzewecAPIResponse<undefined> =
        await szewTwinsAccessClient.removeSZEWTwinFromFavorites(accessToken, szewTwinId);

      // Assert
      expect(removeFavoriteResponse.status).toBe(204);
      expect(removeFavoriteResponse.data).toBeUndefined();

      /* VERIFY SZEWTWIN IS NOT IN FAVORITES */
      // Act
      getFavoritesResponse = await szewTwinsAccessClient.getFavoritesSZEWTwins(
        accessToken,
        {
          displayName: newszewTwin.displayName,
        }
      );

      // Assert
      expect(getFavoritesResponse.status).toBe(200);
      expect(getFavoritesResponse.data?.szewTwins).toHaveLength(0);
    } finally {
      // Clean up - Delete the test szewTwin
      const deleteResponse: SzewecAPIResponse<undefined> =
        await szewTwinsAccessClient.deleteSZEWtwin(accessToken, szewTwinId!);

      // Assert cleanup was successful
      expect(deleteResponse.status).toBe(204);
      expect(deleteResponse.data).toBeUndefined();
    }
  });
});
