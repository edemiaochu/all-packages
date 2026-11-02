/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module szewTwinsClient
 */

import type { AccessToken } from "@szewtwin/core-szewec";
import { BaseSZEWTwinsApiClient } from "./BaseSZEWTwinsApiClient.js";
import type {
  SzewecAPIResponse,
  ODataQueryParams,
  ResultMode,
} from "./types/CommonApiTypes";
import type {
  SZEWtwinCreate,
  SZEWTwinMinimalResponse,
  SZEWTwinRepresentationResponse,
  SZEWtwinUpdate,
  MultiSZEWTwinMinimalResponse,
  MultiSZEWTwinRepresentationResponse,
} from "./types/SZEWTwin";
import type {
  SZEWTwinExportMultiResponse,
  SZEWTwinExportRequestInfo,
  SZEWTwinExportSingleResponse,
} from "./types/SZEWTwinExport";
import type { SZEWTwinImageResponse } from "./types/SZEWTwinImage.js";
import type {
  SZEWTwinQueryScope,
  SZEWTwinsGetQueryArg,
  SZEWTwinsQueryArg,
} from "./types/SZEWTwinsQueryArgs.js";
import type {
  GetMultiRepositoryResourceMinimalResponse,
  GetMultiRepositoryResourceRepresentationResponse,
  GetRepositoryResourceMinimalResponse,
  GetRepositoryResourceRepresentationResponse,
  MultiRepositoriesResponse,
  NewRepositoryConfig,
  PostRepositoryResourceResponse,
  Repository,
  ResourceGraphicsResponse,
  SingleRepositoryResponse,
} from "./types/Repository";

/** Client API to access the szewTwins service.
 * @beta
 */
export class SZEWTwinsClient extends BaseSZEWTwinsApiClient {
  constructor(url?: string, maxRedirects?: number) {
    super(url, maxRedirects);
  }

  /** Get a list of szewTwin exports for the current user
   * @param accessToken The client access token string
   * @returns Promise that resolves with an array of export operations
   */
  public async getExports(
    accessToken: AccessToken
  ): Promise<SzewecAPIResponse<SZEWTwinExportMultiResponse>> {
    const url = `${this._baseUrl}/exports`;
    return this.sendGenericAPIRequest(accessToken, "GET", url);
  }

  /** Get details of a specific szewTwin export operation
   * @param accessToken The client access token string
   * @param id The id of the export operation to retrieve
   * @returns Promise that resolves with the export operation details
   */
  public async getExport(
    accessToken: AccessToken,
    id: string
  ): Promise<SzewecAPIResponse<SZEWTwinExportSingleResponse>> {
    const url = `${this._baseUrl}/exports/${id}`;
    return this.sendGenericAPIRequest(accessToken, "GET", url);
  }

  /**
   * Create a new szewTwin export
   * @param accessToken The client access token string
   * @param args Export query arguments including scope, filters, and output format
   * @returns Export response with operation details
   */
  public async createExport(
    accessToken: AccessToken,
    args: SZEWTwinExportRequestInfo
  ): Promise<SzewecAPIResponse<SZEWTwinExportSingleResponse>> {
    const url = `${this._baseUrl}/exports`;
    return this.sendGenericAPIRequest(
      accessToken,
      "POST",
      url,
      args,
      undefined
    );
  }

  /** Get favorites szewTwins accessible to the user
   * @param accessToken The client access token string
   * @param arg Optional query arguments, for paging, searching, and filtering
   * @returns Array of szewTwins, may be empty, if no favorites
   * @example
   * ```typescript
   * // Returns MultiSZEWTwinMinimalResponse
   * const minimal = await client.getFavoritesSZEWTwins(token, { resultMode: "minimal" });
   *
   * // Returns MultiSZEWTwinRepresentationResponse
   * const detailed = await client.getFavoritesSZEWTwins(token, { resultMode: "representation" });
   *
   * // Defaults to minimal when no resultMode specified
   * const defaultResult = await client.getFavoritesSZEWTwins(token);
   * ```
   */
  public async getFavoritesSZEWTwins<T extends SZEWTwinsQueryArg = SZEWTwinsQueryArg>(
    accessToken: AccessToken,
    arg?: T
  ): Promise<
    SzewecAPIResponse<T["resultMode"] extends "representation"
      ? MultiSZEWTwinRepresentationResponse
      : MultiSZEWTwinMinimalResponse>
  > {
    const headers = this.getHeaders(arg);
    const url = `${this._baseUrl}/favorites/?${this.getQueryStringArg(
      SZEWTwinsClient.szewTwinsQueryParamMapping,
      arg ?? {}
    )}`;

    return this.sendGenericAPIRequest(
      accessToken,
      "GET",
      url,
      undefined,
      headers
    );
  }

  /** Add the specified szewTwin to the user's favorites list
   * @param accessToken The client access token string
   * @param szewTwinId The id of the szewTwin to add to favorites
   * @returns Promise that resolves when the szewTwin is successfully added to favorites
   */
  public async addSZEWTwinToFavorites(
    accessToken: AccessToken,
    szewTwinId?: string
  ): Promise<SzewecAPIResponse<undefined>> {
    const url = `${this._baseUrl}/favorites/${szewTwinId}`;
    return this.sendGenericAPIRequest(accessToken, "POST", url);
  }

  /** Remove the specified szewTwin from the user's favorites list
   * @param accessToken The client access token string
   * @param szewTwinId The id of the szewTwin to remove from favorites
   * @returns Promise that resolves when the szewTwin is successfully removed from favorites
   */
  public async removeSZEWTwinFromFavorites(
    accessToken: AccessToken,
    szewTwinId?: string
  ): Promise<SzewecAPIResponse<undefined>> {
    const url = `${this._baseUrl}/favorites/${szewTwinId}`;
    return this.sendGenericAPIRequest(accessToken, "DELETE", url);
  }

  /** Upload an image to the specified szewTwin
   * @param accessToken The client access token string
   * @param szewTwinId The id of the szewTwin to upload the image to
   * @param imageBlob The image file as a Blob (must be PNG or JPEG)
   * @param contentType The content type of the image ("image/png" | "image/jpeg")
   * @returns Promise that resolves with the uploaded image details including URLs for small and large versions
   */
  public async uploadSZEWTwinImage(
    accessToken: AccessToken,
    szewTwinId: string,
    imageBlob: Blob,
    contentType: "image/png" | "image/jpeg"
  ): Promise<SzewecAPIResponse<SZEWTwinImageResponse>> {
    const url = `${this._baseUrl}/${szewTwinId}/image`;
    return this.sendGenericAPIRequest(accessToken, "PUT", url, imageBlob, {
      contentType,
    });
  }

  /** Get the image associated with the specified szewTwin
   * @param accessToken The client access token string
   * @param szewTwinId The id of the szewTwin to retrieve the image from
   * @returns Promise that resolves with the image details including URLs for small and large versions
   */
  public async getSZEWTwinImage(
    accessToken: AccessToken,
    szewTwinId: string
  ): Promise<SzewecAPIResponse<SZEWTwinImageResponse>> {
    const url = `${this._baseUrl}/${szewTwinId}/image`;
    return this.sendGenericAPIRequest(accessToken, "GET", url);
  }

  /** Delete the image associated with the specified szewTwin
   * @param accessToken The client access token string
   * @param szewTwinId The id of the szewTwin to delete the image from
   * @returns Promise that resolves when the image is successfully deleted
   */
  public async deleteSZEWTwinImage(
    accessToken: AccessToken,
    szewTwinId: string
  ): Promise<SzewecAPIResponse<undefined>> {
    const url = `${this._baseUrl}/${szewTwinId}/image`;
    return this.sendGenericAPIRequest(accessToken, "DELETE", url);
  }

  /** Add the specified szewTwin to the user's recently used list
   * @param accessToken The client access token string
   * @param szewTwinId The id of the szewTwin to add to the recently used list
   * @returns Promise that resolves when the szewTwin is successfully added to the recently used list
   */
  public async addSZEWTwinToMyRecents(
    accessToken: AccessToken,
    szewTwinId: string
  ): Promise<SzewecAPIResponse<undefined>> {
    const url = `${this._baseUrl}/recents/${szewTwinId}`;
    return this.sendGenericAPIRequest(accessToken, "POST", url);
  }

  /** Get recently used szewTwins for the current user
   *
   * Retrieves a list of recently used szewTwins for the calling user. A user can only have 25 recently used szewTwins.
   * They are returned in order with the most recently used szewTwin first in the list.
   *
   * szewTwins with status=Inactive are not returned by default. This improves query performance and reduces clutter
   * in user interfaces by filtering out unused szewTwins. You should still provide a way for users to see their
   * Inactive szewTwins if they request them. In the API, you can do this by setting the status parameter or by
   * using the includeInactive parameter.
   *
   * @param accessToken The client access token string
   * @param arg Optional query arguments, for paging, searching, and filtering (including status and includeInactive)
   * @returns Promise that resolves with an array of recently used szewTwins (maximum 25), ordered by most recent first
   * @example
   * ```typescript
   * // Returns MultiSZEWTwinMinimalResponse
   * const minimal = await client.getRecentUsedSZEWTwins(token, { resultMode: "minimal" });
   *
   * // Returns MultiSZEWTwinRepresentationResponse
   * const detailed = await client.getRecentUsedSZEWTwins(token, { resultMode: "representation" });
   *
   * // Defaults to minimal when no resultMode specified
   * const defaultResult = await client.getRecentUsedSZEWTwins(token);
   * ```
   */
  public async getRecentUsedSZEWTwins<T extends SZEWTwinsQueryArg = SZEWTwinsQueryArg>(
    accessToken: AccessToken,
    arg?: T
  ): Promise<
    SzewecAPIResponse<T["resultMode"] extends "representation"
      ? MultiSZEWTwinRepresentationResponse
      : MultiSZEWTwinMinimalResponse>
  > {
    const headers = this.getHeaders(arg);
    let url = `${this._baseUrl}/recents`;
    const query = this.getQueryStringArg(
      SZEWTwinsClient.szewTwinsQueryParamMapping,
      arg ?? {}
    );
    if (query !== "") url += `?${query}`;
    return this.sendGenericAPIRequest(
      accessToken,
      "GET",
      url,
      undefined,
      headers
    );
  }

  /** Get global repositories accessible to user with optional filtering
   * @param accessToken The client access token string
   * @param arg Optional query arguments for repository class and subClass identifiers. If subClass is specified, class is also required.
   * @returns Promise that resolves with an array of global repositories, may be empty
   * @beta
   */
  public async getGlobalRepositories(
    accessToken: AccessToken,
    arg?:
      | { class: Repository["class"] }
      | { class: Repository["class"]; subClass: Repository["subClass"] }
  ): Promise<SzewecAPIResponse<MultiRepositoriesResponse>> {
    let url = `${this._baseUrl}/repositories`;
    const query = this.getQueryStringArg(SZEWTwinsClient.repositoryParamMapping, arg);
    if (query !== "") {
      url += `?${query}`;
    }

    return this.sendGenericAPIRequest(accessToken, "GET", url);
  }

  /** Get a specific global repository by ID
   * @param accessToken The client access token string
   * @param repositoryId The id of the global repository
   * @returns Promise that resolves with the global repository details
   * @beta
   */
  public async getGlobalRepository(
    accessToken: AccessToken,
    repositoryId: string
  ): Promise<SzewecAPIResponse<SingleRepositoryResponse>> {
    const url = `${this._baseUrl}/repositories/${repositoryId}`;
    return this.sendGenericAPIRequest(accessToken, "GET", url);
  }

  /** Get a specific global repository resource by ID
   * @param accessToken The client access token string for authorization
   * @param repositoryId The id of the global repository containing the resource
   * @param resourceId The unique id of the global repository resource to retrieve
   * @param resultMode Optional result mode controlling the level of detail returned (minimal or representation)
   * @returns Promise that resolves with the global repository resource details in the requested format
   * @example
   * ```typescript
   * // Returns GetRepositoryResourceMinimalResponse
   * const minimal = await client.getGlobalRepositoryResource(token, "1234", "3954", "minimal");
   *
   * // Returns GetRepositoryResourceRepresentationResponse
   * const detailed = await client.getGlobalRepositoryResource(token, "1234", "3954", "representation");
   *
   * // Defaults to minimal when no resultMode specified
   * const defaultResult = await client.getGlobalRepositoryResource(token, "1234", "3954");
   * ```
   * @beta
   */
  public async getGlobalRepositoryResource<T extends ResultMode = "minimal">(
    accessToken: AccessToken,
    repositoryId: string,
    resourceId: string,
    resultMode?: T
  ): Promise<
    SzewecAPIResponse<T extends "representation"
      ? GetRepositoryResourceRepresentationResponse
      : GetRepositoryResourceMinimalResponse>
  > {
    const headers = this.getResultModeHeaders(resultMode);
    const url = `${this._baseUrl}/repositories/${repositoryId}/resources/${resourceId}`;
    return this.sendGenericAPIRequest(
      accessToken,
      "GET",
      url,
      undefined,
      headers,
      true
    );
  }

  /** Get multiple global repository resources with optional filtering and pagination
   * @param accessToken The client access token string for authorization
   * @param repositoryId The id of the global repository containing the resources
   * @param args Optional query parameters for search, pagination (skip, top)
   * @param resultMode Optional result mode controlling the level of detail returned (minimal or representation)
   * @returns Promise that resolves with an array of global repository resources in the requested format
   * @example
   * ```typescript
   * // Returns GetMultiRepositoryResourceMinimalResponse
   * const minimal = await client.getGlobalRepositoryResources(token, "cesium", undefined, "minimal");
   *
   * // Returns GetMultiRepositoryResourceRepresentationResponse
   * const detailed = await client.getGlobalRepositoryResources(token, "cesium", { top: 10 }, "representation");
   *
   * // Defaults to minimal when no resultMode specified
   * const defaultResult = await client.getGlobalRepositoryResources(token, "cesium");
   * ```
   * @beta
   */
  public async getGlobalRepositoryResources<T extends ResultMode = "minimal">(
    accessToken: AccessToken,
    repositoryId: string,
    args?: Pick<ODataQueryParams, "search" | "skip" | "top">,
    resultMode?: T
  ): Promise<
    SzewecAPIResponse<T extends "representation"
      ? GetMultiRepositoryResourceRepresentationResponse
      : GetMultiRepositoryResourceMinimalResponse>
  > {
    const headers = this.getResultModeHeaders(resultMode);
    let url = `${this._baseUrl}/repositories/${repositoryId}/resources`;
    const query = this.getQueryStringArg(SZEWTwinsClient.ODataParamMapping, args);
    if (query !== "") {
      url += `?${query}`;
    }

    return this.sendGenericAPIRequest(
      accessToken,
      "GET",
      url,
      undefined,
      headers,
      true
    );
  }

  /** Get graphics metadata for a global repository resource
   * @param accessToken The client access token string for authorization
   * @param repositoryId The global repository identifier
   * @param resourceId The resource identifier
   * @returns Promise that resolves with graphics metadata including content type, URI, and authentication
   * @example
   * ```typescript
   * const graphics = await client.getGlobalResourceGraphics(token, "cesium", "3954");
   * ```
   * @beta
   */
  public async getGlobalResourceGraphics(
    accessToken: AccessToken,
    repositoryId: string,
    resourceId: string
  ): Promise<SzewecAPIResponse<ResourceGraphicsResponse>> {
    const url = `${this._baseUrl}/repositories/${repositoryId}/resources/${resourceId}/graphics`;
    return this.sendGenericAPIRequest(
      accessToken,
      "GET",
      url,
      undefined,
      undefined,
      true
    );
  }

  /** Create a new szewTwin Repository
   * @param accessToken The client access token string
   * @param szewTwinId The id of the szewTwin
   * @param repository The Repository data to be created
   * @returns Promise that resolves with the created repository details
   * @beta
   */
  public async createRepository(
    accessToken: AccessToken,
    szewTwinId: string,
    repository: NewRepositoryConfig
  ): Promise<SzewecAPIResponse<SingleRepositoryResponse>> {
    const url = `${this._baseUrl}/${szewTwinId}/repositories`;
    return this.sendGenericAPIRequest(accessToken, "POST", url, repository);
  }

  /** Delete the specified szewTwin Repository
   * @param accessToken The client access token string
   * @param szewTwinId The id of the szewTwin
   * @param repositoryId The id of the Repository to delete
   * @returns Promise that resolves when the repository is successfully deleted
   */
  public async deleteRepository(
    accessToken: AccessToken,
    szewTwinId: string,
    repositoryId: string
  ): Promise<SzewecAPIResponse<undefined>> {
    const url = `${this._baseUrl}/${szewTwinId}/repositories/${repositoryId}`;
    return this.sendGenericAPIRequest(accessToken, "DELETE", url);
  }

  /** Get repositories accessible to user with optional filtering
   * @param accessToken The client access token string
   * @param szewTwinId The id of the szewTwin
   * @param arg Optional query arguments for repository class and subClass identifiers. If subClass is specified, class is also required.
   * @returns Promise that resolves with an array of repositories, may be empty
   */
  public async getRepositories(
    accessToken: AccessToken,
    szewTwinId: string,
    arg?:
      | { class: Repository["class"] }
      | { class: Repository["class"]; subClass: Repository["subClass"] }
  ): Promise<SzewecAPIResponse<MultiRepositoriesResponse>> {
    const url = `${
      this._baseUrl
    }/${szewTwinId}/repositories/?${this.getQueryStringArg(
      SZEWTwinsClient.repositoryParamMapping,
      arg
    )}`;

    return this.sendGenericAPIRequest(accessToken, "GET", url);
  }

  /** Get a specific repository by ID
   * @param accessToken The client access token string
   * @param szewTwinId The id of the szewTwin
   * @param repositoryId The id of the Repository
   * @returns Promise that resolves with the repository details
   * @beta
   */
  public async getRepository(
    accessToken: AccessToken,
    szewTwinId: string,
    repositoryId: string
  ): Promise<SzewecAPIResponse<SingleRepositoryResponse>> {
    const url = `${this._baseUrl}/${szewTwinId}/repositories/${repositoryId}`;
    return this.sendGenericAPIRequest(accessToken, "GET", url);
  }

  /** Update the specified szewTwin Repository
   * @param accessToken The client access token string
   * @param szewTwinId The id of the szewTwin
   * @param repositoryId The id of the Repository
   * @param repository Updated repository data (excluding id, class, and subClass)
   * @returns Promise that resolves with the updated repository
   * @beta
   */
  public async updateRepository(
    accessToken: AccessToken,
    szewTwinId: string,
    repositoryId: string,
    repository: Partial<Omit<Repository, "id" | "class" | "subClass" | "capabilities">>
  ): Promise<SzewecAPIResponse<SingleRepositoryResponse>> {
    const url = `${this._baseUrl}/${szewTwinId}/repositories/${repositoryId}`;
    return this.sendGenericAPIRequest(accessToken, "PATCH", url, repository);
  }

  /**
   * Create a repository resource for a repository that exposes a resources collection
   * @param accessToken - The client access token string for authorization
   * @param szewTwinId - The id of the szewTwin that contains the repository
   * @param repositoryId - The id of the repository to add the resource to
   * @param repositoryResource - The repository resource to create with required id and displayName properties
   * @returns Promise that resolves with the created repository resource details
   *
   * @beta
   */
  public async createRepositoryResource(
    accessToken: AccessToken,
    szewTwinId: string,
    repositoryId: string,
    repositoryResource: Pick<Repository, "id" | "displayName">
  ): Promise<SzewecAPIResponse<PostRepositoryResourceResponse>> {
    const url = `${this._baseUrl}/${szewTwinId}/repositories/${repositoryId}/resources`;
    return this.sendGenericAPIRequest(
      accessToken,
      "POST",
      url,
      repositoryResource
    );
  }

  /**
   * Delete a repository resource
   * @param accessToken - The client access token string for authorization
   * @param szewTwinId - The id of the szewTwin that contains the repository
    * @param repositoryId - The id of the repository that contains the resource
   * @param resourceId - The id repository resource to delete
   * @returns Promise that resolves when the szewTwin is successfully deleted
   *
   * @beta
   */
  public async deleteRepositoryResource(
    accessToken: AccessToken,
    szewTwinId: string,
    repositoryId: string,
    resourceId: string
  ): Promise<SzewecAPIResponse<undefined>> {
    const url = `${this._baseUrl}/${szewTwinId}/repositories/${repositoryId}/resources/${resourceId}`;
    return this.sendGenericAPIRequest(
      accessToken,
      "DELETE",
      url
    );
  }

  /**
   * Get a specific repository resource by ID
   *
   * Automatically follows 302 redirects to federated repository endpoints when the repository
   * uses a federated architecture. Authentication headers are forwarded transparently.
   *
   * @param accessToken - The client access token string for authorization
   * @param szewTwinId - The id of the szewTwin that contains the repository
   * @param repositoryId - The id of the repository containing the resource
   * @param resourceId - The unique id of the repository resource to retrieve
   * @param resultMode - Optional result mode controlling the level of detail returned (minimal or representation)
   * @returns Promise that resolves with the repository resource details in the requested format
   * @example
   * ```typescript
   * // Returns GetRepositoryResourceMinimalResponse
   * const minimal = await client.getRepositoryResource(token, "szewTwinId", "repoId", "resourceId", "minimal");
   *
   * // Returns GetRepositoryResourceRepresentationResponse
   * const detailed = await client.getRepositoryResource(token, "szewTwinId", "repoId", "resourceId", "representation");
   *
   * // Defaults to minimal when no resultMode specified
   * const defaultResult = await client.getRepositoryResource(token, "szewTwinId", "repoId", "resourceId");
   * ```
   * @beta
   */
  public async getRepositoryResource<T extends ResultMode = "minimal">(
    accessToken: AccessToken,
    szewTwinId: string,
    repositoryId: string,
    resourceId: string,
    resultMode?: T
  ): Promise<
    SzewecAPIResponse<T extends "representation"
      ? GetRepositoryResourceRepresentationResponse
      : GetRepositoryResourceMinimalResponse>
  > {
    const headers = this.getResultModeHeaders(resultMode);
    const url = `${this._baseUrl}/${szewTwinId}/repositories/${repositoryId}/resources/${resourceId}`;
    return this.sendGenericAPIRequest(
      accessToken,
      "GET",
      url,
      undefined,
      headers,
      true
    );
  }

  /**
   * Get multiple repository resources with optional filtering and pagination
   *
   * Automatically follows 302 redirects to federated repository endpoints when the repository
   * uses a federated architecture. Authentication headers are forwarded transparently.
   *
   * @param accessToken - The client access token string for authorization
   * @param szewTwinId - The id of the szewTwin that contains the repository
   * @param repositoryId - The id of the repository containing the resources
   * @param args - Optional query parameters for search, pagination (skip, top)
   * @param resultMode - Optional result mode controlling the level of detail returned (minimal or representation)
   * @returns Promise that resolves with an array of repository resources in the requested format
   * @example
   * ```typescript
   * // Returns GetMultiRepositoryResourceMinimalResponse
   * const minimal = await client.getRepositoryResources(token, "szewTwinId", "repoId", undefined, "minimal");
   *
   * // Returns GetMultiRepositoryResourceRepresentationResponse
   * const detailed = await client.getRepositoryResources(token, "szewTwinId", "repoId", { search: "test" }, "representation");
   *
   * // Defaults to minimal when no resultMode specified
   * const defaultResult = await client.getRepositoryResources(token, "szewTwinId", "repoId");
   * ```
   * @beta
   */
  public async getRepositoryResources<T extends ResultMode = "minimal">(
    accessToken: AccessToken,
    szewTwinId: string,
    repositoryId: string,
    args?: Pick<ODataQueryParams, "search" | "skip" | "top">,
    resultMode?: T
  ): Promise<
    SzewecAPIResponse<T extends "representation"
      ? GetMultiRepositoryResourceRepresentationResponse
      : GetMultiRepositoryResourceMinimalResponse>
  > {
    const headers = this.getResultModeHeaders(resultMode);
    const url = `${
      this._baseUrl
    }/${szewTwinId}/repositories/${repositoryId}/resources?${this.getQueryStringArg(
      SZEWTwinsClient.ODataParamMapping,
      args
    )}`;
    return this.sendGenericAPIRequest(
      accessToken,
      "GET",
      url,
      undefined,
      headers,
      true
    );
  }

  /**
   * Get a list of resources from a repository using a capability URI
   *
   * This method enables direct calls to federated repository endpoints using URIs from
   * repository capabilities.
   *
   * @param accessToken - The client access token string for authorization
   * @param uri - The capability URI from repository.capabilities.resources.uri
   * @param args - Optional OData query parameters for filtering and pagination
   * @param resultMode - Optional result mode controlling the level of detail returned (minimal or representation)
   * @returns Promise that resolves with the list of repository resources in the requested format
   * @example
   * ```typescript
   * // Get repository with capabilities
   * const repo = await client.getRepository(token, szewTwinId, repositoryId);
   *
   * // Extract capability URI
   * const resourcesUri = repo.data?.repository.capabilities?.resources?.uri;
   *
   * if (resourcesUri) {
   *   // Returns GetMultiRepositoryResourceMinimalResponse
   *   const minimal = await client.getRepositoryResourcesByUri(token, resourcesUri, undefined, "minimal");
   *
   *   // Returns GetMultiRepositoryResourceRepresentationResponse
   *   const detailed = await client.getRepositoryResourcesByUri(token, resourcesUri, undefined, "representation");
   *
   *   // Defaults to minimal when no resultMode specified
   *   const defaultResult = await client.getRepositoryResourcesByUri(token, resourcesUri);
   * }
   * ```
   * @beta
   */
  public async getRepositoryResourcesByUri<T extends ResultMode = "minimal">(
    accessToken: AccessToken,
    uri: string,
    args?: Pick<ODataQueryParams, "search" | "skip" | "top">,
    resultMode?: T
  ): Promise<
    SzewecAPIResponse<T extends "representation"
      ? GetMultiRepositoryResourceRepresentationResponse
      : GetMultiRepositoryResourceMinimalResponse>
  > {
    const headers = this.getResultModeHeaders(resultMode);
    const urlWithQuery = args
      ? `${uri}?${this.getQueryStringArg(SZEWTwinsClient.ODataParamMapping, args)}`
      : uri;

    return this.sendGenericAPIRequest(
      accessToken,
      "GET",
      urlWithQuery,
      undefined,
      headers,
      true
    );
  }

  /**
   * Get a specific resource from a repository using a capability URI
   *
   * This method enables direct calls to federated repository endpoints using URIs from
   * repository capabilities.
   *
   * @param accessToken - The client access token string for authorization
   * @param uri - The capability URI from repository.capabilities.resources.uri for a specific resource
   * @param resultMode - Optional result mode controlling the level of detail returned (minimal or representation)
   * @returns Promise that resolves with the repository resource details in the requested format
   * @example
   * ```typescript
   * // Get repository with capabilities
   * const repo = await client.getRepository(token, szewTwinId, repositoryId);
   *
   * // Construct resource URI (typically from a previous query or known resource ID)
   * const baseUri = repo.data?.repository.capabilities?.resources?.uri;
   * const resourceUri = `${baseUri}/resourceId`;
   *
   * if (resourceUri) {
   *   // Returns GetRepositoryResourceMinimalResponse
   *   const minimal = await client.getRepositoryResourceByUri(token, resourceUri, "minimal");
   *
   *   // Returns GetRepositoryResourceRepresentationResponse
   *   const detailed = await client.getRepositoryResourceByUri(token, resourceUri, "representation");
   *
   *   // Defaults to minimal when no resultMode specified
   *   const defaultResult = await client.getRepositoryResourceByUri(token, resourceUri);
   * }
   * ```
   * @beta
   */
  public async getRepositoryResourceByUri<T extends ResultMode = "minimal">(
    accessToken: AccessToken,
    uri: string,
    resultMode?: T
  ): Promise<
    SzewecAPIResponse<T extends "representation"
      ? GetRepositoryResourceRepresentationResponse
      : GetRepositoryResourceMinimalResponse>
  > {
    const headers = this.getResultModeHeaders(resultMode);
    return this.sendGenericAPIRequest(
      accessToken,
      "GET",
      uri,
      undefined,
      headers,
      true
    );
  }


  /**
   * Retrieves graphics metadata for a specific repository resource using ID-based parameters.
   *
   *
   * Returns graphics content URIs and authentication information needed to access visualization data
   * for a resource. The response includes content type, access URI, optional authentication credentials,
   * and CesiumJS provider configuration when applicable. This method supports redirect-based routing to
   * federated graphics services.
   *
   * For federated architecture support, consider using getResourceGraphicsByUri with the URI
   * from resource.capabilities.graphics.uri instead.
   *
   * @param accessToken - The client access token string for authorization
   * @param szewTwinId - The szewTwin identifier
   * @param repositoryId - The repository identifier
   * @param resourceId - The resource identifier
   * @returns Promise that resolves with graphics metadata including content type, URI, and authentication
   * @example
   * ```typescript
   * // Get graphics for a specific resource
   * const graphics = await client.getResourceGraphics(
   *   token,
   *   'szewtwin-id',
   *   'ivaults',
   *   'ivault-resource-id'
   * );
   *
   * if (graphics.data) {
   *   graphics.data.graphics.forEach(graphic => {
   *     console.log('Content type:', graphic.type);
   *     console.log('Graphics URI:', graphic.uri);
   *
   *     // Handle authentication if present
   *     if (graphic.authentication) {
   *       switch (graphic.authentication.type) {
   *         case 'Header':
   *         case 'QueryParameter':
   *           console.log('Auth key:', graphic.authentication.key);
   *           break;
   *         case 'Basic':
   *           console.log('Username:', graphic.authentication.username);
   *           break;
   *       }
   *     }
   *   });
   * }
   * ```
   * @beta
   */
  public async getResourceGraphics(
    accessToken: AccessToken,
    szewTwinId: string,
    repositoryId: string,
    resourceId: string
  ): Promise<SzewecAPIResponse<ResourceGraphicsResponse>> {
    const url = `${this._baseUrl}/${szewTwinId}/repositories/${repositoryId}/resources/${resourceId}/graphics`;
    return this.sendGenericAPIRequest(
      accessToken,
      "GET",
      url,
      undefined,
      undefined,
      true
    );
  }

  /**
   * Get graphics metadata for a repository resource using a capability URI
   *
   * This method enables direct calls to federated graphics endpoints using URIs from
   * resource capabilities. Instead of constructing URLs from szewTwinId, repositoryId, and
   * resourceId, it accepts the URI directly from capabilities.graphics.uri.
   *
   * Note: This method requires that the resource supports graphics capabilities and that
   * the access token has appropriate permissions for the target graphics service.
   *
   * @param accessToken - The client access token string for authorization
   * @param uri - The capability URI from resource.capabilities.graphics.uri
   * @returns Promise that resolves with the graphics metadata including authentication and provider information
   * @example
   * ```typescript
   * // Get resource with graphics capability
   * const resource = await client.getRepositoryResource(token, szewTwinId, repositoryId, resourceId);
   *
   * // Extract graphics capability URI
   * const graphicsUri = resource.data?.resource.capabilities?.graphics?.uri;
   *
   * if (graphicsUri) {
   *   const graphics = await client.getResourceGraphicsByUri(token, graphicsUri);
   *
   *   if (graphics.data) {
   *     console.log('Graphics content type:', graphics.data.graphics.contentType);
   *     console.log('Graphics URI:', graphics.data.graphics.uri);
   *   }
   * }
   * ```
   * @beta
   */
  public async getResourceGraphicsByUri(
    accessToken: AccessToken,
    uri: string
  ): Promise<SzewecAPIResponse<ResourceGraphicsResponse>> {
    return this.sendGenericAPIRequest(accessToken, "GET", uri, undefined, undefined, true);
  }

  /** Get a specific szewTwin by ID
   * @param accessToken The client access token string
   * @param szewTwinId The id of the szewTwin
   * @param resultMode (Optional) szewTwin result mode: minimal or representation
   * @returns Promise that resolves with the szewTwin details
   * @example
   * ```typescript
   * // Returns SZEWTwinMinimalResponse
   * const minimal = await client.getSZEWTwin(token, "id", "minimal");
   *
   * // Returns SZEWTwinRepresentationResponse
   * const detailed = await client.getSZEWTwin(token, "id", "representation");
   *
   * // Defaults to minimal when no resultMode specified
   * const defaultResult = await client.getSZEWTwin(token, "id");
   * ```
   */
  public async getSZEWTwin<T extends ResultMode = "minimal">(
    accessToken: AccessToken,
    szewTwinId: string,
    resultMode?: T
  ): Promise<SzewecAPIResponse<T extends "representation"
    ? SZEWTwinRepresentationResponse
    : SZEWTwinMinimalResponse>> {
    const headers = this.getResultModeHeaders(resultMode);
    const url = `${this._baseUrl}/${szewTwinId}`;
    return this.sendGenericAPIRequest(
      accessToken,
      "GET",
      url,
      undefined,
      headers
    );
  }

  /** Get szewTwins accessible to the user with optional filtering and pagination
   * @param accessToken The client access token string
   * @param arg Optional query arguments for paging, searching, filtering, ordering, and field selection
   * @returns Promise that resolves with an array of szewTwins, may be empty
   * @example
   * ```typescript
   * // Returns MultiSZEWTwinMinimalResponse
   * const minimal = await client.getSZEWTwins(token, { resultMode: "minimal", search: "test" });
   *
   * // Returns MultiSZEWTwinRepresentationResponse
   * const detailed = await client.getSZEWTwins(token, { resultMode: "representation", filter: "type eq 'Project'" });
   *
   * // Defaults to minimal when no resultMode specified
   * const defaultResult = await client.getSZEWTwins(token);
   * ```
   */
  public async getSZEWTwins<T extends SZEWTwinsGetQueryArg = SZEWTwinsGetQueryArg>(
    accessToken: AccessToken,
    arg?: T
  ): Promise<
    SzewecAPIResponse<T["resultMode"] extends "representation"
      ? MultiSZEWTwinRepresentationResponse
      : MultiSZEWTwinMinimalResponse>
  > {
    const headers = this.getHeaders(arg);
    const url = `${this._baseUrl}/?${this.getQueryStringArg(
      SZEWTwinsClient.SZEWTwinsGetQueryParamMapping,
      arg ?? {}
    )}`;

    return this.sendGenericAPIRequest(
      accessToken,
      "GET",
      url,
      undefined,
      headers
    );
  }

  /** Create a new szewTwin
   * @param accessToken The client access token string
   * @param szewTwin The szewTwin data to be created
   * @returns Promise that resolves with the created szewTwin details
   */
  public async createSZEWTwin(
    accessToken: AccessToken,
    szewTwin: SZEWtwinCreate
  ): Promise<SzewecAPIResponse<SZEWTwinRepresentationResponse>> {
    const url = `${this._baseUrl}/`;
    return this.sendGenericAPIRequest(accessToken, "POST", url, szewTwin);
  }

  /** Update the specified szewTwin
   * @param accessToken The client access token string
   * @param szewTwinId The id of the szewTwin to update
   * @param szewTwin The szewTwin data to be updated (partial update supported)
   * @returns Promise that resolves with the updated szewTwin details
   */
  public async updateSZEWtwin(
    accessToken: AccessToken,
    szewTwinId: string,
    szewTwin: SZEWtwinUpdate
  ): Promise<SzewecAPIResponse<SZEWTwinRepresentationResponse>> {
    const url = `${this._baseUrl}/${szewTwinId}`;
    return this.sendGenericAPIRequest(accessToken, "PATCH", url, szewTwin);
  }

  /** Delete the specified szewTwin
   * @param accessToken The client access token string
   * @param szewTwinId The id of the szewTwin to delete
   * @returns Promise that resolves when the szewTwin is successfully deleted
   */
  public async deleteSZEWtwin(
    accessToken: AccessToken,
    szewTwinId: string
  ): Promise<SzewecAPIResponse<undefined>> {
    const url = `${this._baseUrl}/${szewTwinId}`;
    return this.sendGenericAPIRequest(accessToken, "DELETE", url);
  }

  /** Get the primary account accessible to the user
   * @param accessToken The client access token string
   * @returns Promise that resolves with the primary account details
   */
  public async getPrimaryAccount(
    accessToken: AccessToken
  ): Promise<SzewecAPIResponse<SZEWTwinMinimalResponse>> {
    const url = `${this._baseUrl}/myprimaryaccount`;
    return this.sendGenericAPIRequest(accessToken, "GET", url, undefined);
  }

  /**
   * Get the account for the specified szewTwin
   * @param accessToken The client access token string
   * @param szewTwinId The id of the szewTwin
   * @param resultMode (Optional) Result mode: minimal or representation
   * @returns Promise that resolves with the account details
   * @example
   * ```typescript
   * // Returns SZEWTwinMinimalResponse
   * const minimal = await client.getSZEWTwinAccount(token, "id", "minimal");
   *
   * // Returns SZEWTwinRepresentationResponse
   * const detailed = await client.getSZEWTwinAccount(token, "id", "representation");
   *
   * // Defaults to minimal when no resultMode specified
   * const defaultResult = await client.getSZEWTwinAccount(token, "id");
   * ```
   */
  public async getSZEWTwinAccount<T extends ResultMode = "minimal">(
    accessToken: AccessToken,
    szewTwinId: string,
    resultMode?: T
  ): Promise<SzewecAPIResponse<T extends "representation"
    ? SZEWTwinRepresentationResponse
    : SZEWTwinMinimalResponse>> {
    const headers = this.getResultModeHeaders(resultMode);
    const url = `${this._baseUrl}/${szewTwinId}/account`;
    return this.sendGenericAPIRequest(
      accessToken,
      "GET",
      url,
      undefined,
      headers
    );
  }

  /**
   * Format headers from query arguments including query scope and result mode
   * @param arg (Optional) szewTwin query arguments
   * @returns Headers object with formatted query scope and result mode headers
   * @protected
   */
  protected getHeaders(arg?: SZEWTwinsQueryArg): Record<string, string> {
    return {
      ...this.getQueryScopeHeaders(arg && arg.queryScope),
      ...this.getResultModeHeaders(arg && arg.resultMode),
    };
  }

  /**
   * Format result mode parameter into a headers entry
   * @param resultMode (Optional) szewTwin result mode, defaults to "minimal"
   * @returns Headers object with prefer header for result mode
   * @protected
   */
  protected getResultModeHeaders(
    resultMode: ResultMode = "minimal"
  ): Record<string, string> {
    return {
      prefer: `return=${resultMode}`,
    };
  }

  /**
   * Format query scope parameter into a headers entry
   * @param queryScope (Optional) szewTwin query scope, defaults to "memberOfSZEWtwin"
   * @returns Headers object with x-szewtwin-query-scope header
   * @protected
   */
  protected getQueryScopeHeaders(
    queryScope: SZEWTwinQueryScope = "memberOfSZEWtwin"
  ): Record<string, string> {
    return {
      "x-szewtwin-query-scope": queryScope,
    };
  }
}
