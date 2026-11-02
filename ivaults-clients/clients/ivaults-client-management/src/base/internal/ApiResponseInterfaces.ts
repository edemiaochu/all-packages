/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  Briefcase,
  Changeset,
  ChangesetGroup,
  Checkpoint,
  CreateIVaultOperationDetails,
  IVault,
  Link,
  Lock,
  MinimalBriefcase,
  MinimalChangeset,
  MinimalIVault,
  MinimalNamedVersion,
  MinimalUser,
  NamedVersion,
  User,
} from "../types";

/**
 * Links that are included in all entity list page responses. They simplify pagination implementation because users
 * can send requests using these urls that already include pagination url parameters without having to
 * manually keep track of queried entity count.
 */
export interface CollectionLinks {
  /** Link to the current page. */
  self: Link | null;
  /** Link to the previous page. If `null` it means that the previous page is empty. */
  prev: Link | null;
  /** Link to the next page. If `null` it means that the next page is empty. */
  next: Link | null;
}

export interface ChangesetExtendedDataApiResponse {
  changesetId: string;
  changesetIndex: number;
  data: string;
}

export interface CollectionResponse {
  _links: CollectionLinks;
}

export interface IVaultsResponse<TIVault extends MinimalIVault>
  extends CollectionResponse {
  iVaults: TIVault[];
}

export interface BriefcasesResponse<TBriefcase extends MinimalBriefcase>
  extends CollectionResponse {
  briefcases: TBriefcase[];
}

export interface NamedVersionsResponse<
  TNamedVersion extends MinimalNamedVersion
> extends CollectionResponse {
  namedVersions: TNamedVersion[];
}

export interface ChangesetsResponse<TChangeset extends MinimalChangeset>
  extends CollectionResponse {
  changesets: TChangeset[];
}

export interface ChangesetExtendedDataListResponse extends CollectionResponse {
  extendedData: ChangesetExtendedDataApiResponse[];
}

export interface ChangesetGroupsResponse extends CollectionResponse {
  changesetGroups: ChangesetGroup[];
}

export interface UsersResponse<TUser extends MinimalUser>
  extends CollectionResponse {
  users: TUser[];
}

export interface BriefcaseResponse {
  briefcase: Briefcase;
}

export interface ChangesetResponse {
  changeset: Changeset;
}

export interface ChangesetExtendedDataResponse {
  extendedData: ChangesetExtendedDataApiResponse;
}

export interface ChangesetGroupResponse {
  changesetGroup: ChangesetGroup;
}

export interface CheckpointResponse {
  checkpoint: Checkpoint;
}

export interface IVaultResponse {
  iVault: IVault;
}

export interface UserResponse {
  user: User;
}

export interface NamedVersionResponse {
  namedVersion: NamedVersion;
}

export interface CreateIVaultOperationDetailsResponse {
  createOperation: CreateIVaultOperationDetails;
}

export interface LocksResponse extends CollectionResponse {
  locks: Lock[];
}

export interface LockResponse {
  lock: Lock;
}

export interface ReleaseLocksChunkResponse {
  isLastChunk: boolean;
}
