/*---------------------------------------------------------------------------------------------
* Copyright (c) Szewec Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import type { ODataQueryParams, ResultMode } from "./CommonApiTypes.js";
import type { SZEWTwinSubClass } from "./SZEWTwin.js";

/**
 * Base set of query arguments for szewTwins API operations
 */
export interface SZEWTwinsQueryArg extends SZEWTwinsQueryArgsApi {
  subClass?: SZEWTwinSubClass;
  status?: string;
  type?: string;
  includeInactive?: boolean;
  displayName?: string;
  // eslint-disable-next-line id-denylist
  number?: string;
  parentId?: string;
  szewTwinAccountId?: string;
}

/**
 * API-level query arguments for szewTwins operations.
 *
 * These parameters control result formatting, paging, and search for API requests.
 * They are typically sent as query parameters or headers depending on the parameter type.
 *
 * @public
 */
export interface SZEWTwinsQueryArgsApi
  extends Pick<ODataQueryParams, "search" | "skip" | "top"> {
  /** Controls the level of detail in the response (minimal or representation) */
  resultMode?: ResultMode;
  /** Limits the scope of the query (memberOfSZEWtwin, all, OrganizationAdmin) */
  queryScope?: SZEWTwinQueryScope;
}

/**
 * Extended query arguments for szewTwins GET operations with additional OData query capabilities.
 *
 * Combines the base szewTwins query arguments with advanced OData filtering, ordering, and field selection.
 */
export type SZEWTwinsGetQueryArg = SZEWTwinsQueryArg & Pick<ODataQueryParams, "filter" | "orderby" | "select">;

/**
 * Optional query scope. MemberOfSZEWTwin is the default. This is used to expand the scope of the query to all szewTwins you have access to, not just ones that you are a member of, which only applies to organization administrators.
 */
export type SZEWTwinQueryScope = "memberOfSZEWtwin" | "all" | "OrganizationAdmin";
