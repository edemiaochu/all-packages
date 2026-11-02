/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  AuthorizationParam,
  HeadersParam,
  IVault,
  IVaultsErrorCode,
  IVaultsErrorImpl,
  IVaultOperations as ManagementIVaultOperations,
  UtilityFunctions,
  assertLink,
} from "@szewtwin/ivaults-client-management";

import { BaselineFileState } from "../../base/types";
import { IVaultsClient } from "../../IVaultsClient";
import { BaselineFileOperations } from "../baseline-file/BaselineFileOperations";
import { OperationOptions } from "../OperationOptions";

import {
  CreateIVaultFromBaselineParams,
  IVaultPropertiesForCreateFromBaseline,
} from "./IVaultOperationParams";

export class IVaultOperations<
  TOptions extends OperationOptions
> extends ManagementIVaultOperations<TOptions> {
  private _baselineFileOperations: BaselineFileOperations<TOptions>;

  constructor(options: TOptions, iVaultsClient: IVaultsClient) {
    super(options, iVaultsClient);
    this._baselineFileOperations = new BaselineFileOperations<TOptions>(
      options
    );
  }

  /**
   * Creates an iVault from Baseline file with specified properties. Wraps the
   * {@link https://developer.szewec.com/apis/ivaults-v2/operations/create-ivault/ Create iVault} operation from iVaults API.
   * Internally it creates an iVault instance, uploads the Baseline file, confirms Baseline
   * file upload and then repeatedly queries the Baseline file state until the iVault is initialized. The execution of
   * this method can take up to several minutes due to waiting for initialization to complete. It also depends on the
   * Baseline file size - the larger the file, the longer the upload will take.
   * @param {CreateIVaultFromBaselineParams} params parameters for this operation. See {@link CreateIVaultFromBaselineParams}.
   * @returns {Promise<IVault>} newly created iVault. See {@link IVault}.
   * @throws an error that implements `iVaultsError` interface with code {@link IVaultsErrorCode.BaselineFileInitializationFailed} if
   * Baseline file initialization failed or {@link IVaultsErrorCode.BaselineFileInitializationTimedOut} if the operation did not complete in time.
   * See {@link IVaultsErrorCode}.
   */
  public async createFromBaseline(
    params: CreateIVaultFromBaselineParams
  ): Promise<IVault> {
    const baselineFileSize = await this._options.localFileSystem.getFileSize(
      params.iVaultProperties.filePath
    );
    const createIVaultBody = this.getCreateIVaultFromBaselineRequestBody(
      params.iVaultProperties,
      baselineFileSize
    );
    const createdIVault = await this.sendIVaultPostRequest(
      params.authorization,
      createIVaultBody,
      params.headers
    );

    assertLink(createdIVault._links.upload);
    const uploadLink = createdIVault._links.upload;
    await this._options.cloudStorage.upload({
      url: uploadLink.href,
      storageType: uploadLink.storageType,
      data: params.iVaultProperties.filePath,
    });

    assertLink(createdIVault._links.complete);
    const confirmUploadUrl = createdIVault._links.complete.href;
    await this.sendPostRequest({
      authorization: params.authorization,
      url: confirmUploadUrl,
      body: undefined,
      headers: params.headers,
    });

    await this.waitForBaselineFileInitialization({
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

  private getCreateIVaultFromBaselineRequestBody(
    iVaultProperties: IVaultPropertiesForCreateFromBaseline,
    baselineFileSize: number
  ): object {
    return {
      ...this.getCreateEmptyIVaultRequestBody(iVaultProperties),
      baselineFile: {
        size: baselineFileSize,
      },
    };
  }

  private async waitForBaselineFileInitialization(
    params: AuthorizationParam &
      HeadersParam & { iVaultId: string; timeOutInMs?: number }
  ): Promise<void> {
    const isBaselineInitialized: () => Promise<boolean> = async () => {
      const { state } = await this._baselineFileOperations.getSingle(params);

      if (
        state !== BaselineFileState.Initialized &&
        state !== BaselineFileState.WaitingForFile &&
        state !== BaselineFileState.InitializationScheduled
      )
        throw new IVaultsErrorImpl({
          code: IVaultsErrorCode.BaselineFileInitializationFailed,
          message: `Baseline File initialization failed with state '${state}.'`,
          originalError: undefined,
          statusCode: undefined,
          details: undefined,
        });

      return state === BaselineFileState.Initialized;
    };

    return UtilityFunctions.waitForCondition({
      conditionToSatisfy: isBaselineInitialized,
      timeoutErrorFactory: () =>
        new IVaultsErrorImpl({
          code: IVaultsErrorCode.BaselineFileInitializationTimedOut,
          message: "Timed out waiting for Baseline File initialization.",
          originalError: undefined,
          statusCode: undefined,
          details: undefined,
        }),
      timeOutInMs: params.timeOutInMs,
    });
  }
}
