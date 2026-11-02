/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { injectable } from "inversify";

import { GetLockListParams, Lock } from "@szewtwin/ivaults-client-authoring";
import {
  GetBriefcaseListParams,
  GetChangesetExtendedDataListParams,
  GetChangesetGroupListParams,
  GetChangesetListParams,
  GetNamedVersionListParams,
  IVault,
  NamedVersion,
  toArray,
} from "@szewtwin/ivaults-client-management";

import { TestSetupError } from "../../CommonTestUtils";
import { TestAuthorizationProvider } from "../auth/TestAuthorizationProvider";
import { TestSZEWTwinProvider } from "../szewtwin/TestSZEWTwinProvider";

import { TestIVaultCreator } from "./TestIVaultCreator";
import { TestIVaultFileProvider } from "./TestIVaultFileProvider";
import {
  BriefcaseMetadata,
  ChangesetExtendedDataMetadata,
  ChangesetGroupMetadata,
  NamedVersionMetadata,
  ReusableIVaultMetadata,
} from "./TestIVaultInterfaces";
import { TestIVaultsClient } from "./TestIVaultsClient";

@injectable()
export class TestIVaultRetriever {
  constructor(
    private readonly _iVaultsClient: TestIVaultsClient,
    private readonly _testAuthorizationProvider: TestAuthorizationProvider,
    private readonly _testSZEWTwinProvider: TestSZEWTwinProvider,
    private readonly _testIVaultFileProvider: TestIVaultFileProvider
  ) {}

  public async findIVaultByName(
    iVaultName: string
  ): Promise<IVault | undefined> {
    const szewTwinId = await this._testSZEWTwinProvider.getOrCreate();
    const iVaultIterator = this._iVaultsClient.iVaults.getRepresentationList({
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      urlParams: {
        szewTwinId,
        name: iVaultName,
      },
    });
    const iVaults = await toArray(iVaultIterator);
    return iVaults.length === 0 ? undefined : iVaults[0];
  }

  public async queryRelatedData(
    iVault: IVault
  ): Promise<ReusableIVaultMetadata> {
    const briefcases = await this.queryAndValidateBriefcases(iVault.id);
    const namedVersions = await this.queryAndValidateNamedVersions(iVault.id);
    const lock = await this.queryAndValidateLock(iVault.id);
    const changesetGroups = await this.queryAndValidateChangesetGroups(
      iVault.id
    );
    const changesetExtendedData =
      await this.queryAndValidateChangesetExtendedData(iVault.id);
    await this.queryAndValidateChangesets(iVault.id, changesetGroups);

    return {
      id: iVault.id,
      name: iVault.name,
      description: iVault.description!,
      briefcases,
      namedVersions,
      lock,
      changesetGroups,
      changesetExtendedData,
    };
  }

  private async queryAndValidateBriefcases(
    iVaultId: string
  ): Promise<BriefcaseMetadata[]> {
    const getBriefcaseListParams: GetBriefcaseListParams = {
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      iVaultId,
    };
    const briefcases = await toArray(
      this._iVaultsClient.briefcases.getRepresentationList(
        getBriefcaseListParams
      )
    );
    if (briefcases.length !== TestIVaultCreator.briefcaseCount)
      throw new TestSetupError(
        `${briefcases.length} is an unexpected briefcase count for reusable test iVault.`
      );

    return briefcases.map((briefcase) => ({
      id: briefcase.briefcaseId,
      deviceName: briefcase.deviceName!,
      ownerId: briefcase.ownerId,
    }));
  }

  private async queryAndValidateNamedVersions(
    iVaultId: string
  ): Promise<NamedVersionMetadata[]> {
    const getNamedVersionListParams: GetNamedVersionListParams = {
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      iVaultId,
    };
    const namedVersions: NamedVersion[] = await toArray(
      this._iVaultsClient.namedVersions.getRepresentationList(
        getNamedVersionListParams
      )
    );
    if (namedVersions.length !== TestIVaultCreator.namedVersions.length)
      throw new TestSetupError(
        `${namedVersions.length} is an unexpected named version count for reusable test iVault.`
      );

    const mappedNamedVersions = namedVersions
      .map((namedVersion) => ({
        id: namedVersion.id,
        name: namedVersion.name,
        changesetId: namedVersion.changesetId!,
        changesetIndex: this._testIVaultFileProvider.changesets.find(
          (cs) => cs.id === namedVersion.changesetId
        )!.index,
      }))
      .sort((nv1, nv2) => nv1.changesetIndex - nv2.changesetIndex);

    if (
      !mappedNamedVersions.every(
        (nv, i) => nv.name === TestIVaultCreator.namedVersions[i].name
      )
    )
      throw new TestSetupError(
        "Reusable test iVault contains unexpected named versions - names do not match"
      );

    if (
      !mappedNamedVersions.every(
        (nv, i) =>
          nv.changesetIndex ===
          TestIVaultCreator.namedVersions[i].changesetIndex
      )
    )
      throw new TestSetupError(
        "Reusable test iVault contains unexpected named versions - Changeset indexes do not match."
      );

    return mappedNamedVersions;
  }

  private async queryAndValidateLock(iVaultId: string): Promise<Lock> {
    const getLockListParams: GetLockListParams = {
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      iVaultId,
    };
    const locks: Lock[] = await toArray(
      this._iVaultsClient.locks.getList(getLockListParams)
    );
    if (locks.length !== 1)
      throw new TestSetupError(
        `${locks.length} is an unexpected lock count for reusable test iVault.`
      );

    return locks[0];
  }

  private async queryAndValidateChangesetExtendedData(
    iVaultId: string
  ): Promise<ChangesetExtendedDataMetadata[]> {
    const getChangesetExtendedDataListParams: GetChangesetExtendedDataListParams =
      {
        authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
        iVaultId,
      };
    const changesetExtendedDataList = await toArray(
      this._iVaultsClient.changesetExtendedData.getList(
        getChangesetExtendedDataListParams
      )
    );
    if (
      changesetExtendedDataList.length !==
      TestIVaultCreator.changesetExtendedData.length
    )
      throw new TestSetupError(
        `${changesetExtendedDataList.length} is an unexpected changeset extended data count for reusable test iVault.`
      );

    return changesetExtendedDataList.map((csExtendedData) => ({
      changesetId: csExtendedData.changesetId,
      changesetIndex: csExtendedData.changesetIndex,
      data: csExtendedData.data,
    }));
  }

  private async queryAndValidateChangesetGroups(
    iVaultId: string
  ): Promise<ChangesetGroupMetadata[]> {
    const getChangesetGroupListParams: GetChangesetGroupListParams = {
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      iVaultId,
    };
    const changesetGroups = await toArray(
      this._iVaultsClient.changesetGroups.getList(getChangesetGroupListParams)
    );
    if (changesetGroups.length !== TestIVaultCreator.changesetGroups.length)
      throw new TestSetupError(
        `${changesetGroups.length} is an unexpected changeset group count for reusable test iVault.`
      );

    return changesetGroups.map((csGroup) => {
      const changesetIndexes = TestIVaultCreator.changesetGroups.find(
        (x) => x.description === csGroup.description
      )?.changesetIndexes;
      if (!changesetIndexes)
        throw new TestSetupError(
          "Could not find expected changeset group by description."
        );
      return {
        id: csGroup.id,
        description: csGroup.description,
        changesetIndexes,
      };
    });
  }

  private async queryAndValidateChangesets(
    iVaultId: string,
    changesetGroups: ChangesetGroupMetadata[]
  ): Promise<void> {
    const getChangesetListParams: GetChangesetListParams = {
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      iVaultId,
    };
    const changesets = await toArray(
      this._iVaultsClient.changesets.getMinimalList(getChangesetListParams)
    );
    if (changesets.length !== this._testIVaultFileProvider.changesets.length)
      throw new TestSetupError(
        `${changesets.length} is an unexpected changeset count for reusable test iVault.`
      );

    for (const changeset of changesets) {
      const expectedGroupId =
        changesetGroups.find((csGroup) =>
          csGroup.changesetIndexes.includes(changeset.index)
        )?.id ?? null;
      if (changeset.groupId !== expectedGroupId)
        throw new TestSetupError(
          `Changeset with index ${changeset.index} group id is incorrect.`
        );
    }
  }
}
