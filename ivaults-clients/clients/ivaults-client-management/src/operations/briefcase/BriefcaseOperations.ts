/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  BriefcaseResponse,
  BriefcasesResponse,
  CheckpointResponse,
  EntityListIteratorImpl,
  OperationsBase,
} from "../../base/internal";
import {
  AuthorizationCallback,
  Briefcase,
  EntityListIterator,
  HeaderFactories,
  HttpResponse,
  MinimalBriefcase,
  PreferReturn,
} from "../../base/types";
import { IVaultsClient } from "../../IVaultsClient";
import { OperationOptions } from "../OperationOptions";
import { assertLink, getUser } from "../SharedFunctions";

import {
  GetBriefcaseListParams,
  GetSingleBriefcaseParams,
  ReleaseBriefcaseParams,
} from "./BriefcaseOperationParams";

export class BriefcaseOperations<
  TOptions extends OperationOptions
> extends OperationsBase<TOptions> {
  constructor(options: TOptions, private _iVaultsClient: IVaultsClient) {
    super(options);
  }

  /**
   * Gets Briefcases of a specific iVault. This method returns Briefcases in their minimal representation. The returned iterator
   * internally queries entities in pages. Wraps the
   * {@link https://developer.szewec.com/apis/ivaults-v2/operations/get-ivault-briefcases/ Get iVault Briefcases}
   * operation from iVaults API.
   * @param {GetBriefcaseListParams} params parameters for this operation. See {@link GetBriefcaseListParams}.
   * @returns {EntityListIterator<MinimalBriefcase>} iterator for Briefcase list. See {@link EntityListIterator},
   * {@link MinimalBriefcase}.
   */
  public getMinimalList(
    params: GetBriefcaseListParams
  ): EntityListIterator<MinimalBriefcase> {
    return new EntityListIteratorImpl(async () =>
      this.getEntityCollectionPage<
        MinimalBriefcase,
        BriefcasesResponse<MinimalBriefcase>
      >({
        authorization: params.authorization,
        url: this._options.urlFormatter.getBriefcaseListUrl({
          iVaultId: params.iVaultId,
          urlParams: params.urlParams,
        }),
        preferReturn: PreferReturn.Minimal,
        entityCollectionAccessor: (response) => response.body.briefcases,
        headers: params.headers,
      })
    );
  }

  /**
   * Gets Briefcases of a specific iVault. This method returns Briefcases in their full representation. The returned iterator
   * internally queries entities in pages. Wraps the
   * {@link https://developer.szewec.com/apis/ivaults-v2/operations/get-ivault-briefcases/ Get iVault Briefcases}
   * operation from iVaults API.
   * @param {GetBriefcaseListParams} params parameters for this operation. See {@link GetBriefcaseListParams}.
   * @returns {EntityListIterator<Briefcase>} iterator for Briefcase list. See {@link EntityListIterator}, {@link Briefcase}.
   */
  public getRepresentationList(
    params: GetBriefcaseListParams
  ): EntityListIterator<Briefcase> {
    const entityCollectionAccessor = (
      response: HttpResponse<BriefcasesResponse<Briefcase>>
    ) => {
      const briefcases = response.body.briefcases;
      const mappedBriefcases = briefcases.map((briefcase) =>
        this.appendRelatedEntityCallbacks(
          params.authorization,
          briefcase,
          params.headers
        )
      );
      return mappedBriefcases;
    };

    return new EntityListIteratorImpl(async () =>
      this.getEntityCollectionPage<Briefcase, BriefcasesResponse<Briefcase>>({
        authorization: params.authorization,
        url: this._options.urlFormatter.getBriefcaseListUrl({
          iVaultId: params.iVaultId,
          urlParams: params.urlParams,
        }),
        preferReturn: PreferReturn.Representation,
        entityCollectionAccessor,
        headers: params.headers,
      })
    );
  }

  /**
   * Gets a single Briefcase by its id. This method returns a Briefcase in its full representation. Wraps the
   * {@link https://developer.szewec.com/apis/ivaults-v2/operations/get-ivault-briefcase-details/ Get iVault Briefcase}
   * operation from iVaults API.
   * @param {GetSingleBriefcaseParams} params parameters for this operation. See {@link GetSingleBriefcaseParams}.
   * @returns {Promise<Briefcase>} an Briefcase with specified id. See {@link iVault}.
   */
  public async getSingle(params: GetSingleBriefcaseParams): Promise<Briefcase> {
    const response = await this.sendGetRequest<BriefcaseResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleBriefcaseUrl({
        iVaultId: params.iVaultId,
        briefcaseId: params.briefcaseId,
      }),
      headers: params.headers,
    });
    const result: Briefcase = this.appendRelatedEntityCallbacks(
      params.authorization,
      response.body.briefcase,
      params.headers
    );
    return result;
  }

  /**
   * Releases the specified Briefcase. Wraps the
   * {@link https://developer.szewec.com/apis/ivaults-v2/operations/release-ivault-briefcase/ Release iVault Briefcase}
   * operation from iVaults API.
   * @param {ReleaseBriefcaseParams} params parameters for this operation. See {@link ReleaseBriefcaseParams}.
   * @returns {Promise<void>} a promise that resolves after operation completes.
   */
  public async release(params: ReleaseBriefcaseParams): Promise<void> {
    await this.sendDeleteRequest({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleBriefcaseUrl({
        iVaultId: params.iVaultId,
        briefcaseId: params.briefcaseId,
      }),
      headers: params.headers,
    });
  }

  protected appendRelatedEntityCallbacks(
    authorization: AuthorizationCallback,
    briefcase: Briefcase,
    headers?: HeaderFactories
  ): Briefcase {
    const getOwner = async () =>
      getUser(
        authorization,
        this._iVaultsClient.users,
        this._options.urlFormatter,
        briefcase._links.owner?.href,
        headers
      );

    const checkpointLink = briefcase._links.checkpoint;
    assertLink(checkpointLink);
    const getCheckpoint = async () => {
      const response = await this.sendGetRequest<CheckpointResponse>({
        authorization,
        url: checkpointLink.href,
        headers,
      });
      return response.body.checkpoint;
    };

    const result: Briefcase = {
      ...briefcase,
      getOwner,
      getCheckpoint,
    };

    return result;
  }
}
