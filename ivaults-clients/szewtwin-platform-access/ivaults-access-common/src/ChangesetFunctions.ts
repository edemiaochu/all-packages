/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { SZEWTwinError } from "@szewtwin/core-szewec";
import {
  Changeset,
  ChangesetOrderByProperty,
  EntityListIterator,
  GetChangesetListParams,
  GetNamedVersionListParams,
  IVaultScopedOperationParams,
  IVaultsClient,
  IVaultsErrorCode,
  IVaultsErrorScope,
  MinimalChangeset,
  MinimalNamedVersion,
  OrderByOperator,
  take,
  toArray,
} from "@szewtwin/ivaults-client-management";

import { handleAPIErrors } from "./ErrorHandlingFunctions";

export async function getLatestFullChangesetIfExists(
  iVaultsClient: IVaultsClient,
  iVaultScopedOperationParams: IVaultScopedOperationParams
): Promise<Changeset | undefined> {
  return getLatestChangeset(
    (getChangesetListParams) =>
      iVaultsClient.changesets.getRepresentationList(getChangesetListParams),
    iVaultScopedOperationParams
  );
}

export async function getLatestMinimalChangesetIfExists(
  iVaultsClient: IVaultsClient,
  iVaultScopedOperationParams: IVaultScopedOperationParams
): Promise<MinimalChangeset | undefined> {
  return getLatestChangeset(
    (getChangesetListParams) =>
      iVaultsClient.changesets.getMinimalList(getChangesetListParams),
    iVaultScopedOperationParams
  );
}

export async function getNamedVersionChangeset(
  iVaultsClient: IVaultsClient,
  iVaultScopedOperationParams: IVaultScopedOperationParams,
  versionName: string
): Promise<{ id: string; index: number }> {
  const getNamedVersionListParams: GetNamedVersionListParams = {
    ...iVaultScopedOperationParams,
    urlParams: {
      name: versionName,
    },
  };

  const namedVersionsIterator: EntityListIterator<MinimalNamedVersion> =
    iVaultsClient.namedVersions.getMinimalList(getNamedVersionListParams);
  const namedVersions: MinimalNamedVersion[] = await handleAPIErrors(async () =>
    toArray(namedVersionsIterator)
  );

  if (namedVersions.length === 0 || !namedVersions[0].changesetId)
    SZEWTwinError.throwError({
      szewTwinErrorId: {
        key: IVaultsErrorCode.NamedVersionNotFound,
        scope: IVaultsErrorScope,
      },
      message: `Named version ${versionName} not found`,
    });

  return {
    id: namedVersions[0].changesetId,
    index: namedVersions[0].changesetIndex,
  };
}

async function getLatestChangeset<TChangeset extends MinimalChangeset>(
  changesetQueryFunc: (
    params: GetChangesetListParams
  ) => EntityListIterator<TChangeset>,
  iVaultScopedOperationParams: IVaultScopedOperationParams
): Promise<TChangeset | undefined> {
  const getChangesetListParams: GetChangesetListParams = {
    ...iVaultScopedOperationParams,
    urlParams: {
      $top: 1,
      $orderBy: {
        property: ChangesetOrderByProperty.Index,
        operator: OrderByOperator.Descending,
      },
    },
  };

  const changesetsIterator: EntityListIterator<TChangeset> = changesetQueryFunc(
    getChangesetListParams
  );
  const changesets: TChangeset[] = await handleAPIErrors(async () =>
    take(changesetsIterator, 1)
  );

  if (changesets.length === 0) return undefined;

  return changesets[0];
}
