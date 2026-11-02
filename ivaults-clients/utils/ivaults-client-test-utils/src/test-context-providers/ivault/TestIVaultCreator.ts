/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { injectable } from "inversify";

import {
  Lock,
  LockLevel,
  LockedObjects,
  UpdateChangesetGroupParams,
} from "@szewtwin/ivaults-client-authoring";
import {
  ChangesetGroupState,
  CheckpointState,
  ContainerTypes,
  GetSingleCheckpointParams,
  IVault,
  UtilityFunctions,
} from "@szewtwin/ivaults-client-management";

import { TestSetupError } from "../../CommonTestUtils";
import { TestAuthorizationProvider } from "../auth/TestAuthorizationProvider";
import { TestSZEWTwinProvider } from "../szewtwin/TestSZEWTwinProvider";

import { TestIVaultFileProvider } from "./TestIVaultFileProvider";
import {
  BriefcaseMetadata,
  ChangesetExtendedDataMetadata,
  ChangesetGroupMetadata,
  IVaultMetadata,
  NamedVersionMetadata,
  ReusableIVaultMetadata,
} from "./TestIVaultInterfaces";
import { TestIVaultsClient } from "./TestIVaultsClient";

@injectable()
export class TestIVaultCreator {
  public static briefcaseCount = 3;

  public static namedVersions = [
    { name: "Named version 5", changesetIndex: 5 },
    { name: "Named version 10", changesetIndex: 10 },
  ];

  public static changesetExtendedData = [
    { changesetIndex: 1, data: { someKey: "someValue" } },
    { changesetIndex: 2, data: { someKey: "someValue2" } },
  ];

  public static changesetGroups = [
    { description: "Initial group", changesetIndexes: [1, 2, 3] },
    { description: "Another one", changesetIndexes: [4, 5, 6] },
  ];

  private readonly _reusableIVaultCreationInProgressDescription =
    "Reusable iVault creation in progress";
  private readonly _reusableIVaultCreationCompletedDescription =
    "Reusable iVault creation completed";
  private readonly _briefcaseDeviceName = "Some device name";

  constructor(
    private readonly _iVaultsClient: TestIVaultsClient,
    private readonly _testAuthorizationProvider: TestAuthorizationProvider,
    private readonly _testSZEWTwinProvider: TestSZEWTwinProvider,
    private readonly _testIVaultFileProvider: TestIVaultFileProvider
  ) {}

  public async createEmpty(
    iVaultName: string,
    iVaultDescription: string = "Some description"
  ): Promise<IVaultMetadata> {
    const szewTwinId = await this._testSZEWTwinProvider.getOrCreate();
    const iVault = await this._iVaultsClient.iVaults.createEmpty({
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      iVaultProperties: {
        szewTwinId,
        name: iVaultName,
        description: iVaultDescription,
        containersEnabled: ContainerTypes.None,
      },
    });

    return {
      id: iVault.id,
      name: iVault.name,
      description: iVault.description!,
    };
  }

  public async createEmptyAndUploadChangesets(
    iVaultName: string
  ): Promise<IVaultMetadata> {
    const iVault = await this.createEmpty(iVaultName);
    const briefcases = await this.acquireBriefcases(
      iVault.id,
      TestIVaultCreator.briefcaseCount
    );
    await this.uploadChangesets(iVault.id, briefcases[0].id, []);
    return iVault;
  }

  public async createReusable(
    iVaultName: string
  ): Promise<ReusableIVaultMetadata> {
    const iVault = await this.createEmpty(
      iVaultName,
      this._reusableIVaultCreationInProgressDescription
    );
    const briefcases = await this.acquireBriefcases(
      iVault.id,
      TestIVaultCreator.briefcaseCount
    );
    const changesetGroups = await this.createChangesetGroups(iVault.id);
    await this.uploadChangesets(iVault.id, briefcases[0].id, changesetGroups);
    await this.completeChangesetGroups(iVault.id, changesetGroups);
    const changesetExtendedData = await this.createChangesetExtendedData(
      iVault.id
    );
    const namedVersions = await this.createNamedVersionsOnReusableIVault(
      iVault.id
    );
    const lock = await this.createLockOnReusableIVault(
      iVault.id,
      briefcases[0].id
    );
    const initializedIVault = await this._iVaultsClient.iVaults.update({
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      iVaultId: iVault.id,
      iVaultProperties: {
        description: this._reusableIVaultCreationCompletedDescription,
      },
    });

    return {
      ...iVault,
      description: initializedIVault.description!,
      briefcases,
      namedVersions,
      lock,
      changesetGroups,
      changesetExtendedData,
    };
  }

  public isReusableIVaultInitialized(iVault: IVault): boolean {
    return (
      iVault.description === this._reusableIVaultCreationCompletedDescription
    );
  }

  private async createNamedVersionsOnReusableIVault(
    iVaultId: string
  ): Promise<NamedVersionMetadata[]> {
    const namedVersions: NamedVersionMetadata[] = [];
    const checkpointGenerationPromises: Promise<void>[] = [];
    for (const namedVersionMetadata of TestIVaultCreator.namedVersions) {
      const namedVersion: NamedVersionMetadata =
        await this.createNamedVersionOnChangesetIndex(
          iVaultId,
          namedVersionMetadata.name,
          namedVersionMetadata.changesetIndex
        );
      namedVersions.push(namedVersion);
      checkpointGenerationPromises.push(
        this.waitForNamedVersionCheckpointGenerated(iVaultId, namedVersion.id)
      );
    }

    await Promise.all(checkpointGenerationPromises);
    return namedVersions;
  }

  private async createLockOnReusableIVault(
    iVaultId: string,
    briefcaseId: number
  ): Promise<Lock> {
    const testIVaultLocks: LockedObjects[] = [
      {
        lockLevel: LockLevel.Exclusive,
        objectIds: ["0x1", "0xa"],
      },
      {
        lockLevel: LockLevel.Shared,
        objectIds: ["0x2", "0xb"],
      },
    ];

    const acquiredLocks: Lock = await this._iVaultsClient.locks.update({
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      iVaultId,
      briefcaseId,
      lockedObjects: testIVaultLocks,
    });

    return acquiredLocks;
  }

  private async uploadChangesets(
    iVaultId: string,
    briefcaseId: number,
    changesetGroups: ChangesetGroupMetadata[]
  ): Promise<void> {
    for (let i = 0; i < this._testIVaultFileProvider.changesets.length; i++) {
      const changeset = this._testIVaultFileProvider.changesets[i];
      const parentId =
        i === 0 ? undefined : this._testIVaultFileProvider.changesets[i - 1].id;
      const changesetGroupId = changesetGroups.find((csGroup) =>
        csGroup.changesetIndexes.includes(changeset.index)
      )?.id;

      await this._iVaultsClient.changesets.create({
        authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
        iVaultId,
        changesetProperties: {
          briefcaseId,
          description: changeset.description,
          containingChanges: changeset.containingChanges,
          id: changeset.id,
          parentId,
          synchronizationInfo: changeset.synchronizationInfo,
          filePath: changeset.filePath,
          groupId: changesetGroupId,
        },
      });
    }
  }

  private async createChangesetExtendedData(
    iVaultId: string
  ): Promise<ChangesetExtendedDataMetadata[]> {
    const changesetExtendedDataList: ChangesetExtendedDataMetadata[] = [];
    for (const changesetExtendedDataMetadata of TestIVaultCreator.changesetExtendedData) {
      const changesetMetadata =
        this._testIVaultFileProvider.changesets[
          changesetExtendedDataMetadata.changesetIndex - 1
        ];
      const changesetExtendedData =
        await this._iVaultsClient.changesetExtendedData.create({
          authorization:
            this._testAuthorizationProvider.getAdmin1Authorization(),
          iVaultId,
          changesetExtendedDataProperties: {
            data: changesetExtendedDataMetadata.data,
          },
          changesetIndex: changesetExtendedDataMetadata.changesetIndex,
        });

      changesetExtendedDataList.push({
        changesetId: changesetMetadata.id,
        changesetIndex: changesetExtendedDataMetadata.changesetIndex,
        data: changesetExtendedData.data,
      });
    }

    return changesetExtendedDataList;
  }

  private async createChangesetGroups(
    iVaultId: string
  ): Promise<ChangesetGroupMetadata[]> {
    const changesetGroups: ChangesetGroupMetadata[] = [];

    for (const changesetGroupMetadata of TestIVaultCreator.changesetGroups) {
      const changesetGroup = await this._iVaultsClient.changesetGroups.create({
        authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
        iVaultId,
        changesetGroupProperties: changesetGroupMetadata,
      });

      changesetGroups.push({
        id: changesetGroup.id,
        description: changesetGroup.description,
        changesetIndexes: changesetGroupMetadata.changesetIndexes,
      });
    }

    return changesetGroups;
  }

  private async completeChangesetGroups(
    iVaultId: string,
    changesetGroups: ChangesetGroupMetadata[]
  ): Promise<void> {
    for (const changesetGroup of changesetGroups) {
      const updateChangesetGroupParams: UpdateChangesetGroupParams = {
        authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
        iVaultId,
        changesetGroupId: changesetGroup.id,
        changesetGroupProperties: {
          state: ChangesetGroupState.Completed,
        },
      };

      await this._iVaultsClient.changesetGroups.update(
        updateChangesetGroupParams
      );
    }
  }

  private async acquireBriefcases(
    iVaultId: string,
    briefcaseCount: number
  ): Promise<BriefcaseMetadata[]> {
    const briefcases: BriefcaseMetadata[] = [];
    for (let i = 1; i <= briefcaseCount; i++) {
      const briefcase = await this.acquireBriefcase(iVaultId);
      briefcases.push(briefcase);
    }
    return briefcases;
  }

  private async acquireBriefcase(iVaultId: string): Promise<BriefcaseMetadata> {
    const briefcase = await this._iVaultsClient.briefcases.acquire({
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      iVaultId,
      briefcaseProperties: {
        deviceName: this._briefcaseDeviceName,
      },
    });

    return {
      id: briefcase.briefcaseId,
      deviceName: briefcase.deviceName!,
      ownerId: briefcase.ownerId,
    };
  }

  private async createNamedVersionOnChangesetIndex(
    iVaultId: string,
    namedVersionName: string,
    changesetIndex: number
  ): Promise<NamedVersionMetadata> {
    // We use this specific user that is able to generate checkpoints
    // for named version creation to mimic production environment.
    const authorizationForFullyFeaturedUser =
      this._testAuthorizationProvider.getFullyFeaturedAdmin2Authorization();

    const changesetMetadata =
      this._testIVaultFileProvider.changesets[changesetIndex - 1];
    const namedVersion = await this._iVaultsClient.namedVersions.create({
      authorization: authorizationForFullyFeaturedUser,
      iVaultId,
      namedVersionProperties: {
        name: namedVersionName,
        changesetId: changesetMetadata.id,
      },
    });
    return {
      id: namedVersion.id,
      name: namedVersion.name,
      changesetId: changesetMetadata.id,
      changesetIndex: changesetMetadata.index,
    };
  }

  private async waitForNamedVersionCheckpointGenerated(
    iVaultId: string,
    namedVersionId: string
  ): Promise<void> {
    await UtilityFunctions.sleep(3000);

    const getSingleCheckpointParams: GetSingleCheckpointParams = {
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      iVaultId,
      namedVersionId,
    };
    const sleepPeriodInMs = 1000;
    const timeOutInMs = 5 * 60 * 1000;
    for (let retries = timeOutInMs / sleepPeriodInMs; retries > 0; --retries) {
      const checkpoint = await this._iVaultsClient.checkpoints.getSingle(
        getSingleCheckpointParams
      );

      if (
        checkpoint.state === CheckpointState.Successful &&
        checkpoint._links?.download !== undefined &&
        checkpoint.directoryAccessInfo !== null
      )
        return;

      if (
        checkpoint.state !== CheckpointState.Scheduled &&
        checkpoint.state !== CheckpointState.Successful
      )
        throw new TestSetupError(
          `Checkpoint generation failed with state: ${checkpoint.state}.`
        );

      await UtilityFunctions.sleep(sleepPeriodInMs);
    }

    throw new TestSetupError(
      "Timed out while waiting for checkpoint generation to complete."
    );
  }
}
