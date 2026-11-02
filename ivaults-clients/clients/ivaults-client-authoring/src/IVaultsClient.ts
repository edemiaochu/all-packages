/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  AxiosRestClient,
  AxiosRetryPolicy,
  Constants,
  ExponentialBackoffAlgorithm,
  IVaultsOriginalError,
  IVaultsClient as ManagementIVaultsClient,
  IVaultsClientOptions as ManagementIVaultsClientOptions,
  RecursiveRequired,
  ResponseInfo,
} from "@szewtwin/ivaults-client-management";

import { ClientStorage } from "@szewtwin/object-storage-core";

import { IVaultsErrorParser, NodeLocalFileSystem } from "./base/internal";
import { LocalFileSystem } from "./base/types";
import {
  BaselineFileOperations,
  BriefcaseOperations,
  ChangesetExtendedDataOperations,
  ChangesetGroupOperations,
  ChangesetOperations,
  IVaultOperations,
  IVaultsApiUrlFormatter,
  LockOperations,
  OperationOptions,
} from "./operations";

/** User-configurable iVaults client options. */
export interface IVaultsClientOptions extends ManagementIVaultsClientOptions {
  /**
   * Local filesystem to use in operations which transfer files. Examples of such operations are Changeset download in
   * {@link ChangesetOperations}, iVault creation from Baseline in {@link iVaultOperations}. If `undefined` the default
   * is used which is `LocalFsImpl` that is implemented using Node's `fs` module.
   */
  localFileSystem?: LocalFileSystem;
  /**
   * Storage handler to use in operations which transfer files. Examples of such operations are Changeset download in
   * {@link ChangesetOperations}, iVault creation from Baseline in {@link iVaultOperations}. You can use
   * {@link createDefaultClientStorage} which supports both Azure and Google storage.
   */
  cloudStorage: ClientStorage;
}

/**
 * iVaults API client for iVault authoring workflows. For more information on the API visit the
 * {@link https://developer.szewec.com/apis/ivaults-v2/ iVaults API documentation page}.
 */
export class IVaultsClient extends ManagementIVaultsClient {
  protected override _operationsOptions: OperationOptions;

  /**
   * Class constructor.
   * @param {iVaultsClientOptions} options client options. If `options` are `undefined` or if some of the properties
   * are `undefined` the client uses defaults. See {@link iVaultsClientOptions}.
   */
  constructor(options: IVaultsClientOptions) {
    const filledIVaultsClientOptions =
      IVaultsClient.fillAuthoringClientConfiguration(options);
    super(filledIVaultsClientOptions);

    this._operationsOptions = {
      ...filledIVaultsClientOptions,
      parseErrorFunc: (
        response: ResponseInfo,
        originalError: IVaultsOriginalError
      ) => IVaultsErrorParser.parse(response, originalError),
      urlFormatter: new IVaultsApiUrlFormatter(
        filledIVaultsClientOptions.api.baseUrl
      ),
    };
  }

  /**
   * `ClientStorage` instance that is used for file transfer operations. This uses the user provided instance or default one,
   * see {@link IVaultsClientOptions}.
   */
  public get cloudStorage(): ClientStorage {
    return this._operationsOptions.cloudStorage;
  }

  /** iVault operations. See {@link iVaultOperations}. */
  public override get iVaults(): IVaultOperations<OperationOptions> {
    return new IVaultOperations(this._operationsOptions, this);
  }

  /** Baseline file operations. See {@link BaselineFileOperations}. */
  public get baselineFiles(): BaselineFileOperations<OperationOptions> {
    return new BaselineFileOperations(this._operationsOptions);
  }

  /** Briefcase operations. See {@link BriefcaseOperations}. */
  public override get briefcases(): BriefcaseOperations<OperationOptions> {
    return new BriefcaseOperations(this._operationsOptions, this);
  }

  /** Changeset operations. See {@link ChangesetOperations}. */
  public override get changesets(): ChangesetOperations<OperationOptions> {
    return new ChangesetOperations(this._operationsOptions, this);
  }

  /** Changeset Extended Data operations. See {@link ChangesetExtendedDataOperations}. */
  public override get changesetExtendedData(): ChangesetExtendedDataOperations<OperationOptions> {
    return new ChangesetExtendedDataOperations(this._operationsOptions);
  }

  /** Changeset Group operations. See {@link ChangesetGroupOperations}. */
  public override get changesetGroups(): ChangesetGroupOperations<OperationOptions> {
    return new ChangesetGroupOperations(this._operationsOptions, this);
  }

  /** Lock operations. See {@link LockOperations}. */
  public override get locks(): LockOperations<OperationOptions> {
    return new LockOperations(this._operationsOptions);
  }

  private static fillAuthoringClientConfiguration(
    options: IVaultsClientOptions
  ): RecursiveRequired<IVaultsClientOptions> {
    const retryPolicy =
      options?.retryPolicy ??
      new AxiosRetryPolicy({
        maxRetries: Constants.retryPolicy.maxRetries,
        backoffAlgorithm: new ExponentialBackoffAlgorithm({
          baseDelayInMs: Constants.retryPolicy.baseDelayInMs,
          factor: Constants.retryPolicy.delayFactor,
        }),
      });

    return {
      api: this.fillApiConfiguration(options?.api),
      restClient: options.restClient ?? new AxiosRestClient(retryPolicy),
      localFileSystem: options.localFileSystem ?? new NodeLocalFileSystem(),
      headers: options.headers ?? {},
      cloudStorage: options.cloudStorage,
      retryPolicy,
    };
  }
}
