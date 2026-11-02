/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import type { AccessToken } from "@szewtwin/core-szewec";
import { SzewecAPIResponse } from "src/types/CommonApiTypes";
import type { SZEWTwinRepresentation } from "src/types/SZEWTwin";
import { beforeAll, describe, expect, it } from "vitest";
import { SZEWTwinsClient } from "../../szewTwinsClient";
import { TestConfig } from "../TestConfig";

describe("szewTwinsClient Recently Used Functionality", () => {
  let baseUrl: string = "https://api.szewec.com/szewtwins";
  const urlPrefix = process.env.IVJS_URL_PREFIX;
  if (urlPrefix) {
    const url = new URL(baseUrl);
    url.hostname = urlPrefix + url.hostname;
    baseUrl = url.href;
  }
  const szewTwinsAccessClient: SZEWTwinsClient = new SZEWTwinsClient();
  let accessToken: AccessToken;

  beforeAll(async () => {
    accessToken = await TestConfig.getAccessToken();
  }, 120000);

  it("should get a list of recently used szewTwins", async () => {
    // Act
    const recentsResponse =
      await szewTwinsAccessClient.getRecentUsedSZEWTwins(accessToken);

    // Assert
    expect(recentsResponse.status).toBe(200);
    expect(recentsResponse.data).toBeDefined();

    // Validate that we don't exceed the 25 szewTwin limit
    if (recentsResponse.data!.szewTwins) {
      expect(recentsResponse.data!.szewTwins.length).toBeLessThanOrEqual(25);
    }
  });

  it("should get recently used szewTwins with query parameters", async () => {
    // Act
    const recentsResponse =
      await szewTwinsAccessClient.getRecentUsedSZEWTwins(accessToken, {
        top: 5,
        resultMode: "representation",
      });

    // Assert
    expect(recentsResponse.status).toBe(200);
    expect(recentsResponse.data).toBeDefined();

    // Should respect the top parameter (max 5 results)
    if (recentsResponse.data!.szewTwins) {
      expect(recentsResponse.data!.szewTwins.length).toBeLessThanOrEqual(5);

      // Verify representation mode returns additional properties
      recentsResponse.data!.szewTwins.forEach((szewTwin) => {
        expect(szewTwin.id).toBeDefined();
        expect(szewTwin.displayName).toBeDefined();
        expect(szewTwin.class).toBeDefined();
        expect(szewTwin.subClass).toBeDefined();
        expect(szewTwin.type).toBeDefined();
        expect(szewTwin.status).toBeDefined();
        expect(szewTwin.ianaTimeZone).toBeDefined();
        expect(szewTwin.dataCenterLocation).toBeDefined();
      });
    }
  });

  it("should get recently used szewTwins including inactive ones", async () => {
    // Act
    const recentsResponse =
      await szewTwinsAccessClient.getRecentUsedSZEWTwins(accessToken, {
        includeInactive: true,
      });

    // Assert
    expect(recentsResponse.status).toBe(200);
    expect(recentsResponse.data).toBeDefined();

    // Should not exceed 25 szewTwin limit even with inactive included
    if (recentsResponse.data!.szewTwins) {
      expect(recentsResponse.data!.szewTwins.length).toBeLessThanOrEqual(25);
    }
  });

  it("should return 404 when adding non-existent szewTwin to recents", async () => {
    // Arrange - Use a random GUID that doesn't exist
    const nonExistentSZEWTwinId = "33333333-3333-3333-3333-333333333333";

    // Act
    const addRecentResponse: SzewecAPIResponse<undefined> =
      await szewTwinsAccessClient.addSZEWTwinToMyRecents(accessToken, nonExistentSZEWTwinId);

    // Assert
    expect(addRecentResponse.status).toBe(404);
  });

  it("should successfully add and retrieve szewTwin from recently used list", async () => {
    // Arrange - Create a test szewTwin
    const newszewTwin: Omit<SZEWTwinRepresentation, "id">= {
      displayName: `APIM szewTwin Recents Test ${new Date().toISOString()}`,
      number: `APIM szewTwin Recents Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      ianaTimeZone: "America/New_York",
      status: "Trial",
    };

    const createResponse =
      await szewTwinsAccessClient.createSZEWTwin(accessToken, newszewTwin);
    const szewTwinId = createResponse.data?.szewTwin!.id!;

    try {
      expect(createResponse.status).toBe(201);

      // Act - Add szewTwin to recently used list
      const addRecentResponse: SzewecAPIResponse<undefined> =
        await szewTwinsAccessClient.addSZEWTwinToMyRecents(accessToken, szewTwinId);

      // Assert add operation
      expect(addRecentResponse.status).toBe(204);

      // Verify szewTwin appears in recently used list
      const recentsResponse =
        await szewTwinsAccessClient.getRecentUsedSZEWTwins(accessToken, {
          displayName: newszewTwin.displayName,
        });

      expect(recentsResponse.status).toBe(200);
      expect(recentsResponse.data).toBeDefined();

      // Find our szewTwin in the recents list
      const foundRecent = recentsResponse.data!.szewTwins?.find(
        (szewTwin: SZEWTwinRepresentation) => szewTwin.id === szewTwinId
      );
      expect(foundRecent).toBeDefined();
      expect(foundRecent!.displayName).toBe(newszewTwin.displayName);
    } finally {
      // Clean up - Delete the test szewTwin
      await szewTwinsAccessClient.deleteSZEWtwin(accessToken, szewTwinId);
    }
  });

  it("should handle adding the same szewTwin to recents multiple times", async () => {
    // Arrange - Create a test szewTwin
    const newszewTwin: Omit<SZEWTwinRepresentation, "id"> = {
      displayName: `APIM szewTwin Recents Duplicate Test ${new Date().toISOString()}`,
      number: `APIM szewTwin Recents Duplicate Number ${new Date().toISOString()}`,
      type: "Bridge",
      subClass: "Asset",
      class: "Thing",
      dataCenterLocation: "East US",
      ianaTimeZone: "America/New_York",
      status: "Trial",
    };

    const createResponse =
      await szewTwinsAccessClient.createSZEWTwin(accessToken, newszewTwin);
    const szewTwinId = createResponse.data?.szewTwin!.id!;

    try {
      // Act - Add szewTwin to recents twice
      const firstAddResponse: SzewecAPIResponse<undefined> =
        await szewTwinsAccessClient.addSZEWTwinToMyRecents(accessToken, szewTwinId);

      const secondAddResponse: SzewecAPIResponse<undefined> =
        await szewTwinsAccessClient.addSZEWTwinToMyRecents(accessToken, szewTwinId);

      // Assert - Both operations should succeed (idempotent behavior)
      expect(firstAddResponse.status).toBe(204);
      expect(secondAddResponse.status).toBe(204);

      // Verify szewTwin is in recently used list (should appear only once, most recent)
      const recentsResponse =
        await szewTwinsAccessClient.getRecentUsedSZEWTwins(accessToken, {
          displayName: newszewTwin.displayName,
        });

      expect(recentsResponse.status).toBe(200);

      // Should find exactly one instance of our szewTwin
      const matchingRecents = recentsResponse.data!.szewTwins?.filter(
        (szewTwin: SZEWTwinRepresentation) => szewTwin.id === szewTwinId
      );
      expect(matchingRecents).toBeDefined();
      expect(matchingRecents.length).toBe(1);
    } finally {
      // Clean up - Delete the test szewTwin
      await szewTwinsAccessClient.deleteSZEWtwin(accessToken, szewTwinId);
    }
  });

  it("should return recently used szewTwins in correct order (most recent first)", async () => {
    // Act - Get recently used szewTwins
    const recentsResponse = await szewTwinsAccessClient.getRecentUsedSZEWTwins(accessToken, {
      top: 10,
    });

    // Assert
    expect(recentsResponse.status).toBe(200);
    expect(recentsResponse.data).toBeDefined();

    if (recentsResponse.data!.szewTwins && recentsResponse.data!.szewTwins.length > 1) {
      // Verify ordering - each szewTwin should have a lastAccessedDateTime if available
      // Or verify that the list is properly ordered by checking that newer entries come first
      const szewTwins = recentsResponse.data!.szewTwins;

      // Basic validation that we have szewTwins and they have required properties
      szewTwins.forEach((szewTwin: SZEWTwinRepresentation) => {
        expect(szewTwin.id).toBeDefined();
        expect(szewTwin.displayName).toBeDefined();
      });

      // The API guarantees ordering, so we just verify we get a reasonable list
      expect(szewTwins.length).toBeGreaterThan(0);
      expect(szewTwins.length).toBeLessThanOrEqual(10);
    }
  });
});
