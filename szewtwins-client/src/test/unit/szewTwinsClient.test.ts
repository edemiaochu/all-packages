/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { beforeEach, describe, expect, it } from "vitest";
import { SZEWTwinsClient } from "../../szewTwinsClient";
import type { SZEWTwinsQueryArg } from "../../types/SZEWTwinsQueryArgs";

/**
 * Test subclass to expose protected methods for unit testing
 */
class TestableszewTwinsClient extends SZEWTwinsClient {
  public testGetHeaders(arg?: SZEWTwinsQueryArg) {
    return (this as any).getHeaders(arg);
  }

  public testGetResultModeHeaders(resultMode?: "minimal" | "representation") {
    return (this as any).getResultModeHeaders(resultMode);
  }

  public testGetQueryScopeHeaders(queryScope?: string) {
    return (this as any).getQueryScopeHeaders(queryScope);
  }
}

describe("SZEWTwinsClient - Header Generation", () => {
  let client: TestableszewTwinsClient;

  beforeEach(() => {
    client = new TestableszewTwinsClient();
  });

  describe("getResultModeHeaders", () => {
    it("should return minimal by default", () => {
      const headers = client.testGetResultModeHeaders();
      expect(headers).toEqual({ prefer: "return=minimal" });
    });

    it("should return minimal when explicitly specified", () => {
      const headers = client.testGetResultModeHeaders("minimal");
      expect(headers).toEqual({ prefer: "return=minimal" });
    });

    it("should return representation when specified", () => {
      const headers = client.testGetResultModeHeaders("representation");
      expect(headers).toEqual({ prefer: "return=representation" });
    });

    it("should use correct HTTP header name", () => {
      const headers = client.testGetResultModeHeaders("representation");
      expect(headers).toHaveProperty("prefer");
      expect(headers.prefer).toContain("return=");
    });

    it("should format header value correctly", () => {
      const minimalHeaders = client.testGetResultModeHeaders("minimal");
      const representationHeaders = client.testGetResultModeHeaders("representation");

      expect(minimalHeaders.prefer).toBe("return=minimal");
      expect(representationHeaders.prefer).toBe("return=representation");
    });
  });

  describe("getQueryScopeHeaders", () => {
    it("should return memberOfSZEWtwin by default", () => {
      const headers = client.testGetQueryScopeHeaders();
      expect(headers).toEqual({ "x-szewtwin-query-scope": "memberOfSZEWtwin" });
    });

    it("should return specified query scope", () => {
      const headers = client.testGetQueryScopeHeaders("all");
      expect(headers).toEqual({ "x-szewtwin-query-scope": "all" });
    });

    it("should handle different query scope values", () => {
      const scopes = ["memberOfSZEWtwin", "all", "OrganizationAdmin"];

      scopes.forEach(scope => {
        const headers = client.testGetQueryScopeHeaders(scope);
        expect(headers["x-szewtwin-query-scope"]).toBe(scope);
      });
    });

    it("should use correct HTTP header name", () => {
      const headers = client.testGetQueryScopeHeaders("memberOfSZEWtwin");
      expect(headers).toHaveProperty("x-szewtwin-query-scope");
    });

    it("should use x-szewtwin-query-scope header (szewTwin platform standard)", () => {
      const headers = client.testGetQueryScopeHeaders("favoriteSZEWtwins");
      expect(Object.keys(headers)).toContain("x-szewtwin-query-scope");
    });
  });

  describe("getHeaders - Combined Headers", () => {
    it("should combine query scope and result mode headers with defaults", () => {
      const headers = client.testGetHeaders();

      expect(headers).toHaveProperty("x-szewtwin-query-scope");
      expect(headers).toHaveProperty("prefer");
      expect(headers["x-szewtwin-query-scope"]).toBe("memberOfSZEWtwin");
      expect(headers.prefer).toBe("return=minimal");
    });

    it("should use provided query scope", () => {
      const headers = client.testGetHeaders({
        queryScope: "all"
      });

      expect(headers["x-szewtwin-query-scope"]).toBe("all");
      expect(headers.prefer).toBe("return=minimal");
    });

    it("should use provided result mode", () => {
      const headers = client.testGetHeaders({
        resultMode: "representation"
      });

      expect(headers["x-szewtwin-query-scope"]).toBe("memberOfSZEWtwin");
      expect(headers.prefer).toBe("return=representation");
    });

    it("should combine both custom values", () => {
      const headers = client.testGetHeaders({
        queryScope: "OrganizationAdmin",
        resultMode: "representation"
      });

      expect(headers["x-szewtwin-query-scope"]).toBe("OrganizationAdmin");
      expect(headers.prefer).toBe("return=representation");
    });

    it("should handle undefined arg gracefully", () => {
      const headers = client.testGetHeaders(undefined);

      expect(headers["x-szewtwin-query-scope"]).toBe("memberOfSZEWtwin");
      expect(headers.prefer).toBe("return=minimal");
    });

    it("should handle empty object arg", () => {
      const headers = client.testGetHeaders({});

      expect(headers["x-szewtwin-query-scope"]).toBe("memberOfSZEWtwin");
      expect(headers.prefer).toBe("return=minimal");
    });

    it("should preserve other query args without affecting headers", () => {
      const headers = client.testGetHeaders({
        queryScope: "memberOfSZEWtwin",
        resultMode: "minimal",
        search: "test",
        top: 10
      } as any);

      // Should only have the header fields
      expect(Object.keys(headers).sort()).toEqual(["prefer", "x-szewtwin-query-scope"]);
    });

    it("should return new object each time (not cached)", () => {
      const headers1 = client.testGetHeaders();
      const headers2 = client.testGetHeaders();

      expect(headers1).toEqual(headers2);
      expect(headers1).not.toBe(headers2); // Different object instances
    });

    it("should work with all valid query scopes", () => {
      const queryScopes: Array<"memberOfSZEWtwin" | "all" | "OrganizationAdmin"> = [
        "memberOfSZEWtwin",
        "all",
        "OrganizationAdmin"
      ];

      queryScopes.forEach(scope => {
        const headers = client.testGetHeaders({ queryScope: scope });
        expect(headers["x-szewtwin-query-scope"]).toBe(scope);
      });
    });

    it("should work with both result modes", () => {
      const minimalHeaders = client.testGetHeaders({ resultMode: "minimal" });
      const representationHeaders = client.testGetHeaders({ resultMode: "representation" });

      expect(minimalHeaders.prefer).toBe("return=minimal");
      expect(representationHeaders.prefer).toBe("return=representation");
    });
  });

  describe("Header Integration", () => {
    it("should generate headers compatible with szewTwin Platform API", () => {
      const headers = client.testGetHeaders({
        queryScope: "all",
        resultMode: "representation"
      });

      // Verify headers match szewTwin Platform expectations
      expect(headers["x-szewtwin-query-scope"]).toBeDefined();
      expect(headers.prefer).toMatch(/^return=(minimal|representation)$/);
    });

    it("should support headers for all szewTwins query", () => {
      const headers = client.testGetHeaders({
        queryScope: "all",
        resultMode: "representation"
      });

      expect(headers["x-szewtwin-query-scope"]).toBe("all");
      expect(headers.prefer).toBe("return=representation");
    });

    it("should support headers for organization admin query", () => {
      const headers = client.testGetHeaders({
        queryScope: "OrganizationAdmin",
        resultMode: "minimal"
      });

      expect(headers["x-szewtwin-query-scope"]).toBe("OrganizationAdmin");
      expect(headers.prefer).toBe("return=minimal");
    });

    it("should support headers for general szewTwin queries", () => {
      const headers = client.testGetHeaders({
        queryScope: "memberOfSZEWtwin",
        resultMode: "representation"
      });

      expect(headers["x-szewtwin-query-scope"]).toBe("memberOfSZEWtwin");
      expect(headers.prefer).toBe("return=representation");
    });
  });

  describe("Edge Cases", () => {
    it("should handle null-like values gracefully", () => {
      const headers1 = client.testGetHeaders(undefined);
      const headers2 = client.testGetHeaders({} as any);

      expect(headers1).toEqual(headers2);
    });

    it("should not mutate input arguments", () => {
      const arg: SZEWTwinsQueryArg = {
        queryScope: "all",
        resultMode: "representation"
      };

      const argCopy = { ...arg };
      client.testGetHeaders(arg);

      expect(arg).toEqual(argCopy);
    });

    it("should handle extra properties in arg object", () => {
      const headers = client.testGetHeaders({
        queryScope: "memberOfSZEWtwin",
        resultMode: "minimal",
        extraProp: "ignored"
      } as any);

      expect(headers).toEqual({
        "x-szewtwin-query-scope": "memberOfSZEWtwin",
        prefer: "return=minimal"
      });
    });
  });
});
