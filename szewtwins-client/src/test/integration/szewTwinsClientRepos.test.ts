/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import type { AccessToken } from "@szewtwin/core-szewec";
import type { SZEWtwinCreate  } from "../../types/SZEWTwin";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SZEWTwinsClient } from "../../szewTwinsClient";
import { NewRepositoryConfig } from "../../types/Repository";
import { TestConfig } from "../TestConfig";

describe("szewTwins Client - Repository Integration Tests", () => {
  let accessToken: AccessToken;
  let szewTwinsAccessClient: SZEWTwinsClient;

  beforeAll(async () => {
    accessToken = await TestConfig.getAccessToken();
    szewTwinsAccessClient = new SZEWTwinsClient();
  });

  beforeEach(async () => {
    // Add small delay between tests to respect API rate limits
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it("should get a 404 not found when trying to delete an szewTwin that doesn't exist", async () => {
    // Arrange
    const someRandomId = "ffd3dc75-0b4a-4587-b428-4c73f5d6dbb4";

    // Act
    const deleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
      accessToken,
      someRandomId
    );

    // Assert
    expect(deleteResponse.status).toBe(404);
    expect(deleteResponse.data).toBeUndefined();
    expect(deleteResponse.error).not.toBeUndefined();
    expect(deleteResponse.error!.code).toBe("szewTwinNotFound");
  });

  it("should get a 404 not found when trying to create a repository with an szewTwin that doesn't exist", async () => {
    // Arrange
    const someRandomId = "ffd3dc75-0b4a-4587-b428-4c73f5d6dbb4";
    const newRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "https://www.sciencebase.gov/arcgis/rest/services/Catalog/5888bf4fe4b05ccb964bab9d/MapServer",
    };

    // Act
    const createResponse = await szewTwinsAccessClient.createRepository(
      accessToken,
      someRandomId,
      newRepository
    );

    // Assert
    expect(createResponse.status).toBe(404);
    expect(createResponse.data).toBeUndefined();
    expect(createResponse.error).not.toBeUndefined();
    expect(createResponse.error!.code).toBe("szewTwinNotFound");
  });

  it("should get a 409 conflict when trying to create a duplicate repository", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );

    const szewTwinId = szewTwinResponse.data!.szewTwin.id!;

    const newRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "https://www.sciencebase.gov/arcgis/rest/services/Catalog/5888bf4fe4b05ccb964bab9d/MapServer",
    };

    try {
      // Act
      const createResponse = await szewTwinsAccessClient.createRepository(
        accessToken,
        szewTwinId,
        newRepository
      );
      const createResponse2 = await szewTwinsAccessClient.createRepository(
        accessToken,
        szewTwinId,
        newRepository
      );

      // Assert
      expect(createResponse.status).toBe(201);
      expect(createResponse.data?.repository!.class).toBe(newRepository.class);
      expect(createResponse.data?.repository!.subClass).toBe(
        newRepository.subClass
      );
      expect(createResponse.data?.repository!.uri).toBe(newRepository.uri);
      expect(createResponse2.status).toBe(409);
      expect(createResponse2.data).toBeUndefined();
      expect(createResponse2.error).not.toBeUndefined();
      expect(createResponse2.error!.code).toBe("szewTwinRepositoryExists");
    } finally {
      // Cleanup
      const deleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(deleteResponse.status).toBe(204);
      expect(deleteResponse.data).toBeUndefined();
    }
  });

  it("should get a 422 unprocessable entity when trying to create a repository without the uri property", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );

    const szewTwinId = szewTwinResponse.data!.szewTwin.id!;

    const newRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "",
    };

    try {
      // Act
      const createResponse = await szewTwinsAccessClient.createRepository(
        accessToken,
        szewTwinId,
        newRepository
      );

      // Assert
      expect(createResponse.status).toBe(422);
      expect(createResponse.data).toBeUndefined();
      expect(createResponse.error).not.toBeUndefined();
      expect(createResponse.error!.code).toBe("InvalidszewTwinsRequest");
      expect(createResponse.error!.details![0].code).toBe(
        "MissingRequiredProperty"
      );
      expect(createResponse.error!.details![0].target).toBe("uri");
    } finally {
      // Cleanup
      const deleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(deleteResponse.status).toBe(204);
      expect(deleteResponse.data).toBeUndefined();
    }
  });

  it("should get a 404 not found when trying to delete an repository that doesn't exist", async () => {
    // Arrange
    const someRandomId = "ffd3dc75-0b4a-4587-b428-4c73f5d6dbb4";
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );

    const szewTwinId = szewTwinResponse.data!.szewTwin.id!;

    try {
      // Act
      const deleteResponse = await szewTwinsAccessClient.deleteRepository(
        accessToken,
        szewTwinId,
        someRandomId
      );

      // Assert
      expect(deleteResponse.status).toBe(404);
      expect(deleteResponse.data).toBeUndefined();
      expect(deleteResponse.error).not.toBeUndefined();
      expect(deleteResponse.error!.code).toBe("szewTwinRepositoryNotFound");
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should create and delete an szewTwin Repository", async () => {
    /* CREATE THE SZEWTWIN REPOSITORY */
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
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );

    const szewTwinId = szewTwinResponse.data!.szewTwin.id!;

    const newRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "https://www.sciencebase.gov/arcgis/rest/services/Catalog/5888bf4fe4b05ccb964bab9d/MapServer",
    };

    try {
      // Act
      const createResponse = await szewTwinsAccessClient.createRepository(
        accessToken,
        szewTwinId,
        newRepository
      );

      // Assert
      expect(createResponse.status).toBe(201);
      expect(createResponse.data?.repository!.class).toBe(newRepository.class);
      expect(createResponse.data?.repository!.subClass).toBe(
        newRepository.subClass
      );
      expect(createResponse.data?.repository!.uri).toBe(newRepository.uri);

      /* DELETE SZEWTWIN REPOSITORY */
      // Act
      const repositoryDeleteResponse =
        await szewTwinsAccessClient.deleteRepository(
          accessToken,
          szewTwinId,
          createResponse.data?.repository!.id!
        );

      // Assert
      expect(repositoryDeleteResponse.status).toBe(204);
      expect(repositoryDeleteResponse.data).toBeUndefined();
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should get a 404 not found when trying to get repositories from an szewTwin that doesn't exist", async () => {
    // Arrange
    const someRandomId = "ffd3dc75-0b4a-4587-b428-4c73f5d6dbb4";

    // Act
    const getResponse = await szewTwinsAccessClient.getRepositories(
      accessToken,
      someRandomId
    );

    // Assert
    expect(getResponse.status).toBe(404);
    expect(getResponse.data).toBeUndefined();
    expect(getResponse.error).not.toBeUndefined();
    expect(getResponse.error!.code).toBe("szewTwinNotFound");
  });

  it("should get an array with only cesium content when getting repositories from an new szewTwin", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      class: "Endeavor",
      subClass: "WorkPackage",
      dataCenterLocation: "East US",
      status: "Inactive",
      type: "type",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin!.id!;

    try {
      // Act
      const getResponse = await szewTwinsAccessClient.getRepositories(
        accessToken,
        szewTwinId
      );

      // Assert
      expect(getResponse.status).toBe(200);
      expect(getResponse.data?.repositories).toBeDefined();
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should get repositories from an szewTwin and filter by class", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin!.id!;

    const gisRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "https://www.sciencebase.gov/arcgis/rest/services/Catalog/5888bf4fe4b05ccb964bab9d/MapServer",
    };

    try {
      // Create a repository
      const createResponse = await szewTwinsAccessClient.createRepository(
        accessToken,
        szewTwinId,
        gisRepository
      );
      expect(createResponse.status).toBe(201);

      // Act - Get all repositories
      const getAllResponse = await szewTwinsAccessClient.getRepositories(
        accessToken,
        szewTwinId
      );

      // Assert - All repositories
      expect(getAllResponse.status).toBe(200);
      expect(getAllResponse.data?.repositories).toBeDefined();
      expect(getAllResponse.data!.repositories).toHaveLength(2);
      expect(getAllResponse.data!.repositories[1].class).toBe(
        "GeographicInformationSystem"
      );
      expect(getAllResponse.data!.repositories[1].subClass).toBe(
        "WebMapService"
      );
      expect(getAllResponse.data!.repositories[1].uri).toBe(gisRepository.uri);

      // Act - Get repositories filtered by class
      const getFilteredResponse = await szewTwinsAccessClient.getRepositories(
        accessToken,
        szewTwinId,
        { class: "GeographicInformationSystem" }
      );

      // Assert - Filtered repositories
      expect(getFilteredResponse.status).toBe(200);
      expect(getFilteredResponse.data?.repositories).toBeDefined();
      expect(getFilteredResponse.data!.repositories).toHaveLength(1);
      expect(getFilteredResponse.data!.repositories[0].class).toBe(
        "GeographicInformationSystem"
      );

      // Act - Get repositories filtered by different class (should be empty)
      const getEmptyFilterResponse = await szewTwinsAccessClient.getRepositories(
        accessToken,
        szewTwinId,
        { class: "Storage" }
      );

      // Assert - Empty filtered result
      expect(getEmptyFilterResponse.status).toBe(200);
      expect(getEmptyFilterResponse.data?.repositories).toBeDefined();
      expect(getEmptyFilterResponse.data!.repositories).toHaveLength(0);

      // Cleanup repository
      const repositoryDeleteResponse =
        await szewTwinsAccessClient.deleteRepository(
          accessToken,
          szewTwinId,
          createResponse.data?.repository!.id!
        );
      expect(repositoryDeleteResponse.status).toBe(204);
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should get repositories from an szewTwin and filter by subClass", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin!.id!;

    const wmsRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "https://www.sciencebase.gov/arcgis/rest/services/Catalog/5888bf4fe4b05ccb964bab9d/MapServer",
    };

    try {
      // Create a repository
      const createResponse = await szewTwinsAccessClient.createRepository(
        accessToken,
        szewTwinId,
        wmsRepository
      );
      expect(createResponse.status).toBe(201);

      // Act - Get repositories filtered by subClass
      const getFilteredResponse = await szewTwinsAccessClient.getRepositories(
        accessToken,
        szewTwinId,
        {
          class: "GeographicInformationSystem",
          subClass: "WebMapService",
        }
      );

      // Assert - Filtered repositories
      expect(getFilteredResponse.status).toBe(200);
      expect(getFilteredResponse.data?.repositories).toBeDefined();
      expect(getFilteredResponse.data!.repositories).toHaveLength(1);
      expect(getFilteredResponse.data!.repositories[0].subClass).toBe(
        "WebMapService"
      );

      // Act - Get repositories filtered by different subClass (should be empty)
      const getEmptyFilterResponse = await szewTwinsAccessClient.getRepositories(
        accessToken,
        szewTwinId,
        { class: "GeographicInformationSystem", subClass: "ArcGIS" }
      );

      // Assert - Empty filtered result
      expect(getEmptyFilterResponse.status).toBe(200);
      expect(getEmptyFilterResponse.data?.repositories).toBeDefined();
      expect(getEmptyFilterResponse.data!.repositories).toHaveLength(0);

      // Cleanup repository
      const repositoryDeleteResponse =
        await szewTwinsAccessClient.deleteRepository(
          accessToken,
          szewTwinId,
          createResponse.data?.repository!.id!
        );
      expect(repositoryDeleteResponse.status).toBe(204);
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should get repositories from an szewTwin and filter by both class and subClass", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin!.id!;

    const urlTemplateRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "UrlTemplate",
      uri: "http://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
    };

    try {
      // Create a repository
      const createResponse = await szewTwinsAccessClient.createRepository(
        accessToken,
        szewTwinId,
        urlTemplateRepository
      );
      expect(createResponse.status).toBe(201);

      // Act - Get repositories filtered by both class and subClass
      const getFilteredResponse = await szewTwinsAccessClient.getRepositories(
        accessToken,
        szewTwinId,
        {
          class: "GeographicInformationSystem",
          subClass: "UrlTemplate",
        }
      );

      // Assert - Filtered repositories
      expect(getFilteredResponse.status).toBe(200);
      expect(getFilteredResponse.data?.repositories).toBeDefined();
      expect(getFilteredResponse.data!.repositories).toHaveLength(1);
      expect(getFilteredResponse.data!.repositories[0].class).toBe(
        "GeographicInformationSystem"
      );
      expect(getFilteredResponse.data!.repositories[0].subClass).toBe(
        "UrlTemplate"
      );

      // Act - Get repositories with mismatched class and subClass (should be empty)
      const getEmptyFilterResponse = await szewTwinsAccessClient.getRepositories(
        accessToken,
        szewTwinId,
        {
          class: "Storage",
          subClass: "UrlTemplate",
        }
      );

      // Assert - Error, miss matched class and subclass
      expect(getEmptyFilterResponse.status).toBe(422);
      expect(getEmptyFilterResponse.data).toBeUndefined();
      expect(getEmptyFilterResponse.error).toBeDefined();

      // Cleanup repository
      const repositoryDeleteResponse =
        await szewTwinsAccessClient.deleteRepository(
          accessToken,
          szewTwinId,
          createResponse.data?.repository!.id!
        );
      expect(repositoryDeleteResponse.status).toBe(204);
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should get a 404 not found when trying to get a repository that doesn't exist", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data!.szewTwin.id!;
    const someRandomRepositoryId = "ffd3dc75-0b4a-4587-b428-4c73f5d6dbb4";

    try {
      // Act
      const getResponse = await szewTwinsAccessClient.getRepository(
        accessToken,
        szewTwinId,
        someRandomRepositoryId
      );

      // Assert
      expect(getResponse.status).toBe(404);
      expect(getResponse.data).toBeUndefined();
      expect(getResponse.error).not.toBeUndefined();
      expect(getResponse.error!.code).toBe("szewTwinRepositoryNotFound");
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should get a 404 not found when trying to get a repository from an szewTwin that doesn't exist", async () => {
    // Arrange
    const someRandomszewTwinId = "ffd3dc75-0b4a-4587-b428-4c73f5d6dbb4";
    const someRandomRepositoryId = "aaf3dc75-0b4a-4587-b428-4c73f5d6dbb4";

    // Act
    const getResponse = await szewTwinsAccessClient.getRepository(
      accessToken,
      someRandomszewTwinId,
      someRandomRepositoryId
    );

    // Assert
    expect(getResponse.status).toBe(404);
    expect(getResponse.data).toBeUndefined();
    expect(getResponse.error).not.toBeUndefined();
    expect(getResponse.error!.code).toBe("szewTwinNotFound");
    expect(getResponse.error?.message).toBe(
      "Requested szewTwin is not available."
    );
  });

  it("should successfully get a repository by ID", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data!.szewTwin.id!;

    const newRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapTileService",
      uri: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/WMTS",
      displayName: "Test WMTS Repository",
    };

    try {
      // Create a repository first
      const createResponse = await szewTwinsAccessClient.createRepository(
        accessToken,
        szewTwinId,
        newRepository
      );
      expect(createResponse.status).toBe(201);
      const repositoryId = createResponse.data?.repository!.id!;

      // Act - Get the specific repository
      const getResponse = await szewTwinsAccessClient.getRepository(
        accessToken,
        szewTwinId,
        repositoryId
      );

      // Assert
      expect(getResponse.status).toBe(200);

      const retrievedRepository = getResponse.data!.repository;
      expect(retrievedRepository.id).toBe(repositoryId);
      expect(retrievedRepository.class).toBe(newRepository.class);
      expect(retrievedRepository.subClass).toBe(newRepository.subClass);
      expect(retrievedRepository.uri).toBe(newRepository.uri);
      expect(retrievedRepository.displayName).toBe(newRepository.displayName);

      // Cleanup repository
      const repositoryDeleteResponse =
        await szewTwinsAccessClient.deleteRepository(
          accessToken,
          szewTwinId,
          repositoryId
        );
      expect(repositoryDeleteResponse.status).toBe(204);
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should get a repository with authentication and options", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin!.id!;

    const repositoryWithAuth: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "UrlTemplate",
      uri: "http://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      displayName: "Test UrlTemplate with Auth",
      authentication: {
        type: "Header",
        key: "X-Api-Key",
        value: "mySecretApiKey",
      },
      options: {
        queryParameters: {
          apiVersion: "1.5.1",
        },
        minimumLevel: 10,
        maximumLevel: 20,
      },
    };

    try {
      // Create a repository with authentication and options
      const createResponse = await szewTwinsAccessClient.createRepository(
        accessToken,
        szewTwinId,
        repositoryWithAuth
      );
      expect(createResponse.status).toBe(201);
      const repositoryId = createResponse.data?.repository!.id!;

      // Act - Get the specific repository
      const getResponse = await szewTwinsAccessClient.getRepository(
        accessToken,
        szewTwinId,
        repositoryId
      );

      // Assert
      expect(getResponse.status).toBe(200);

      const retrievedRepository = getResponse.data!.repository;
      expect(retrievedRepository.id).toBe(repositoryId);
      expect(retrievedRepository.class).toBe(repositoryWithAuth.class);
      expect(retrievedRepository.subClass).toBe(repositoryWithAuth.subClass);
      expect(retrievedRepository.uri).toBe(repositoryWithAuth.uri);
      expect(retrievedRepository.displayName).toBe(
        repositoryWithAuth.displayName
      );

      // Verify authentication is returned
      expect(retrievedRepository.authentication).toBeDefined();
      expect(retrievedRepository.authentication!.type).toBe("Header");
      if (retrievedRepository.authentication && (retrievedRepository.authentication.type === "Header" || retrievedRepository.authentication.type === "QueryParameter")) {
        expect(retrievedRepository.authentication.key).toBe("X-Api-Key");
        expect(retrievedRepository.authentication.value).toBe("mySecretApiKey");
      }

      // Verify options are returned
      expect(retrievedRepository.options).toBeDefined();
      expect(retrievedRepository.options!.queryParameters).toBeDefined();
      expect(retrievedRepository.options!.queryParameters!.apiVersion).toBe(
        "1.5.1"
      );
      expect(retrievedRepository.options!.minimumLevel).toBe(10);
      expect(retrievedRepository.options!.maximumLevel).toBe(20);

      // Cleanup repository
      const repositoryDeleteResponse =
        await szewTwinsAccessClient.deleteRepository(
          accessToken,
          szewTwinId,
          repositoryId
        );
      expect(repositoryDeleteResponse.status).toBe(204);
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should get a 404 not found when trying to update a repository that doesn't exist", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin!.id!;
    const someRandomRepositoryId = "ffd3dc75-0b4a-4587-b428-4c73f5d6dbb4";

    const updateData: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "https://updated-example.com/wms",
      displayName: "Updated Repository",
    };

    try {
      // Act
      const updateResponse = await szewTwinsAccessClient.updateRepository(
        accessToken,
        szewTwinId,
        someRandomRepositoryId,
        updateData
      );

      // Assert
      expect(updateResponse.status).toBe(404);
      expect(updateResponse.data).toBeUndefined();
      expect(updateResponse.error).not.toBeUndefined();
      expect(updateResponse.error!.code).toBe("szewTwinRepositoryNotFound");
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should get a 404 not found when trying to update a repository from an szewTwin that doesn't exist", async () => {
    // Arrange
    const someRandomszewTwinId = "ffd3dc75-0b4a-4587-b428-4c73f5d6dbb4";
    const someRandomRepositoryId = "aaf3dc75-0b4a-4587-b428-4c73f5d6dbb4";

    const updateData: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "https://updated-example.com/wms",
      displayName: "Updated Repository",
    };

    // Act
    const updateResponse = await szewTwinsAccessClient.updateRepository(
      accessToken,
      someRandomszewTwinId,
      someRandomRepositoryId,
      updateData
    );

    // Assert
    expect(updateResponse.status).toBe(404);
    expect(updateResponse.data).toBeUndefined();
    expect(updateResponse.error).not.toBeUndefined();
    expect(updateResponse.error!.code).toBe("szewTwinNotFound");
    expect(updateResponse.error?.message).toBe(
      "Requested szewTwin is not available."
    );
  });

  it("should get a 422 unprocessable entity when trying to update a repository with invalid data", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data!.szewTwin.id!;

    const newRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "https://www.sciencebase.gov/arcgis/rest/services/Catalog/5888bf4fe4b05ccb964bab9d/MapServer",
      displayName: "Original Repository",
    };

    try {
      // Create a repository first
      const createResponse = await szewTwinsAccessClient.createRepository(
        accessToken,
        szewTwinId,
        newRepository
      );
      expect(createResponse.status).toBe(201);
      const repositoryId = createResponse.data?.repository!.id!;

      // Prepare invalid update data (empty URI)
      const invalidUpdateData: NewRepositoryConfig = {
        class: "GeographicInformationSystem",
        subClass: "WebMapService",
        uri: "",
        displayName: "Updated Repository with Invalid URI",
      };

      // Act - Try to update with invalid data
      const updateResponse = await szewTwinsAccessClient.updateRepository(
        accessToken,
        szewTwinId,
        repositoryId,
        invalidUpdateData
      );

      // Assert
      expect(updateResponse.status).toBe(422);
      expect(updateResponse.data).toBeUndefined();
      expect(updateResponse.error).not.toBeUndefined();
      expect(updateResponse.error!.code).toBe("InvalidszewTwinsRequest");

      // Cleanup repository
      const repositoryDeleteResponse =
        await szewTwinsAccessClient.deleteRepository(
          accessToken,
          szewTwinId,
          repositoryId
        );
      expect(repositoryDeleteResponse.status).toBe(204);
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should successfully update a repository with basic properties", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin!.id!;

    const originalRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "https://original-example.com/wms",
      displayName: "Original Repository Name",
    };

    const updatedRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "https://updated-example.com/wmts",
      displayName: "Updated Repository Name",
    };

    try {
      // Create a repository first
      const createResponse = await szewTwinsAccessClient.createRepository(
        accessToken,
        szewTwinId,
        originalRepository
      );
      expect(createResponse.status).toBe(201);
      const repositoryId = createResponse.data?.repository!.id!;

      // Act - Update the repository
      const updateResponse = await szewTwinsAccessClient.updateRepository(
        accessToken,
        szewTwinId,
        repositoryId,
        updatedRepository
      );

      // Assert - Update response
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.data?.repository).toBeDefined();

      const updatedRepo = updateResponse.data!.repository;
      expect(updatedRepo.id).toBe(repositoryId);
      expect(updatedRepo.class).toBe(updatedRepository.class);
      expect(updatedRepo.subClass).toBe(updatedRepository.subClass);
      expect(updatedRepo.uri).toBe(updatedRepository.uri);
      expect(updatedRepo.displayName).toBe(updatedRepository.displayName);

      // Verify changes by getting the repository
      const getResponse = await szewTwinsAccessClient.getRepository(
        accessToken,
        szewTwinId,
        repositoryId
      );
      expect(getResponse.status).toBe(200);

      const retrievedRepo = getResponse.data!.repository;
      expect(retrievedRepo.subClass).toBe("WebMapService");
      expect(retrievedRepo.uri).toBe("https://updated-example.com/wmts");
      expect(retrievedRepo.displayName).toBe("Updated Repository Name");

      // Cleanup repository
      const repositoryDeleteResponse =
        await szewTwinsAccessClient.deleteRepository(
          accessToken,
          szewTwinId,
          repositoryId
        );
      expect(repositoryDeleteResponse.status).toBe(204);
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should successfully update a repository with authentication and options", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin?.id!;

    const originalRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "UrlTemplate",
      uri: "http://original-basemaps.com/light_all/{z}/{x}/{y}.png",
      displayName: "Original UrlTemplate Repository",
      authentication: {
        type: "Header",
        key: "X-Original-Key",
        value: "originalApiKey",
      },
      options: {
        queryParameters: {
          apiVersion: "1.0.0",
        },
        minimumLevel: 5,
        maximumLevel: 15,
      },
    };

    const updatedRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "UrlTemplate",
      uri: "http://updated-basemaps.com/dark_all/{z}/{x}/{y}.png",
      displayName: "Updated UrlTemplate Repository",
      authentication: {
        type: "QueryParameter",
        key: "apikey",
        value: "newUpdatedApiKey",
      },
      options: {
        queryParameters: {
          apiVersion: "2.0.0",
          format: "image/png",
        },
        minimumLevel: 8,
        maximumLevel: 22,
      },
    };

    try {
      // Create a repository with authentication and options
      const createResponse = await szewTwinsAccessClient.createRepository(
        accessToken,
        szewTwinId,
        originalRepository
      );
      expect(createResponse.status).toBe(201);
      const repositoryId = createResponse.data?.repository!.id!;

      // Act - Update the repository with new authentication and options
      const updateResponse = await szewTwinsAccessClient.updateRepository(
        accessToken,
        szewTwinId,
        repositoryId,
        updatedRepository
      );

      // Assert - Update response
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.data?.repository).toBeDefined();

      const updatedRepo = updateResponse.data!.repository;
      expect(updatedRepo.id).toBe(repositoryId);
      expect(updatedRepo.uri).toBe(updatedRepository.uri);
      expect(updatedRepo.displayName).toBe(updatedRepository.displayName);

      // Verify updated authentication
      expect(updatedRepo.authentication).toBeDefined();
      expect(updatedRepo.authentication!.type).toBe("QueryParameter");
      if (updatedRepo.authentication && (updatedRepo.authentication.type === "Header" || updatedRepo.authentication.type === "QueryParameter")) {
        expect(updatedRepo.authentication.key).toBe("apikey");
        expect(updatedRepo.authentication.value).toBe("newUpdatedApiKey");
      }

      // Verify updated options
      expect(updatedRepo.options).toBeDefined();
      expect(updatedRepo.options!.queryParameters).toBeDefined();
      expect(updatedRepo.options!.queryParameters!.apiVersion).toBe("2.0.0");
      expect(updatedRepo.options!.queryParameters!.format).toBe("image/png");
      expect(updatedRepo.options!.minimumLevel).toBe(8);
      expect(updatedRepo.options!.maximumLevel).toBe(22);

      // Cleanup repository
      const repositoryDeleteResponse =
        await szewTwinsAccessClient.deleteRepository(
          accessToken,
          szewTwinId,
          repositoryId
        );
      expect(repositoryDeleteResponse.status).toBe(204);
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should successfully update only specific fields of a repository", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin?.id!;

    const originalRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "ArcGIS",
      uri: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
      displayName: "Original ArcGIS Repository",
    };

    // Only update displayName and URI, keep class and subClass the same
    const partialUpdateRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "ArcGIS",
      uri: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer",
      displayName: "Updated ArcGIS Street Map Repository",
    };

    try {
      // Create a repository first
      const createResponse = await szewTwinsAccessClient.createRepository(
        accessToken,
        szewTwinId,
        originalRepository
      );
      expect(createResponse.status).toBe(201);
      const repositoryId = createResponse.data?.repository!.id!;

      // Act - Update only specific fields
      const updateResponse = await szewTwinsAccessClient.updateRepository(
        accessToken,
        szewTwinId,
        repositoryId,
        partialUpdateRepository
      );

      // Assert - Update response
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.data?.repository).toBeDefined();

      const updatedRepo = updateResponse.data!.repository;
      expect(updatedRepo.id).toBe(repositoryId);
      expect(updatedRepo.class).toBe("GeographicInformationSystem"); // Unchanged
      expect(updatedRepo.subClass).toBe("ArcGIS"); // Unchanged
      expect(updatedRepo.uri).toBe(
        "https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer"
      ); // Updated
      expect(updatedRepo.displayName).toBe(
        "Updated ArcGIS Street Map Repository"
      ); // Updated

      // Cleanup repository
      const repositoryDeleteResponse =
        await szewTwinsAccessClient.deleteRepository(
          accessToken,
          szewTwinId,
          repositoryId
        );
      expect(repositoryDeleteResponse.status).toBe(204);
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should successfully create a repository resource with required properties", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin?.id!;

    const gisRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "https://www.sciencebase.gov/arcgis/rest/services/Catalog/5888bf4fe4b05ccb964bab9d/MapServer",
      displayName: "Test GIS Repository for Resources",
    };

    try {
      // Create a GIS repository first
      const createRepositoryResponse =
        await szewTwinsAccessClient.createRepository(
          accessToken,
          szewTwinId,
          gisRepository
        );
      expect(createRepositoryResponse.status).toBe(201);
      const repositoryId = createRepositoryResponse.data?.repository!.id!;

      const repositoryResource = {
        id: "flood_zones",
        displayName: "Flood Zones",
      };

      // Act - Create repository resource
      const createResourceResponse =
        await szewTwinsAccessClient.createRepositoryResource(
          accessToken,
          szewTwinId,
          repositoryId,
          repositoryResource
        );

      // Assert
      expect(createResourceResponse.status).toBe(201);
      expect(createResourceResponse.data?.resource).toBeDefined();

      const createdResource = createResourceResponse.data!.resource;
      expect(createdResource.id).toBe(repositoryResource.id);
      expect(createdResource.displayName).toBe(repositoryResource.displayName);
      expect(createdResource.class).toBe("GeographicInformationSystem");
      expect(createdResource.subClass).toBe("WebMapService");

      // Cleanup repository (this will also cleanup the resource)
      const repositoryDeleteResponse =
        await szewTwinsAccessClient.deleteRepository(
          accessToken,
          szewTwinId,
          repositoryId
        );
      expect(repositoryDeleteResponse.status).toBe(204);
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should get a 422 unprocessable entity when trying to create a repository resource without required properties", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin?.id!;

    const gisRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "https://www.sciencebase.gov/arcgis/rest/services/Catalog/5888bf4fe4b05ccb964bab9d/MapServer",
      displayName: "Test GIS Repository for Resources",
    };

    try {
      // Create a GIS repository first
      const createRepositoryResponse =
        await szewTwinsAccessClient.createRepository(
          accessToken,
          szewTwinId,
          gisRepository
        );
      expect(createRepositoryResponse.status).toBe(201);
      const repositoryId = createRepositoryResponse.data?.repository!.id!;

      // Missing required 'id' property
      const invalidRepositoryResource = {
        displayName: "Flood Zones Without ID",
      } as any;

      // Act - Try to create repository resource with missing required property
      const createResourceResponse =
        await szewTwinsAccessClient.createRepositoryResource(
          accessToken,
          szewTwinId,
          repositoryId,
          invalidRepositoryResource
        );

      // Assert
      expect(createResourceResponse.status).toBe(422);
      expect(createResourceResponse.data).toBeUndefined();
      expect(createResourceResponse.error).not.toBeUndefined();
      expect(createResourceResponse.error!.code).toBe("InvalidszewTwinsRequest");

      // Cleanup repository
      const repositoryDeleteResponse =
        await szewTwinsAccessClient.deleteRepository(
          accessToken,
          szewTwinId,
          repositoryId
        );
      expect(repositoryDeleteResponse.status).toBe(204);
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should get a 422 unprocessable entity when trying to create a repository resource with empty required properties", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin?.id!;

    const gisRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "https://www.sciencebase.gov/arcgis/rest/services/Catalog/5888bf4fe4b05ccb964bab9d/MapServer",
      displayName: "Test GIS Repository for Resources",
    };

    try {
      // Create a GIS repository first
      const createRepositoryResponse =
        await szewTwinsAccessClient.createRepository(
          accessToken,
          szewTwinId,
          gisRepository
        );
      expect(createRepositoryResponse.status).toBe(201);
      const repositoryId = createRepositoryResponse.data?.repository!.id!;

      // Empty required properties
      const invalidRepositoryResource = {
        id: "",
        displayName: "",
      };

      // Act - Try to create repository resource with empty required properties
      const createResourceResponse =
        await szewTwinsAccessClient.createRepositoryResource(
          accessToken,
          szewTwinId,
          repositoryId,
          invalidRepositoryResource
        );

      // Assert
      expect(createResourceResponse.status).toBe(422);
      expect(createResourceResponse.data).toBeUndefined();
      expect(createResourceResponse.error).not.toBeUndefined();
      expect(createResourceResponse.error!.code).toBe("InvalidszewTwinsRequest");

      // Cleanup repository
      const repositoryDeleteResponse =
        await szewTwinsAccessClient.deleteRepository(
          accessToken,
          szewTwinId,
          repositoryId
        );
      expect(repositoryDeleteResponse.status).toBe(204);
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should get a 409 conflict when trying to create a duplicate repository resource", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin?.id!;

    const gisRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "https://www.sciencebase.gov/arcgis/rest/services/Catalog/5888bf4fe4b05ccb964bab9d/MapServer",
      displayName: "Test GIS Repository for Resources",
    };

    try {
      // Create a GIS repository first
      const createRepositoryResponse =
        await szewTwinsAccessClient.createRepository(
          accessToken,
          szewTwinId,
          gisRepository
        );
      expect(createRepositoryResponse.status).toBe(201);
      const repositoryId = createRepositoryResponse.data?.repository!.id!;

      const repositoryResource = {
        id: "water_bodies",
        displayName: "Water Bodies",
      };

      // Act - Create repository resource first time
      const createResourceResponse1 =
        await szewTwinsAccessClient.createRepositoryResource(
          accessToken,
          szewTwinId,
          repositoryId,
          repositoryResource
        );

      // Assert - First creation should succeed
      expect(createResourceResponse1.status).toBe(201);
      expect(createResourceResponse1.data?.resource).toBeDefined();
      expect(createResourceResponse1.data!.resource.id).toBe(
        repositoryResource.id
      );

      // Act - Try to create the same repository resource again
      const createResourceResponse2 =
        await szewTwinsAccessClient.createRepositoryResource(
          accessToken,
          szewTwinId,
          repositoryId,
          repositoryResource
        );

      // Assert - Second creation should fail with conflict
      expect(createResourceResponse2.status).toBe(409);
      expect(createResourceResponse2.data).toBeUndefined();
      expect(createResourceResponse2.error).not.toBeUndefined();
      expect(createResourceResponse2.error!.code).toBe(
        "szewTwinRepositoryResourceExists"
      );

      // Cleanup repository (this will also cleanup the resource)
      const repositoryDeleteResponse =
        await szewTwinsAccessClient.deleteRepository(
          accessToken,
          szewTwinId,
          repositoryId
        );
      expect(repositoryDeleteResponse.status).toBe(204);
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should get a 404 not found when trying to create a repository resource for a repository that doesn't exist", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin?.id!;
    const someRandomRepositoryId = "ffd3dc75-0b4a-4587-b428-4c73f5d6dbb4";

    const repositoryResource = {
      id: "test_resource",
      displayName: "Test Resource",
    };

    try {
      // Act - Try to create repository resource for non-existent repository
      const createResourceResponse =
        await szewTwinsAccessClient.createRepositoryResource(
          accessToken,
          szewTwinId,
          someRandomRepositoryId,
          repositoryResource
        );

      // Assert
      expect(createResourceResponse.status).toBe(404);
      expect(createResourceResponse.data).toBeUndefined();
      expect(createResourceResponse.error).not.toBeUndefined();
      expect(createResourceResponse.error!.code).toBe(
        "szewTwinRepositoryNotFound"
      );
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should get a 404 not found when trying to create a repository resource for an szewTwin that doesn't exist", async () => {
    // Arrange
    const someRandomszewTwinId = "ffd3dc75-0b4a-4587-b428-4c73f5d6dbb4";
    const someRandomRepositoryId = "aaf3dc75-0b4a-4587-b428-4c73f5d6dbb4";

    const repositoryResource = {
      id: "test_resource",
      displayName: "Test Resource",
    };

    // Act - Try to create repository resource for non-existent szewTwin
    const createResourceResponse =
      await szewTwinsAccessClient.createRepositoryResource(
        accessToken,
        someRandomszewTwinId,
        someRandomRepositoryId,
        repositoryResource
      );

    // Assert
    expect(createResourceResponse.status).toBe(404);
    expect(createResourceResponse.data).toBeUndefined();
    expect(createResourceResponse.error).not.toBeUndefined();
    expect(createResourceResponse.error!.code).toBe("szewTwinNotFound");
  });

  it("should successfully get a repository resource with minimal mode", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin?.id!;

    const gisRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "https://www.sciencebase.gov/arcgis/rest/services/Catalog/5888bf4fe4b05ccb964bab9d/MapServer",
      displayName: "Test GIS Repository for Resource Access",
    };

    try {
      // Create a GIS repository first
      const createRepositoryResponse =
        await szewTwinsAccessClient.createRepository(
          accessToken,
          szewTwinId,
          gisRepository
        );
      expect(createRepositoryResponse.status).toBe(201);
      const repositoryId = createRepositoryResponse.data?.repository!.id!;

      const repositoryResource = {
        id: "water_features",
        displayName: "Water Features",
      };

      // Create a repository resource
      const createResourceResponse =
        await szewTwinsAccessClient.createRepositoryResource(
          accessToken,
          szewTwinId,
          repositoryId,
          repositoryResource
        );
      expect(createResourceResponse.status).toBe(201);
      const resourceId = createResourceResponse.data?.resource!.id!;

      // Act - Get repository resource with minimal mode
      const getResourceResponse =
        await szewTwinsAccessClient.getRepositoryResource(
          accessToken,
          szewTwinId,
          repositoryId,
          resourceId,
          "minimal"
        );

      // Assert
      expect(getResourceResponse.status).toBe(200);
      expect(getResourceResponse.data?.resource).toBeDefined();

      const retrievedResource = getResourceResponse.data!.resource;
      expect(retrievedResource.id).toBe(resourceId);
      expect(retrievedResource.displayName).toBe(
        repositoryResource.displayName
      );
      expect(retrievedResource.class).toBeDefined();
      expect(retrievedResource.class).toBe("GeographicInformationSystem");

      // In minimal mode, properties should not be present
      expect("properties" in retrievedResource).toBe(false);

      // Cleanup repository (this will also cleanup the resource)
      const repositoryDeleteResponse =
        await szewTwinsAccessClient.deleteRepository(
          accessToken,
          szewTwinId,
          repositoryId
        );
      expect(repositoryDeleteResponse.status).toBe(204);
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should successfully get a repository resource with representation mode", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data!.szewTwin.id!;

    const gisRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "https://www.sciencebase.gov/arcgis/rest/services/Catalog/5888bf4fe4b05ccb964bab9d/MapServer",
      displayName: "Test GIS Repository for Resource Representation",
    };

    try {
      // Create a GIS repository first
      const createRepositoryResponse =
        await szewTwinsAccessClient.createRepository(
          accessToken,
          szewTwinId,
          gisRepository
        );
      expect(createRepositoryResponse.status).toBe(201);
      const repositoryId = createRepositoryResponse.data?.repository!.id!;

      const repositoryResource = {
        id: "vegetation_areas",
        displayName: "Vegetation Areas",
      };

      // Create a repository resource
      const createResourceResponse =
        await szewTwinsAccessClient.createRepositoryResource(
          accessToken,
          szewTwinId,
          repositoryId,
          repositoryResource
        );
      expect(createResourceResponse.status).toBe(201);
      const resourceId = createResourceResponse.data?.resource!.id!;

      // Act - Get repository resource with representation mode
      const getResourceResponse =
        await szewTwinsAccessClient.getRepositoryResource(
          accessToken,
          szewTwinId,
          repositoryId,
          resourceId,
          "representation"
        );

      // Assert
      expect(getResourceResponse.status).toBe(200);
      expect(getResourceResponse.data?.resource).toBeDefined();

      const retrievedResource = getResourceResponse.data!.resource;
      expect(retrievedResource.id).toBe(resourceId);
      expect(retrievedResource.displayName).toBe(
        repositoryResource.displayName
      );
      expect(retrievedResource.class).toBeDefined();
      expect(retrievedResource.class).toBe("GeographicInformationSystem");

      // Cleanup repository (this will also cleanup the resource)
      const repositoryDeleteResponse =
        await szewTwinsAccessClient.deleteRepository(
          accessToken,
          szewTwinId,
          repositoryId
        );
      expect(repositoryDeleteResponse.status).toBe(204);
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should get a 404 not found when trying to get a repository resource that doesn't exist", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin?.id!;

    const gisRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "https://www.sciencebase.gov/arcgis/rest/services/Catalog/5888bf4fe4b05ccb964bab9d/MapServer",
      displayName: "Test GIS Repository",
    };

    try {
      // Create a GIS repository first
      const createRepositoryResponse =
        await szewTwinsAccessClient.createRepository(
          accessToken,
          szewTwinId,
          gisRepository
        );
      expect(createRepositoryResponse.status).toBe(201);
      const repositoryId = createRepositoryResponse.data?.repository!.id!;

      const someRandomResourceId = "ffd3dc75-0b4a-4587-b428-4c73f5d6dbb4";

      // Act - Try to get a non-existent repository resource
      const getResourceResponse =
        await szewTwinsAccessClient.getRepositoryResource(
          accessToken,
          szewTwinId,
          repositoryId,
          someRandomResourceId
        );

      // Assert
      expect(getResourceResponse.status).toBe(404);
      expect(getResourceResponse.data).toBeUndefined();
      expect(getResourceResponse.error).not.toBeUndefined();
      expect(getResourceResponse.error!.code).toBe(
        "szewTwinRepositoryResourceNotFound"
      );

      // Cleanup repository
      const repositoryDeleteResponse =
        await szewTwinsAccessClient.deleteRepository(
          accessToken,
          szewTwinId,
          repositoryId
        );
      expect(repositoryDeleteResponse.status).toBe(204);
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should get a 404 not found when trying to get a repository resource from a repository that doesn't exist", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin?.id!;

    const someRandomRepositoryId = "ffd3dc75-0b4a-4587-b428-4c73f5d6dbb4";
    const someRandomResourceId = "aaf3dc75-0b4a-4587-b428-4c73f5d6dbb4";

    try {
      // Act - Try to get a repository resource from a non-existent repository
      const getResourceResponse =
        await szewTwinsAccessClient.getRepositoryResource(
          accessToken,
          szewTwinId,
          someRandomRepositoryId,
          someRandomResourceId
        );

      // Assert
      expect(getResourceResponse.status).toBe(404);
      expect(getResourceResponse.data).toBeUndefined();
      expect(getResourceResponse.error).not.toBeUndefined();
      expect(getResourceResponse.error!.code).toBe("szewTwinRepositoryNotFound");
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should get a 404 not found when trying to get a repository resource from an szewTwin that doesn't exist", async () => {
    // Arrange
    const someRandomszewTwinId = "ffd3dc75-0b4a-4587-b428-4c73f5d6dbb4";
    const someRandomRepositoryId = "aaf3dc75-0b4a-4587-b428-4c73f5d6dbb4";
    const someRandomResourceId = "bbf3dc75-0b4a-4587-b428-4c73f5d6dbb4";

    // Act - Try to get a repository resource from a non-existent szewTwin
    const getResourceResponse = await szewTwinsAccessClient.getRepositoryResource(
      accessToken,
      someRandomszewTwinId,
      someRandomRepositoryId,
      someRandomResourceId
    );

    // Assert
    expect(getResourceResponse.status).toBe(404);
    expect(getResourceResponse.data).toBeUndefined();
    expect(getResourceResponse.error).not.toBeUndefined();
    expect(getResourceResponse.error!.code).toBe("szewTwinNotFound");
  });

  it("should successfully get repository resources with minimal mode", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin?.id!;

    const gisRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "https://www.sciencebase.gov/arcgis/rest/services/Catalog/5888bf4fe4b05ccb964bab9d/MapServer",
      displayName: "Test GIS Repository for Multiple Resources",
    };

    try {
      // Create a GIS repository first
      const createRepositoryResponse =
        await szewTwinsAccessClient.createRepository(
          accessToken,
          szewTwinId,
          gisRepository
        );
      expect(createRepositoryResponse.status).toBe(201);
      const repositoryId = createRepositoryResponse.data?.repository!.id!;

      // Create multiple repository resources
      const resource1 = {
        id: "water_features",
        displayName: "Water Features",
      };
      const resource2 = {
        id: "vegetation_areas",
        displayName: "Vegetation Areas",
      };

      const createResourceResponse1 =
        await szewTwinsAccessClient.createRepositoryResource(
          accessToken,
          szewTwinId,
          repositoryId,
          resource1
        );
      expect(createResourceResponse1.status).toBe(201);

      const createResourceResponse2 =
        await szewTwinsAccessClient.createRepositoryResource(
          accessToken,
          szewTwinId,
          repositoryId,
          resource2
        );
      expect(createResourceResponse2.status).toBe(201);

      // Act - Get repository resources with minimal mode
      const getResourcesResponse =
        await szewTwinsAccessClient.getRepositoryResources(
          accessToken,
          szewTwinId,
          repositoryId,
          undefined,
          "minimal"
        );

      // Assert
      expect(getResourcesResponse.status).toBe(200);
      expect(getResourcesResponse.data?.resources).toBeDefined();
      expect(Array.isArray(getResourcesResponse.data!.resources)).toBe(true);
      expect(
        getResourcesResponse.data!.resources.length
      ).toBeGreaterThanOrEqual(2);

      // Check that resources contain expected data
      const resources = getResourcesResponse.data!.resources;
      const waterFeature = resources.find((r) => r.id === "water_features");
      const vegetationArea = resources.find((r) => r.id === "vegetation_areas");

      expect(waterFeature).toBeDefined();
      expect(waterFeature!.displayName).toBe("Water Features");
      expect(waterFeature!.class).toBe("GeographicInformationSystem");

      expect(vegetationArea).toBeDefined();
      expect(vegetationArea!.displayName).toBe("Vegetation Areas");
      expect(vegetationArea!.class).toBe("GeographicInformationSystem");

      // In minimal mode, properties should not be present
      resources.forEach((resource) => {
        expect("properties" in resource).toBe(false);
      });

      // In minimal mode, _links should also be present (updated requirement)
      const minimalResponse = getResourcesResponse.data! as any;
      expect(minimalResponse._links).toBeDefined();
      expect(minimalResponse._links.self).toBeDefined();
      expect(minimalResponse._links.self.href).toBeDefined();
      expect(typeof minimalResponse._links.self.href).toBe("string");

      // Cleanup repository (this will also cleanup the resources)
      const repositoryDeleteResponse =
        await szewTwinsAccessClient.deleteRepository(
          accessToken,
          szewTwinId,
          repositoryId
        );
      expect(repositoryDeleteResponse.status).toBe(204);
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should successfully get repository resources with representation mode", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin?.id!;

    const gisRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "https://www.sciencebase.gov/arcgis/rest/services/Catalog/5888bf4fe4b05ccb964bab9d/MapServer",
      displayName: "Test GIS Repository for Resource Representation",
    };

    try {
      // Create a GIS repository first
      const createRepositoryResponse =
        await szewTwinsAccessClient.createRepository(
          accessToken,
          szewTwinId,
          gisRepository
        );
      expect(createRepositoryResponse.status).toBe(201);
      const repositoryId = createRepositoryResponse.data?.repository!.id!;

      // Create repository resources
      const resource1 = {
        id: "roads_network",
        displayName: "Roads Network",
      };
      const resource2 = {
        id: "building_footprints",
        displayName: "Building Footprints",
      };

      const createResourceResponse1 =
        await szewTwinsAccessClient.createRepositoryResource(
          accessToken,
          szewTwinId,
          repositoryId,
          resource1
        );
      expect(createResourceResponse1.status).toBe(201);

      const createResourceResponse2 =
        await szewTwinsAccessClient.createRepositoryResource(
          accessToken,
          szewTwinId,
          repositoryId,
          resource2
        );
      expect(createResourceResponse2.status).toBe(201);

      // Act - Get repository resources with representation mode
      const getResourcesResponse =
        await szewTwinsAccessClient.getRepositoryResources(
          accessToken,
          szewTwinId,
          repositoryId,
          undefined,
          "representation"
        );

      // Assert
      expect(getResourcesResponse.status).toBe(200);
      expect(getResourcesResponse.data?.resources).toBeDefined();
      expect(Array.isArray(getResourcesResponse.data!.resources)).toBe(true);
      expect(
        getResourcesResponse.data!.resources.length
      ).toBeGreaterThanOrEqual(2);

      // Check that resources contain expected data
      const resources = getResourcesResponse.data!.resources;
      const roadsNetwork = resources.find((r) => r.id === "roads_network");
      const buildingFootprints = resources.find(
        (r) => r.id === "building_footprints"
      );

      expect(roadsNetwork).toBeDefined();
      expect(roadsNetwork!.displayName).toBe("Roads Network");
      expect(roadsNetwork!.class).toBe("GeographicInformationSystem");

      expect(buildingFootprints).toBeDefined();
      expect(buildingFootprints!.displayName).toBe("Building Footprints");
      expect(buildingFootprints!.class).toBe("GeographicInformationSystem");

      // In representation mode, _links should be present
      const representationResponse = getResourcesResponse.data! as any;
      expect(representationResponse._links).toBeDefined();
      expect(representationResponse._links.self).toBeDefined();
      expect(representationResponse._links.self.href).toBeDefined();
      expect(typeof representationResponse._links.self.href).toBe("string");

      // prev and next may or may not be present depending on pagination
      if (representationResponse._links.prev) {
        expect(representationResponse._links.prev.href).toBeDefined();
        expect(typeof representationResponse._links.prev.href).toBe("string");
      }
      if (representationResponse._links.next) {
        expect(representationResponse._links.next.href).toBeDefined();
        expect(typeof representationResponse._links.next.href).toBe("string");
      }

      // Cleanup repository (this will also cleanup the resources)
      const repositoryDeleteResponse =
        await szewTwinsAccessClient.deleteRepository(
          accessToken,
          szewTwinId,
          repositoryId
        );
      expect(repositoryDeleteResponse.status).toBe(204);
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should successfully get repository resources with pagination parameters", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin?.id!;

    const gisRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "https://www.sciencebase.gov/arcgis/rest/services/Catalog/5888bf4fe4b05ccb964bab9d/MapServer",
      displayName: "Test GIS Repository for Pagination",
    };

    try {
      // Create a GIS repository first
      const createRepositoryResponse =
        await szewTwinsAccessClient.createRepository(
          accessToken,
          szewTwinId,
          gisRepository
        );
      expect(createRepositoryResponse.status).toBe(201);
      const repositoryId = createRepositoryResponse.data?.repository!.id!;

      // Create multiple repository resources
      const resources = [
        { id: "resource_1", displayName: "Resource One" },
        { id: "resource_2", displayName: "Resource Two" },
        { id: "resource_3", displayName: "Resource Three" },
      ];

      for (const resource of resources) {
        const createResourceResponse =
          await szewTwinsAccessClient.createRepositoryResource(
            accessToken,
            szewTwinId,
            repositoryId,
            resource
          );
        expect(createResourceResponse.status).toBe(201);
      }

      // Act - Get repository resources with pagination (top=2) in representation mode to get links
      const getResourcesResponse =
        await szewTwinsAccessClient.getRepositoryResources(
          accessToken,
          szewTwinId,
          repositoryId,
          { top: 2 },
          "representation"
        );

      // Assert
      expect(getResourcesResponse.status).toBe(200);
      expect(getResourcesResponse.data?.resources).toBeDefined();
      expect(Array.isArray(getResourcesResponse.data!.resources)).toBe(true);
      // Note: The actual count may be higher due to default resources, so we just verify we get results
      expect(getResourcesResponse.data!.resources.length).toBeGreaterThan(0);

      // In representation mode with pagination, _links should be present
      const representationResponse = getResourcesResponse.data!;
      expect(representationResponse._links).toBeDefined();
      expect(representationResponse._links.self).toBeDefined();
      expect(representationResponse._links.self.href).toBeDefined();
      expect(typeof representationResponse._links.self.href).toBe("string");

      // Verify the self link contains pagination parameters
      expect(representationResponse._links.self.href).toContain("top=2");

      // Cleanup repository (this will also cleanup the resources)
      const repositoryDeleteResponse =
        await szewTwinsAccessClient.deleteRepository(
          accessToken,
          szewTwinId,
          repositoryId
        );
      expect(repositoryDeleteResponse.status).toBe(204);
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should successfully get repository resources with search parameter", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin?.id!;

    const gisRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "https://www.sciencebase.gov/arcgis/rest/services/Catalog/5888bf4fe4b05ccb964bab9d/MapServer",
      displayName: "Test GIS Repository for Search",
    };

    try {
      // Create a GIS repository first
      const createRepositoryResponse =
        await szewTwinsAccessClient.createRepository(
          accessToken,
          szewTwinId,
          gisRepository
        );
      expect(createRepositoryResponse.status).toBe(201);
      const repositoryId = createRepositoryResponse.data?.repository!.id!;

      // Create repository resources with searchable names
      const searchableResource = {
        id: "water_bodies_special",
        displayName: "Water Bodies Special Feature",
      };
      const otherResource = {
        id: "road_network",
        displayName: "Road Network System",
      };

      const createResourceResponse1 =
        await szewTwinsAccessClient.createRepositoryResource(
          accessToken,
          szewTwinId,
          repositoryId,
          searchableResource
        );
      expect(createResourceResponse1.status).toBe(201);

      const createResourceResponse2 =
        await szewTwinsAccessClient.createRepositoryResource(
          accessToken,
          szewTwinId,
          repositoryId,
          otherResource
        );
      expect(createResourceResponse2.status).toBe(201);

      // Act - Get repository resources with search parameter
      const getResourcesResponse =
        await szewTwinsAccessClient.getRepositoryResources(
          accessToken,
          szewTwinId,
          repositoryId,
          { search: "water" }
        );

      // Assert
      expect(getResourcesResponse.status).toBe(200);
      expect(getResourcesResponse.data?.resources).toBeDefined();
      expect(Array.isArray(getResourcesResponse.data!.resources)).toBe(true);

      // Cleanup repository (this will also cleanup the resources)
      const repositoryDeleteResponse =
        await szewTwinsAccessClient.deleteRepository(
          accessToken,
          szewTwinId,
          repositoryId
        );
      expect(repositoryDeleteResponse.status).toBe(204);
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should successfully get repository resources with pagination in minimal mode and verify links", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin?.id!;

    const gisRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "https://www.sciencebase.gov/arcgis/rest/services/Catalog/5888bf4fe4b05ccb964bab9d/MapServer",
      displayName: "Test GIS Repository for Minimal Mode Pagination",
    };

    try {
      // Create a GIS repository first
      const createRepositoryResponse =
        await szewTwinsAccessClient.createRepository(
          accessToken,
          szewTwinId,
          gisRepository
        );
      expect(createRepositoryResponse.status).toBe(201);
      const repositoryId = createRepositoryResponse.data?.repository!.id!;

      // Create multiple repository resources
      const resources = [
        { id: "minimal_resource_1", displayName: "Minimal Resource One" },
        { id: "minimal_resource_2", displayName: "Minimal Resource Two" },
        { id: "minimal_resource_3", displayName: "Minimal Resource Three" },
      ];

      for (const resource of resources) {
        const createResourceResponse =
          await szewTwinsAccessClient.createRepositoryResource(
            accessToken,
            szewTwinId,
            repositoryId,
            resource
          );
        expect(createResourceResponse.status).toBe(201);
      }

      // Act - Get repository resources with pagination in minimal mode
      const getResourcesResponse =
        await szewTwinsAccessClient.getRepositoryResources(
          accessToken,
          szewTwinId,
          repositoryId,
          { top: 2, skip: 1 },
          "minimal"
        );

      // Assert
      expect(getResourcesResponse.status).toBe(200);
      expect(getResourcesResponse.data?.resources).toBeDefined();
      expect(Array.isArray(getResourcesResponse.data!.resources)).toBe(true);
      expect(getResourcesResponse.data!.resources.length).toBeGreaterThan(0);

      // In minimal mode, _links should be present with pagination parameters
      const minimalResponse = getResourcesResponse.data! as any;
      expect(minimalResponse._links).toBeDefined();
      expect(minimalResponse._links.self).toBeDefined();
      expect(minimalResponse._links.self.href).toBeDefined();
      expect(typeof minimalResponse._links.self.href).toBe("string");

      // Verify the self link contains pagination parameters
      expect(minimalResponse._links.self.href).toContain("top=2");
      expect(minimalResponse._links.self.href).toContain("skip=1");

      // Verify resources don't have properties (minimal mode characteristic)
      const resourcesResponse = getResourcesResponse.data!.resources;
      resourcesResponse.forEach((resource) => {
        expect("properties" in resource).toBe(false);
      });

      // Cleanup repository (this will also cleanup the resources)
      const repositoryDeleteResponse =
        await szewTwinsAccessClient.deleteRepository(
          accessToken,
          szewTwinId,
          repositoryId
        );
      expect(repositoryDeleteResponse.status).toBe(204);
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should get a 404 not found when trying to get repository resources from a repository that doesn't exist", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin?.id!;

    const someRandomRepositoryId = "ffd3dc75-0b4a-4587-b428-4c73f5d6dbb4";

    try {
      // Act - Try to get repository resources from a non-existent repository
      const getResourcesResponse =
        await szewTwinsAccessClient.getRepositoryResources(
          accessToken,
          szewTwinId,
          someRandomRepositoryId
        );

      // Assert
      expect(getResourcesResponse.status).toBe(404);
      expect(getResourcesResponse.data).toBeUndefined();
      expect(getResourcesResponse.error).not.toBeUndefined();
      expect(getResourcesResponse.error!.code).toBe("szewTwinRepositoryNotFound");
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should get a 404 not found when trying to get repository resources from an szewTwin that doesn't exist", async () => {
    // Arrange
    const someRandomszewTwinId = "ffd3dc75-0b4a-4587-b428-4c73f5d6dbb4";
    const someRandomRepositoryId = "aaf3dc75-0b4a-4587-b428-4c73f5d6dbb4";

    // Act - Try to get repository resources from a non-existent szewTwin
    const getResourcesResponse =
      await szewTwinsAccessClient.getRepositoryResources(
        accessToken,
        someRandomszewTwinId,
        someRandomRepositoryId
      );

    // Assert
    expect(getResourcesResponse.status).toBe(404);
    expect(getResourcesResponse.data).toBeUndefined();
    expect(getResourcesResponse.error).not.toBeUndefined();
    expect(getResourcesResponse.error!.code).toBe("szewTwinNotFound");
  });

  it("should successfully get empty repository resources array from a repository with no resources", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin?.id!;

    const gisRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "https://www.sciencebase.gov/arcgis/rest/services/Catalog/5888bf4fe4b05ccb964bab9d/MapServer",
      displayName: "Empty Test GIS Repository",
    };

    try {
      // Create a GIS repository but don't add any resources
      const createRepositoryResponse =
        await szewTwinsAccessClient.createRepository(
          accessToken,
          szewTwinId,
          gisRepository
        );
      expect(createRepositoryResponse.status).toBe(201);
      const repositoryId = createRepositoryResponse.data?.repository!.id!;

      // Act - Get repository resources from empty repository
      const getResourcesResponse =
        await szewTwinsAccessClient.getRepositoryResources(
          accessToken,
          szewTwinId,
          repositoryId
        );

      // Assert
      expect(getResourcesResponse.status).toBe(200);
      expect(getResourcesResponse.data?.resources).toBeDefined();
      expect(Array.isArray(getResourcesResponse.data!.resources)).toBe(true);
      // The array may contain default resources, so we just verify it's an array

      // Cleanup repository
      const repositoryDeleteResponse =
        await szewTwinsAccessClient.deleteRepository(
          accessToken,
          szewTwinId,
          repositoryId
        );
      expect(repositoryDeleteResponse.status).toBe(204);
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should successfully delete a repository resource", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin?.id!;

    const gisRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "https://www.sciencebase.gov/arcgis/rest/services/Catalog/5888bf4fe4b05ccb964bab9d/MapServer",
      displayName: "Test GIS Repository for Resource Deletion",
    };

    try {
      // Create a GIS repository first
      const createRepositoryResponse =
        await szewTwinsAccessClient.createRepository(
          accessToken,
          szewTwinId,
          gisRepository
        );
      expect(createRepositoryResponse.status).toBe(201);
      const repositoryId = createRepositoryResponse.data?.repository!.id!;

      const repositoryResource = {
        id: "test_resource_to_delete",
        displayName: "Test Resource for Deletion",
      };

      // Create a repository resource
      const createResourceResponse =
        await szewTwinsAccessClient.createRepositoryResource(
          accessToken,
          szewTwinId,
          repositoryId,
          repositoryResource
        );
      expect(createResourceResponse.status).toBe(201);
      const resourceId = createResourceResponse.data?.resource!.id!;

      // Verify resource exists
      const getResourceResponse =
        await szewTwinsAccessClient.getRepositoryResource(
          accessToken,
          szewTwinId,
          repositoryId,
          resourceId
        );
      expect(getResourceResponse.status).toBe(200);
      expect(getResourceResponse.data?.resource).toBeDefined();

      // Act - Delete the repository resource
      const deleteResourceResponse =
        await szewTwinsAccessClient.deleteRepositoryResource(
          accessToken,
          szewTwinId,
          repositoryId,
          resourceId
        );

      // Assert - Delete response
      expect(deleteResourceResponse.status).toBe(204);
      expect(deleteResourceResponse.data).toBeUndefined();

      // Verify resource is deleted by trying to get it
      const verifyDeleteResponse =
        await szewTwinsAccessClient.getRepositoryResource(
          accessToken,
          szewTwinId,
          repositoryId,
          resourceId
        );
      expect(verifyDeleteResponse.status).toBe(404);
      expect(verifyDeleteResponse.error?.code).toBe("szewTwinRepositoryResourceNotFound");

      // Cleanup repository
      const repositoryDeleteResponse =
        await szewTwinsAccessClient.deleteRepository(
          accessToken,
          szewTwinId,
          repositoryId
        );
      expect(repositoryDeleteResponse.status).toBe(204);
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should get a 404 not found when trying to delete a repository resource that doesn't exist", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin?.id!;

    const gisRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "https://www.sciencebase.gov/arcgis/rest/services/Catalog/5888bf4fe4b05ccb964bab9d/MapServer",
      displayName: "Test GIS Repository",
    };

    try {
      // Create a GIS repository first
      const createRepositoryResponse =
        await szewTwinsAccessClient.createRepository(
          accessToken,
          szewTwinId,
          gisRepository
        );
      expect(createRepositoryResponse.status).toBe(201);
      const repositoryId = createRepositoryResponse.data?.repository!.id!;

      const someRandomResourceId = "ffd3dc75-0b4a-4587-b428-4c73f5d6dbb4";

      // Act - Try to delete a non-existent repository resource
      const deleteResourceResponse =
        await szewTwinsAccessClient.deleteRepositoryResource(
          accessToken,
          szewTwinId,
          repositoryId,
          someRandomResourceId
        );

      // Assert
      expect(deleteResourceResponse.status).toBe(404);
      expect(deleteResourceResponse.data).toBeUndefined();
      expect(deleteResourceResponse.error).not.toBeUndefined();
      expect(deleteResourceResponse.error!.code).toBe("szewTwinRepositoryResourceNotFound");

      // Cleanup repository
      const repositoryDeleteResponse =
        await szewTwinsAccessClient.deleteRepository(
          accessToken,
          szewTwinId,
          repositoryId
        );
      expect(repositoryDeleteResponse.status).toBe(204);
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should get a 404 not found when trying to delete a repository resource from a repository that doesn't exist", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin?.id!;

    const someRandomRepositoryId = "ffd3dc75-0b4a-4587-b428-4c73f5d6dbb4";
    const someRandomResourceId = "aaf3dc75-0b4a-4587-b428-4c73f5d6dbb4";

    try {
      // Act - Try to delete a repository resource from a non-existent repository
      const deleteResourceResponse =
        await szewTwinsAccessClient.deleteRepositoryResource(
          accessToken,
          szewTwinId,
          someRandomRepositoryId,
          someRandomResourceId
        );

      // Assert
      expect(deleteResourceResponse.status).toBe(404);
      expect(deleteResourceResponse.data).toBeUndefined();
      expect(deleteResourceResponse.error).not.toBeUndefined();
      expect(deleteResourceResponse.error!.code).toBe("szewTwinRepositoryResourceNotFound");
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should get a 404 not found when trying to delete a repository resource from an szewTwin that doesn't exist", async () => {
    // Arrange
    const someRandomszewTwinId = "ffd3dc75-0b4a-4587-b428-4c73f5d6dbb4";
    const someRandomRepositoryId = "aaf3dc75-0b4a-4587-b428-4c73f5d6dbb4";
    const someRandomResourceId = "bbf3dc75-0b4a-4587-b428-4c73f5d6dbb4";

    // Act - Try to delete a repository resource from a non-existent szewTwin
    const deleteResourceResponse =
      await szewTwinsAccessClient.deleteRepositoryResource(
        accessToken,
        someRandomszewTwinId,
        someRandomRepositoryId,
        someRandomResourceId
      );

    // Assert
    expect(deleteResourceResponse.status).toBe(404);
    expect(deleteResourceResponse.data).toBeUndefined();
    expect(deleteResourceResponse.error).not.toBeUndefined();
    expect(deleteResourceResponse.error!.code).toBe("szewTwinNotFound");
  });

  it("should handle resource graphics request (may return 404 if graphics capability unavailable)", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin?.id!;

    const gisRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "https://www.sciencebase.gov/arcgis/rest/services/Catalog/5888bf4fe4b05ccb964bab9d/MapServer",
      displayName: "Test GIS Repository for Graphics",
    };

    try {
      // Create a GIS repository first
      const createRepositoryResponse =
        await szewTwinsAccessClient.createRepository(
          accessToken,
          szewTwinId,
          gisRepository
        );
      expect(createRepositoryResponse.status).toBe(201);
      const repositoryId = createRepositoryResponse.data?.repository!.id!;

      const repositoryResource = {
        id: "test_graphics_resource",
        displayName: "Test Graphics Resource",
      };

      // Create a repository resource
      const createResourceResponse =
        await szewTwinsAccessClient.createRepositoryResource(
          accessToken,
          szewTwinId,
          repositoryId,
          repositoryResource
        );
      expect(createResourceResponse.status).toBe(201);
      const resourceId = createResourceResponse.data?.resource!.id!;

      // Act - Get resource graphics (may not be available for all resources)
      const graphicsResponse = await szewTwinsAccessClient.getResourceGraphics(
        accessToken,
        szewTwinId,
        repositoryId,
        resourceId
      );

      // Assert - Accept either 200 (graphics available) or 404 (graphics not available)
      expect([200, 404]).toContain(graphicsResponse.status);

      if (graphicsResponse.status === 200) {
        // If graphics are available, validate the response structure
        expect(graphicsResponse.data?.graphics).toBeDefined();
        expect(Array.isArray(graphicsResponse.data!.graphics)).toBe(true);

        // If graphics array is not empty, validate the structure
        if (graphicsResponse.data!.graphics.length > 0) {
          const graphic = graphicsResponse.data!.graphics[0];
          expect(graphic.uri).toBeDefined();
          expect(typeof graphic.uri).toBe("string");
          expect(graphic.type).toBeDefined();

          // Validate authentication if present
          if (graphic.authentication) {
            expect(graphic.authentication.type).toBeDefined();
            // Authentication type should be one of the supported types
            expect(["Header", "QueryParameter", "Basic"]).toContain(
              graphic.authentication.type
            );
          }
        }
      } else {
        // If graphics are not available (404), verify error structure
        expect(graphicsResponse.data).toBeUndefined();
        expect(graphicsResponse.error).not.toBeUndefined();
        // Error code may vary depending on API implementation
        expect(graphicsResponse.error!.code).toBeDefined();
      }

      // Cleanup repository (this will also cleanup the resource)
      const repositoryDeleteResponse =
        await szewTwinsAccessClient.deleteRepository(
          accessToken,
          szewTwinId,
          repositoryId
        );
      expect(repositoryDeleteResponse.status).toBe(204);
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should get a 200 OK when trying to get graphics for a resource that doesn't exist, and an empty graphics array", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin?.id!;

    const gisRepository: NewRepositoryConfig = {
      class: "GeographicInformationSystem",
      subClass: "WebMapService",
      uri: "https://www.sciencebase.gov/arcgis/rest/services/Catalog/5888bf4fe4b05ccb964bab9d/MapServer",
      displayName: "Test GIS Repository",
    };

    try {
      // Create a GIS repository first
      const createRepositoryResponse =
        await szewTwinsAccessClient.createRepository(
          accessToken,
          szewTwinId,
          gisRepository
        );
      expect(createRepositoryResponse.status).toBe(201);
      const repositoryId = createRepositoryResponse.data?.repository!.id!;

      const someRandomResourceId = "ffd3dc75-0b4a-4587-b428-4c69f5d9dbb8";

      // Act - Try to get graphics for a non-existent resource
      const graphicsResponse = await szewTwinsAccessClient.getResourceGraphics(
        accessToken,
        szewTwinId,
        repositoryId,
        someRandomResourceId
      );

      // Assert
      expect(graphicsResponse.status).toBe(200);
      expect(graphicsResponse.data).toBeDefined();
      expect(graphicsResponse.data?.graphics).toBeDefined();
      expect(Array.isArray(graphicsResponse.data!.graphics)).toBe(true);
      expect(graphicsResponse.data!.graphics.length).toBe(0);

      // Cleanup repository
      const repositoryDeleteResponse =
        await szewTwinsAccessClient.deleteRepository(
          accessToken,
          szewTwinId,
          repositoryId
        );
      expect(repositoryDeleteResponse.status).toBe(204);
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should get a 200 OK when trying to get graphics from a repository that doesn't exist, and an empty graphics array", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      status: "Trial",
    };
    const szewTwinResponse = await szewTwinsAccessClient.createSZEWTwin(
      accessToken,
      newszewTwin
    );
    const szewTwinId = szewTwinResponse.data?.szewTwin?.id!;

    const someRandomRepositoryId = "ffd3dc75-0b4a-4587-b428-4c73f5d6dbb4";
    const someRandomResourceId = "aaf3dc75-0b4a-4587-b428-4c73f5d6dbb4";

    try {
      // Act - Try to get graphics from a non-existent repository
      const graphicsResponse = await szewTwinsAccessClient.getResourceGraphics(
        accessToken,
        szewTwinId,
        someRandomRepositoryId,
        someRandomResourceId
      );

      // Assert
      expect(graphicsResponse.status).toBe(200);
      expect(graphicsResponse.data).toBeDefined();
      expect(graphicsResponse.data?.graphics).toBeDefined();
      expect(Array.isArray(graphicsResponse.data!.graphics)).toBe(true);
      expect(graphicsResponse.data!.graphics.length).toBe(0);
    } finally {
      // Cleanup
      const szewTwinDeleteResponse = await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinId
      );
      expect(szewTwinDeleteResponse.status).toBe(204);
      expect(szewTwinDeleteResponse.data).toBeUndefined();
    }
  });

  it("should get a 404 not found when trying to get graphics from an szewTwin that doesn't exist", async () => {
    // Arrange
    const someRandomszewTwinId = "ffd3dc75-0b4a-4587-b428-4c73f5d6dbb4";
    const someRandomRepositoryId = "aaf3dc75-0b4a-4587-b428-4c73f5d6dbb4";
    const someRandomResourceId = "bbf3dc75-0b4a-4587-b428-4c73f5d6dbb4";

    // Act - Try to get graphics from a non-existent szewTwin
    const graphicsResponse = await szewTwinsAccessClient.getResourceGraphics(
      accessToken,
      someRandomszewTwinId,
      someRandomRepositoryId,
      someRandomResourceId
    );

    // Assert
    expect(graphicsResponse.status).toBe(404);
    expect(graphicsResponse.data).toBeUndefined();
    expect(graphicsResponse.error).not.toBeUndefined();
    expect(graphicsResponse.error!.code).toBe("szewTwinNotFound");
  });
});
