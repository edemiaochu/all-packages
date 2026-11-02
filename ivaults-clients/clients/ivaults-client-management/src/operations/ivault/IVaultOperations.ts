/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  EntityListIteratorImpl,
  IVaultResponse,
  IVaultsErrorImpl,
  IVaultsResponse,
  OperationsBase,
  UtilityFunctions,
} from "../../base/internal";
import {
  AuthorizationCallback,
  EntityListIterator,
  HeaderFactories,
  HttpResponse,
  IVault,
  IVaultCreationState,
  IVaultState,
  IVaultsErrorCode,
  MinimalIVault,
  PreferReturn,
  User,
} from "../../base/types";
import { Constants } from "../../Constants";
import { IVaultsClient } from "../../IVaultsClient";
import { OperationOptions } from "../OperationOptions";
import { assertStringHeaderValue } from "../SharedFunctions";

import {
  CloneIVaultParams,
  CreateEmptyIVaultParams,
  CreateIVaultFromTemplateParams,
  DeleteIVaultParams,
  ForkIVaultParams,
  GetIVaultListParams,
  GetSingleIVaultParams,
  IVaultProperties,
  IVaultPropertiesForClone,
  IVaultPropertiesForCreateFromTemplate,
  IVaultPropertiesForFork,
  IVaultPropertiesForUpdate,
  UpdateIVaultParams,
} from "./IVaultOperationParams";

export class IVaultOperations<
  TOptions extends OperationOptions
> extends OperationsBase<TOptions> {
  constructor(options: TOptions, private _iVaultsClient: IVaultsClient) {
    super(options);
  }
  /**
   * Gets iVaults for a specific szewTwin. This method returns iVaults in their minimal representation. The returned iterator
   * internally queries entities in pages. Wraps the {@link https://developer.szewec.com/apis/ivaults-v2/operations/get-szewtwin-ivaults/ Get szewTwin iVaults}
   * operation from iVaults API.
   * @param {GetIVaultListParams} params parameters for this operation. See {@link GetIVaultListParams}.
   * @returns {EntityListIterator<MinimalIVault>} iterator for iVault list. See {@link EntityListIterator}, {@link MinimalIVault}.
   */
  public getMinimalList(
    params: GetIVaultListParams
  ): EntityListIterator<MinimalIVault> {
    return new EntityListIteratorImpl(async () =>
      this.getEntityCollectionPage<
        MinimalIVault,
        IVaultsResponse<MinimalIVault>
      >({
        authorization: params.authorization,
        url: this._options.urlFormatter.getIVaultListUrl({
          urlParams: params.urlParams,
        }),
        preferReturn: PreferReturn.Minimal,
        entityCollectionAccessor: (response) => response.body.iVaults,
        headers: params.headers,
      })
    );
  }

  /**
   * Gets iVaults for a specific szewTwin. This method returns iVaults in their full representation. The returned iterator
   * internally queries entities in pages. Wraps the {@link https://developer.szewec.com/apis/ivaults-v2/operations/get-szewtwin-ivaults/ Get szewTwin iVaults}
   * operation from iVaults API.
   * @param {GetIVaultListParams} params parameters for this operation. See {@link GetIVaultListParams}.
   * @returns {EntityListIterator<IVault>} iterator for iVault list. See {@link EntityListIterator}, {@link IVault}.
   */
  public getRepresentationList(
    params: GetIVaultListParams
  ): EntityListIterator<IVault> {
    const entityCollectionAccessor = (
      response: HttpResponse<IVaultsResponse<IVault>>
    ) => {
      const iVaults = response.body.iVaults;
      const mappedIVaults = iVaults.map((iVault) =>
        this.appendRelatedEntityCallbacks(
          params.authorization,
          iVault,
          params.headers
        )
      );
      return mappedIVaults;
    };

    return new EntityListIteratorImpl(async () =>
      this.getEntityCollectionPage<IVault, IVaultsResponse<IVault>>({
        authorization: params.authorization,
        url: this._options.urlFormatter.getIVaultListUrl({
          urlParams: params.urlParams,
        }),
        preferReturn: PreferReturn.Representation,
        entityCollectionAccessor,
        headers: params.headers,
      })
    );
  }

  /**
   * Gets a single iVault by its id. This method returns an iVault in its full representation. Wraps the
   * {@link https://developer.szewec.com/apis/ivaults-v2/operations/get-ivault-details/ Get iVault} operation from iVaults API.
   * @param {GetSingleIVaultParams} params parameters for this operation. See {@link GetSingleIVaultParams}.
   * @returns {Promise<iVault>} an iVault with specified id. See {@link IVault}.
   */
  public async getSingle(params: GetSingleIVaultParams): Promise<IVault> {
    const response = await this.sendGetRequest<IVaultResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleIVaultUrl({
        iVaultId: params.iVaultId,
      }),
      headers: params.headers,
    });
    const result: IVault = this.appendRelatedEntityCallbacks(
      params.authorization,
      response.body.iVault,
      params.headers
    );
    return result;
  }

  /**
   * Creates an empty iVault with specified properties. Wraps the
   * {@link https://developer.szewec.com/apis/ivaults-v2/operations/create-ivault/ Create iVault} operation from iVaults API.
   * @param {CreateEmptyIVaultParams} params parameters for this operation. See {@link CreateEmptyIVaultParams}.
   * @returns {Promise<iVault>} newly created iVault. See {@link IVault}.
   */
  public async createEmpty(params: CreateEmptyIVaultParams): Promise<IVault> {
    const createIVaultBody = this.getCreateEmptyIVaultRequestBody(
      params.iVaultProperties
    );
    if (
      createIVaultBody.geographicCoordinateSystem &&
      createIVaultBody.creationMode !== "empty"
    ) {
      throw new IVaultsErrorImpl({
        code: IVaultsErrorCode.InvalidIVaultGCSCreationMode,
        message:
          "For empty iVaults, GeographicCoordinateSystem can only be set when creationMode is 'empty'.",
        originalError: undefined,
        statusCode: undefined,
        details: undefined,
      });
    }

    let createdIVault = await this.sendIVaultPostRequest(
      params.authorization,
      createIVaultBody,
      params.headers
    );

    if (createdIVault.state === IVaultState.NotInitialized) {
      await this.waitForEmptyIVaultInitialization({
        authorization: params.authorization,
        headers: params.headers,
        iVaultId: createdIVault.id,
        timeOutInMs: params.timeOutInMs,
      });

      createdIVault = await this.getSingle({
        authorization: params.authorization,
        iVaultId: createdIVault.id,
      });
    }

    const result: IVault = this.appendRelatedEntityCallbacks(
      params.authorization,
      createdIVault,
      params.headers
    );
    return result;
  }

  /**
   * Creates an iVault from a template. Wraps the
   * {@link https://developer.szewec.com/apis/ivaults-v2/operations/create-ivault/ Create iVault} operation from iVaults API.
   * It uses the `template` request body property to specify the source iVault which will be used as a template. Internally
   * this method creates the iVault instance and then repeatedly queries the iVault state until the iVault is initialized.
   * The execution of this method can take up to several minutes due to waiting for initialization to complete.
   * @param {CreateIVaultFromTemplateParams} params parameters for this operation. See {@link CreateIVaultFromTemplateParams}.
   * @returns {Promise<iVault>} newly created iVault. See {@link IVault}.
   * @throws an error that implements `iVaultsError` interface with code {@link IVaultsErrorCode.IVaultFromTemplateInitializationFailed} if
   * iVault initialization failed or did not complete in time. See {@link IVaultsErrorCode}.
   */
  public async createFromTemplate(
    params: CreateIVaultFromTemplateParams
  ): Promise<IVault> {
    const createIVaultBody = this.getCreateIVaultFromTemplateRequestBody(
      params.iVaultProperties
    );
    const createdIVault = await this.sendIVaultPostRequest(
      params.authorization,
      createIVaultBody,
      params.headers
    );

    await this.waitForTemplatedIVaultInitialization({
      authorization: params.authorization,
      iVaultId: createdIVault.id,
      headers: params.headers,
      timeOutInMs: params.timeOutInMs,
    });

    return this.getSingle({
      authorization: params.authorization,
      iVaultId: createdIVault.id,
      headers: params.headers,
    });
  }

  /**
   * Clones the specified iVault. Wraps the
   * {@link https://developer.szewec.com/apis/ivaults-v2/operations/clone-ivault/ Clone iVault} operation from iVaults API.
   * Internally this method clones the iVault and then repeatedly queries the new iVault's state until it is initialized.
   * The execution of this method can take up to several minutes due to waiting for initialization to complete.
   * @param {CloneIVaultParams} params parameters for this operation. See {@link CloneIVaultParams}.
   * @returns {Promise<IVault>} newly created iVault. See {@link IVault}.
   * @throws an error that implements `iVaultsError` interface with code {@link IVaultsErrorCode.ClonedIVaultInitializationFailed} if
   * iVault initialization failed or {@link IVaultsErrorCode.ClonedIVaultInitializationTimedOut} if operation did not complete in time.
   * See {@link IVaultsErrorCode}.
   */
  public async clone(params: CloneIVaultParams): Promise<IVault> {
    const cloneIVaultBody = this.getCloneIVaultRequestBody(
      params.iVaultProperties
    );
    const cloneIVaultResponse = await this.sendPostRequest<void>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getCloneIVaultUrl({
        iVaultId: params.iVaultId,
      }),
      body: cloneIVaultBody,
      headers: params.headers,
    });

    const locationHeaderValue = cloneIVaultResponse.headers.get(
      Constants.headers.location
    );
    assertStringHeaderValue(Constants.headers.location, locationHeaderValue);
    const { iVaultId: clonedIVaultId } =
      this._options.urlFormatter.parseIVaultUrl(locationHeaderValue);

    await this.waitForClonedIVaultInitialization({
      authorization: params.authorization,
      iVaultId: clonedIVaultId,
      headers: params.headers,
      timeOutInMs: params.timeOutInMs,
    });

    return this.getSingle({
      authorization: params.authorization,
      iVaultId: clonedIVaultId,
    });
  }

  /**
   * Forks the specified iVault. Wraps the
   * {@link https://developer.szewec.com/apis/ivaults-v2/operations/fork-ivault/ Fork iVault} operation from iVaults API.
   * Internally this method forks the iVault and then repeatedly queries the new iVault's creation state until it is succeeded.
   * The execution of this method can take up to several minutes due to waiting for initialization to complete.
   * @param {ForkIVaultParams} params parameters for this operation. See {@link ForkIVaultParams}.
   * @returns {Promise<IVault>} newly created iVault. See {@link IVault}.
   * @throws an error that implements `iVaultsError` interface with code {@link IVaultsErrorCode.IVaultForkInitializationFailed} if
   * iVault initialization failed, {@link IVaultsErrorCode.IVaultForkInitializationTimedOut} if operation did not complete in time or
   * {@link IVaultsErrorCode.MainIVaultIsMissingFederationGuids} if the iVault from which user is attempting to create a fork does not
   * have {@link https://www.szewtwinjs.org/bis/guide/fundamentals/federationguids/ FederationGuid} property set on all its elements.
   * See {@link IVaultsErrorCode}.
   */
  public async fork(params: ForkIVaultParams): Promise<IVault> {
    const forkIVaultBody = this.getForkIVaultRequestBody(
      params.iVaultProperties
    );
    const forkIVaultResponse = await this.sendPostRequest<void>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getForkIVaultUrl({
        iVaultId: params.iVaultId,
      }),
      body: forkIVaultBody,
      headers: params.headers,
    });

    const locationHeaderValue = forkIVaultResponse.headers.get(
      Constants.headers.location
    );
    assertStringHeaderValue(Constants.headers.location, locationHeaderValue);
    const { iVaultId: forkIVaultId } =
      this._options.urlFormatter.parseIVaultUrl(locationHeaderValue);

    await this.waitForIVaultForkInitialization({
      authorization: params.authorization,
      iVaultId: forkIVaultId,
      headers: params.headers,
      timeOutInMs: params.timeOutInMs,
    });

    return this.getSingle({
      authorization: params.authorization,
      iVaultId: forkIVaultId,
    });
  }

  /**
   * Updates iVault properties. Wraps the
   * {@link https://developer.szewec.com/apis/ivaults-v2/operations/update-ivault/ Update iVault} operation from iVaults API.
   * @param {UpdateIVaultParams} params parameters for this operation. See {@link UpdateIVaultParams}.
   * @returns {Promise<IVault>} updated iVault. See {@link IVault}.
   */
  public async update(params: UpdateIVaultParams): Promise<IVault> {
    const updateIVaultBody = this.getUpdateIVaultRequestBody(
      params.iVaultProperties
    );
    const updateIVaultResponse = await this.sendPatchRequest<IVaultResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleIVaultUrl({
        iVaultId: params.iVaultId,
      }),
      body: updateIVaultBody,
      headers: params.headers,
    });
    const result: IVault = this.appendRelatedEntityCallbacks(
      params.authorization,
      updateIVaultResponse.body.iVault,
      params.headers
    );
    return result;
  }

  /**
   * Deletes an iVault with specified id. Wraps the {@link https://developer.szewec.com/apis/ivaults-v2/operations/delete-ivault/ Delete iVault}
   * operation from iVaults API.
   * @param {DeleteIVaultParams} params parameters for this operation. See {@link DeleteIVaultParams}.
   * @returns {Promise<void>} a promise that resolves after operation completes.
   */
  public async delete(params: DeleteIVaultParams): Promise<void> {
    await this.sendDeleteRequest({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleIVaultUrl({
        iVaultId: params.iVaultId,
      }),
      headers: params.headers,
    });
  }

  protected appendRelatedEntityCallbacks(
    authorization: AuthorizationCallback,
    iVault: IVault,
    headers?: HeaderFactories
  ): IVault {
    const getCreator = async () =>
      this.getCreator(authorization, iVault._links.creator?.href, headers);

    const result: IVault = {
      ...iVault,
      getCreator,
    };

    return result;
  }

  protected getCreateEmptyIVaultRequestBody(
    iVaultProperties: IVaultProperties
  ): IVaultProperties {
    const result: IVaultProperties = {
      szewTwinId: iVaultProperties.szewTwinId,
      name: iVaultProperties.name,
      description: iVaultProperties.description,
      extent: iVaultProperties.extent,
      containersEnabled: iVaultProperties.containersEnabled,
      creationMode: iVaultProperties.creationMode,
      geographicCoordinateSystem: iVaultProperties.geographicCoordinateSystem,
    };

    return result;
  }

  protected async sendIVaultPostRequest(
    authorization: AuthorizationCallback,
    createIVaultBody: object,
    headers?: HeaderFactories
  ): Promise<IVault> {
    const createIVaultResponse = await this.sendPostRequest<IVaultResponse>({
      authorization,
      url: this._options.urlFormatter.getCreateIVaultUrl(),
      body: createIVaultBody,
      headers,
    });
    return createIVaultResponse.body.iVault;
  }

  private async getCreator(
    authorization: AuthorizationCallback,
    creatorLink: string | undefined,
    headers?: HeaderFactories
  ): Promise<User | undefined> {
    if (!creatorLink) return undefined;

    const { iVaultId, userId } =
      this._options.urlFormatter.parseUserUrl(creatorLink);
    return this._iVaultsClient.users.getSingle({
      authorization,
      iVaultId,
      userId,
      headers,
    });
  }

  private getCreateIVaultFromTemplateRequestBody(
    iVaultProperties: IVaultPropertiesForCreateFromTemplate
  ): object {
    const emptyIVaultParams =
      this.getCreateEmptyIVaultRequestBody(iVaultProperties);
    return {
      ...emptyIVaultParams,
      template: {
        iVaultId: iVaultProperties.template.iVaultId,
        changesetId: iVaultProperties.template.changesetId,
      },
    };
  }

  private getCloneIVaultRequestBody(
    iVaultProperties: IVaultPropertiesForClone
  ): object {
    return {
      szewTwinId: iVaultProperties.szewTwinId,
      name: iVaultProperties.name,
      description: iVaultProperties.description,
      changesetId: iVaultProperties.changesetId,
      changesetIndex: iVaultProperties.changesetIndex,
      containersEnabled: iVaultProperties.containersEnabled,
    };
  }

  private getForkIVaultRequestBody(
    iVaultProperties: IVaultPropertiesForFork
  ): object {
    return {
      szewTwinId: iVaultProperties.szewTwinId,
      name: iVaultProperties.name,
      description: iVaultProperties.description,
      changesetId: iVaultProperties.changesetId,
      changesetIndex: iVaultProperties.changesetIndex,
      preserveHistory: iVaultProperties.preserveHistory,
      containersEnabled: iVaultProperties.containersEnabled,
    };
  }

  private getUpdateIVaultRequestBody(
    iVaultProperties: IVaultPropertiesForUpdate
  ): object {
    return {
      name: iVaultProperties.name,
      description: iVaultProperties.description,
      extent: iVaultProperties.extent,
    };
  }

  private async isIVaultInitialized(params: {
    authorization: AuthorizationCallback;
    iVaultId: string;
    errorCodeOnFailure: IVaultsErrorCode;
    headers?: HeaderFactories;
  }): Promise<boolean> {
    const { state } =
      await this._iVaultsClient.operations.getCreateIVaultDetails({
        authorization: params.authorization,
        iVaultId: params.iVaultId,
        headers: params.headers,
      });

    if (
      state !== IVaultCreationState.Scheduled &&
      state !== IVaultCreationState.WaitingForFile &&
      state !== IVaultCreationState.Successful
    )
      throw new IVaultsErrorImpl({
        code: params.errorCodeOnFailure,
        message: `iVault initialization failed with state '${state}'`,
        originalError: undefined,
        statusCode: undefined,
        details: undefined,
      });

    return state === IVaultCreationState.Successful;
  }

  private async isIVaultForkInitialized(params: {
    authorization: AuthorizationCallback;
    iVaultId: string;
    headers?: HeaderFactories;
  }): Promise<boolean> {
    const { state } =
      await this._iVaultsClient.operations.getCreateIVaultDetails({
        authorization: params.authorization,
        iVaultId: params.iVaultId,
        headers: params.headers,
      });

    if (state === IVaultCreationState.MainIVaultIsMissingFederationGuids)
      throw new IVaultsErrorImpl({
        code: IVaultsErrorCode.MainIVaultIsMissingFederationGuids,
        message:
          "iVault fork initialization failed because some elements in the main iVault do not have FederationGuid property set.",
        originalError: undefined,
        statusCode: undefined,
        details: undefined,
      });

    if (
      state !== IVaultCreationState.Scheduled &&
      state !== IVaultCreationState.WaitingForFile &&
      state !== IVaultCreationState.Successful
    )
      throw new IVaultsErrorImpl({
        code: IVaultsErrorCode.IVaultForkInitializationFailed,
        message: `iVault fork initialization failed with state '${state}'`,
        originalError: undefined,
        statusCode: undefined,
        details: undefined,
      });

    return state === IVaultCreationState.Successful;
  }

  private async waitForEmptyIVaultInitialization(params: {
    authorization: AuthorizationCallback;
    iVaultId: string;
    timeOutInMs?: number;
    headers?: HeaderFactories;
  }): Promise<void> {
    return UtilityFunctions.waitForCondition({
      conditionToSatisfy: async () =>
        this.isIVaultInitialized({
          authorization: params.authorization,
          iVaultId: params.iVaultId,
          errorCodeOnFailure: IVaultsErrorCode.EmptyIVaultInitializationFailed,
          headers: params.headers,
        }),
      timeoutErrorFactory: () =>
        new IVaultsErrorImpl({
          code: IVaultsErrorCode.EmptyIVaultInitializationFailed,
          message: "Timed out waiting for empty iVault initialization.",
          originalError: undefined,
          statusCode: undefined,
          details: undefined,
        }),
      timeOutInMs: params.timeOutInMs,
    });
  }

  private async waitForTemplatedIVaultInitialization(params: {
    authorization: AuthorizationCallback;
    iVaultId: string;
    timeOutInMs?: number;
    headers?: HeaderFactories;
  }): Promise<void> {
    return UtilityFunctions.waitForCondition({
      conditionToSatisfy: async () =>
        this.isIVaultInitialized({
          authorization: params.authorization,
          iVaultId: params.iVaultId,
          errorCodeOnFailure:
            IVaultsErrorCode.IVaultFromTemplateInitializationFailed,
          headers: params.headers,
        }),
      timeoutErrorFactory: () =>
        new IVaultsErrorImpl({
          code: IVaultsErrorCode.IVaultFromTemplateInitializationTimedOut,
          message: "Timed out waiting for Baseline File initialization.",
          originalError: undefined,
          statusCode: undefined,
          details: undefined,
        }),
      timeOutInMs: params.timeOutInMs,
    });
  }

  private async waitForClonedIVaultInitialization(params: {
    authorization: AuthorizationCallback;
    iVaultId: string;
    timeOutInMs?: number;
    headers?: HeaderFactories;
  }): Promise<void> {
    return UtilityFunctions.waitForCondition({
      conditionToSatisfy: async () =>
        this.isIVaultInitialized({
          authorization: params.authorization,
          iVaultId: params.iVaultId,
          errorCodeOnFailure: IVaultsErrorCode.ClonedIVaultInitializationFailed,
          headers: params.headers,
        }),
      timeoutErrorFactory: () =>
        new IVaultsErrorImpl({
          code: IVaultsErrorCode.ClonedIVaultInitializationTimedOut,
          message: "Timed out waiting for Cloned iVault initialization.",
          originalError: undefined,
          statusCode: undefined,
          details: undefined,
        }),
      timeOutInMs: params.timeOutInMs,
    });
  }

  private async waitForIVaultForkInitialization(params: {
    authorization: AuthorizationCallback;
    iVaultId: string;
    timeOutInMs?: number;
    headers?: HeaderFactories;
  }): Promise<void> {
    return UtilityFunctions.waitForCondition({
      conditionToSatisfy: async () =>
        this.isIVaultForkInitialized({
          authorization: params.authorization,
          iVaultId: params.iVaultId,
          headers: params.headers,
        }),
      timeoutErrorFactory: () =>
        new IVaultsErrorImpl({
          code: IVaultsErrorCode.IVaultForkInitializationTimedOut,
          message: "Timed out waiting for iVault fork initialization.",
          originalError: undefined,
          statusCode: undefined,
          details: undefined,
        }),
      timeOutInMs: params.timeOutInMs,
    });
  }
}
