/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/* eslint-disable @typescript-eslint/no-deprecated */
// This file is a minimal copy from szewtwinjs-core. Deprecation warnings are expected
// and will be resolved upstream.

import * as chai from "chai";
import { assert, expect } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import { Base64 } from "js-base64";
import * as path from "path";
import {
  AccessToken,
  BeEvent,
  DbResult,
  Guid,
  GuidString,
  Id64,
  Id64String,
  IVaultStatus,
  omit,
  OpenMode,
} from "@szewtwin/core-szewec";
import {
  AuxCoordSystem2dProps,
  Base64EncodedString,
  ChangesetIdWithIndex,
  Code,
  CodeProps,
  CodeScopeSpec,
  CodeSpec,
  ColorDef,
  ElementAspectProps,
  ElementProps,
  Environment,
  ExternalSourceAspectProps,
  ExternalSourceProps,
  FontType,
  GeometricElement2dProps,
  GeometryParams,
  GeometryPartProps,
  GeometryStreamBuilder,
  GeometryStreamProps,
  ImageSourceFormat,
  IVault,
  IVaultError,
  IVaultReadRpcInterface,
  IVaultVersion,
  IVaultVersionProps,
  InformationPartitionElementProps,
  LocalFileName,
  ModelProps,
  PhysicalElementProps,
  PlanProjectionSettings,
  RelatedElement,
  RepositoryLinkProps,
  RequestNewBriefcaseProps,
  RpcConfiguration,
  RpcManager,
  RpcPendingResponse,
  SkyBoxImageType,
  SubCategoryAppearance,
  SubCategoryOverride,
  SyncMode,
} from "@szewtwin/core-common";
import {
  Box,
  Cone,
  LineString3d,
  Point2d,
  Point3d,
  Range2d,
  Range3d,
  StandardViewIndex,
  Vector3d,
  YawPitchRollAngles,
} from "@szewtwin/core-geometry";
import {
  AuxCoordSystem2d,
  BackendHubAccess,
  BriefcaseDb,
  BriefcaseManager,
  CategorySelector,
  CheckpointManager,
  CheckpointProps,
  ClassRegistry,
  DefinitionModel,
  DefinitionPartition,
  DisplayStyle2d,
  DisplayStyle3d,
  DocumentListModel,
  DownloadRequest,
  Drawing,
  DrawingCategory,
  DrawingGraphic,
  DrawingGraphicRepresentsElement,
  DrawingModel,
  DrawingViewDefinition,
  DMSqlStatement,
  EditTxn,
  // eslint-disable-next-line @typescript-eslint/no-redeclare
  Element,
  ElementAspect,
  ElementDrivesElement,
  ElementOwnsChildElements,
  ElementOwnsMultiAspects,
  ElementOwnsUniqueAspect,
  ElementUniqueAspect,
  ExternalSource,
  ExternalSourceAspect,
  ExternalSourceIsInRepository,
  FunctionalModel,
  FunctionalSchema,
  GeometryPart,
  GroupModel,
  IVaultDb,
  IVaultHost,
  IVaultJsFs,
  InformationPartitionElement,
  InformationRecordModel,
  LinkElement,
  Model,
  ModelSelector,
  OrthographicViewDefinition,
  PhysicalElement,
  PhysicalModel,
  PhysicalObject,
  PhysicalPartition,
  Relationship,
  RelationshipProps,
  RenderMaterialElement,
  RepositoryLink,
  RequestNewBriefcaseArg,
  Schema,
  Schemas,
  SnapshotDb,
  SpatialCategory,
  SpatialLocationModel,
  SubCategory,
  Subject,
  SubjectOwnsPartitionElements,
  Texture,
  V2CheckpointManager,
  ViewDefinition,
} from "@szewtwin/core-backend";
import { HubMock } from "@szewtwin/core-backend/lib/cjs/internal/HubMock";
import { _hubAccess } from "@szewtwin/core-backend/lib/cjs/internal/Symbols";
import {
  DownloadAndOpenArgs,
  RpcBriefcaseUtility,
} from "@szewtwin/core-backend/lib/cjs/rpc-impl/RpcBriefcaseUtility";
import { KnownTestLocations } from "./KnownTestLocations";
import { TargetScopeProvenanceJsonProps } from "../../IVaultTransformer";
import { TimelineIVaultState } from "./TimelineTestUtil";

chai.use(chaiAsPromised);

/* eslint-disable @typescript-eslint/explicit-member-accessibility */

RpcConfiguration.developmentMode = true;

// Initialize the RPC interface classes used by tests
RpcManager.initializeInterface(IVaultReadRpcInterface);

export interface IVaultTestUtilsOpenOptions {
  copyFilename?: string;
  enableTransactions?: boolean;
  openMode?: OpenMode;
}

export class TestBim extends Schema {
  public static override get schemaName(): string {
    return "TestBim";
  }
}
export interface TestRelationshipProps extends RelationshipProps {
  property1: string;
}
export class TestElementDrivesElement extends ElementDrivesElement {
  public static override get className(): string {
    return "TestElementDrivesElement";
  }
  public property1!: string;
  public static rootChanged = new BeEvent<
    (props: RelationshipProps, ivault: IVaultDb) => void
  >();
  public static deletedDependency = new BeEvent<
    (props: RelationshipProps, ivault: IVaultDb) => void
  >();
  public static override onRootChanged(
    props: RelationshipProps,
    ivault: IVaultDb
  ): void {
    this.rootChanged.raiseEvent(props, ivault);
  }
  public static override onDeletedDependency(
    props: RelationshipProps,
    ivault: IVaultDb
  ): void {
    this.deletedDependency.raiseEvent(props, ivault);
  }
}

export interface ExpectedTargetScopeProvenanceProps {
  syncVersionIndex: string;
  reverseSyncVersionIndex: string;
  pendingSyncChangesetIndices: number[];
  pendingReverseSyncChangesetIndices: number[];
  syncVersionId?: string;
  reverseSyncVersionId?: string;
}
export interface TestPhysicalObjectProps extends PhysicalElementProps {
  intProperty: number;
}
export class TestPhysicalObject extends PhysicalElement {
  public static override get className(): string {
    return "TestPhysicalObject";
  }
  public intProperty!: number;
  public static beforeOutputsHandled = new BeEvent<
    (id: Id64String, ivault: IVaultDb) => void
  >();
  public static allInputsHandled = new BeEvent<
    (id: Id64String, ivault: IVaultDb) => void
  >();
  public static override onBeforeOutputsHandled(
    id: Id64String,
    ivault: IVaultDb
  ): void {
    this.beforeOutputsHandled.raiseEvent(id, ivault);
  }
  public static override onAllInputsHandled(
    id: Id64String,
    ivault: IVaultDb
  ): void {
    this.allInputsHandled.raiseEvent(id, ivault);
  }
}

/** the types of users available for tests */
export enum TestUserType {
  Regular,
  Manager,
  Super,
  SuperManager,
}

/** A wrapper around the BackendHubAccess API through IVaultHost[_hubAccess].
 *
 * All methods in this class should be usable with any BackendHubAccess implementation (i.e. HubMock and IVaultHubBackend).
 */
export class HubWrappers {
  protected static get hubMock() {
    return HubMock;
  }

  public static async getAccessToken(user: TestUserType) {
    return TestUserType[user];
  }

  /** Create an iVault with the name provided if it does not already exist. If it does exist, the iVaultId is returned. */
  public static async createIVault(
    accessToken: AccessToken,
    szewTwinId: GuidString,
    iVaultName: string
  ): Promise<GuidString> {
    assert.isTrue(
      this.hubMock.isValid,
      "Must use HubMock for tests that modify iVaults"
    );
    let iVaultId = await IVaultHost[_hubAccess].queryIVaultByName({
      accessToken,
      szewTwinId,
      iVaultName,
    });
    if (!iVaultId)
      iVaultId = await IVaultHost[_hubAccess].createNewIVault({
        accessToken,
        szewTwinId,
        iVaultName,
        description: "Description for iVault",
      });
    return iVaultId;
  }

  /** Deletes and re-creates an iVault with the provided name in the szewTwin.
   * @returns the iVaultId of the newly created iVault.
   */
  public static async recreateIVault(
    ...[arg]: Parameters<BackendHubAccess["createNewIVault"]>
  ): Promise<GuidString> {
    assert.isTrue(
      this.hubMock.isValid,
      "Must use HubMock for tests that modify iVaults"
    );
    const deleteIVault = await IVaultHost[_hubAccess].queryIVaultByName(arg);
    if (undefined !== deleteIVault)
      await IVaultHost[_hubAccess].deleteIVault({
        accessToken: arg.accessToken,
        szewTwinId: arg.szewTwinId,
        iVaultId: deleteIVault,
      });

    // Create a new iVault
    return IVaultHost[_hubAccess].createNewIVault({
      description: `Description for ${arg.iVaultName}`,
      ...arg,
    });
  }

  /** Delete an IVault from the hub */
  public static async deleteIVault(
    accessToken: AccessToken,
    szewTwinId: string,
    iVaultName: string
  ): Promise<void> {
    const iVaultId = await IVaultHost[_hubAccess].queryIVaultByName({
      accessToken,
      szewTwinId,
      iVaultName,
    });
    if (undefined === iVaultId) return;

    await IVaultHost[_hubAccess].deleteIVault({
      accessToken,
      szewTwinId,
      iVaultId,
    });
  }

  /** Push an iVault to the Hub */
  public static async pushIVault(
    accessToken: AccessToken,
    szewTwinId: string,
    pathname: string,
    iVaultName?: string,
    overwrite?: boolean
  ): Promise<GuidString> {
    // Delete any existing iVaults with the same name as the required iVault
    const locIVaultName = iVaultName || path.basename(pathname, ".bim");
    const iVaultId = await IVaultHost[_hubAccess].queryIVaultByName({
      accessToken,
      szewTwinId,
      iVaultName: locIVaultName,
    });
    if (iVaultId) {
      if (!overwrite) return iVaultId;
      await IVaultHost[_hubAccess].deleteIVault({
        accessToken,
        szewTwinId,
        iVaultId,
      });
    }

    // Upload a new iVault
    return IVaultHost[_hubAccess].createNewIVault({
      accessToken,
      szewTwinId,
      iVaultName: locIVaultName,
      version0: pathname,
    });
  }

  /** Helper to open a briefcase db directly with the BriefcaseManager API */
  public static async downloadAndOpenBriefcase(
    args: RequestNewBriefcaseArg
  ): Promise<BriefcaseDb> {
    const props = await BriefcaseManager.downloadBriefcase(args);
    return BriefcaseDb.open({ fileName: props.fileName });
  }

  /** Opens the specific iVault as a Briefcase through the same workflow the IVaultReadRpc.getConnectionProps method will use. Replicates the way a frontend would open the iVault. */
  public static async openBriefcaseUsingRpc(
    args: RequestNewBriefcaseProps & {
      accessToken: AccessToken;
      deleteFirst?: boolean;
    }
  ): Promise<BriefcaseDb> {
    if (undefined === args.asOf) args.asOf = IVaultVersion.latest().toJSON();

    const openArgs: DownloadAndOpenArgs = {
      tokenProps: {
        szewTwinId: args.szewTwinId,
        iVaultId: args.iVaultId,
        changeset: await IVaultHost[_hubAccess].getChangesetFromVersion({
          accessToken: args.accessToken,
          version: IVaultVersion.fromJSON(args.asOf),
          iVaultId: args.iVaultId,
        }),
      },
      activity: {
        accessToken: args.accessToken,
        activityId: "",
        applicationId: "",
        applicationVersion: "",
        sessionId: "",
      },
      syncMode:
        args.briefcaseId === 0 ? SyncMode.PullOnly : SyncMode.PullAndPush,
      forceDownload: args.deleteFirst,
    };

    assert.isTrue(
      this.hubMock.isValid || openArgs.syncMode === SyncMode.PullOnly,
      "use HubMock to acquire briefcases"
    );
    while (true) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        return (await RpcBriefcaseUtility.open(openArgs)) as BriefcaseDb;
      } catch (error) {
        if (!(error instanceof RpcPendingResponse)) throw error;
      }
    }
  }

  /** Downloads and opens a v1 checkpoint */
  public static async downloadAndOpenCheckpoint(args: {
    accessToken: AccessToken;
    szewTwinId: GuidString;
    iVaultId: GuidString;
    asOf?: IVaultVersionProps;
  }): Promise<SnapshotDb> {
    if (undefined === args.asOf) args.asOf = IVaultVersion.latest().toJSON();

    const checkpoint: CheckpointProps = {
      szewTwinId: args.szewTwinId,
      iVaultId: args.iVaultId,
      accessToken: args.accessToken,
      changeset: await IVaultHost[_hubAccess].getChangesetFromVersion({
        accessToken: args.accessToken,
        version: IVaultVersion.fromJSON(args.asOf),
        iVaultId: args.iVaultId,
      }),
    };

    const folder = path.join(
      V2CheckpointManager.getFolder(),
      checkpoint.iVaultId
    );
    const filename = path.join(
      folder,
      `${checkpoint.changeset.id === "" ? "first" : checkpoint.changeset.id}.bim`
    );
    const request: DownloadRequest = { checkpoint, localFile: filename };
    let db = SnapshotDb.tryFindByKey(
      CheckpointManager.getKey(request.checkpoint)
    );
    if (undefined !== db) return db;
    db = IVaultTestUtils.tryOpenLocalFile(request);
    if (db) return db;
    await V2CheckpointManager.downloadCheckpoint(request);
    await CheckpointManager.updateToRequestedVersion(request);
    return IVaultTestUtils.openCheckpoint(
      request.localFile,
      request.checkpoint
    );
  }

  /** Opens the specific Checkpoint iVault, `SyncMode.FixedVersion`, through the same workflow the IVaultReadRpc.getConnectionProps method will use. Replicates the way a frontend would open the iVault. */
  public static async openCheckpointUsingRpc(
    args: RequestNewBriefcaseProps & {
      accessToken: AccessToken;
      deleteFirst?: boolean;
    }
  ): Promise<IVaultDb> {
    if (undefined === args.asOf) args.asOf = IVaultVersion.latest().toJSON();

    const changeset = await IVaultHost[_hubAccess].getChangesetFromVersion({
      accessToken: args.accessToken,
      version: IVaultVersion.fromJSON(args.asOf),
      iVaultId: args.iVaultId,
    });
    const openArgs = {
      tokenProps: {
        szewTwinId: args.szewTwinId,
        iVaultId: args.iVaultId,
        changeset,
      },
      activity: {
        accessToken: args.accessToken,
        activityId: "",
        applicationId: "",
        applicationVersion: "",
        sessionId: "",
      },
      syncMode: SyncMode.FixedVersion as const,
      forceDownload: args.deleteFirst,
    };

    while (true) {
      try {
        return await RpcBriefcaseUtility.open(openArgs);
      } catch (error) {
        if (!(error instanceof RpcPendingResponse)) throw error;
      }
    }
  }

  /**
   * Purges all acquired briefcases for the specified iVault (and user), if the specified threshold of acquired briefcases is exceeded
   */
  public static async purgeAcquiredBriefcasesById(
    accessToken: AccessToken,
    iVaultId: GuidString,
    onReachThreshold: () => void = () => {},
    acquireThreshold: number = 16
  ): Promise<void> {
    const briefcases = await IVaultHost[_hubAccess].getMyBriefcaseIds({
      accessToken,
      iVaultId,
    });
    if (briefcases.length > acquireThreshold) {
      if (undefined !== onReachThreshold) onReachThreshold();

      const promises: Promise<void>[] = [];
      briefcases.forEach((briefcaseId) => {
        promises.push(
          IVaultHost[_hubAccess].releaseBriefcase({
            accessToken,
            iVaultId,
            briefcaseId,
          })
        );
      });
      await Promise.all(promises);
    }
  }

  public static async closeAndDeleteBriefcaseDb(
    accessToken: AccessToken,
    briefcaseDb: IVaultDb
  ) {
    const fileName = briefcaseDb.pathName;
    const iVaultId = briefcaseDb.iVaultId;
    briefcaseDb.close();

    await BriefcaseManager.deleteBriefcaseFiles(fileName, accessToken);

    // try to clean up empty briefcase directories, and empty iVault directories.
    if (0 === BriefcaseManager.getCachedBriefcases(iVaultId).length) {
      IVaultJsFs.removeSync(BriefcaseManager.getBriefcaseBasePath(iVaultId));
      const ivaultPath = BriefcaseManager.getIVaultPath(iVaultId);
      if (0 === IVaultJsFs.readdirSync(ivaultPath).length) {
        IVaultJsFs.removeSync(ivaultPath);
      }
    }
  }
}

export class IVaultTestUtils {
  protected static get knownTestLocations(): {
    outputDir: string;
    assetsDir: string;
  } {
    return KnownTestLocations;
  }

  /** Generate a name for an iVault that's unique using the baseName provided and appending a new GUID.  */
  public static generateUniqueName(baseName: string) {
    return `${baseName} - ${Guid.createValue()}`;
  }

  public static openCheckpoint(
    fileName: LocalFileName,
    checkpoint: CheckpointProps
  ) {
    const snapshot = SnapshotDb.openFile(fileName, {
      key: CheckpointManager.getKey(checkpoint),
    });
    (snapshot as any)._szewTwinId = checkpoint.szewTwinId;
    return snapshot;
  }

  /** try to open an existing local file to satisfy a download request */
  public static tryOpenLocalFile(
    request: DownloadRequest
  ): SnapshotDb | undefined {
    const checkpoint = request.checkpoint;
    if (CheckpointManager.verifyCheckpoint(checkpoint, request.localFile))
      return this.openCheckpoint(request.localFile, checkpoint);

    return undefined;
  }

  /** Prepare for an output file by:
   * - Resolving the output file name under the known test output directory
   * - Making directories as necessary
   * - Removing a previous copy of the output file
   * @param subDirName Sub-directory under known test output directory. Should match the name of the test file minus the .test.ts file extension.
   * @param fileName Name of output fille
   */
  public static prepareOutputFile(
    subDirName: string,
    fileName: string
  ): LocalFileName {
    if (!IVaultJsFs.existsSync(this.knownTestLocations.outputDir))
      IVaultJsFs.mkdirSync(this.knownTestLocations.outputDir);

    const outputDir = path.join(this.knownTestLocations.outputDir, subDirName);
    if (!IVaultJsFs.existsSync(outputDir)) IVaultJsFs.mkdirSync(outputDir);

    const outputFile = path.join(outputDir, fileName);
    if (IVaultJsFs.existsSync(outputFile)) IVaultJsFs.unlinkSync(outputFile);

    return outputFile;
  }

  /** Resolve an asset file path from the asset name by looking in the known assets directory */
  public static resolveAssetFile(assetName: string): LocalFileName {
    const assetFile = path.join(this.knownTestLocations.assetsDir, assetName);
    assert.isTrue(IVaultJsFs.existsSync(assetFile));
    return assetFile;
  }

  /** Orchestrates the steps necessary to create a new snapshot iVault from a seed file. */
  public static createSnapshotFromSeed(
    testFileName: string,
    seedFileName: LocalFileName
  ): SnapshotDb {
    const seedDb: SnapshotDb = SnapshotDb.openFile(seedFileName);
    const testDb: SnapshotDb = SnapshotDb.createFrom(seedDb, testFileName);
    seedDb.close();
    return testDb;
  }

  public static getUniqueModelCode(
    testDb: IVaultDb,
    newModelCodeBase: string
  ): Code {
    let newModelCode: string = newModelCodeBase;
    let iter: number = 0;
    while (true) {
      const modelCode = InformationPartitionElement.createCode(
        testDb,
        IVault.rootSubjectId,
        newModelCode
      );
      if (testDb.elements.queryElementIdByCode(modelCode) === undefined)
        return modelCode;

      newModelCode = newModelCodeBase + iter;
      ++iter;
    }
  }

  public static generateChangeSetId(): ChangesetIdWithIndex {
    let result = "";
    for (let i = 0; i < 20; ++i) {
      result += Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, "0");
    }
    return { id: result };
  }

  /** Create and insert a PhysicalPartition element (in the repositoryModel) and an associated PhysicalModel. */
  public static createAndInsertPhysicalPartition(
    testDb: IVaultDb,
    newModelCode: CodeProps,
    parentId?: Id64String
  ): Id64String {
    const model = parentId
      ? testDb.elements.getElement(parentId).model
      : IVault.repositoryModelId;
    const parent = new SubjectOwnsPartitionElements(
      parentId || IVault.rootSubjectId
    );

    const modeledElementProps: ElementProps = {
      classFullName: PhysicalPartition.classFullName,
      parent,
      model,
      code: newModelCode,
    };
    const modeledElement: Element =
      testDb.elements.createElement(modeledElementProps);
    return testDb.elements.insertElement(modeledElement.toJSON());
  }

  /** Create and insert a PhysicalPartition element (in the repositoryModel) and an associated PhysicalModel. */
  public static async createAndInsertPhysicalPartitionAsync(
    testDb: IVaultDb,
    newModelCode: CodeProps,
    parentId?: Id64String
  ): Promise<Id64String> {
    const model = parentId
      ? testDb.elements.getElement(parentId).model
      : IVault.repositoryModelId;
    const parent = new SubjectOwnsPartitionElements(
      parentId || IVault.rootSubjectId
    );

    const modeledElementProps: ElementProps = {
      classFullName: PhysicalPartition.classFullName,
      parent,
      model,
      code: newModelCode,
    };
    const modeledElement = testDb.elements.createElement(modeledElementProps);
    await testDb.locks.acquireLocks({ shared: model });
    return testDb.elements.insertElement(modeledElement.toJSON());
  }

  /** Create and insert a PhysicalPartition element (in the repositoryModel) and an associated PhysicalModel. */
  public static createAndInsertPhysicalModel(
    testDb: IVaultDb,
    modeledElementRef: RelatedElement,
    privateModel: boolean = false
  ): Id64String {
    const newModel = testDb.models.createModel({
      modeledElement: modeledElementRef,
      classFullName: PhysicalModel.classFullName,
      isPrivate: privateModel,
    });
    const newModelId = (newModel.id = testDb.models.insertModel(
      newModel.toJSON()
    ));
    assert.isTrue(Id64.isValidId64(newModelId));
    assert.isTrue(Id64.isValidId64(newModel.id));
    assert.deepEqual(newModelId, newModel.id);
    return newModelId;
  }

  /** Create and insert a PhysicalPartition element (in the repositoryModel) and an associated PhysicalModel. */
  public static async createAndInsertPhysicalModelAsync(
    testDb: IVaultDb,
    modeledElementRef: RelatedElement,
    privateModel: boolean = false
  ): Promise<Id64String> {
    const newModel = testDb.models.createModel({
      modeledElement: modeledElementRef,
      classFullName: PhysicalModel.classFullName,
      isPrivate: privateModel,
    });
    const newModelId = newModel.insert();
    assert.isTrue(Id64.isValidId64(newModelId));
    assert.isTrue(Id64.isValidId64(newModel.id));
    assert.deepEqual(newModelId, newModel.id);
    return newModelId;
  }

  /**
   * Create and insert a PhysicalPartition element (in the repositoryModel) and an associated PhysicalModel.
   * @return [modeledElementId, modelId]
   */
  public static createAndInsertPhysicalPartitionAndModel(
    testIvault: IVaultDb,
    newModelCode: CodeProps,
    privateModel: boolean = false,
    parent?: Id64String
  ): Id64String[] {
    const eid = IVaultTestUtils.createAndInsertPhysicalPartition(
      testIvault,
      newModelCode,
      parent
    );
    const modeledElementRef = new RelatedElement({ id: eid });
    const mid = IVaultTestUtils.createAndInsertPhysicalModel(
      testIvault,
      modeledElementRef,
      privateModel
    );
    return [eid, mid];
  }

  /**
   * Create and insert a PhysicalPartition element (in the repositoryModel) and an associated PhysicalModel.
   * @return [modeledElementId, modelId]
   */
  public static async createAndInsertPhysicalPartitionAndModelAsync(
    testIvault: IVaultDb,
    newModelCode: CodeProps,
    privateModel: boolean = false,
    parentId?: Id64String
  ): Promise<Id64String[]> {
    const eid = await IVaultTestUtils.createAndInsertPhysicalPartitionAsync(
      testIvault,
      newModelCode,
      parentId
    );
    const modeledElementRef = new RelatedElement({ id: eid });
    const mid = await IVaultTestUtils.createAndInsertPhysicalModelAsync(
      testIvault,
      modeledElementRef,
      privateModel
    );
    return [eid, mid];
  }

  /** Create and insert a Drawing Partition element (in the repositoryModel). */
  public static createAndInsertDrawingPartition(
    testDb: IVaultDb,
    newModelCode: CodeProps,
    parentId?: Id64String
  ): Id64String {
    const model = parentId
      ? testDb.elements.getElement(parentId).model
      : IVault.repositoryModelId;
    const parent = new SubjectOwnsPartitionElements(
      parentId || IVault.rootSubjectId
    );

    const modeledElementProps: ElementProps = {
      classFullName: Drawing.classFullName,
      parent,
      model,
      code: newModelCode,
    };
    const modeledElement: Element =
      testDb.elements.createElement(modeledElementProps);
    return testDb.elements.insertElement(modeledElement.toJSON());
  }

  /** Create and insert a DrawingModel associated with Drawing Partition. */
  public static createAndInsertDrawingModel(
    testDb: IVaultDb,
    modeledElementRef: RelatedElement,
    privateModel: boolean = false
  ): Id64String {
    const newModel = testDb.models.createModel({
      modeledElement: modeledElementRef,
      classFullName: DrawingModel.classFullName,
      isPrivate: privateModel,
    });
    const newModelId = newModel.insert();
    assert.isTrue(Id64.isValidId64(newModelId));
    assert.isTrue(Id64.isValidId64(newModel.id));
    assert.deepEqual(newModelId, newModel.id);
    return newModelId;
  }

  /**
   * Create and insert a Drawing Partition element (in the repositoryModel) and an associated DrawingModel.
   * @return [modeledElementId, modelId]
   */
  public static createAndInsertDrawingPartitionAndModel(
    testIvault: IVaultDb,
    newModelCode: CodeProps,
    privateModel: boolean = false,
    parent?: Id64String
  ): Id64String[] {
    const eid = IVaultTestUtils.createAndInsertDrawingPartition(
      testIvault,
      newModelCode,
      parent
    );
    const modeledElementRef = new RelatedElement({ id: eid });
    const mid = IVaultTestUtils.createAndInsertDrawingModel(
      testIvault,
      modeledElementRef,
      privateModel
    );
    return [eid, mid];
  }

  public static getUniqueSpatialCategoryCode(
    scopeModel: Model,
    newCodeBaseValue: string
  ): Code {
    let newCodeValue: string = newCodeBaseValue;
    let iter: number = 0;
    while (true) {
      if (
        SpatialCategory.queryCategoryIdByName(
          scopeModel.iVault,
          scopeModel.id,
          newCodeValue
        ) === undefined
      )
        return SpatialCategory.createCode(
          scopeModel.iVault,
          scopeModel.id,
          newCodeValue
        );

      newCodeValue = newCodeBaseValue + iter;
      ++iter;
    }
  }

  // Create a PhysicalObject. (Does not insert it.)
  public static createPhysicalObject(
    testIvault: IVaultDb,
    modelId: Id64String,
    categoryId: Id64String,
    elemCode?: Code
  ): Element {
    const elementProps: PhysicalElementProps = {
      classFullName: "Generic:PhysicalObject",
      model: modelId,
      category: categoryId,
      code: elemCode ? elemCode : Code.createEmpty(),
    };
    return testIvault.elements.createElement(elementProps);
  }

  public static registerTestBimSchema() {
    if (undefined === Schemas.getRegisteredSchema(TestBim.schemaName)) {
      Schemas.registerSchema(TestBim);
      ClassRegistry.register(TestPhysicalObject, TestBim);
      ClassRegistry.register(TestElementDrivesElement, TestBim);
    }
  }

  public static executeQuery(
    db: IVaultDb,
    dmsql: string,
    bindings?: any[] | object
  ): any[] {
    // eslint-disable-next-line @szewtwin/no-internal, @typescript-eslint/no-deprecated
    return db.withPreparedStatement(dmsql, (stmt) => {
      if (bindings) stmt.bindValues(bindings);

      const rows: any[] = [];
      while (DbResult.BE_SQLITE_ROW === stmt.step()) {
        rows.push(stmt.getRow());
        if (rows.length > IVaultDb.maxLimit)
          throw new IVaultError(
            IVaultStatus.BadRequest,
            "Max LIMIT exceeded in SELECT statement"
          );
      }

      return rows;
    });
  }

  public static createJobSubjectElement(
    iVault: IVaultDb,
    name: string
  ): Subject {
    const subj = Subject.create(
      iVault,
      iVault.elements.getRootSubject().id,
      name
    );
    subj.setJsonProperty("Subject", { Job: name }); // eslint-disable-line @typescript-eslint/naming-convention
    return subj;
  }

  public static querySubjectId(
    iVaultDb: IVaultDb,
    subjectCodeValue: string
  ): Id64String {
    const subjectId = iVaultDb.elements.queryElementIdByCode(
      Subject.createCode(iVaultDb, IVault.rootSubjectId, subjectCodeValue)
    )!;
    assert.isTrue(Id64.isValidId64(subjectId));
    return subjectId;
  }

  public static queryDefinitionPartitionId(
    iVaultDb: IVaultDb,
    parentSubjectId: Id64String,
    suffix: string
  ): Id64String {
    const partitionCode: Code = DefinitionPartition.createCode(
      iVaultDb,
      parentSubjectId,
      `Definition${suffix}`
    );
    const partitionId = iVaultDb.elements.queryElementIdByCode(partitionCode)!;
    assert.isTrue(Id64.isValidId64(partitionId));
    return partitionId;
  }

  public static querySpatialCategoryId(
    iVaultDb: IVaultDb,
    modelId: Id64String,
    suffix: string
  ): Id64String {
    const categoryCode: Code = SpatialCategory.createCode(
      iVaultDb,
      modelId,
      `SpatialCategory${suffix}`
    );
    const categoryId = iVaultDb.elements.queryElementIdByCode(categoryCode)!;
    assert.isTrue(Id64.isValidId64(categoryId));
    return categoryId;
  }

  public static queryPhysicalPartitionId(
    iVaultDb: IVaultDb,
    parentSubjectId: Id64String,
    suffix: string
  ): Id64String {
    const partitionCode: Code = PhysicalPartition.createCode(
      iVaultDb,
      parentSubjectId,
      `Physical${suffix}`
    );
    const partitionId = iVaultDb.elements.queryElementIdByCode(partitionCode)!;
    assert.isTrue(Id64.isValidId64(partitionId));
    return partitionId;
  }

  public static queryPhysicalElementId(
    iVaultDb: IVaultDb,
    modelId: Id64String,
    categoryId: Id64String,
    suffix: string
  ): Id64String {
    const elementId = IVaultTestUtils.queryByUserLabel(
      iVaultDb,
      `PhysicalObject${suffix}`
    );
    assert.isTrue(Id64.isValidId64(elementId));
    const element: PhysicalElement =
      iVaultDb.elements.getElement<PhysicalElement>(elementId);
    assert.equal(element.model, modelId);
    assert.equal(element.category, categoryId);
    return elementId;
  }

  public static insertSpatialCategory(
    iVaultDbOrTxn: IVaultDb | EditTxn,
    modelId: Id64String,
    categoryName: string,
    color: ColorDef
  ): Id64String {
    const appearance: SubCategoryAppearance.Props = {
      color: color.toJSON(),
      transp: 0,
      invisible: false,
    };
    return SpatialCategory.insert(
      iVaultDbOrTxn as any,
      modelId,
      categoryName,
      appearance
    );
  }

  public static createBoxes(subCategoryIds: Id64String[]): GeometryStreamProps {
    const length = 1.0;
    const entryOrigin = Point3d.createZero();
    const geometryStreamBuilder = new GeometryStreamBuilder();
    geometryStreamBuilder.appendGeometry(
      Box.createBldBox(
        entryOrigin,
        Vector3d.unitX(),
        Vector3d.unitY(),
        new Point3d(0, 0, length),
        length,
        length,
        length,
        length,
        true
      )!
    );
    for (const subCategoryId of subCategoryIds) {
      entryOrigin.addInPlace({ x: 1, y: 1, z: 1 });
      geometryStreamBuilder.appendSubCategoryChange(subCategoryId);
      geometryStreamBuilder.appendGeometry(
        Box.createBldBox(
          entryOrigin,
          Vector3d.unitX(),
          Vector3d.unitY(),
          new Point3d(0, 0, length),
          length,
          length,
          length,
          length,
          true
        )!
      );
    }
    return geometryStreamBuilder.geometryStream;
  }

  public static createBox(
    size: Point3d,
    categoryId?: Id64String,
    subCategoryId?: Id64String,
    renderMaterialId?: Id64String,
    geometryPartId?: Id64String
  ): GeometryStreamProps {
    const geometryStreamBuilder = new GeometryStreamBuilder();
    if (undefined !== categoryId && undefined !== subCategoryId) {
      geometryStreamBuilder.appendSubCategoryChange(subCategoryId);
      if (undefined !== renderMaterialId) {
        const geometryParams = new GeometryParams(categoryId, subCategoryId);
        geometryParams.materialId = renderMaterialId;
        geometryStreamBuilder.appendGeometryParamsChange(geometryParams);
      }
    }
    geometryStreamBuilder.appendGeometry(
      Box.createBldBox(
        Point3d.createZero(),
        Vector3d.unitX(),
        Vector3d.unitY(),
        new Point3d(0, 0, size.z),
        size.x,
        size.y,
        size.x,
        size.y,
        true
      )!
    );
    if (undefined !== geometryPartId) {
      geometryStreamBuilder.appendGeometryPart3d(geometryPartId);
    }
    return geometryStreamBuilder.geometryStream;
  }

  public static createCylinder(radius: number): GeometryStreamProps {
    const pointA = Point3d.create(0, 0, 0);
    const pointB = Point3d.create(0, 0, 2 * radius);
    const cylinder = Cone.createBaseAndTarget(
      pointA,
      pointB,
      Vector3d.unitX(),
      Vector3d.unitY(),
      radius,
      radius,
      true
    );
    const geometryStreamBuilder = new GeometryStreamBuilder();
    geometryStreamBuilder.appendGeometry(cylinder);
    return geometryStreamBuilder.geometryStream;
  }

  public static createRectangle(size: Point2d): GeometryStreamProps {
    const geometryStreamBuilder = new GeometryStreamBuilder();
    geometryStreamBuilder.appendGeometry(
      LineString3d.createPoints([
        new Point3d(0, 0),
        new Point3d(size.x, 0),
        new Point3d(size.x, size.y),
        new Point3d(0, size.y),
        new Point3d(0, 0),
      ])
    );
    return geometryStreamBuilder.geometryStream;
  }

  public static insertTextureElement(
    iVaultDb: IVaultDb,
    modelId: Id64String,
    textureName: string
  ): Id64String {
    // This is an encoded png containing a 3x3 square with white in top left pixel, blue in middle pixel, and green in bottom right pixel. The rest of the square is red.
    const pngData = [
      137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 3,
      0, 0, 0, 3, 8, 2, 0, 0, 0, 217, 74, 34, 232, 0, 0, 0, 1, 115, 82, 71, 66,
      0, 174, 206, 28, 233, 0, 0, 0, 4, 103, 65, 77, 65, 0, 0, 177, 143, 11,
      252, 97, 5, 0, 0, 0, 9, 112, 72, 89, 115, 0, 0, 14, 195, 0, 0, 14, 195, 1,
      199, 111, 168, 100, 0, 0, 0, 24, 73, 68, 65, 84, 24, 87, 99, 248, 15, 4,
      12, 12, 64, 4, 198, 64, 46, 132, 5, 162, 254, 51, 0, 0, 195, 90, 10, 246,
      127, 175, 154, 145, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
    ];
    const textureData = Base64.btoa(String.fromCharCode(...pngData));
    return Texture.insertTexture(
      iVaultDb,
      modelId,
      textureName,
      ImageSourceFormat.Png,
      textureData,
      `Description for ${textureName}`
    );
  }

  public static queryByUserLabel(
    iVaultDb: IVaultDb,
    userLabel: string
  ): Id64String {
    // eslint-disable-next-line @szewtwin/no-internal, @typescript-eslint/no-deprecated
    return iVaultDb.withPreparedStatement(
      `SELECT DMInstanceId FROM ${Element.classFullName} WHERE UserLabel=:userLabel`,
      // eslint-disable-next-line @szewtwin/no-internal, @typescript-eslint/no-deprecated
      (statement: DMSqlStatement): Id64String => {
        statement.bindString("userLabel", userLabel);
        return DbResult.BE_SQLITE_ROW === statement.step()
          ? statement.getValue(0).getId()
          : Id64.invalid;
      }
    );
  }

  public static findAndAssertTargetScopeProvenance(
    master: TimelineIVaultState,
    branch: TimelineIVaultState,
    expectedProps: ExpectedTargetScopeProvenanceProps
  ) {
    const scopeProvenanceCandidates = branch.db.elements
      .getAspects(IVaultDb.rootSubjectId, ExternalSourceAspect.classFullName)
      .filter(
        (a) => (a as ExternalSourceAspect).identifier === master.db.iVaultId
      );
    expect(scopeProvenanceCandidates).to.have.length(1);
    const targetScopeProvenance =
      scopeProvenanceCandidates[0].toJSON() as ExternalSourceAspectProps;
    const targetScopeJsonProps = JSON.parse(
      targetScopeProvenance.jsonProperties
    ) as TargetScopeProvenanceJsonProps;

    if (expectedProps.syncVersionId === undefined) {
      const regex = new RegExp(`;${expectedProps.syncVersionIndex}$`);
      expect(
        targetScopeProvenance.version,
        `Incorrect sync version index: actual ${targetScopeProvenance.version}`
      ).to.match(regex);
    } else {
      expect(
        targetScopeProvenance.version,
        "Incorrect syncVersionId/syncVersionIndex"
      ).to.equal(
        `${expectedProps.syncVersionId};${expectedProps.syncVersionIndex}`
      );
    }
    if (expectedProps.reverseSyncVersionId === undefined) {
      const regex = new RegExp(`;${expectedProps.reverseSyncVersionIndex}$`);
      expect(
        targetScopeJsonProps.reverseSyncVersion,
        `Incorrect reverseSyncVersion index: actual ${targetScopeJsonProps.reverseSyncVersion}`
      ).to.match(regex);
    } else {
      expect(
        targetScopeJsonProps.reverseSyncVersion,
        "Incorrect reverseSyncVersionId/reverseSyncVersionIndex"
      ).to.equal(
        `${expectedProps.reverseSyncVersionId};${expectedProps.reverseSyncVersionIndex}`
      );
    }

    expect(targetScopeProvenance.identifier).to.equal(master.db.iVaultId);
    expect(
      targetScopeJsonProps.pendingReverseSyncChangesetIndices,
      "Incorrect pending reverseSyncIndices."
    ).to.deep.equal(expectedProps.pendingReverseSyncChangesetIndices);
    expect(
      targetScopeJsonProps.pendingSyncChangesetIndices,
      "Incorrect pending syncIndices."
    ).to.deep.equal(expectedProps.pendingSyncChangesetIndices);

    return {
      targetScopeElementId: targetScopeProvenance.scope.id,
      targetScopeProvenanceProps: targetScopeProvenance,
    };
  }

  public static queryByCodeValue(
    iVaultDb: IVaultDb,
    codeValue: string
  ): Id64String {
    // eslint-disable-next-line @szewtwin/no-internal, @typescript-eslint/no-deprecated
    return iVaultDb.withPreparedStatement(
      `SELECT DMInstanceId FROM ${Element.classFullName} WHERE CodeValue=:codeValue`,
      // eslint-disable-next-line @szewtwin/no-internal, @typescript-eslint/no-deprecated
      (statement: DMSqlStatement): Id64String => {
        statement.bindString("codeValue", codeValue);
        return DbResult.BE_SQLITE_ROW === statement.step()
          ? statement.getValue(0).getId()
          : Id64.invalid;
      }
    );
  }

  public static queryModelIddByModeledElementCodeValue(
    iVaultDb: IVaultDb,
    codeValue: string
  ): Id64String {
    // eslint-disable-next-line @szewtwin/no-internal, @typescript-eslint/no-deprecated
    return iVaultDb.withPreparedStatement(
      `SELECT DMInstanceId FROM ${Model.classFullName} WHERE ModeledElement.Id in (Select DMInstanceId from Bis.Element where CodeValue=:codeValue)`,
      // eslint-disable-next-line @szewtwin/no-internal, @typescript-eslint/no-deprecated
      (statement: DMSqlStatement): Id64String => {
        statement.bindString("codeValue", codeValue);
        return DbResult.BE_SQLITE_ROW === statement.step()
          ? statement.getValue(0).getId()
          : Id64.invalid;
      }
    );
  }

  public static insertRepositoryLink(
    iVaultDb: IVaultDb,
    codeValue: string,
    url: string,
    format: string
  ): Id64String {
    const repositoryLinkProps: RepositoryLinkProps = {
      classFullName: RepositoryLink.classFullName,
      model: IVault.repositoryModelId,
      code: LinkElement.createCode(
        iVaultDb,
        IVault.repositoryModelId,
        codeValue
      ),
      url,
      format,
    };
    return iVaultDb.elements.insertElement(repositoryLinkProps);
  }

  public static insertExternalSource(
    iVaultDb: IVaultDb,
    repositoryId: Id64String,
    userLabel: string
  ): Id64String {
    const externalSourceProps: ExternalSourceProps = {
      classFullName: ExternalSource.classFullName,
      model: IVault.repositoryModelId,
      code: Code.createEmpty(),
      userLabel,
      repository: new ExternalSourceIsInRepository(repositoryId),
      connectorName: "Connector",
      connectorVersion: "0.0.1",
    };
    return iVaultDb.elements.insertElement(externalSourceProps);
  }

  public static dumpIVaultInfo(iVaultDb: IVaultDb): void {
    const outputFileName: string = `${iVaultDb.pathName}.info.txt`;
    if (IVaultJsFs.existsSync(outputFileName)) {
      IVaultJsFs.removeSync(outputFileName);
    }
    IVaultJsFs.appendFileSync(outputFileName, `${iVaultDb.pathName}\n`);
    IVaultJsFs.appendFileSync(outputFileName, "\n=== CodeSpecs ===\n");
    // eslint-disable-next-line @szewtwin/no-internal, @typescript-eslint/no-deprecated
    iVaultDb.withPreparedStatement(
      "SELECT DMInstanceId,Name FROM BisCore:CodeSpec ORDER BY DMInstanceId",
      // eslint-disable-next-line @szewtwin/no-internal, @typescript-eslint/no-deprecated
      (statement: DMSqlStatement): void => {
        while (DbResult.BE_SQLITE_ROW === statement.step()) {
          const codeSpecId = statement.getValue(0).getId();
          const codeSpecName: string = statement.getValue(1).getString();
          IVaultJsFs.appendFileSync(
            outputFileName,
            `${codeSpecId}, ${codeSpecName}\n`
          );
        }
      }
    );
    IVaultJsFs.appendFileSync(outputFileName, "\n=== Schemas ===\n");
    // eslint-disable-next-line @szewtwin/no-internal, @typescript-eslint/no-deprecated
    iVaultDb.withPreparedStatement(
      "SELECT Name FROM DMDbMeta.DMSchemaDef ORDER BY DMInstanceId",
      // eslint-disable-next-line @szewtwin/no-internal, @typescript-eslint/no-deprecated
      (statement: DMSqlStatement): void => {
        while (DbResult.BE_SQLITE_ROW === statement.step()) {
          const schemaName: string = statement.getValue(0).getString();
          IVaultJsFs.appendFileSync(outputFileName, `${schemaName}\n`);
        }
      }
    );
    IVaultJsFs.appendFileSync(outputFileName, "\n=== Models ===\n");
    // eslint-disable-next-line @szewtwin/no-internal, @typescript-eslint/no-deprecated
    iVaultDb.withPreparedStatement(
      `SELECT DMInstanceId FROM ${Model.classFullName} ORDER BY DMInstanceId`,
      // eslint-disable-next-line @szewtwin/no-internal, @typescript-eslint/no-deprecated
      (statement: DMSqlStatement): void => {
        while (DbResult.BE_SQLITE_ROW === statement.step()) {
          const modelId = statement.getValue(0).getId();
          const model: Model = iVaultDb.models.getModel(modelId);
          IVaultJsFs.appendFileSync(
            outputFileName,
            `${modelId}, ${model.name}, ${model.parentModel}, ${model.classFullName}\n`
          );
        }
      }
    );
    IVaultJsFs.appendFileSync(outputFileName, "\n=== ViewDefinitions ===\n");
    // eslint-disable-next-line @szewtwin/no-internal, @typescript-eslint/no-deprecated
    iVaultDb.withPreparedStatement(
      `SELECT DMInstanceId FROM ${ViewDefinition.classFullName} ORDER BY DMInstanceId`,
      // eslint-disable-next-line @szewtwin/no-internal, @typescript-eslint/no-deprecated
      (statement: DMSqlStatement): void => {
        while (DbResult.BE_SQLITE_ROW === statement.step()) {
          const viewDefinitionId = statement.getValue(0).getId();
          const viewDefinition: ViewDefinition =
            iVaultDb.elements.getElement<ViewDefinition>(viewDefinitionId);
          IVaultJsFs.appendFileSync(
            outputFileName,
            `${viewDefinitionId}, ${viewDefinition.code.value}, ${viewDefinition.classFullName}\n`
          );
        }
      }
    );
    IVaultJsFs.appendFileSync(outputFileName, "\n=== Elements ===\n");
    // eslint-disable-next-line @szewtwin/no-internal, @typescript-eslint/no-deprecated
    iVaultDb.withPreparedStatement(
      `SELECT COUNT(*) FROM ${Element.classFullName}`,
      // eslint-disable-next-line @szewtwin/no-internal, @typescript-eslint/no-deprecated
      (statement: DMSqlStatement): void => {
        if (DbResult.BE_SQLITE_ROW === statement.step()) {
          const count: number = statement.getValue(0).getInteger();
          IVaultJsFs.appendFileSync(
            outputFileName,
            `Count of ${Element.classFullName}=${count}\n`
          );
        }
      }
    );
    // eslint-disable-next-line @szewtwin/no-internal, @typescript-eslint/no-deprecated
    iVaultDb.withPreparedStatement(
      `SELECT COUNT(*) FROM ${PhysicalObject.classFullName}`,
      // eslint-disable-next-line @szewtwin/no-internal, @typescript-eslint/no-deprecated
      (statement: DMSqlStatement): void => {
        if (DbResult.BE_SQLITE_ROW === statement.step()) {
          const count: number = statement.getValue(0).getInteger();
          IVaultJsFs.appendFileSync(
            outputFileName,
            `Count of ${PhysicalObject.classFullName}=${count}\n`
          );
        }
      }
    );
    // eslint-disable-next-line @szewtwin/no-internal, @typescript-eslint/no-deprecated
    iVaultDb.withPreparedStatement(
      `SELECT COUNT(*) FROM ${GeometryPart.classFullName}`,
      // eslint-disable-next-line @szewtwin/no-internal, @typescript-eslint/no-deprecated
      (statement: DMSqlStatement): void => {
        if (DbResult.BE_SQLITE_ROW === statement.step()) {
          const count: number = statement.getValue(0).getInteger();
          IVaultJsFs.appendFileSync(
            outputFileName,
            `Count of ${GeometryPart.classFullName}=${count}\n`
          );
        }
      }
    );
  }

  public static count(
    this: void,
    iVaultDb: IVaultDb,
    classFullName: string,
    whereClause?: string
  ): number {
    // eslint-disable-next-line @szewtwin/no-internal, @typescript-eslint/no-deprecated
    return iVaultDb.withPreparedStatement(
      `SELECT COUNT(*) FROM ${classFullName}${
        whereClause ? ` WHERE ${whereClause}` : ""
      }`,
      // eslint-disable-next-line @szewtwin/no-internal, @typescript-eslint/no-deprecated
      (statement: DMSqlStatement): number => {
        return DbResult.BE_SQLITE_ROW === statement.step()
          ? statement.getValue(0).getInteger()
          : 0;
      }
    );
  }

  public static async saveAndPushChanges(
    accessToken: string,
    briefcaseDb: BriefcaseDb,
    description: string
  ): Promise<void> {
    briefcaseDb.saveChanges(description);
    await briefcaseDb.pushChanges({ accessToken, description });
  }
}

export class ExtensiveTestScenario {
  static uniqueAspectGuid = Guid.createValue();
  static federationGuid3 = Guid.createValue();

  public static async prepareDb(sourceDb: IVaultDb): Promise<void> {
    // Import desired schemas
    const sourceSchemaFileName = path.join(
      KnownTestLocations.assetsDir,
      "ExtensiveTestScenario.dmschema.xml"
    );
    await sourceDb.importSchemas([
      FunctionalSchema.schemaFilePath,
      sourceSchemaFileName,
    ]);
    FunctionalSchema.registerSchema();
  }

  public static async populateDb(sourceDb: IVaultDb): Promise<void> {
    // make sure Arial is in the font table
    const arialFontId = await sourceDb.fonts.acquireId({
      name: "Arial",
      type: FontType.TrueType,
    });
    expect(arialFontId).not.to.be.undefined;
    expect(arialFontId).greaterThan(0);

    // Initialize project extents
    const projectExtents = new Range3d(-1000, -1000, -1000, 1000, 1000, 1000);
    sourceDb.updateProjectExtents(projectExtents);
    // Insert CodeSpecs
    const codeSpecId1 = sourceDb.codeSpecs.insert(
      "SourceCodeSpec",
      CodeScopeSpec.Type.Model
    );
    const codeSpecId2 = sourceDb.codeSpecs.insert(
      "ExtraCodeSpec",
      CodeScopeSpec.Type.ParentElement
    );
    const codeSpecId3 = sourceDb.codeSpecs.insert(
      "InformationRecords",
      CodeScopeSpec.Type.Model
    );
    assert.isTrue(Id64.isValidId64(codeSpecId1));
    assert.isTrue(Id64.isValidId64(codeSpecId2));
    assert.isTrue(Id64.isValidId64(codeSpecId3));
    // Insert RepositoryModel structure
    const subjectId = Subject.insert(
      sourceDb,
      IVault.rootSubjectId,
      "Subject",
      "Subject Description"
    );
    assert.isTrue(Id64.isValidId64(subjectId));
    const sourceOnlySubjectId = Subject.insert(
      sourceDb,
      IVault.rootSubjectId,
      "Only in Source"
    );
    assert.isTrue(Id64.isValidId64(sourceOnlySubjectId));
    const definitionModelId = DefinitionModel.insert(
      sourceDb,
      subjectId,
      "Definition"
    );
    assert.isTrue(Id64.isValidId64(definitionModelId));
    const informationModelId = InformationRecordModel.insert(
      sourceDb,
      subjectId,
      "Information"
    );
    assert.isTrue(Id64.isValidId64(informationModelId));
    const groupModelId = GroupModel.insert(sourceDb, subjectId, "Group");
    assert.isTrue(Id64.isValidId64(groupModelId));
    const physicalModelId = PhysicalModel.insert(
      sourceDb,
      subjectId,
      "Physical"
    );
    assert.isTrue(Id64.isValidId64(physicalModelId));
    const spatialLocationModelId = SpatialLocationModel.insert(
      sourceDb,
      subjectId,
      "SpatialLocation",
      true
    );
    assert.isTrue(Id64.isValidId64(spatialLocationModelId));
    const functionalModelId = FunctionalModel.insert(
      sourceDb,
      subjectId,
      "Functional"
    );
    assert.isTrue(Id64.isValidId64(functionalModelId));
    const documentListModelId = DocumentListModel.insert(
      sourceDb,
      subjectId,
      "Document"
    );
    assert.isTrue(Id64.isValidId64(documentListModelId));
    const drawingId = Drawing.insert(sourceDb, documentListModelId, "Drawing");
    assert.isTrue(Id64.isValidId64(drawingId));
    // Insert DefinitionElements
    const modelSelectorId = ModelSelector.insert(
      sourceDb,
      definitionModelId,
      "SpatialModels",
      [physicalModelId, spatialLocationModelId]
    );
    assert.isTrue(Id64.isValidId64(modelSelectorId));
    const spatialCategoryId = IVaultTestUtils.insertSpatialCategory(
      sourceDb,
      definitionModelId,
      "SpatialCategory",
      ColorDef.green
    );
    assert.isTrue(Id64.isValidId64(spatialCategoryId));
    const sourcePhysicalCategoryId = IVaultTestUtils.insertSpatialCategory(
      sourceDb,
      definitionModelId,
      "SourcePhysicalCategory",
      ColorDef.blue
    );
    assert.isTrue(Id64.isValidId64(sourcePhysicalCategoryId));
    const subCategoryId = SubCategory.insert(
      sourceDb,
      spatialCategoryId,
      "SubCategory",
      { color: ColorDef.blue.toJSON() }
    );
    assert.isTrue(Id64.isValidId64(subCategoryId));
    const filteredSubCategoryId = SubCategory.insert(
      sourceDb,
      spatialCategoryId,
      "FilteredSubCategory",
      { color: ColorDef.green.toJSON() }
    );
    assert.isTrue(Id64.isValidId64(filteredSubCategoryId));
    const drawingCategoryId = DrawingCategory.insert(
      sourceDb,
      definitionModelId,
      "DrawingCategory",
      new SubCategoryAppearance()
    );
    assert.isTrue(Id64.isValidId64(drawingCategoryId));
    const spatialCategorySelectorId = CategorySelector.insert(
      sourceDb,
      definitionModelId,
      "SpatialCategories",
      [spatialCategoryId, sourcePhysicalCategoryId]
    );
    assert.isTrue(Id64.isValidId64(spatialCategorySelectorId));
    const drawingCategorySelectorId = CategorySelector.insert(
      sourceDb,
      definitionModelId,
      "DrawingCategories",
      [drawingCategoryId]
    );
    assert.isTrue(Id64.isValidId64(drawingCategorySelectorId));
    const auxCoordSystemProps: AuxCoordSystem2dProps = {
      classFullName: AuxCoordSystem2d.classFullName,
      model: definitionModelId,
      code: AuxCoordSystem2d.createCode(
        sourceDb,
        definitionModelId,
        "AuxCoordSystem2d"
      ),
    };
    const auxCoordSystemId =
      sourceDb.elements.insertElement(auxCoordSystemProps);
    assert.isTrue(Id64.isValidId64(auxCoordSystemId));
    const textureId = IVaultTestUtils.insertTextureElement(
      sourceDb,
      definitionModelId,
      "Texture"
    );
    assert.isTrue(Id64.isValidId64(textureId));
    const renderMaterialId = RenderMaterialElement.insert(
      sourceDb,
      definitionModelId,
      "RenderMaterial",
      { paletteName: "PaletteName" }
    );
    assert.isTrue(Id64.isValidId64(renderMaterialId));
    const geometryPartProps: GeometryPartProps = {
      classFullName: GeometryPart.classFullName,
      model: definitionModelId,
      code: GeometryPart.createCode(
        sourceDb,
        definitionModelId,
        "GeometryPart"
      ),
      geom: IVaultTestUtils.createBox(Point3d.create(3, 3, 3)),
    };
    const geometryPartId = sourceDb.elements.insertElement(geometryPartProps);
    assert.isTrue(Id64.isValidId64(geometryPartId));
    // Insert InformationRecords
    const informationRecordProps1 = {
      classFullName: "ExtensiveTestScenario:SourceInformationRecord",
      model: informationModelId,
      code: {
        spec: codeSpecId3,
        scope: informationModelId,
        value: "InformationRecord1",
      },
      commonString: "Common1",
      sourceString: "One",
    };
    const informationRecordId1 = sourceDb.elements.insertElement(
      informationRecordProps1
    );
    assert.isTrue(Id64.isValidId64(informationRecordId1));
    const informationRecordProps2: any = {
      classFullName: "ExtensiveTestScenario:SourceInformationRecord",
      model: informationModelId,
      code: {
        spec: codeSpecId3,
        scope: informationModelId,
        value: "InformationRecord2",
      },
      commonString: "Common2",
      sourceString: "Two",
    };
    const informationRecordId2 = sourceDb.elements.insertElement(
      informationRecordProps2
    );
    assert.isTrue(Id64.isValidId64(informationRecordId2));
    const informationRecordProps3 = {
      classFullName: "ExtensiveTestScenario:SourceInformationRecord",
      model: informationModelId,
      code: {
        spec: codeSpecId3,
        scope: informationModelId,
        value: "InformationRecord3",
      },
      commonString: "Common3",
      sourceString: "Three",
    };
    const informationRecordId3 = sourceDb.elements.insertElement(
      informationRecordProps3
    );
    assert.isTrue(Id64.isValidId64(informationRecordId3));
    // Insert PhysicalObject1
    const physicalObjectProps1: PhysicalElementProps = {
      classFullName: PhysicalObject.classFullName,
      model: physicalModelId,
      category: spatialCategoryId,
      code: Code.createEmpty(),
      userLabel: "PhysicalObject1",
      geom: IVaultTestUtils.createBox(
        Point3d.create(1, 1, 1),
        spatialCategoryId,
        subCategoryId,
        renderMaterialId,
        geometryPartId
      ),
      placement: {
        origin: Point3d.create(1, 1, 1),
        angles: YawPitchRollAngles.createDegrees(0, 0, 0),
      },
    };
    const physicalObjectId1 =
      sourceDb.elements.insertElement(physicalObjectProps1);
    assert.isTrue(Id64.isValidId64(physicalObjectId1));
    // Insert PhysicalObject1 children
    const childObjectProps1A: PhysicalElementProps = physicalObjectProps1;
    childObjectProps1A.userLabel = "ChildObject1A";
    childObjectProps1A.parent = new ElementOwnsChildElements(physicalObjectId1);
    childObjectProps1A.placement!.origin = Point3d.create(0, 1, 1);
    const childObjectId1A = sourceDb.elements.insertElement(childObjectProps1A);
    assert.isTrue(Id64.isValidId64(childObjectId1A));
    const childObjectProps1B: PhysicalElementProps = childObjectProps1A;
    childObjectProps1B.userLabel = "ChildObject1B";
    childObjectProps1B.placement!.origin = Point3d.create(1, 0, 1);
    const childObjectId1B = sourceDb.elements.insertElement(childObjectProps1B);
    assert.isTrue(Id64.isValidId64(childObjectId1B));
    // Insert PhysicalObject2
    const physicalObjectProps2: PhysicalElementProps = {
      classFullName: PhysicalObject.classFullName,
      model: physicalModelId,
      category: sourcePhysicalCategoryId,
      code: Code.createEmpty(),
      userLabel: "PhysicalObject2",
      geom: IVaultTestUtils.createBox(Point3d.create(2, 2, 2)),
      placement: {
        origin: Point3d.create(2, 2, 2),
        angles: YawPitchRollAngles.createDegrees(0, 0, 0),
      },
    };
    const physicalObjectId2 =
      sourceDb.elements.insertElement(physicalObjectProps2);
    assert.isTrue(Id64.isValidId64(physicalObjectId2));
    // Insert PhysicalObject3
    const physicalObjectProps3: PhysicalElementProps = {
      classFullName: PhysicalObject.classFullName,
      model: physicalModelId,
      category: sourcePhysicalCategoryId,
      code: Code.createEmpty(),
      federationGuid: ExtensiveTestScenario.federationGuid3,
      userLabel: "PhysicalObject3",
    };
    const physicalObjectId3 =
      sourceDb.elements.insertElement(physicalObjectProps3);
    assert.isTrue(Id64.isValidId64(physicalObjectId3));
    // Insert PhysicalObject4
    const physicalObjectProps4: PhysicalElementProps = {
      classFullName: PhysicalObject.classFullName,
      model: physicalModelId,
      category: spatialCategoryId,
      code: Code.createEmpty(),
      userLabel: "PhysicalObject4",
      geom: IVaultTestUtils.createBoxes([subCategoryId, filteredSubCategoryId]),
      placement: {
        origin: Point3d.create(4, 4, 4),
        angles: YawPitchRollAngles.createDegrees(0, 0, 0),
      },
    };
    const physicalObjectId4 =
      sourceDb.elements.insertElement(physicalObjectProps4);
    assert.isTrue(Id64.isValidId64(physicalObjectId4));
    // Insert PhysicalElement1
    const sourcePhysicalElementProps: PhysicalElementProps = {
      classFullName: "ExtensiveTestScenario:SourcePhysicalElement",
      model: physicalModelId,
      category: sourcePhysicalCategoryId,
      code: Code.createEmpty(),
      userLabel: "PhysicalElement1",
      geom: IVaultTestUtils.createBox(Point3d.create(2, 2, 2)),
      placement: {
        origin: Point3d.create(4, 4, 4),
        angles: YawPitchRollAngles.createDegrees(0, 0, 0),
      },
      sourceString: "S1",
      sourceDouble: 1.1,
      sourceNavigation: {
        id: sourcePhysicalCategoryId,
        relClassName:
          "ExtensiveTestScenario:SourcePhysicalElementUsesSourceDefinition",
      },
      commonNavigation: { id: sourcePhysicalCategoryId },
      commonString: "Common",
      commonDouble: 7.3,
      sourceBinary: new Uint8Array([1, 3, 5, 7]),
      commonBinary: Base64EncodedString.fromUint8Array(
        new Uint8Array([2, 4, 6, 8])
      ),
      extraString: "Extra",
    } as PhysicalElementProps;
    const sourcePhysicalElementId = sourceDb.elements.insertElement(
      sourcePhysicalElementProps
    );
    assert.isTrue(Id64.isValidId64(sourcePhysicalElementId));
    assert.doesNotThrow(() =>
      sourceDb.elements.getElement(sourcePhysicalElementId)
    );
    // Insert ElementAspects
    const aspectProps = {
      classFullName: "ExtensiveTestScenario:SourceUniqueAspect",
      element: new ElementOwnsUniqueAspect(physicalObjectId1),
      commonDouble: 1.1,
      commonString: "Unique",
      commonLong: physicalObjectId1,
      commonBinary: Base64EncodedString.fromUint8Array(
        new Uint8Array([2, 4, 6, 8])
      ),
      sourceDouble: 11.1,
      sourceString: "UniqueAspect",
      sourceLong: physicalObjectId1,
      sourceGuid: ExtensiveTestScenario.uniqueAspectGuid,
      extraString: "Extra",
    } as const;
    sourceDb.elements.insertAspect(aspectProps);
    const sourceUniqueAspect: ElementUniqueAspect =
      sourceDb.elements.getAspects(
        physicalObjectId1,
        "ExtensiveTestScenario:SourceUniqueAspect"
      )[0];
    expect(sourceUniqueAspect).to.deep.subsetEqual(
      omit(aspectProps, ["commonBinary"]),
      { normalizeClassNameProps: true }
    );
    sourceDb.elements.insertAspect({
      classFullName: "ExtensiveTestScenario:SourceMultiAspect",
      element: new ElementOwnsMultiAspects(physicalObjectId1),
      commonDouble: 2.2,
      commonString: "Multi",
      commonLong: physicalObjectId1,
      sourceDouble: 22.2,
      sourceString: "MultiAspect",
      sourceLong: physicalObjectId1,
      sourceGuid: Guid.createValue(),
      extraString: "Extra",
    } as ElementAspectProps);
    sourceDb.elements.insertAspect({
      classFullName: "ExtensiveTestScenario:SourceMultiAspect",
      element: new ElementOwnsMultiAspects(physicalObjectId1),
      commonDouble: 3.3,
      commonString: "Multi",
      commonLong: physicalObjectId1,
      sourceDouble: 33.3,
      sourceString: "MultiAspect",
      sourceLong: physicalObjectId1,
      sourceGuid: Guid.createValue(),
      extraString: "Extra",
    } as ElementAspectProps);
    sourceDb.elements.insertAspect({
      classFullName: "ExtensiveTestScenario:SourceUniqueAspectToExclude",
      element: new ElementOwnsUniqueAspect(physicalObjectId1),
      description: "SourceUniqueAspect1",
    } as ElementAspectProps);
    sourceDb.elements.insertAspect({
      classFullName: "ExtensiveTestScenario:SourceMultiAspectToExclude",
      element: new ElementOwnsMultiAspects(physicalObjectId1),
      description: "SourceMultiAspect1",
    } as ElementAspectProps);
    // Insert DrawingGraphics
    const drawingGraphicProps1: GeometricElement2dProps = {
      classFullName: DrawingGraphic.classFullName,
      model: drawingId,
      category: drawingCategoryId,
      code: Code.createEmpty(),
      userLabel: "DrawingGraphic1",
      geom: IVaultTestUtils.createRectangle(Point2d.create(1, 1)),
      placement: { origin: Point2d.create(2, 2), angle: 0 },
    };
    const drawingGraphicId1 =
      sourceDb.elements.insertElement(drawingGraphicProps1);
    assert.isTrue(Id64.isValidId64(drawingGraphicId1));
    const drawingGraphicRepresentsId1 = DrawingGraphicRepresentsElement.insert(
      sourceDb,
      drawingGraphicId1,
      physicalObjectId1
    );
    assert.isTrue(Id64.isValidId64(drawingGraphicRepresentsId1));
    const drawingGraphicProps2: GeometricElement2dProps = {
      classFullName: DrawingGraphic.classFullName,
      model: drawingId,
      category: drawingCategoryId,
      code: Code.createEmpty(),
      userLabel: "DrawingGraphic2",
      geom: IVaultTestUtils.createRectangle(Point2d.create(1, 1)),
      placement: { origin: Point2d.create(3, 3), angle: 0 },
    };
    const drawingGraphicId2 =
      sourceDb.elements.insertElement(drawingGraphicProps2);
    assert.isTrue(Id64.isValidId64(drawingGraphicId2));
    const drawingGraphicRepresentsId2 = DrawingGraphicRepresentsElement.insert(
      sourceDb,
      drawingGraphicId2,
      physicalObjectId1
    );
    assert.isTrue(Id64.isValidId64(drawingGraphicRepresentsId2));
    // Insert DisplayStyles
    const displayStyle2dId = DisplayStyle2d.insert(
      sourceDb,
      definitionModelId,
      "DisplayStyle2d"
    );
    assert.isTrue(Id64.isValidId64(displayStyle2dId));
    const displayStyle3d: DisplayStyle3d = DisplayStyle3d.create(
      sourceDb,
      definitionModelId,
      "DisplayStyle3d"
    );
    const subCategoryOverride: SubCategoryOverride =
      SubCategoryOverride.fromJSON({ color: ColorDef.from(1, 2, 3).toJSON() });
    displayStyle3d.settings.overrideSubCategory(
      subCategoryId,
      subCategoryOverride
    );
    displayStyle3d.settings.addExcludedElements(physicalObjectId1);
    displayStyle3d.settings.setPlanProjectionSettings(
      spatialLocationModelId,
      PlanProjectionSettings.fromJSON({ elevation: 10.0 })
    );
    displayStyle3d.settings.environment = Environment.fromJSON({
      sky: {
        image: {
          type: SkyBoxImageType.Spherical,
          texture: textureId,
        },
      },
    });
    const displayStyle3dId = displayStyle3d.insert();
    assert.isTrue(Id64.isValidId64(displayStyle3dId));
    // Insert ViewDefinitions
    const viewId = OrthographicViewDefinition.insert(
      sourceDb,
      definitionModelId,
      "Orthographic View",
      modelSelectorId,
      spatialCategorySelectorId,
      displayStyle3dId,
      projectExtents,
      StandardViewIndex.Iso
    );
    assert.isTrue(Id64.isValidId64(viewId));
    const drawingViewRange = new Range2d(0, 0, 100, 100);
    const drawingViewId = DrawingViewDefinition.insert(
      sourceDb,
      definitionModelId,
      "Drawing View",
      drawingId,
      drawingCategorySelectorId,
      displayStyle2dId,
      drawingViewRange
    );
    assert.isTrue(Id64.isValidId64(drawingViewId));
    // Insert instance of SourceRelToExclude to test relationship exclusion by class
    const relationship1: Relationship = sourceDb.relationships.createInstance({
      classFullName: "ExtensiveTestScenario:SourceRelToExclude",
      sourceId: spatialCategorySelectorId,
      targetId: drawingCategorySelectorId,
    });
    const relationshipId1 = sourceDb.relationships.insertInstance(
      relationship1.toJSON()
    );
    assert.isTrue(Id64.isValidId64(relationshipId1));
    // Insert instance of RelWithProps to test relationship property remapping
    const relationship2: Relationship = sourceDb.relationships.createInstance({
      classFullName: "ExtensiveTestScenario:SourceRelWithProps",
      sourceId: spatialCategorySelectorId,
      targetId: drawingCategorySelectorId,
      sourceString: "One",
      sourceDouble: 1.1,
      sourceLong: spatialCategoryId,
      sourceGuid: Guid.createValue(),
    } as any);
    const relationshipId2 = sourceDb.relationships.insertInstance(
      relationship2.toJSON()
    );
    assert.isTrue(Id64.isValidId64(relationshipId2));

    // Insert PhysicalObject5
    const physicalObjectProps5: PhysicalElementProps = {
      classFullName: PhysicalObject.classFullName,
      model: physicalModelId,
      category: spatialCategoryId,
      code: Code.createEmpty(),
      userLabel: "PhysicalObject5",
    };

    const physicalObjectId5 =
      sourceDb.elements.insertElement(physicalObjectProps5);
    assert.isTrue(Id64.isValidId64(physicalObjectId5));

    // Insert PhysicalObject6
    const physicalObjectProps6: PhysicalElementProps = {
      classFullName: PhysicalObject.classFullName,
      model: physicalModelId,
      category: spatialCategoryId,
      code: { spec: "0x1", scope: physicalObjectId5 },
      userLabel: "PhysicalObject6",
    };

    const physicalObjectId6 =
      sourceDb.elements.insertElement(physicalObjectProps6);
    assert.isTrue(Id64.isValidId64(physicalObjectId6));

    // Insert DefinitionPartition1
    const definitionPartitionProps1: InformationPartitionElementProps = {
      classFullName: DefinitionPartition.classFullName,
      model: IVault.repositoryModelId,
      parent: new SubjectOwnsPartitionElements(subjectId),
      code: Code.createEmpty(),
      userLabel: "DefinitionPartition1",
    };

    const definitionPartitionId1 = sourceDb.elements.insertElement(
      definitionPartitionProps1
    );
    assert.isTrue(Id64.isValidId64(definitionPartitionId1));

    // Insert DefinitionModel1
    const definitionModelProps1: ModelProps = {
      classFullName: DefinitionModel.classFullName,
      modeledElement: { id: definitionPartitionId1 },
      parentModel: IVault.repositoryModelId,
    };

    const definitionModelId1 = sourceDb.models.insertModel(
      definitionModelProps1
    );
    assert.isTrue(Id64.isValidId64(definitionModelId1));
    assert.equal(definitionPartitionId1, definitionModelId1);
  }

  public static updateDb(sourceDb: IVaultDb): void {
    // Update Subject element
    const subjectId = sourceDb.elements.queryElementIdByCode(
      Subject.createCode(sourceDb, IVault.rootSubjectId, "Subject")
    )!;
    assert.isTrue(Id64.isValidId64(subjectId));
    const subject = sourceDb.elements.getElement<Subject>(subjectId);
    subject.description = "Subject description (Updated)";
    sourceDb.elements.updateElement(subject.toJSON());
    // Update spatialCategory element
    const definitionModelId = sourceDb.elements.queryElementIdByCode(
      InformationPartitionElement.createCode(sourceDb, subjectId, "Definition")
    )!;
    assert.isTrue(Id64.isValidId64(definitionModelId));
    const spatialCategoryId = sourceDb.elements.queryElementIdByCode(
      SpatialCategory.createCode(sourceDb, definitionModelId, "SpatialCategory")
    )!;
    assert.isTrue(Id64.isValidId64(spatialCategoryId));
    const spatialCategory: SpatialCategory =
      sourceDb.elements.getElement<SpatialCategory>(spatialCategoryId);
    spatialCategory.federationGuid = Guid.createValue();
    sourceDb.elements.updateElement(spatialCategory.toJSON());
    // Update relationship properties
    const spatialCategorySelectorId = sourceDb.elements.queryElementIdByCode(
      CategorySelector.createCode(
        sourceDb,
        definitionModelId,
        "SpatialCategories"
      )
    )!;
    assert.isTrue(Id64.isValidId64(spatialCategorySelectorId));
    const drawingCategorySelectorId = sourceDb.elements.queryElementIdByCode(
      CategorySelector.createCode(
        sourceDb,
        definitionModelId,
        "DrawingCategories"
      )
    )!;
    assert.isTrue(Id64.isValidId64(drawingCategorySelectorId));
    const relWithProps: any = sourceDb.relationships.getInstanceProps(
      "ExtensiveTestScenario:SourceRelWithProps",
      {
        sourceId: spatialCategorySelectorId,
        targetId: drawingCategorySelectorId,
      }
    );
    assert.equal(relWithProps.sourceString, "One");
    assert.equal(relWithProps.sourceDouble, 1.1);
    relWithProps.sourceString += "-Updated";
    relWithProps.sourceDouble = 1.2;
    sourceDb.relationships.updateInstance(relWithProps);
    // Update ElementAspect properties
    const physicalObjectId1 = IVaultTestUtils.queryByUserLabel(
      sourceDb,
      "PhysicalObject1"
    );
    const sourceUniqueAspects: ElementAspect[] = sourceDb.elements.getAspects(
      physicalObjectId1,
      "ExtensiveTestScenario:SourceUniqueAspect"
    );
    assert.equal(sourceUniqueAspects.length, 1);
    sourceUniqueAspects[0].asAny.commonString += "-Updated";
    sourceUniqueAspects[0].asAny.sourceString += "-Updated";
    sourceDb.elements.updateAspect(sourceUniqueAspects[0].toJSON());
    const sourceMultiAspects: ElementAspect[] = sourceDb.elements.getAspects(
      physicalObjectId1,
      "ExtensiveTestScenario:SourceMultiAspect"
    );
    assert.equal(sourceMultiAspects.length, 2);
    sourceMultiAspects[1].asAny.commonString += "-Updated";
    sourceMultiAspects[1].asAny.sourceString += "-Updated";
    sourceDb.elements.updateAspect(sourceMultiAspects[1].toJSON());
    // clear NavigationProperty of PhysicalElement1
    const physicalElementId1 = IVaultTestUtils.queryByUserLabel(
      sourceDb,
      "PhysicalElement1"
    );
    let physicalElement1: PhysicalElement =
      sourceDb.elements.getElement(physicalElementId1);
    physicalElement1.asAny.commonNavigation = RelatedElement.none;
    physicalElement1.update();
    physicalElement1 = sourceDb.elements.getElement(physicalElementId1);
    assert.isUndefined(physicalElement1.asAny.commonNavigation);
    // delete PhysicalObject3
    const physicalObjectId3 = IVaultTestUtils.queryByUserLabel(
      sourceDb,
      "PhysicalObject3"
    );
    assert.isTrue(Id64.isValidId64(physicalObjectId3));
    sourceDb.elements.deleteElement(physicalObjectId3);
    assert.equal(
      Id64.invalid,
      IVaultTestUtils.queryByUserLabel(sourceDb, "PhysicalObject3")
    );

    // delete PhysicalObject6
    const physicalObjectId6 = IVaultTestUtils.queryByUserLabel(
      sourceDb,
      "PhysicalObject6"
    );
    assert.isTrue(Id64.isValidId64(physicalObjectId6));
    sourceDb.elements.deleteElement(physicalObjectId6);
    assert.equal(
      Id64.invalid,
      IVaultTestUtils.queryByUserLabel(sourceDb, "PhysicalObject6")
    );

    // delete PhysicalObject5
    const physicalObjectId5 = IVaultTestUtils.queryByUserLabel(
      sourceDb,
      "PhysicalObject5"
    );
    assert.isTrue(Id64.isValidId64(physicalObjectId5));
    sourceDb.elements.deleteElement(physicalObjectId5);
    assert.equal(
      Id64.invalid,
      IVaultTestUtils.queryByUserLabel(sourceDb, "PhysicalObject5")
    );

    // delete DefinitionModel1
    const definitionModelId1 = IVaultTestUtils.queryByUserLabel(
      sourceDb,
      "DefinitionPartition1"
    );
    assert.isTrue(Id64.isValidId64(definitionModelId1));
    sourceDb.models.deleteModel(definitionModelId1);

    // delete DefinitionPartition1
    const definitionPartitionId1 = IVaultTestUtils.queryByUserLabel(
      sourceDb,
      "DefinitionPartition1"
    );
    assert.isTrue(Id64.isValidId64(definitionPartitionId1));
    sourceDb.elements.deleteElement(definitionPartitionId1);
    assert.equal(
      Id64.invalid,
      IVaultTestUtils.queryByUserLabel(sourceDb, "DefinitionPartition1")
    );

    // Insert PhysicalObject7
    const physicalObjectProps5: PhysicalElementProps = {
      classFullName: PhysicalObject.classFullName,
      model: physicalElement1.model,
      category: spatialCategoryId,
      code: Code.createEmpty(),
      userLabel: "PhysicalObject7",
      geom: IVaultTestUtils.createBox(Point3d.create(1, 1, 1)),
      placement: {
        origin: Point3d.create(5, 5, 5),
        angles: YawPitchRollAngles.createDegrees(0, 0, 0),
      },
    };
    const physicalObjectId7 =
      sourceDb.elements.insertElement(physicalObjectProps5);
    assert.isTrue(Id64.isValidId64(physicalObjectId7));
    // delete relationship
    const drawingGraphicId1 = IVaultTestUtils.queryByUserLabel(
      sourceDb,
      "DrawingGraphic1"
    );
    const drawingGraphicId2 = IVaultTestUtils.queryByUserLabel(
      sourceDb,
      "DrawingGraphic2"
    );
    const relationship: Relationship = sourceDb.relationships.getInstance(
      DrawingGraphicRepresentsElement.classFullName,
      { sourceId: drawingGraphicId2, targetId: physicalObjectId1 }
    );
    relationship.delete();
    // insert relationships
    DrawingGraphicRepresentsElement.insert(
      sourceDb,
      drawingGraphicId1,
      physicalObjectId7
    );
    DrawingGraphicRepresentsElement.insert(
      sourceDb,
      drawingGraphicId2,
      physicalObjectId7
    );
    // update InformationRecord2
    const informationRecordCodeSpec: CodeSpec =
      sourceDb.codeSpecs.getByName("InformationRecords");
    const informationModelId = sourceDb.elements.queryElementIdByCode(
      InformationPartitionElement.createCode(sourceDb, subjectId, "Information")
    )!;
    const informationRecodeCode2: Code = new Code({
      spec: informationRecordCodeSpec.id,
      scope: informationModelId,
      value: "InformationRecord2",
    });
    const informationRecordId2 = sourceDb.elements.queryElementIdByCode(
      informationRecodeCode2
    )!;
    assert.isTrue(Id64.isValidId64(informationRecordId2));
    const informationRecord2: any =
      sourceDb.elements.getElement(informationRecordId2);
    informationRecord2.commonString = `${informationRecord2.commonString}-Updated`;
    informationRecord2.sourceString = `${informationRecord2.sourceString}-Updated`;
    informationRecord2.update();
    // delete InformationRecord3
    const informationRecodeCode3: Code = new Code({
      spec: informationRecordCodeSpec.id,
      scope: informationModelId,
      value: "InformationRecord3",
    });
    const informationRecordId3 = sourceDb.elements.queryElementIdByCode(
      informationRecodeCode3
    )!;
    assert.isTrue(Id64.isValidId64(informationRecordId3));
    sourceDb.elements.deleteElement(informationRecordId3);
  }

  public static assertUpdatesInDb(
    iVaultDb: IVaultDb,
    assertDeletes: boolean = true
  ): void {
    // determine which schema was imported
    const testSourceSchema = iVaultDb.querySchemaVersion(
      "ExtensiveTestScenario"
    )
      ? true
      : false;
    const testTargetSchema = iVaultDb.querySchemaVersion(
      "ExtensiveTestScenarioTarget"
    )
      ? true
      : false;
    assert.notEqual(testSourceSchema, testTargetSchema);
    // assert Subject was updated
    const subjectId = iVaultDb.elements.queryElementIdByCode(
      Subject.createCode(iVaultDb, IVault.rootSubjectId, "Subject")
    )!;
    assert.isTrue(Id64.isValidId64(subjectId));
    const subject: Subject = iVaultDb.elements.getElement<Subject>(subjectId);
    assert.equal(subject.description, "Subject description (Updated)");
    // assert SpatialCategory was updated
    const definitionModelId = iVaultDb.elements.queryElementIdByCode(
      InformationPartitionElement.createCode(iVaultDb, subjectId, "Definition")
    )!;
    assert.isTrue(Id64.isValidId64(definitionModelId));
    const spatialCategoryId = iVaultDb.elements.queryElementIdByCode(
      SpatialCategory.createCode(iVaultDb, definitionModelId, "SpatialCategory")
    )!;
    assert.isTrue(Id64.isValidId64(spatialCategoryId));
    const spatialCategory: SpatialCategory =
      iVaultDb.elements.getElement<SpatialCategory>(spatialCategoryId);
    assert.exists(spatialCategory.federationGuid);
    // assert TargetRelWithProps was updated
    const spatialCategorySelectorId = iVaultDb.elements.queryElementIdByCode(
      CategorySelector.createCode(
        iVaultDb,
        definitionModelId,
        "SpatialCategories"
      )
    )!;
    assert.isTrue(Id64.isValidId64(spatialCategorySelectorId));
    const drawingCategorySelectorId = iVaultDb.elements.queryElementIdByCode(
      CategorySelector.createCode(
        iVaultDb,
        definitionModelId,
        "DrawingCategories"
      )
    )!;
    assert.isTrue(Id64.isValidId64(drawingCategorySelectorId));
    const relClassFullName = testTargetSchema
      ? "ExtensiveTestScenarioTarget:TargetRelWithProps"
      : "ExtensiveTestScenario:SourceRelWithProps";
    const relWithProps: any = iVaultDb.relationships.getInstanceProps(
      relClassFullName,
      {
        sourceId: spatialCategorySelectorId,
        targetId: drawingCategorySelectorId,
      }
    );
    assert.equal(
      testTargetSchema ? relWithProps.targetString : relWithProps.sourceString,
      "One-Updated"
    );
    assert.equal(
      testTargetSchema ? relWithProps.targetDouble : relWithProps.sourceDouble,
      1.2
    );
    // assert ElementAspect properties
    const physicalObjectId1 = IVaultTestUtils.queryByUserLabel(
      iVaultDb,
      "PhysicalObject1"
    );
    const uniqueAspectClassFullName = testTargetSchema
      ? "ExtensiveTestScenarioTarget:TargetUniqueAspect"
      : "ExtensiveTestScenario:SourceUniqueAspect";
    const uniqueAspects: ElementAspect[] = iVaultDb.elements.getAspects(
      physicalObjectId1,
      uniqueAspectClassFullName
    );
    assert.equal(uniqueAspects.length, 1);
    const uniqueAspect = uniqueAspects[0].asAny;
    expect(uniqueAspect).to.deep.subsetEqual({
      commonDouble: 1.1,
      commonString: "Unique-Updated",
      commonLong: physicalObjectId1,
    });
    if (testTargetSchema) {
      expect(uniqueAspect).to.deep.subsetEqual({
        targetDouble: 11.1,
        targetString: "UniqueAspect-Updated",
        targetLong: physicalObjectId1,
      });
    } else {
      expect(uniqueAspect).to.deep.subsetEqual({
        sourceDouble: 11.1,
        sourceString: "UniqueAspect-Updated",
        sourceLong: physicalObjectId1,
      });
    }
    const multiAspectClassFullName = testTargetSchema
      ? "ExtensiveTestScenarioTarget:TargetMultiAspect"
      : "ExtensiveTestScenario:SourceMultiAspect";
    const multiAspects: ElementAspect[] = iVaultDb.elements.getAspects(
      physicalObjectId1,
      multiAspectClassFullName
    );
    assert.equal(multiAspects.length, 2);
    const multiAspect0 = multiAspects[0].asAny;
    const multiAspect1 = multiAspects[1].asAny;
    assert.equal(multiAspect0.commonDouble, 2.2);
    assert.equal(multiAspect0.commonString, "Multi");
    assert.equal(multiAspect0.commonLong, physicalObjectId1);
    assert.equal(
      testTargetSchema ? multiAspect0.targetDouble : multiAspect0.sourceDouble,
      22.2
    );
    assert.equal(
      testTargetSchema ? multiAspect0.targetString : multiAspect0.sourceString,
      "MultiAspect"
    );
    assert.equal(
      testTargetSchema ? multiAspect0.targetLong : multiAspect0.sourceLong,
      physicalObjectId1
    );
    assert.equal(multiAspect1.commonDouble, 3.3);
    assert.equal(multiAspect1.commonString, "Multi-Updated");
    assert.equal(multiAspect1.commonLong, physicalObjectId1);
    assert.equal(
      testTargetSchema ? multiAspect1.targetDouble : multiAspect1.sourceDouble,
      33.3
    );
    assert.equal(
      testTargetSchema ? multiAspect1.targetString : multiAspect1.sourceString,
      "MultiAspect-Updated"
    );
    assert.equal(
      testTargetSchema ? multiAspect1.targetLong : multiAspect1.sourceLong,
      physicalObjectId1
    );
    // assert NavigationProperty of PhysicalElement1 was cleared
    const physicalElementId = IVaultTestUtils.queryByUserLabel(
      iVaultDb,
      "PhysicalElement1"
    );
    const physicalElement: PhysicalElement =
      iVaultDb.elements.getElement(physicalElementId);
    assert.isUndefined(physicalElement.asAny.commonNavigation);
    // assert PhysicalObject7 was inserted
    const physicalObjectId7 = IVaultTestUtils.queryByUserLabel(
      iVaultDb,
      "PhysicalObject7"
    );
    assert.isTrue(Id64.isValidId64(physicalObjectId7));
    // assert relationships were inserted
    const drawingGraphicId1 = IVaultTestUtils.queryByUserLabel(
      iVaultDb,
      "DrawingGraphic1"
    );
    const drawingGraphicId2 = IVaultTestUtils.queryByUserLabel(
      iVaultDb,
      "DrawingGraphic2"
    );
    iVaultDb.relationships.getInstance(
      DrawingGraphicRepresentsElement.classFullName,
      { sourceId: drawingGraphicId1, targetId: physicalObjectId7 }
    );
    iVaultDb.relationships.getInstance(
      DrawingGraphicRepresentsElement.classFullName,
      { sourceId: drawingGraphicId2, targetId: physicalObjectId7 }
    );
    // assert InformationRecord2 was updated
    const informationRecordCodeSpec: CodeSpec =
      iVaultDb.codeSpecs.getByName("InformationRecords");
    const informationModelId = iVaultDb.elements.queryElementIdByCode(
      InformationPartitionElement.createCode(iVaultDb, subjectId, "Information")
    )!;
    const informationRecordId2 = iVaultDb.elements.queryElementIdByCode(
      new Code({
        spec: informationRecordCodeSpec.id,
        scope: informationModelId,
        value: "InformationRecord2",
      })
    );
    assert.isTrue(Id64.isValidId64(informationRecordId2!));
    const informationRecord2: any = iVaultDb.elements.getElement(
      informationRecordId2!
    );
    assert.equal(informationRecord2.commonString, "Common2-Updated");
    assert.equal(
      testTargetSchema
        ? informationRecord2.targetString
        : informationRecord2.sourceString,
      "Two-Updated"
    );
    // assert InformationRecord3 was deleted
    assert.isDefined(
      iVaultDb.elements.queryElementIdByCode(
        new Code({
          spec: informationRecordCodeSpec.id,
          scope: informationModelId,
          value: "InformationRecord1",
        })
      )
    );
    assert.isDefined(
      iVaultDb.elements.queryElementIdByCode(
        new Code({
          spec: informationRecordCodeSpec.id,
          scope: informationModelId,
          value: "InformationRecord2",
        })
      )
    );
    // detect deletes if possible - cannot detect during processAll when isReverseSynchronization is true
    if (assertDeletes) {
      assert.equal(
        Id64.invalid,
        IVaultTestUtils.queryByUserLabel(iVaultDb, "PhysicalObject3")
      );
      assert.equal(
        Id64.invalid,
        IVaultTestUtils.queryByUserLabel(iVaultDb, "PhysicalObject5")
      );
      assert.equal(
        Id64.invalid,
        IVaultTestUtils.queryByUserLabel(iVaultDb, "PhysicalObject6")
      );
      assert.equal(
        Id64.invalid,
        IVaultTestUtils.queryByUserLabel(iVaultDb, "DefinitionPartition1")
      );
      assert.throws(() =>
        iVaultDb.relationships.getInstanceProps(
          DrawingGraphicRepresentsElement.classFullName,
          { sourceId: drawingGraphicId2, targetId: physicalObjectId1 }
        )
      );
      assert.isUndefined(
        iVaultDb.elements.queryElementIdByCode(
          new Code({
            spec: informationRecordCodeSpec.id,
            scope: informationModelId,
            value: "InformationRecord3",
          })
        )
      );
    }
  }
}
