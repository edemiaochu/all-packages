/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { SZEWTwinError } from "@szewtwin/core-szewec";
import type { ChangesetIndexAndId, IVaultVersion } from "@szewtwin/core-common";
import {
  FrontendHubAccess,
  IVaultApp,
  IVaultIdArg,
} from "@szewtwin/core-frontend";
import {
  AccessTokenAdapter,
  Constants,
  getLatestMinimalChangesetIfExists,
  getNamedVersionChangeset,
  handleAPIErrors,
} from "@szewtwin/ivaults-access-common";
import {
  AuthorizationCallback,
  Changeset,
  EntityListIterator,
  GetNamedVersionListParams,
  GetSingleChangesetParams,
  IVaultScopedOperationParams,
  IVaultsClient,
  IVaultsClientOptions,
  IVaultsErrorCode,
  IVaultsErrorScope,
  MinimalNamedVersion,
  NamedVersionOrderByProperty,
  OrderByOperator,
  take,
} from "@szewtwin/ivaults-client-management";

export type FrontendIVaultsAccessOptions = IVaultsClientOptions;

export class FrontendIVaultsAccess implements FrontendHubAccess {
  private readonly _emptyChangeset: ChangesetIndexAndId = {
    index: Constants.ChangeSet0.index,
    id: Constants.ChangeSet0.id,
  };
  protected readonly _iVaultsClient: IVaultsClient;

  constructor(iVaultsClient?: IVaultsClient | FrontendIVaultsAccessOptions) {
    this._iVaultsClient =
      iVaultsClient instanceof IVaultsClient
        ? iVaultsClient
        : new IVaultsClient(iVaultsClient);
  }

  public get iVaultsClient(): IVaultsClient {
    return this._iVaultsClient;
  }

  private async getChangesetFromId(
    arg: IVaultIdArg & { changeSetId: string }
  ): Promise<ChangesetIndexAndId> {
    const getSingleChangesetParams: GetSingleChangesetParams = {
      ...this.getIVaultScopedOperationParams(arg),
      changesetId: arg.changeSetId,
    };

    const changeset: Changeset = await handleAPIErrors(async () =>
      this._iVaultsClient.changesets.getSingle(getSingleChangesetParams)
    );

    if (!changeset)
      SZEWTwinError.throwError({
        szewTwinErrorId: {
          key: IVaultsErrorCode.ChangesetNotFound,
          scope: IVaultsErrorScope,
        },
        message: `Changeset ${arg.changeSetId} not found`,
      });

    return { index: changeset.index, id: changeset.id };
  }

  public async getLatestChangeset(
    arg: IVaultIdArg
  ): Promise<ChangesetIndexAndId> {
    const latestChangeset = await getLatestMinimalChangesetIfExists(
      this._iVaultsClient,
      this.getIVaultScopedOperationParams(arg)
    );

    if (!latestChangeset) return this._emptyChangeset;

    return { index: latestChangeset.index, id: latestChangeset.id };
  }

  public async getChangesetFromVersion(
    arg: IVaultIdArg & { version: IVaultVersion }
  ): Promise<ChangesetIndexAndId> {
    const version = arg.version;
    if (version.isFirst) return this._emptyChangeset;

    const namedVersionChangesetId = version.getAsOfChangeSet();
    if (namedVersionChangesetId)
      return this.getChangesetFromId({
        ...arg,
        changeSetId: namedVersionChangesetId,
      });

    const namedVersionName = version.getName();
    if (namedVersionName)
      return this.getChangesetFromNamedVersion({
        ...arg,
        versionName: namedVersionName,
      });

    return this.getLatestChangeset(arg);
  }

  public async getChangesetFromNamedVersion(
    arg: IVaultIdArg & { versionName?: string }
  ): Promise<ChangesetIndexAndId> {
    if (!arg.versionName) return this.getChangesetFromLatestNamedVersion(arg);

    return getNamedVersionChangeset(
      this._iVaultsClient,
      this.getIVaultScopedOperationParams(arg),
      arg.versionName
    );
  }

  private getIVaultScopedOperationParams(
    arg: IVaultIdArg
  ): IVaultScopedOperationParams {
    const authorizationCallback: AuthorizationCallback = arg.accessToken
      ? () =>
          Promise.resolve(AccessTokenAdapter.toAuthorization(arg.accessToken))
      : AccessTokenAdapter.toAuthorizationCallback(() =>
          IVaultApp.getAccessToken()
        );

    return {
      authorization: authorizationCallback,
      iVaultId: arg.iVaultId,
    };
  }

  private async getChangesetFromLatestNamedVersion(
    arg: IVaultIdArg
  ): Promise<ChangesetIndexAndId> {
    const getNamedVersionListParams: GetNamedVersionListParams = {
      ...this.getIVaultScopedOperationParams(arg),
      urlParams: {
        $top: 1,
        $orderBy: {
          property: NamedVersionOrderByProperty.ChangesetIndex,
          operator: OrderByOperator.Descending,
        },
      },
    };
    const namedVersionsIterator: EntityListIterator<MinimalNamedVersion> =
      this._iVaultsClient.namedVersions.getMinimalList(
        getNamedVersionListParams
      );
    const namedVersions = await handleAPIErrors(async () =>
      take(namedVersionsIterator, 1)
    );

    if (
      namedVersions.length === 0 ||
      !namedVersions[0].changesetIndex ||
      !namedVersions[0].changesetId
    )
      SZEWTwinError.throwError({
        szewTwinErrorId: {
          key: IVaultsErrorCode.NamedVersionNotFound,
          scope: IVaultsErrorScope,
        },
        message: "No named versions found",
      });

    return {
      index: namedVersions[0].changesetIndex,
      id: namedVersions[0].changesetId,
    };
  }
}
