/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import type { AccessToken } from "@szewtwin/core-szewec";;
import { beforeAll, describe, expect, it } from "vitest";
import { SZEWTwinsClient } from "../../szewTwinsClient";
import type { SzewecAPIResponse } from "../../types/CommonApiTypes";
import type { SZEWtwinCreate, SZEWTwinMinimal, SZEWTwinRepresentation, SZEWTwinRepresentationResponse, SZEWTwinSubClass } from "../../types/SZEWTwin";
import { TestConfig } from "../TestConfig";

describe("szewTwinsClient", () => {
  let baseUrl: string = "https://api.szewec.com/szewtwins";
  const urlPrefix = process.env.IVJS_URL_PREFIX;
  if (urlPrefix) {
    const url = new URL(baseUrl);
    url.hostname = urlPrefix + url.hostname;
    baseUrl = url.href;
  }
  const szewTwinsAccessClient: SZEWTwinsClient = new SZEWTwinsClient();
  const szewTwinsCustomClient: SZEWTwinsClient = new SZEWTwinsClient(
    baseUrl
  );
  let accessToken: AccessToken;

  beforeAll(async () => {
    accessToken = await TestConfig.getAccessToken();
  }, 120000);

  it("should get a list of project szewTwins with custom url", async () => {
    // Act
    const szewTwinsResponse =
      await szewTwinsCustomClient.getSZEWTwins(accessToken, { subClass: "Project" });

    // Assert
    expect(szewTwinsResponse.status).toBe(200);
    expect(szewTwinsResponse.data).toBeDefined();
    expect(szewTwinsResponse.data?.szewTwins).not.toHaveLength(0);
    expect(szewTwinsResponse.data?._links).toBeDefined();
    expect(szewTwinsResponse.data?._links?.self).toBeDefined();
  });

  it("should get a list of project szewTwins without provided subClass", async () => {
    // Act
    const szewTwinsResponse =
      await szewTwinsCustomClient.getSZEWTwins(accessToken);

    // Assert
    expect(szewTwinsResponse.status).toBe(200);
    expect(szewTwinsResponse.data).toBeDefined();
    expect(szewTwinsResponse.data?.szewTwins).not.toHaveLength(0);
    expect(szewTwinsResponse.data?._links).toBeDefined();
    expect(szewTwinsResponse.data?._links?.self).toBeDefined();
  });

  it("should get a list of project szewTwins with provided subClass inside arg", async () => {
    // Act
    const szewTwinsResponse =
      await szewTwinsCustomClient.getSZEWTwins(accessToken, {
        subClass: "Project",
      });

    // Assert
    expect(szewTwinsResponse.status).toBe(200);
    expect(szewTwinsResponse.data).toBeDefined();
    expect(szewTwinsResponse.data?.szewTwins).not.toHaveLength(0);
    expect(szewTwinsResponse.data?._links).toBeDefined();
    expect(szewTwinsResponse.data?._links?.self).toBeDefined();
  });

  it("should get a 404 when trying to get an szewTwin", async () => {
    // Arrange
    const notAnszewTwinId = "22acf21e-0575-4faf-849b-bcd538718269";

    // Act
    const szewTwinsResponse =
      await szewTwinsAccessClient.getSZEWTwin(accessToken, notAnszewTwinId);

    // Assert
    expect(szewTwinsResponse.status).toBe(404);
    expect(szewTwinsResponse.data).toBeUndefined();
    expect(szewTwinsResponse.error!.code).toBe("szewTwinNotFound");
  });

  it("should get a 422 when querying with an unsupported subClass", async () => {
    // Act
    const szewTwinsResponse =
      await szewTwinsAccessClient.getSZEWTwins(accessToken, {
        subClass: "Invalid" as SZEWTwinSubClass,
      });

    // Assert
    expect(szewTwinsResponse.status).toBe(422);
    expect(szewTwinsResponse.data).toBeUndefined();
    expect(szewTwinsResponse.error).not.toBeUndefined();
    expect(szewTwinsResponse.error!.code).toBe("InvalidszewTwinsRequest");
    expect(szewTwinsResponse.error!.details![0].code).toBe("InvalidValue");
    expect(szewTwinsResponse.error!.details![0].target).toBe("subClass");
  });

  it("should get a list of project szewTwins", async () => {
    // Act
    const szewTwinsResponse =
      await szewTwinsAccessClient.getSZEWTwins(accessToken, { subClass: "Project" });

    // Assert
    expect(szewTwinsResponse.status).toBe(200);
    expect(szewTwinsResponse.data?.szewTwins).not.toHaveLength(0);
    expect(szewTwinsResponse.data?._links).toBeDefined();
    expect(szewTwinsResponse.data?._links?.self).toBeDefined();
  });

  it("should get a list of project szewTwins without providing subClass", async () => {
    // Act
    const szewTwinsResponse =
      await szewTwinsAccessClient.getSZEWTwins(accessToken);

    // Assert
    expect(szewTwinsResponse.status).toBe(200);
    expect(szewTwinsResponse.data?.szewTwins).not.toHaveLength(0);
    expect(szewTwinsResponse.data?._links).toBeDefined();
    expect(szewTwinsResponse.data?._links?.self).toBeDefined();
  });

  it("should get a project szewTwin", async () => {
    // Arrange
    const szewTwinId = process.env.IVJS_TEST_PROJECT_ID;

    // Act
    const szewTwinsResponse =
      await szewTwinsAccessClient.getSZEWTwin(accessToken, szewTwinId!);

    // Assert
    expect(szewTwinsResponse.status).toBe(200);
    expect(szewTwinsResponse.data).toBeDefined();
    const actualszewTwin = szewTwinsResponse.data!;
    expect(actualszewTwin.szewTwin.id).toBe(szewTwinId);
    expect(actualszewTwin.szewTwin.class).toBe("Endeavor");
    expect(actualszewTwin.szewTwin.subClass).toBe("Project");
  });

  it("should get more project szewTwin properties in representation result mode", async () => {
    // Arrange
    const szewTwinId = process.env.IVJS_TEST_PROJECT_ID;

    // Act
    const szewTwinsResponse: SzewecAPIResponse<SZEWTwinRepresentationResponse> =
      await szewTwinsAccessClient.getSZEWTwin(
        accessToken,
        szewTwinId!,
        "representation"
      );

    // Assert
    const actualszewTwin = szewTwinsResponse.data!;
    expect(actualszewTwin.szewTwin.parentId).toBeTypeOf("string");
    expect(actualszewTwin.szewTwin.szewTwinAccountId).toBeTypeOf("string");
    expect(actualszewTwin.szewTwin.imageName).toBeNull();
    expect(actualszewTwin.szewTwin.image).toBeNull();
    expect(actualszewTwin.szewTwin.createdDateTime).toBeTypeOf("string");
    expect(actualszewTwin.szewTwin.createdBy).toBeTypeOf("string");
  });

  it("should get an account", async () => {
    // Arrange
    const szewTwinId = process.env.IVJS_TEST_PROJECT_ID;

    // Act
    const szewTwinsResponse =
      await szewTwinsAccessClient.getSZEWTwinAccount(accessToken, szewTwinId!);

    // Assert
    expect(szewTwinsResponse.status).toBe(200);
    expect(szewTwinsResponse.data).toBeDefined();
    const actualszewTwin = szewTwinsResponse.data!;
    expect(actualszewTwin.szewTwin.id).not.toBe(szewTwinId); // should be a different entity
    expect(actualszewTwin.szewTwin.class).toBe("Account");
    expect(actualszewTwin.szewTwin.subClass).toBe("Account");
  });

  it("should get more details for an account in represenatation result mode", async () => {
    // Arrange
    const szewTwinId = process.env.IVJS_TEST_PROJECT_ID;

    // Act
    const szewTwinsResponse : SzewecAPIResponse<SZEWTwinRepresentationResponse> =
      await szewTwinsAccessClient.getSZEWTwinAccount(
        accessToken,
        szewTwinId!,
        "representation"
      );

    // Assert
    expect(szewTwinsResponse.status).toBe(200);
    expect(szewTwinsResponse.data).toBeDefined();
    const actualszewTwin = szewTwinsResponse.data!;
    expect(actualszewTwin.szewTwin.id).not.toBe(szewTwinId); // should be a different entity
    expect(actualszewTwin.szewTwin.class).toBe("Account");
    expect(actualszewTwin.szewTwin.subClass).toBe("Account");
    expect(actualszewTwin.szewTwin.createdDateTime).toBeTypeOf("string");
    expect(actualszewTwin.szewTwin.createdBy).toBeTypeOf("string");
  });

  it("should get the account specified by the szewTwinAccountId", async () => {
    // Arrange
    const szewTwinId = process.env.IVJS_TEST_PROJECT_ID;

    // Act
    const accountResponse =
      await szewTwinsAccessClient.getSZEWTwinAccount(accessToken, szewTwinId!);
    const szewTwinsResponse =
      await szewTwinsAccessClient.getSZEWTwin(
        accessToken,
        szewTwinId!,
        "representation"
      );

    // Assert
    expect(accountResponse.status).toBe(200);
    expect(accountResponse.data).toBeDefined();
    const actualAccount = accountResponse.data!;
    expect(actualAccount.szewTwin.id).not.toBe(szewTwinId); // should be a different entity
    expect(actualAccount.szewTwin.class).toBe("Account");
    expect(actualAccount.szewTwin.subClass).toBe("Account");

    expect(szewTwinsResponse.status).toBe(200);
    expect(szewTwinsResponse.data).toBeDefined();
    const actualszewTwin = szewTwinsResponse.data!;
    expect(actualszewTwin.szewTwin.id).toBe(szewTwinId);
    expect(actualszewTwin.szewTwin.class).toBe("Endeavor");
    expect(actualszewTwin.szewTwin.subClass).toBe("Project");

    expect(actualszewTwin.szewTwin.szewTwinAccountId).toBe(actualAccount.szewTwin.id);
  });

  it("should get a paged list of project szewTwins using top", async () => {
    // Arrange
    const numberOfszewTwins = 3;

    // Act
    const szewTwinsResponse = await szewTwinsAccessClient.getSZEWTwins(accessToken, {
      subClass: "Project",
      top: numberOfszewTwins,
    });

    // Assert
    expect(szewTwinsResponse.data?.szewTwins).not.toHaveLength(0);
    expect(szewTwinsResponse.data?.szewTwins!.length).toBe(3);
    expect(szewTwinsResponse.data?._links).toBeDefined();
    expect(szewTwinsResponse.data?._links?.self).toBeDefined();
    szewTwinsResponse.data?.szewTwins!.forEach((actualszewTwin: SZEWTwinMinimal) => {
      expect(actualszewTwin.class).toBe("Endeavor");
      expect(actualszewTwin.subClass).toBe("Project");
    });
  });

  it("should get a paged list of project szewTwins using skip", async () => {
    // Arrange
    const numberOfszewTwins = 3;
    const numberToSkip = 3;

    // Act
    const szewTwinsResponse = await szewTwinsAccessClient.getSZEWTwins(accessToken, {
      subClass: "Project",
      top: numberOfszewTwins,
      skip: numberToSkip,
    });

    // Assert
    expect(szewTwinsResponse.data?.szewTwins).not.toHaveLength(0);
    expect(szewTwinsResponse.data!.szewTwins.length).toBe(3);
    expect(szewTwinsResponse.data?._links).toBeDefined();
    expect(szewTwinsResponse.data?._links?.self).toBeDefined();
    // For skip-based pagination, there might be next/prev links
    if (numberToSkip > 0) {
      expect(szewTwinsResponse.data?._links?.prev).toBeDefined();
    }
    szewTwinsResponse.data!.szewTwins.forEach((actualszewTwin: SZEWTwinMinimal) => {
      expect(actualszewTwin.class).toBe("Endeavor");
      expect(actualszewTwin.subClass).toBe("Project");
    });
  });

  it("should get a first three pages of project szewTwins", async () => {
    // Arrange
    const numberOfPages = 3;
    const pageSize = 2;

    // Act
    for (let skip = 0; skip < numberOfPages * pageSize; skip += pageSize) {
      const szewTwinsResponse = await szewTwinsAccessClient.getSZEWTwins(accessToken, {
        subClass: "Project",
        top: pageSize,
        skip,
      });

      // Assert
      expect(szewTwinsResponse.data?.szewTwins).not.toHaveLength(0);
      expect(szewTwinsResponse.data!.szewTwins.length).toBe(pageSize);
      expect(szewTwinsResponse.data?._links).toBeDefined();
      expect(szewTwinsResponse.data?._links?.self).toBeDefined();
      // For pagination, check for next/prev links based on position
      if (skip > 0) {
        expect(szewTwinsResponse.data?._links?.prev).toBeDefined();
      }
      szewTwinsResponse.data!.szewTwins.forEach((actualszewTwin: SZEWTwinMinimal) => {
        expect(actualszewTwin.class).toBe("Endeavor");
        expect(actualszewTwin.subClass).toBe("Project");
      });
    }
  });

  it("should get query a project szewTwin by name", async () => {
    // Arrange
    const szewTwinName = TestConfig.szewTwinProjectName;

    // Act
    const szewTwinsResponse = await szewTwinsAccessClient.getSZEWTwins(accessToken, {
      subClass: "Project",
      displayName: szewTwinName,
    });
    const szewTwins = szewTwinsResponse.data?.szewTwins!;

    // Assert
    expect(szewTwins).not.toHaveLength(0);
    expect(szewTwinsResponse.data?._links).toBeDefined();
    expect(szewTwinsResponse.data?._links?.self).toBeDefined();
    szewTwins.forEach((actualszewTwin: SZEWTwinMinimal) => {
      expect(actualszewTwin.displayName).toBe(szewTwinName);
      expect(actualszewTwin.class).toBe("Endeavor");
      expect(actualszewTwin.subClass).toBe("Project");
    });
  });

  it("should get query a project szewTwin by number", async () => {
    // Arrange
    const szewTwinNumber = TestConfig.szewTwinProjectNumber;

    // Act
    const szewTwinsResponse = await szewTwinsAccessClient.getSZEWTwins(accessToken, {
      subClass: "Project",
      number: szewTwinNumber,
    });
    const szewTwins = szewTwinsResponse.data?.szewTwins!;

    // Assert
    expect(szewTwins).not.toHaveLength(0);
    expect(szewTwinsResponse.data?._links).toBeDefined();
    expect(szewTwinsResponse.data?._links?.self).toBeDefined();
    // All items match the name
    szewTwins.forEach((actualszewTwin: SZEWTwinMinimal) => {
      expect(actualszewTwin.number).toBe(szewTwinNumber);
      expect(actualszewTwin.class).toBe("Endeavor");
      expect(actualszewTwin.subClass).toBe("Project");
    });
  });

  it("should search for project szewTwins", async () => {
    // Arrange
    const szewTwinSearchString = TestConfig.szewTwinSearchString;

    // Act
    const szewTwinsResponse = await szewTwinsAccessClient.getSZEWTwins(accessToken, {
      subClass: "Project",
      search: szewTwinSearchString,
    });
    const szewTwins = szewTwinsResponse.data?.szewTwins!;

    // Assert
    expect(szewTwins).not.toHaveLength(0);
    expect(szewTwinsResponse.data?._links).toBeDefined();
    expect(szewTwinsResponse.data?._links?.self).toBeDefined();
    // All items match the name
    szewTwins.forEach((actualszewTwin: SZEWTwinMinimal) => {
      expect(actualszewTwin.displayName).toContain(szewTwinSearchString);
      expect(actualszewTwin.class).toBe("Endeavor");
      expect(actualszewTwin.subClass).toBe("Project");
    });
  });

  it("should get more properties of szewTwins in representation result mode", async () => {
    // Arrange
    const szewTwinSearchString = TestConfig.szewTwinSearchString;

    // Act
    const szewTwinsResponse = await szewTwinsAccessClient.getSZEWTwins(accessToken, {
      subClass: "Project",
      search: szewTwinSearchString,
      resultMode: "representation",
    });

    const szewTwins = szewTwinsResponse.data?.szewTwins!;

    // Assert
    expect(szewTwins).not.toHaveLength(0);
    expect(szewTwinsResponse.data?._links).toBeDefined();
    expect(szewTwinsResponse.data?._links?.self).toBeDefined();

    szewTwins.forEach((actualszewTwin) => {
      expect(actualszewTwin.parentId).toBeTypeOf("string");
      expect(actualszewTwin.szewTwinAccountId).toBeTypeOf("string");
      expect(actualszewTwin.createdDateTime).toBeTypeOf("string");
      expect(actualszewTwin.createdBy).toBeTypeOf("string");
    });
  });

  it("should get szewTwins in query scope of all", async () => {
    // Arrange
    const szewTwinSearchString = TestConfig.szewTwinSearchString;

    // Act
    const szewTwinsResponse = await szewTwinsAccessClient.getSZEWTwins(accessToken, {
      subClass: "Project",
      search: szewTwinSearchString,
      queryScope: "all",
    });

    const szewTwins = szewTwinsResponse.data?.szewTwins!;

    // Assert
    expect(szewTwins).not.toHaveLength(0);
    expect(szewTwinsResponse.data?._links).toBeDefined();
    expect(szewTwinsResponse.data?._links?.self).toBeDefined();
  });

  it("should filter szewTwins using OData filter parameter", async () => {
    // Act
    const szewTwinsResponse = await szewTwinsAccessClient.getSZEWTwins(accessToken, {
      subClass: "Project",
      filter: "status eq 'Active'",
      resultMode: "representation",
      top: 10,
    });

    const szewTwins = szewTwinsResponse.data?.szewTwins!;

    // Assert
    expect(szewTwins).not.toHaveLength(0);
    expect(szewTwinsResponse.data?._links).toBeDefined();
    expect(szewTwinsResponse.data?._links?.self).toBeDefined();
    szewTwins.forEach((actualszewTwin) => {
      expect(actualszewTwin.status).toBe("Active");
      expect(actualszewTwin.subClass).toBe("Project");
    });
  });

  it("should order szewTwins using OData orderby parameter", async () => {
    // Act
    const szewTwinsResponse = await szewTwinsAccessClient.getSZEWTwins(accessToken, {
      subClass: "Project",
      orderby: "displayName asc",
      top: 10,
    });

    const szewTwins = szewTwinsResponse.data?.szewTwins!;

    // Assert
    expect(szewTwins).not.toHaveLength(0);
    expect(szewTwinsResponse.data?._links).toBeDefined();
    expect(szewTwinsResponse.data?._links?.self).toBeDefined();

    // Verify ascending order by displayName
    for (let i = 1; i < szewTwins.length; i++) {
      expect(szewTwins[i].displayName.localeCompare(szewTwins[i - 1].displayName)).toBeGreaterThanOrEqual(0);
    }
  });

  it("should order szewTwins in descending order using OData orderby parameter", async () => {
    // Act
    const szewTwinsResponse = await szewTwinsAccessClient.getSZEWTwins(accessToken, {
      subClass: "Project",
      orderby: "displayName desc",
      top: 10,
    });

    const szewTwins = szewTwinsResponse.data?.szewTwins!;

    // Assert
    expect(szewTwins).not.toHaveLength(0);
    expect(szewTwinsResponse.data?._links).toBeDefined();
    expect(szewTwinsResponse.data?._links?.self).toBeDefined();

    // Verify descending order by displayName
    for (let i = 1; i < szewTwins.length; i++) {
      expect(szewTwins[i].displayName.localeCompare(szewTwins[i - 1].displayName)).toBeLessThanOrEqual(0);
    }
  });

  it("should select specific fields using OData select parameter", async () => {
    // Act
    const szewTwinsResponse = await szewTwinsAccessClient.getSZEWTwins(accessToken, {
      subClass: "Project",
      select: "id,displayName,class,subClass",
      top: 5,
    });

    const szewTwins = szewTwinsResponse.data?.szewTwins!;

    // Assert
    expect(szewTwins).not.toHaveLength(0);
    expect(szewTwinsResponse.data?._links).toBeDefined();
    expect(szewTwinsResponse.data?._links?.self).toBeDefined();
    szewTwins.forEach((actualszewTwin) => {
      // Selected fields should be present
      expect(actualszewTwin.id).toBeDefined();
      expect(actualszewTwin.displayName).toBeDefined();
      expect(actualszewTwin.class).toBeDefined();
      expect(actualszewTwin.subClass).toBe("Project");
    });
  });

  it("should combine multiple OData parameters", async () => {
    // Act
    const szewTwinsResponse = await szewTwinsAccessClient.getSZEWTwins(accessToken, {
      subClass: "Project",
      filter: "status eq 'Active'",
      orderby: "displayName asc",
      select: "id,displayName,status,class,subClass",
      resultMode: "representation",
      top: 5,
    });

    const szewTwins = szewTwinsResponse.data?.szewTwins!;

    // Assert
    expect(szewTwins).not.toHaveLength(0);
    expect(szewTwins.length).toBeLessThanOrEqual(5);
    expect(szewTwinsResponse.data?._links).toBeDefined();
    expect(szewTwinsResponse.data?._links?.self).toBeDefined();

    szewTwins.forEach((actualszewTwin) => {
      expect(actualszewTwin.status).toBe("Active");
      expect(actualszewTwin.subClass).toBe("Project");
      expect(actualszewTwin.id).toBeDefined();
      expect(actualszewTwin.displayName).toBeDefined();
    });

    // Verify ascending order by displayName
    for (let i = 1; i < szewTwins.length; i++) {
      expect(szewTwins[i].displayName.localeCompare(szewTwins[i - 1].displayName)).toBeGreaterThanOrEqual(0);
    }
  });

  it("should handle complex OData filter expressions", async () => {
    // Act
    const szewTwinsResponse = await szewTwinsAccessClient.getSZEWTwins(accessToken, {
      subClass: "Project",
      filter: "status eq 'Active' or status eq 'Trial'",
      resultMode: "representation",
      top: 10,
    });

    const szewTwins = szewTwinsResponse.data?.szewTwins!;

    // Assert
    expect(szewTwins).not.toHaveLength(0);
    expect(szewTwinsResponse.data?._links).toBeDefined();
    expect(szewTwinsResponse.data?._links?.self).toBeDefined();
    szewTwins.forEach((actualszewTwin) => {
      expect(["Active", "Trial"]).toContain(actualszewTwin.status);
      expect(actualszewTwin.subClass).toBe("Project");
    });
  });

  it("should get a list of asset szewTwins", async () => {
    // Act
    const szewTwinsResponse =
      await szewTwinsAccessClient.getSZEWTwins(accessToken, { subClass: "Asset" });

    // Assert
    expect(szewTwinsResponse.status).toBe(200);
    expect(szewTwinsResponse.data?.szewTwins).not.toHaveLength(0);
    expect(szewTwinsResponse.data?._links).toBeDefined();
    expect(szewTwinsResponse.data?._links?.self).toBeDefined();
  });

  it("should get more properties of asset szewTwins in representation result mode", async () => {
    // Act
    const szewTwinsResponse =
      await szewTwinsAccessClient.getSZEWTwins(accessToken, {
        subClass: "Asset",
        resultMode: "representation",
      });

    // Assert
    expect(szewTwinsResponse.data?.szewTwins).not.toHaveLength(0);
    expect(szewTwinsResponse.data?._links).toBeDefined();
    expect(szewTwinsResponse.data?._links?.self).toBeDefined();

    szewTwinsResponse.data!.szewTwins.forEach((actualszewTwin) => {
      expect(actualszewTwin.parentId).toBeTypeOf("string");
      expect(actualszewTwin.szewTwinAccountId).toBeTypeOf("string");
      expect(actualszewTwin.createdDateTime).toBeTypeOf("string");
      expect(actualszewTwin.createdBy).toBeTypeOf("string");
    });
  });

  it("should get a asset szewTwin", async () => {
    // Arrange
    const szewTwinId = process.env.IVJS_TEST_ASSET_ID;

    // Act
    const szewTwinsResponse =
      await szewTwinsAccessClient.getSZEWTwin(accessToken, szewTwinId!);

    // Assert
    expect(szewTwinsResponse.status).toBe(200);
    expect(szewTwinsResponse.data).toBeDefined();
    const actualszewTwin = szewTwinsResponse.data?.szewTwin!;
    expect(szewTwinId).toBe(actualszewTwin.id);
  });

  it("should get more asset szewTwin properties in representation result mode", async () => {
    // Arrange
    const szewTwinId = process.env.IVJS_TEST_ASSET_ID;

    // Act
    const szewTwinsResponse =
      await szewTwinsAccessClient.getSZEWTwin(
        accessToken,
        szewTwinId!,
        "representation"
      );

    // Assert
    const actualszewTwin: SZEWTwinRepresentation = szewTwinsResponse.data?.szewTwin!;
    expect(actualszewTwin.parentId).toBeTypeOf("string");
    expect(actualszewTwin.szewTwinAccountId).toBeTypeOf("string");
    expect(actualszewTwin.imageName).toBeNull();
    expect(actualszewTwin.image).toBeNull();
    expect(actualszewTwin.createdDateTime).toBeTypeOf("string");
    expect(actualszewTwin.createdBy).toBeTypeOf("string");
  });

  it("should get a paged list of asset szewTwins using top", async () => {
    // Arrange
    const numberOfszewTwins = 3;

    // Act
    const szewTwinsResponse = await szewTwinsAccessClient.getSZEWTwins(accessToken, {
      subClass: "Asset",
      top: numberOfszewTwins,
    });

    // Assert
    expect(szewTwinsResponse.data?.szewTwins).not.toHaveLength(0);
    expect(szewTwinsResponse.data!.szewTwins.length).toBe(3);
    szewTwinsResponse.data!.szewTwins.forEach((actualszewTwin) => {
      expect(actualszewTwin.class).toBe("Thing");
      expect(actualszewTwin.subClass).toBe("Asset");
    });
  });

  it("should get a paged list of asset szewTwins using skip", async () => {
    // Arrange
    const numberOfszewTwins = 3;
    const numberToSkip = 3;

    // Act
    const szewTwinsResponse = await szewTwinsAccessClient.getSZEWTwins(accessToken, {
      subClass: "Asset",
      top: numberOfszewTwins,
      skip: numberToSkip,
    });

    // Assert
    expect(szewTwinsResponse.data?.szewTwins).not.toHaveLength(0);
    expect(szewTwinsResponse.data!.szewTwins.length).toBe(3);
    szewTwinsResponse.data!.szewTwins.forEach((actualszewTwin) => {
      expect(actualszewTwin.class).toBe("Thing");
      expect(actualszewTwin.subClass).toBe("Asset");
    });
  });

  it("should get a first three pages of asset szewTwins", async () => {
    // Arrange
    const numberOfPages = 3;
    const pageSize = 2;

    // Act
    for (let skip = 0; skip < numberOfPages * pageSize; skip += pageSize) {
      const szewTwinsResponse = await szewTwinsAccessClient.getSZEWTwins(accessToken, {
        subClass: "Asset",
        top: pageSize,
        skip,
      });

      // Assert
      expect(szewTwinsResponse.data?.szewTwins).not.toHaveLength(0);
      expect(szewTwinsResponse.data?.szewTwins.length).toBe(pageSize);
      szewTwinsResponse.data?.szewTwins.forEach((actualszewTwin) => {
        expect(actualszewTwin.class).toBe("Thing");
        expect(actualszewTwin.subClass).toBe("Asset");
      });
    }
  });

  it("should get query an asset szewTwin by name", async () => {
    // Arrange
    const szewTwinName = TestConfig.szewTwinAssetName;

    // Act
    const szewTwinsResponse = await szewTwinsAccessClient.getSZEWTwins(accessToken, {
      subClass: "Asset",
      displayName: szewTwinName,
    });
    const szewTwins = szewTwinsResponse.data?.szewTwins!;

    // Assert
    expect(szewTwins).not.toHaveLength(0);
    // All items match the name
    szewTwins.forEach((actualszewTwin) => {
      expect(actualszewTwin.displayName).toBe(szewTwinName);
      expect(actualszewTwin.class).toBe("Thing");
      expect(actualszewTwin.subClass).toBe("Asset");
    });
  });

  it("should get query an asset szewTwin by number", async () => {
    // Arrange
    const szewTwinNumber = TestConfig.szewTwinAssetNumber;

    // Act
    const szewTwinsResponse = await szewTwinsAccessClient.getSZEWTwins(accessToken, {
      subClass: "Asset",
      number: szewTwinNumber,
    });
    const szewTwins = szewTwinsResponse.data?.szewTwins!;

    // Assert
    expect(szewTwins).not.toHaveLength(0);
    // All items match the name
    szewTwins.forEach((actualszewTwin) => {
      expect(actualszewTwin.number).toBe(szewTwinNumber);
      expect(actualszewTwin.class).toBe("Thing");
      expect(actualszewTwin.subClass).toBe("Asset");
    });
  });

  it("should search for asset szewTwins", async () => {
    // Arrange
    const szewTwinSearchString = TestConfig.szewTwinSearchString;

    // Act
    const szewTwinsResponse = await szewTwinsAccessClient.getSZEWTwins(accessToken, {
      subClass: "Asset",
      search: szewTwinSearchString,
    });
    const szewTwins = szewTwinsResponse.data?.szewTwins!;

    // Assert
    expect(szewTwins).not.toHaveLength(0);
    // All items match the name
    szewTwins.forEach((actualszewTwin) => {
      expect(actualszewTwin.displayName).toContain(szewTwinSearchString);
      expect(actualszewTwin.class).toBe("Thing");
      expect(actualszewTwin.subClass).toBe("Asset");
    });
  });

  it("should get the primary account szewTwin", async () => {
    // Act
    const szewTwinsResponse =
      await szewTwinsAccessClient.getPrimaryAccount(accessToken);

    // Assert
    expect(szewTwinsResponse.status).toBe(200);
    expect(szewTwinsResponse.data).toBeDefined();
    const actualszewTwin = szewTwinsResponse.data?.szewTwin!;
    expect(actualszewTwin.id).toBeTruthy();
  });

  it("should create, update, and delete an szewTwin", async () => {
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
    const szewTwinId = createResponse.data!.szewTwin.id!;

    // Assert
    expect(createResponse.status).toBe(201);
    expect(createResponse.data?.szewTwin!.displayName).toBe(newszewTwin.displayName);
    expect(createResponse.data?.szewTwin!.class).toBe(newszewTwin.class);
    expect(createResponse.data?.szewTwin!.subClass).toBe(newszewTwin.subClass);

    /* UPDATE SZEWTWIN */
    // Arrange
    const updatedszewTwin = {
      displayName: "UPDATED APIM szewTwin Test Display Name",
    };

    // Act
    const updateResponse =
      await szewTwinsAccessClient.updateSZEWtwin(accessToken, szewTwinId, updatedszewTwin);

    // Assert
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.data!.szewTwin.displayName).toBe(updatedszewTwin.displayName);

    /* DELETE SZEWTWIN */
    // Act
    const deleteResponse: SzewecAPIResponse<undefined> =
      await szewTwinsAccessClient.deleteSZEWtwin(accessToken, szewTwinId);

    // Assert
    expect(deleteResponse.status).toBe(204);
    expect(deleteResponse.data).toBeUndefined();
  });

  it("should get a 409 conflict when trying to create a duplicate", async () => {
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

    // Act
    const szewTwinResponse =
      await szewTwinsAccessClient.createSZEWTwin(accessToken, newszewTwin);
    const szewTwinResponse2 =
      await szewTwinsAccessClient.createSZEWTwin(accessToken, newszewTwin);
    const deleteResponse: SzewecAPIResponse<undefined> =
      await szewTwinsAccessClient.deleteSZEWtwin(
        accessToken,
        szewTwinResponse.data!.szewTwin.id!
      );

    // Assert
    expect(szewTwinResponse.status).toBe(201);
    expect(szewTwinResponse2.status).toBe(409);
    expect(szewTwinResponse2.data).toBeUndefined();
    expect(szewTwinResponse2.error).not.toBeUndefined();
    expect(szewTwinResponse2.error!.code).toBe("szewTwinExists");
    expect(szewTwinResponse2.error!.details![0].code).toBe("InvalidValue");
    expect(szewTwinResponse2.error!.details![0].target).toBe("number");
    expect(deleteResponse.status).toBe(204);
    expect(deleteResponse.data).toBeUndefined();
  });

  it("should get a 422 unprocessable entity when trying to create an szewTwin without a class specified", async () => {
    // Arrange
    const newszewTwin: SZEWtwinCreate = {
      displayName: `APIM szewTwin Test Display Name ${new Date().toISOString()}`,
      number: `APIM szewTwin Test Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      dataCenterLocation: "East US",
      status: "Trial",
    } as SZEWtwinCreate;

    // Act
    const szewTwinResponse =
      await szewTwinsAccessClient.createSZEWTwin(accessToken, newszewTwin);

    // Assert
    expect(szewTwinResponse.status).toBe(422);
    expect(szewTwinResponse.data).toBeUndefined();
    expect(szewTwinResponse.error).not.toBeUndefined();
    expect(szewTwinResponse.error!.code).toBe("InvalidszewTwinsRequest");
    expect(szewTwinResponse.error!.details![0].code).toBe(
      "MissingRequiredProperty"
    );
    expect(szewTwinResponse.error!.details![0].target).toBe("class");
  });
});
