/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import axios, { AxiosResponse } from "axios";

import {
  CheckpointProps,
  DownloadRequest,
  V2CheckpointAccessProps,
} from "@szewtwin/core-backend";
import { Logger } from "@szewtwin/core-szewec";
import { Constants, handleAPIErrors } from "@szewtwin/ivaults-access-common";
import { IVaultsClient } from "@szewtwin/ivaults-client-authoring";
import {
  Checkpoint,
  GetSingleChangesetParams,
  GetSingleCheckpointParams,
  IVaultScopedOperationParams,
} from "@szewtwin/ivaults-client-management";

import { ClientToPlatformAdapter } from "./interface-adapters/ClientToPlatformAdapter";
import { PlatformToClientAdapter } from "./interface-adapters/PlatformToClientAdapter";

export async function queryCurrentOrPrecedingV2Checkpoint(
  iVaultsClient: IVaultsClient,
  iVaultScopedOperationParams: IVaultScopedOperationParams,
  checkpointProps: CheckpointProps
): Promise<V2CheckpointAccessProps | undefined> {
  const changesetIndex = await resolveChangesetIndexFromParamsOrQueryApi(
    iVaultsClient,
    iVaultScopedOperationParams,
    checkpointProps
  );

  if (changesetIndex === 0) {
    const baselineCheckpoint = await getBaselineCheckpoint(
      iVaultsClient,
      iVaultScopedOperationParams
    );
    if (!baselineCheckpoint?.directoryAccessInfo) return undefined;
    return ClientToPlatformAdapter.toV2CheckpointAccessProps(
      baselineCheckpoint.directoryAccessInfo,
      baselineCheckpoint.dbName
    );
  }

  const isQueriedCheckpointValid = (queriedCheckpoint: Checkpoint) =>
    !!queriedCheckpoint.directoryAccessInfo;
  const checkpoint = await findLatestCheckpointForChangeset(
    iVaultsClient,
    iVaultScopedOperationParams,
    changesetIndex,
    isQueriedCheckpointValid
  );
  if (checkpoint === undefined) return undefined;
  return ClientToPlatformAdapter.toV2CheckpointAccessProps(
    checkpoint.directoryAccessInfo!,
    checkpoint.dbName
  );
}

export async function queryCurrentOrPrecedingV1Checkpoint(
  iVaultsClient: IVaultsClient,
  iVaultScopedOperationParams: IVaultScopedOperationParams,
  // eslint-disable-next-line deprecation/deprecation
  checkpointArg: DownloadRequest
): Promise<Checkpoint | undefined> {
  const changesetIndex = await resolveChangesetIndexFromParamsOrQueryApi(
    iVaultsClient,
    iVaultScopedOperationParams,
    checkpointArg.checkpoint
  );

  if (changesetIndex === 0) {
    const baselineCheckpoint = await getBaselineCheckpoint(
      iVaultsClient,
      iVaultScopedOperationParams
    );
    return baselineCheckpoint;
  }

  const isQueriedCheckpointValid = (queriedCheckpoint: Checkpoint) =>
    !!queriedCheckpoint._links.download;
  const checkpoint = await findLatestCheckpointForChangeset(
    iVaultsClient,
    iVaultScopedOperationParams,
    changesetIndex,
    isQueriedCheckpointValid
  );
  return checkpoint;
}

/**
 * iVaults API returns a link to a file in Azure Blob Storage. The API does not return checkpoint file size as
 * a standalone property so we query it from Azure using the method described below.
 *
 * To get the total size of the file we send a GET request to the file download url with `Range: bytes=0-0` header
 * specified which requests to get only the first byte of the file. As a response we get the first file byte in
 * the body and `Content-Range` response header which contains information about the total file size. See
 * https://docs.microsoft.com/en-us/rest/api/storageservices/get-blob#response-headers,
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Range.
 *
 * The format of returned `Content-Range` header in this case is
 * `<unit> <range-start>-<range-end>/<size>`, e.g. `bytes 0-0/1253376`.
 */
export async function getV1CheckpointSize(
  downloadUrl: string
): Promise<number> {
  const emptyRangeHeaderValue = "bytes=0-0";
  const contentRangeHeaderName = "content-range";

  const response: AxiosResponse = await axios.get(downloadUrl, {
    headers: { Range: emptyRangeHeaderValue },
  });
  const rangeHeaderValue: string | undefined =
    response.headers[contentRangeHeaderName];
  if (!rangeHeaderValue) {
    Logger.logError(
      "BackendIVaultsAccess",
      "Cannot determine total V1 checkpoint size"
    );
    return 0;
  }

  const rangeTotalBytesString: string = rangeHeaderValue.split("/")[1];
  const rangeTotalBytes: number = parseInt(rangeTotalBytesString, 10);

  return rangeTotalBytes;
}

async function findLatestCheckpointForChangeset(
  iVaultsClient: IVaultsClient,
  iVaultScopedOperationParams: IVaultScopedOperationParams,
  changesetIndex: number,
  isExpectedCheckpoint: (checkpoint: Checkpoint) => boolean
): Promise<Checkpoint | undefined> {
  if (changesetIndex <= 0) return undefined;

  const getSingleChangesetParams: GetSingleChangesetParams = {
    ...iVaultScopedOperationParams,
    ...PlatformToClientAdapter.toChangesetIdOrIndex({ index: changesetIndex }),
  };

  const changeset = await handleAPIErrors(async () =>
    iVaultsClient.changesets.getSingle(getSingleChangesetParams)
  );
  const checkpoint = await handleAPIErrors(async () =>
    changeset.getCurrentOrPrecedingCheckpoint()
  );

  if (!checkpoint) return undefined;

  if (isExpectedCheckpoint(checkpoint)) return checkpoint;

  const previousChangesetIndex = checkpoint.changesetIndex - 1;
  return findLatestCheckpointForChangeset(
    iVaultsClient,
    iVaultScopedOperationParams,
    previousChangesetIndex,
    isExpectedCheckpoint
  );
}

async function getBaselineCheckpoint(
  iVaultsClient: IVaultsClient,
  iVaultScopedOperationParams: IVaultScopedOperationParams
): Promise<Checkpoint | undefined> {
  const getCheckpointParams: GetSingleCheckpointParams = {
    ...iVaultScopedOperationParams,
    changesetIndex: 0,
  };
  const result = await handleAPIErrors(async () =>
    iVaultsClient.checkpoints.getSingle(getCheckpointParams)
  );
  return result;
}

async function resolveChangesetIndexFromParamsOrQueryApi(
  iVaultsClient: IVaultsClient,
  iVaultScopedOperationParams: IVaultScopedOperationParams,
  checkpointProps: CheckpointProps
): Promise<number> {
  if (
    checkpointProps.changeset.id === Constants.ChangeSet0.id ||
    checkpointProps.changeset.index === Constants.ChangeSet0.index
  )
    return Constants.ChangeSet0.index;

  if (checkpointProps.changeset.index !== undefined)
    return checkpointProps.changeset.index;

  const getSingleChangesetParams: GetSingleChangesetParams = {
    ...iVaultScopedOperationParams,
    changesetId: checkpointProps.changeset.id,
  };

  const changeset = await handleAPIErrors(async () =>
    iVaultsClient.changesets.getSingle(getSingleChangesetParams)
  );

  return changeset.index;
}
