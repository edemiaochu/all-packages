/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionRequestParams, Dictionary, OrderBy } from "../base/types";

import { GetBriefcaseListUrlParams } from "./briefcase/BriefcaseOperationParams";
import {
  ChangesetIdOrIndex,
  GetChangesetListUrlParams,
} from "./changeset/ChangesetOperationParams";
import { GetChangesetExtendedDataListUrlParams } from "./changeset-extended-data/ChangesetExtendedDataOperationParams";
import { GetChangesetGroupListUrlParams } from "./changeset-group/ChangesetGroupOperationParams";
import { CheckpointParentEntityId } from "./checkpoint/CheckpointOperationParams";
import { GetFavoriteIVaultListUrlParams } from "./favorite-ivault/FavoriteIVaultOperationParams";
import { GetIVaultListUrlParams } from "./ivault/IVaultOperationParams";
import { GetLockListUrlParams } from "./lock/LockOperationParams";
import { GetNamedVersionListUrlParams } from "./named-version/NamedVersionOperationParams";
import { DownloadThumbnailUrlParams } from "./OperationParamExports";
import { GetRecentIVaultListUrlParams } from "./recent-ivault/RecentIVaultOperationParams";

type SingleOrderByForAnyEntity = OrderBy<{ [key: string]: unknown }, string>;
type MultipleOrderByForAnyEntity = SingleOrderByForAnyEntity[];
type OrderByForAnyEntity =
  | SingleOrderByForAnyEntity
  | MultipleOrderByForAnyEntity;
type UrlParameterValue = string | number | OrderByForAnyEntity;

export class IVaultsApiUrlFormatter {
  private readonly _regexIgnoreCaseOption = "i";
  private readonly _groupNames = {
    iVaultId: "iVaultId",
    changesetIdOrIndex: "changesetIdOrIndex",
    namedVersionId: "namedVersionId",
    userId: "userId",
  };
  private readonly _numericRegex = new RegExp("^\\d+$");
  private readonly _changesetUrlRegex = new RegExp(
    `/iVaults/(?<${this._groupNames.iVaultId}>.*)/changesets/(?<${this._groupNames.changesetIdOrIndex}>[^/]*)`,
    this._regexIgnoreCaseOption
  );
  private readonly _checkpointUrlRegex = new RegExp(
    `/iVaults/(?<${this._groupNames.iVaultId}>.*)/changesets/(?<${this._groupNames.changesetIdOrIndex}>.*)/checkpoint`,
    this._regexIgnoreCaseOption
  );
  private readonly _namedVersionUrlRegex = new RegExp(
    `/iVaults/(?<${this._groupNames.iVaultId}>.*)/namedversions/(?<${this._groupNames.namedVersionId}>[^/]*)`,
    this._regexIgnoreCaseOption
  );
  private readonly _userUrlRegex = new RegExp(
    `/iVaults/(?<${this._groupNames.iVaultId}>.*)/users/(?<${this._groupNames.userId}>[^/]*)`,
    this._regexIgnoreCaseOption
  );
  private readonly _iVaultUrlRegex = new RegExp(
    `/iVaults/(?<${this._groupNames.iVaultId}>[^/]*)`,
    this._regexIgnoreCaseOption
  );

  constructor(protected readonly baseUrl: string) {}

  public getCreateIVaultUrl(): string {
    return this.baseUrl;
  }

  public getCloneIVaultUrl(params: { iVaultId: string }): string {
    return `${this.baseUrl}/${params.iVaultId}/clone`;
  }

  public getForkIVaultUrl(params: { iVaultId: string }): string {
    return `${this.baseUrl}/${params.iVaultId}/fork`;
  }

  public getSingleIVaultUrl(params: { iVaultId: string }): string {
    return `${this.baseUrl}/${params.iVaultId}`;
  }

  public getIVaultListUrl(params: {
    urlParams: GetIVaultListUrlParams;
  }): string {
    return `${this.baseUrl}${this.formQueryString({ ...params.urlParams })}`;
  }

  public getSingleBriefcaseUrl(
    params: { iVaultId: string } & { briefcaseId: number }
  ): string {
    return `${this.baseUrl}/${params.iVaultId}/briefcases/${params.briefcaseId}`;
  }

  public getBriefcaseListUrl(params: {
    iVaultId: string;
    urlParams?: GetBriefcaseListUrlParams;
  }): string {
    return `${this.baseUrl}/${params.iVaultId}/briefcases${this.formQueryString(
      { ...params.urlParams }
    )}`;
  }

  public getSingleChangesetUrl(
    params: { iVaultId: string } & ChangesetIdOrIndex
  ): string {
    return `${this.baseUrl}/${params.iVaultId}/changesets/${
      params.changesetId ?? params.changesetIndex
    }`;
  }

  public getChangesetListUrl(params: {
    iVaultId: string;
    urlParams?: GetChangesetListUrlParams;
  }): string {
    return `${this.baseUrl}/${params.iVaultId}/changesets${this.formQueryString(
      { ...params.urlParams }
    )}`;
  }

  public getSingleChangesetExtendedDataUrl(
    params: { iVaultId: string } & ChangesetIdOrIndex
  ): string {
    return `${this.baseUrl}/${params.iVaultId}/changesets/${
      params.changesetId ?? params.changesetIndex
    }/extendeddata`;
  }

  public getChangesetExtendedDataListUrl(params: {
    iVaultId: string;
    urlParams?: GetChangesetExtendedDataListUrlParams;
  }): string {
    return `${this.baseUrl}/${
      params.iVaultId
    }/changesets/extendeddata${this.formQueryString({ ...params.urlParams })}`;
  }

  public getSingleChangesetGroupUrl(
    params: { iVaultId: string } & { changesetGroupId: string }
  ): string {
    return `${this.baseUrl}/${params.iVaultId}/changesetgroups/${params.changesetGroupId}`;
  }

  public getChangesetGroupListUrl(params: {
    iVaultId: string;
    urlParams?: GetChangesetGroupListUrlParams;
  }): string {
    return `${this.baseUrl}/${
      params.iVaultId
    }/changesetgroups${this.formQueryString({ ...params.urlParams })}`;
  }

  public parseChangesetUrl(
    url: string
  ): { iVaultId: string } & ChangesetIdOrIndex {
    const matchedGroups: Dictionary<string> =
      this._changesetUrlRegex.exec(url)!.groups!;
    return {
      iVaultId: matchedGroups[this._groupNames.iVaultId],
      ...this.parseChangesetIdOrIndex(
        matchedGroups[this._groupNames.changesetIdOrIndex]
      ),
    };
  }

  public getSingleNamedVersionUrl(
    params: { iVaultId: string } & { namedVersionId: string }
  ): string {
    return `${this.baseUrl}/${params.iVaultId}/namedversions/${params.namedVersionId}`;
  }

  public getNamedVersionListUrl(params: {
    iVaultId: string;
    urlParams?: GetNamedVersionListUrlParams;
  }): string {
    return `${this.baseUrl}/${
      params.iVaultId
    }/namedversions${this.formQueryString({ ...params.urlParams })}`;
  }

  public getCheckpointUrl(
    params: { iVaultId: string } & CheckpointParentEntityId
  ): string {
    let parentEntityUrlPath: string;
    if (params.namedVersionId)
      parentEntityUrlPath = `namedversions/${params.namedVersionId}`;
    else if (params.changesetId || params.changesetIndex != null)
      parentEntityUrlPath = `changesets/${
        params.changesetId ?? params.changesetIndex
      }`;
    else parentEntityUrlPath = "briefcases";

    return `${this.baseUrl}/${params.iVaultId}/${parentEntityUrlPath}/checkpoint`;
  }

  public getThumbnailUrl(params: {
    iVaultId: string;
    urlParams?: DownloadThumbnailUrlParams;
  }): string {
    return `${this.baseUrl}/${params.iVaultId}/thumbnail${this.formQueryString({
      ...params.urlParams,
    })}`;
  }

  public getUserListUrl(params: {
    iVaultId: string;
    urlParams?: CollectionRequestParams;
  }): string {
    return `${this.baseUrl}/${params.iVaultId}/users${this.formQueryString({
      ...params.urlParams,
    })}`;
  }

  public getSingleUserUrl(
    params: { iVaultId: string } & { userId: string }
  ): string {
    return `${this.baseUrl}/${params.iVaultId}/users/${params.userId}`;
  }

  public getUserPermissionsUrl(params: { iVaultId: string }): string {
    return `${this.baseUrl}/${params.iVaultId}/permissions`;
  }

  public getFavoriteIVaultListUrl(params: {
    urlParams: GetFavoriteIVaultListUrlParams;
  }): string {
    return `${this.baseUrl}/favorites${this.formQueryString({
      ...params.urlParams,
    })}`;
  }

  public getFavoriteIVaultUrl(params: { iVaultId: string }): string {
    return `${this.baseUrl}/favorites/${params.iVaultId}`;
  }

  public getRecentIVaultListUrl(params: {
    urlParams: GetRecentIVaultListUrlParams;
  }): string {
    return `${this.baseUrl}/recents${this.formQueryString({
      ...params.urlParams,
    })}`;
  }

  public getRecentIVaultUrl(params: { iVaultId: string }): string {
    return `${this.baseUrl}/recents/${params.iVaultId}`;
  }

  public getLockListUrl(params: {
    iVaultId: string;
    urlParams?: GetLockListUrlParams;
  }): string {
    return `${this.baseUrl}/${params.iVaultId}/locks${this.formQueryString({
      ...params.urlParams,
    })}`;
  }

  public getReleaseLocksChunkUrl(params: { iVaultId: string }): string {
    return `${this.baseUrl}/${params.iVaultId}/locks/release-chunk`;
  }

  public getCreateIVaultOperationDetailsUrl(params: {
    iVaultId: string;
  }): string {
    return `${this.baseUrl}/${params.iVaultId}/operations/create`;
  }

  public parseCheckpointUrl(
    url: string
  ): { iVaultId: string } & ChangesetIdOrIndex {
    const matchedGroups: Dictionary<string> =
      this._checkpointUrlRegex.exec(url)!.groups!;
    return {
      iVaultId: matchedGroups[this._groupNames.iVaultId],
      ...this.parseChangesetIdOrIndex(
        matchedGroups[this._groupNames.changesetIdOrIndex]
      ),
    };
  }

  public parseNamedVersionUrl(url: string): {
    iVaultId: string;
    namedVersionId: string;
  } {
    const matchedGroups: Dictionary<string> =
      this._namedVersionUrlRegex.exec(url)!.groups!;
    return {
      iVaultId: matchedGroups[this._groupNames.iVaultId],
      namedVersionId: matchedGroups[this._groupNames.namedVersionId],
    };
  }

  public parseUserUrl(url: string): { iVaultId: string; userId: string } {
    const matchedGroups: Dictionary<string> =
      this._userUrlRegex.exec(url)!.groups!;
    return {
      iVaultId: matchedGroups[this._groupNames.iVaultId],
      userId: matchedGroups[this._groupNames.userId],
    };
  }

  public parseIVaultUrl(url: string): { iVaultId: string } {
    const matchedGroups: Dictionary<string> =
      this._iVaultUrlRegex.exec(url)!.groups!;
    return {
      iVaultId: matchedGroups[this._groupNames.iVaultId],
    };
  }

  protected formQueryString(
    urlParameters: Dictionary<UrlParameterValue> | undefined
  ): string {
    let queryString = "";
    for (const urlParameterKey in urlParameters) {
      if (!Object.prototype.hasOwnProperty.call(urlParameters, urlParameterKey))
        continue;

      const urlParameterValue = urlParameters[urlParameterKey];
      if (!this.shouldAppendToUrl(urlParameterValue)) continue;

      queryString = this.appendToQueryString(
        queryString,
        urlParameterKey,
        urlParameterValue
      );
    }

    return queryString;
  }

  /**
   * API could return Changeset urls that either contain id or index since both are valid identifiers
   * so here we handle both scenarios. We assume if the value contains only digits and is shorter than 40
   * symbols it is a numeric index, otherwise, it is a string id.
   */
  private parseChangesetIdOrIndex(
    changesetIdOrIndex: string
  ): ChangesetIdOrIndex {
    const containsOnlyDigits = this._numericRegex.test(changesetIdOrIndex);
    if (containsOnlyDigits && changesetIdOrIndex.length < 40)
      return {
        changesetIndex: parseInt(changesetIdOrIndex, 10),
      };

    return {
      changesetId: changesetIdOrIndex,
    };
  }

  private shouldAppendToUrl(urlParameterValue: UrlParameterValue): boolean {
    if (urlParameterValue === null || urlParameterValue === undefined)
      return false;

    if (typeof urlParameterValue === "string" && !urlParameterValue.trim())
      return false;

    return true;
  }

  private appendToQueryString(
    existingQueryString: string,
    parameterKey: string,
    parameterValue: UrlParameterValue
  ): string {
    const separator = existingQueryString.length === 0 ? "?" : "&";
    return `${existingQueryString}${separator}${parameterKey}=${this.stringify(
      parameterValue
    )}`;
  }

  private stringify(urlParameterValue: UrlParameterValue): string {
    if (this.isSingleOrderBy(urlParameterValue)) {
      return this.stringifyOrderByParameterValue([urlParameterValue]);
    } else if (this.isMultipleOrderBy(urlParameterValue)) {
      return this.stringifyOrderByParameterValue(urlParameterValue);
    }

    return urlParameterValue.toString();
  }

  private isSingleOrderBy(
    parameterValue: UrlParameterValue
  ): parameterValue is SingleOrderByForAnyEntity {
    return (parameterValue as SingleOrderByForAnyEntity).property !== undefined;
  }

  private isMultipleOrderBy(
    parameterValue: UrlParameterValue
  ): parameterValue is MultipleOrderByForAnyEntity {
    return (
      (parameterValue as MultipleOrderByForAnyEntity)?.[0]?.property !==
      undefined
    );
  }

  private stringifyOrderByParameterValue(
    orderByCriteria: MultipleOrderByForAnyEntity
  ): string {
    let result = "";
    for (let i = 0; i < orderByCriteria.length; i++) {
      if (i !== 0) result += ",";

      const criterion = orderByCriteria[i];
      result += criterion.property;
      if (criterion.operator !== undefined) result += ` ${criterion.operator}`;
    }

    return result;
  }
}
