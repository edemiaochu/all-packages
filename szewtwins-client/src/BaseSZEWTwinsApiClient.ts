/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import type { AccessToken } from "@szewtwin/core-szewec";
import { BaseSzewecAPIClient } from "./BaseSzewecAPIClient";
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
import type { SZEWTwinImageResponse } from "./types/SZEWTwinImage";
import type { SZEWTwinsGetQueryArg, SZEWTwinsQueryArg } from "./types/SZEWTwinsQueryArgs";
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
import type { ParameterMapping } from "./types/typeUtils";

/** Abstract class for accessing working with SZEWTwins Service
 * @beta
 */
export abstract class BaseSZEWTwinsApiClient extends BaseSzewecAPIClient {
  /**
   * Maps the properties of {@link SZEWTwinsQueryArg} to their corresponding query parameter names.
   *
   * @remarks
   * This mapping is used to translate internal property names to the expected parameter names
   * when constructing szewTwins queries. Properties mapped to empty strings are excluded from
   * the query string as they should be sent as headers instead.
   *
   * The mapping includes both OData query parameters (prefixed with $) and szewTwins-specific
   * parameters for filtering and pagination.
   *
   * @readonly
   */
  protected static readonly szewTwinsQueryParamMapping: ParameterMapping<SZEWTwinsQueryArg> =
    {
      subClass: "subClass",
      type: "type",
      status: "status",
      search: "$search",
      displayName: "displayName",
      // eslint-disable-next-line id-denylist
      number: "number",
      top: "$top",
      skip: "$skip",
      parentId: "parentId",
      szewTwinAccountId: "szewTwinAccountId",
      includeInactive: "includeInactive",
      resultMode: "",
      queryScope: "",
    } as const;

  /**
   * Maps the properties some of the {@link ODataQueryParams} to their corresponding query parameter names.
   *
   * @remarks
   * This mapping is used to translate internal property names to the expected parameter names
   * when constructing szewTwins queries. Properties mapped to empty strings are excluded from
   * the query string as they should be sent as headers instead.
   *
   * The mapping includes both OData query parameters (prefixed with $) and szewTwins-specific
   * parameters for filtering and pagination.
   *
   * @readonly
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected static readonly ODataParamMapping: ParameterMapping<
    Pick<ODataQueryParams, "search" | "skip" | "top">
  > = {
    top: "$top",
    skip: "$skip",
    search: "$search",
  } as const;

  /**
   * Maps the properties some of the {@link ODataQueryParams} and all of the {@link SZEWTwinsQueryArg} to their corresponding query parameter names.
   *
   * @remarks
   * This mapping is used to translate internal property names to the expected parameter names
   * when constructing szewTwins queries. Properties mapped to empty strings are excluded from
   * the query string as they should be sent as headers instead.
   *
   * The mapping includes both OData query parameters (prefixed with $) and szewTwins-specific
   * parameters for filtering and pagination.
   *
   * @readonly
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected static readonly SZEWTwinsGetQueryParamMapping: ParameterMapping<
    SZEWTwinsQueryArg & Pick<ODataQueryParams, "filter" | "orderby" | "select">
  > = {
    subClass: "subClass",
    type: "type",
    status: "status",
    search: "$search",
    displayName: "displayName",
    // eslint-disable-next-line id-denylist
    number: "number",
    top: "$top",
    skip: "$skip",
    parentId: "parentId",
    szewTwinAccountId: "szewTwinAccountId",
    includeInactive: "includeInactive",
    resultMode: "",
    queryScope: "",
    filter: "$filter",
    orderby: "$orderby",
    select: "$select",
  } as const;

  /**
   * Maps the properties of class and subclass to their corresponding query parameter names.
   *
   * @remarks
   * This mapping is used to translate internal property names to the expected parameter names
   * when constructing repository queries.
   *
   * @readonly
   */
  protected static readonly repositoryParamMapping: ParameterMapping<{
    class: Repository["class"];
    subClass: Repository["subClass"];
  }> = {
    class: "class",
    subClass: "subClass",
  } as const;

  /**
   * The base URL for szewTwins API endpoints.
   * The URL can be customized via the constructor parameter or automatically
   * modified based on the IVJS_URL_PREFIX environment variable for different
   * deployment environments.
   *
   * @readonly
   */
  protected readonly _baseUrl: string = "https://api.szewec.com/szewtwins";

  /**
   * Creates a new BaseClient instance for szewTwins API operations
   * @param url - Optional custom base URL, defaults to production szewTwins API URL
   *
   * @example
   * ```typescript
   * // Use default production URL
   * const client = new BaseClient();
   *
   * // Use custom URL for development/testing
   * const client = new SZEWTwinsAccessClient("https://dev-api.szewec.com/szewtwins");
   * ```
   */
  public constructor(url?: string, maxRedirects?: number) {
    super(maxRedirects);
    if (url !== undefined) {
      this._baseUrl = url;
    } else {
      const urlPrefix = globalThis.IVJS_URL_PREFIX;
      if (urlPrefix) {
        const baseUrl = new URL(this._baseUrl);
        baseUrl.hostname = `${urlPrefix}${baseUrl.hostname}`;
        this._baseUrl = baseUrl.href;
      }
    }
  }

  /** Create a new szewTwin export */
  public abstract createExport(
    accessToken: AccessToken,
    args: SZEWTwinExportRequestInfo
  ): Promise<SzewecAPIResponse<SZEWTwinExportSingleResponse>>;

  /** Get a szewTwin export */
  public abstract getExport(
    accessToken: AccessToken,
    id: string
  ): Promise<SzewecAPIResponse<SZEWTwinExportSingleResponse>>;

  /** Get a list of szewTwin exports for user */
  public abstract getExports(
    accessToken: AccessToken
  ): Promise<SzewecAPIResponse<SZEWTwinExportMultiResponse>>;

  /** Get favorites szewTwins accessible to the user */
  public abstract getFavoritesSZEWTwins<T extends SZEWTwinsQueryArg = SZEWTwinsQueryArg>(
    accessToken: AccessToken,
    arg?: T
  ): Promise<
    SzewecAPIResponse<T["resultMode"] extends "representation"
      ? MultiSZEWTwinRepresentationResponse
      : MultiSZEWTwinMinimalResponse>
  >;

  /** Add szewTwin to favorites */
  public abstract addSZEWTwinToFavorites(
    accessToken: AccessToken,
    szewTwinId?: string
  ): Promise<SzewecAPIResponse<undefined>>;

  /** Remove szewTwin from favorites */
  public abstract removeSZEWTwinFromFavorites(
    accessToken: AccessToken,
    szewTwinId?: string
  ): Promise<SzewecAPIResponse<undefined>>;

  /** Adds image to szewTwin  */
  public abstract uploadSZEWTwinImage(
    accessToken: AccessToken,
    szewTwinId: string,
    imageBlob: Blob,
    contentType: "image/png" | "image/jpeg"
  ): Promise<SzewecAPIResponse<SZEWTwinImageResponse>>;

  /** Add the specified szewTwin to the user's recently used list */
  public abstract addSZEWTwinToMyRecents(
    accessToken: AccessToken,
    szewTwinId: string
  ): Promise<SzewecAPIResponse<undefined>>;

  /** Get recently used szewTwins for the current user, maximum 25 items ordered by most recent first */
  public abstract getRecentUsedSZEWTwins<T extends SZEWTwinsQueryArg = SZEWTwinsQueryArg>(
    accessToken: AccessToken,
    arg?: T
  ): Promise<
    SzewecAPIResponse<T["resultMode"] extends "representation"
      ? MultiSZEWTwinRepresentationResponse
      : MultiSZEWTwinMinimalResponse>
  >;

  /** Get all global repositories with optional filtering by repository class and subClass identifiers.
   * @beta
   */
  public abstract getGlobalRepositories(
    accessToken: AccessToken,
    arg?:
      | { class: Repository["class"] }
      | { class: Repository["class"]; subClass: Repository["subClass"] }
  ): Promise<SzewecAPIResponse<MultiRepositoriesResponse>>;

  /** Get a specific global repository by ID.
   * @beta
   */
  public abstract getGlobalRepository(
    accessToken: AccessToken,
    repositoryId: string
  ): Promise<SzewecAPIResponse<SingleRepositoryResponse>>;

  /** Get a global repository resource by ID.
   * @beta
   */
  public abstract getGlobalRepositoryResource<T extends ResultMode = "minimal">(
    accessToken: AccessToken,
    repositoryId: string,
    resourceId: string,
    resultMode?: T
  ): Promise<
    SzewecAPIResponse<T extends "representation"
      ? GetRepositoryResourceRepresentationResponse
      : GetRepositoryResourceMinimalResponse>
  >;

  /** Get global repository resources with optional filtering and pagination.
   * @beta
   */
  public abstract getGlobalRepositoryResources<T extends ResultMode = "minimal">(
    accessToken: AccessToken,
    repositoryId: string,
    args?: Pick<ODataQueryParams, "search" | "skip" | "top">,
    resultMode?: T
  ): Promise<
    SzewecAPIResponse<T extends "representation"
      ? GetMultiRepositoryResourceRepresentationResponse
      : GetMultiRepositoryResourceMinimalResponse>
  >;

  /** Get graphics metadata for a global repository resource.
   * @beta
   */
  public abstract getGlobalResourceGraphics(
    accessToken: AccessToken,
    repositoryId: string,
    resourceId: string
  ): Promise<SzewecAPIResponse<ResourceGraphicsResponse>>;

  /** Create a new repository for the specified szewTwin */
  public abstract createRepository(
    accessToken: AccessToken,
    szewTwinId: string,
    repository: NewRepositoryConfig
  ): Promise<SzewecAPIResponse<SingleRepositoryResponse>>;

  /** Delete the specified repository from an szewTwin */
  public abstract deleteRepository(
    accessToken: AccessToken,
    szewTwinId: string,
    repositoryId: string
  ): Promise<SzewecAPIResponse<undefined>>;

  /** Get all repositories for an szewTwin with optional filtering by repository class and subClass identifiers. If subClass is specified, class is also required. */
  public abstract getRepositories(
    accessToken: AccessToken,
    szewTwinId: string,
    arg?:
      | { class: Repository["class"] }
      | { class: Repository["class"]; subClass: Repository["subClass"] }
  ): Promise<SzewecAPIResponse<MultiRepositoriesResponse>>;

  /** Get a specific repository by ID from an szewTwin */
  public abstract getRepository(
    accessToken: AccessToken,
    szewTwinId: string,
    repositoryId: string
  ): Promise<SzewecAPIResponse<SingleRepositoryResponse>>;

  /** Update a specific repository by ID from an szewTwin */
  public abstract updateRepository(
    accessToken: AccessToken,
    szewTwinId: string,
    repositoryId: string,
    repository: Partial<Omit<Repository, "id" | "class" | "subClass" | "capabilities">>
  ): Promise<SzewecAPIResponse<SingleRepositoryResponse>>;

  /** Create a repository resource for a repository that exposes a resources collection. */
  public abstract createRepositoryResource(
    accessToken: AccessToken,
    szewTwinId: string,
    repositoryId: string,
    repositoryResource: Pick<Repository, "id" | "displayName">
  ): Promise<SzewecAPIResponse<PostRepositoryResourceResponse>>;

  /** Delete a repository resource from a repository */
  public abstract deleteRepositoryResource(
    accessToken: AccessToken,
    szewTwinId: string,
    repositoryId: string,
    resourceId: string
  ): Promise<SzewecAPIResponse<undefined>>;

  /** Get a repository resource for a repository */
  public abstract getRepositoryResource<T extends ResultMode = "minimal">(
    accessToken: AccessToken,
    szewTwinId: string,
    repositoryId: string,
    resourceId: string,
    resultMode?: T
  ): Promise<
    SzewecAPIResponse<T extends "representation"
      ? GetRepositoryResourceRepresentationResponse
      : GetRepositoryResourceMinimalResponse>
  >;

  /** Get repository resources for a repository */
  public abstract getRepositoryResources<T extends ResultMode = "minimal">(
    accessToken: AccessToken,
    szewTwinId: string,
    repositoryId: string,
    args?: Pick<ODataQueryParams, "search" | "skip" | "top">,
    resultMode?: T
  ): Promise<
    SzewecAPIResponse<T extends "representation"
      ? GetMultiRepositoryResourceRepresentationResponse
      : GetMultiRepositoryResourceMinimalResponse>
  >;

  /** Get a list of resources from a repository using a capability URI */
  public abstract getRepositoryResourcesByUri<T extends ResultMode = "minimal">(
    accessToken: AccessToken,
    uri: string,
    args?: Pick<ODataQueryParams, "search" | "skip" | "top">,
    resultMode?: T
  ): Promise<
    SzewecAPIResponse<T extends "representation"
      ? GetMultiRepositoryResourceRepresentationResponse
      : GetMultiRepositoryResourceMinimalResponse>
  >;

  /** Get a specific resource from a repository using a capability URI */
  public abstract getRepositoryResourceByUri<T extends ResultMode = "minimal">(
    accessToken: AccessToken,
    uri: string,
    resultMode?: T
  ): Promise<
    SzewecAPIResponse<T extends "representation"
      ? GetRepositoryResourceRepresentationResponse
      : GetRepositoryResourceMinimalResponse>
  >;

  /** Get graphics metadata for a repository resource using ID-based parameters */
  public abstract getResourceGraphics(
    accessToken: AccessToken,
    szewTwinId: string,
    repositoryId: string,
    resourceId: string
  ): Promise<SzewecAPIResponse<ResourceGraphicsResponse>>;

  /** Get graphics metadata for a repository resource using a capability URI */
  public abstract getResourceGraphicsByUri(
    accessToken: AccessToken,
    uri: string
  ): Promise<SzewecAPIResponse<ResourceGraphicsResponse>>;

  /** Get image for szewTwin  */
  public abstract getSZEWTwinImage(
    accessToken: AccessToken,
    szewTwinId: string
  ): Promise<SzewecAPIResponse<SZEWTwinImageResponse>>;

  /** Deletes image from szewTwin  */
  public abstract deleteSZEWTwinImage(
    accessToken: AccessToken,
    szewTwinId: string
  ): Promise<SzewecAPIResponse<undefined>>;

  /** Get szewTwins */
  public abstract getSZEWTwins<T extends SZEWTwinsGetQueryArg = SZEWTwinsGetQueryArg>(
    accessToken: AccessToken,
    arg?: T
  ): Promise<
    SzewecAPIResponse<T["resultMode"] extends "representation"
      ? MultiSZEWTwinRepresentationResponse
      : MultiSZEWTwinMinimalResponse>
  >;

  /** Delete the specified szewTwin */
  public abstract deleteSZEWtwin(
    accessToken: AccessToken,
    szewTwinId: string
  ): Promise<SzewecAPIResponse<undefined>>;

  /** Get an SZEWTwin */
  public abstract getSZEWTwin<T extends ResultMode = "minimal">(
    accessToken: AccessToken,
    szewTwinId: string,
    resultMode?: T
  ): Promise<SzewecAPIResponse<T extends "representation"
    ? SZEWTwinRepresentationResponse
    : SZEWTwinMinimalResponse>>;

  /** Get the primary account SZEWTwin */
  public abstract getPrimaryAccount(
    accessToken: AccessToken
  ): Promise<SzewecAPIResponse<SZEWTwinMinimalResponse>>;

  /* Get the account for an szewTwin */
  public abstract getSZEWTwinAccount<T extends ResultMode = "minimal">(
    accessToken: AccessToken,
    szewTwinId: string,
    resultMode?: T
  ): Promise<SzewecAPIResponse<T extends "representation"
    ? SZEWTwinRepresentationResponse
    : SZEWTwinMinimalResponse>>;

  /** Create a new szewTwin */
  public abstract createSZEWTwin(
    accessToken: AccessToken,
    szewTwin: SZEWtwinCreate
  ): Promise<SzewecAPIResponse<SZEWTwinRepresentationResponse>>;

  /** Update the specified szewTwin */
  public abstract updateSZEWtwin(
    accessToken: AccessToken,
    szewTwinId: string,
    szewTwin: SZEWtwinUpdate
  ): Promise<SzewecAPIResponse<SZEWTwinRepresentationResponse>>;
}
