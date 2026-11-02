/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { assert, expect } from "chai";
import * as fs from "fs";
import * as path from "path";
import * as Semver from "semver";
import * as sinon from "sinon";
import {
  CategorySelector,
  DefinitionModel,
  DisplayStyle3d,
  DocumentListModel,
  Drawing,
  DrawingCategory,
  DrawingGraphic,
  DrawingModel,
  // eslint-disable-next-line @typescript-eslint/no-redeclare
  Element,
  ElementMultiAspect,
  ElementOwnsChildElements,
  ElementOwnsExternalSourceAspects,
  ElementOwnsMultiAspects,
  ElementOwnsUniqueAspect,
  ElementRefersToElements,
  ElementUniqueAspect,
  ExternalSourceAspect,
  GenericGraphicalModel3d,
  GenericPhysicalMaterial,
  GeometricElement,
  GeometryPart,
  Graphic3d,
  IVaultDb,
  IVaultElementCloneContext,
  IVaultJsFs,
  InformationRecordModel,
  InformationRecordPartition,
  LineStyleDefinition,
  LinkElement,
  Model,
  ModelSelector,
  OrthographicViewDefinition,
  PhysicalModel,
  PhysicalObject,
  PhysicalPartition,
  PhysicalType,
  Relationship,
  RenderMaterialElement,
  RepositoryLink,
  Schema,
  SnapshotDb,
  SpatialCategory,
  SqliteStatement,
  StandaloneDb,
  SubCategory,
  Subject,
  Texture,
} from "@szewtwin/core-backend";
import * as coreBackendPkgJson from "@szewtwin/core-backend/package.json";
import * as DMSchemaMetaData from "@szewtwin/dmschema-metadata";

import * as TestUtils from "../TestUtils";
import {
  DbResult,
  Guid,
  Id64,
  Id64String,
  Logger,
  LoggingMetaData,
  LogLevel,
  OpenMode,
} from "@szewtwin/core-szewec";
import {
  AxisAlignedBox3d,
  Code,
  CodeScopeSpec,
  CodeSpec,
  ColorDef,
  CreateIVaultProps,
  DefinitionElementProps,
  ElementAspectProps,
  ElementProps,
  ExternalSourceAspectProps,
  GeometricElement2dProps,
  GeometricElement3dProps,
  GeometryParams,
  GeometryPartProps,
  GeometryStreamBuilder,
  ImageSourceFormat,
  IVault,
  IVaultError,
  InformationPartitionElementProps,
  LineStyle,
  ModelProps,
  PhysicalElementProps,
  Placement3d,
  ProfileOptions,
  QueryBinder,
  QueryRowFormat,
  RelatedElement,
  RelationshipProps,
  RepositoryLinkProps,
} from "@szewtwin/core-common";
import {
  Arc3d,
  LineSegment3d,
  Point3d,
  Range3d,
  StandardViewIndex,
  Transform,
  YawPitchRollAngles,
} from "@szewtwin/core-geometry";
import { IVaultExporter, IVaultExportHandler } from "../../IVaultExporter";
import {
  IVaultTransformer,
  IVaultTransformOptions,
} from "../../IVaultTransformer";
import { TransformerLoggerCategory } from "../../TransformerLoggerCategory";
import {
  AspectTrackingImporter,
  AspectTrackingTransformer,
  assertIdentityTransformation,
  AssertOrderTransformer,
  ClassCounter,
  cmpProfileVersion,
  FilterByViewTransformer,
  getProfileVersion,
  IVaultToTextFileExporter,
  IVaultTransformer3d,
  IVaultTransformerTestUtils,
  PhysicalModelConsolidator,
  RecordingIVaultImporter,
  runWithCpuProfiler,
  TestIVaultTransformer,
  TransformerExtensiveTestScenario,
} from "../IVaultTransformerUtils";
import { KnownTestLocations } from "../TestUtils/KnownTestLocations";

import "./TransformerTestStartup"; // calls startup/shutdown IVaultHost before/after all tests
import { SchemaLoader } from "@szewtwin/dmschema-metadata";
import { DetachedExportElementAspectsStrategy } from "../../DetachedExportElementAspectsStrategy";
import { SchemaTestUtils } from "../TestUtils";

describe("IVaultTransformer", () => {
  const outputDir = path.join(
    KnownTestLocations.outputDir,
    "IVaultTransformer"
  );

  /** Instead creating empty snapshots and populating them via routines for new tests incurring a wait,
   * if it's going to be reused, store it here as a getter and a promise that `SnapshotDb.createFrom` can be called on
   */
  class ReusedSnapshots {
    private static _extensiveTestScenario: Promise<SnapshotDb> | undefined;

    public static get extensiveTestScenario(): Promise<SnapshotDb> {
      return (this._extensiveTestScenario ??= (async () => {
        const dbPath = IVaultTransformerTestUtils.prepareOutputFile(
          "IVaultTransformer",
          "ReusedExtensiveTestScenario.dtw"
        );
        const db = SnapshotDb.createEmpty(dbPath, {
          rootSubject: { name: "ReusedExtensiveTestScenario" },
          createClassViews: true,
        });
        await TransformerExtensiveTestScenario.prepareDb(db);
        await TransformerExtensiveTestScenario.populateDb(db);
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        db.saveChanges();
        return db;
      })());
    }

    public static async cleanup() {
      (await this._extensiveTestScenario)?.close();
    }
  }

  before(async () => {
    if (!IVaultJsFs.existsSync(KnownTestLocations.outputDir)) {
      IVaultJsFs.mkdirSync(KnownTestLocations.outputDir);
    }
    if (!IVaultJsFs.existsSync(outputDir)) {
      IVaultJsFs.mkdirSync(outputDir);
    }
  });

  beforeEach(async () => {
    // initialize logging
    if (process.env.LOG_TRANSFORMER_IN_TESTS) {
      Logger.initializeToConsole();
      Logger.setLevelDefault(LogLevel.Error);
      Logger.setLevel(TransformerLoggerCategory.IVaultExporter, LogLevel.Trace);
      Logger.setLevel(TransformerLoggerCategory.IVaultImporter, LogLevel.Trace);
      Logger.setLevel(
        TransformerLoggerCategory.IVaultTransformer,
        LogLevel.Trace
      );
    }
  });

  after(async () => {
    await ReusedSnapshots.cleanup();
  });

  it("should transform changes from source to target", async () => {
    // Source IVaultDb
    const sourceDbFile = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "TestIVaultTransformer-Source.dtw"
    );
    const sourceDb = SnapshotDb.createFrom(
      await ReusedSnapshots.extensiveTestScenario,
      sourceDbFile
    );
    // Target IVaultDb
    const targetDbFile = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "TestIVaultTransformer-Target.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbFile, {
      rootSubject: { name: "TestIVaultTransformer-Target" },
    });
    await TransformerExtensiveTestScenario.prepareTargetDb(targetDb);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    const numSourceUniqueAspects = await count(
      sourceDb,
      ElementUniqueAspect.classFullName
    );
    const numSourceMultiAspects = await count(
      sourceDb,
      ElementMultiAspect.classFullName
    );
    const numSourceRelationships = await count(
      sourceDb,
      ElementRefersToElements.classFullName
    );
    assert.isAtLeast(numSourceUniqueAspects, 1);
    assert.isAtLeast(numSourceMultiAspects, 1);
    assert.isAtLeast(numSourceRelationships, 1);

    if (true) {
      // initial import
      Logger.logInfo(
        TransformerLoggerCategory.IVaultTransformer,
        "=============="
      );
      Logger.logInfo(
        TransformerLoggerCategory.IVaultTransformer,
        "Initial Import"
      );
      Logger.logInfo(
        TransformerLoggerCategory.IVaultTransformer,
        "=============="
      );
      const targetImporter = new RecordingIVaultImporter(targetDb);
      const transformer = await TestIVaultTransformer.create(
        sourceDb,
        targetImporter,
        {
          forceExternalSourceAspectProvenance: true,
        }
      );
      assert.isTrue(transformer.context.isBetweenIVaults);
      await transformer.process();
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      targetDb.saveChanges();
      assert.isAtLeast(targetImporter.numModelsInserted, 1);
      assert.equal(targetImporter.numModelsUpdated, 0);
      assert.isAtLeast(targetImporter.numElementsInserted, 1);
      assert.isAtLeast(targetImporter.numElementsUpdated, 1);
      assert.equal(targetImporter.numElementsExplicitlyDeleted, 0);
      assert.isAtLeast(targetImporter.numElementAspectsInserted, 1);
      assert.equal(targetImporter.numElementAspectsUpdated, 0);
      assert.isAtLeast(targetImporter.numRelationshipsInserted, 1);
      assert.equal(targetImporter.numRelationshipsUpdated, 0);
      assert.isAtLeast(
        await count(targetDb, ElementRefersToElements.classFullName),
        1
      );
      assert.isAtLeast(
        await count(targetDb, InformationRecordPartition.classFullName),
        1
      );
      assert.isAtLeast(
        await count(targetDb, InformationRecordModel.classFullName),
        1
      );
      assert.isAtLeast(
        await count(
          targetDb,
          "ExtensiveTestScenarioTarget:PhysicalPartitionIsTrackedByRecords"
        ),
        1
      );
      assert.isAtLeast(
        await count(targetDb, "ExtensiveTestScenarioTarget:AuditRecord"),
        1
      );
      assert.equal(
        3,
        await count(
          targetDb,
          "ExtensiveTestScenarioTarget:TargetInformationRecord"
        )
      );
      TransformerExtensiveTestScenario.assertTargetDbContents(
        sourceDb,
        targetDb,
        { expectEsas: true }
      );
      transformer.context.dump(`${targetDbFile}.context.txt`);
      transformer.dispose();
    }

    const numTargetElements = await count(targetDb, Element.classFullName);
    const numTargetUniqueAspects = await count(
      targetDb,
      ElementUniqueAspect.classFullName
    );
    const numTargetMultiAspects = await count(
      targetDb,
      ElementMultiAspect.classFullName
    );
    const numTargetExternalSourceAspects = await count(
      targetDb,
      ExternalSourceAspect.classFullName
    );
    const numTargetRelationships = await count(
      targetDb,
      ElementRefersToElements.classFullName
    );
    assert.isAtLeast(numTargetElements, 1);
    assert.isAtLeast(numTargetUniqueAspects, 1);
    assert.isAtLeast(numTargetMultiAspects, 1);
    assert.isAtLeast(numTargetRelationships, 1);

    if (true) {
      // tests of IVaultExporter
      // test #1 - export structure
      const exportFileName: string =
        IVaultTransformerTestUtils.prepareOutputFile(
          "IVaultTransformer",
          "TestIVaultTransformer-Source-Export.txt"
        );
      assert.isFalse(IVaultJsFs.existsSync(exportFileName));
      const exporter = new IVaultToTextFileExporter(sourceDb, exportFileName);
      await exporter.export();
      assert.isTrue(IVaultJsFs.existsSync(exportFileName));

      // test #2 - count occurrences of classFullNames
      const classCountsFileName: string =
        IVaultTransformerTestUtils.prepareOutputFile(
          "IVaultTransformer",
          "TestIVaultTransformer-Source-Counts.txt"
        );
      assert.isFalse(IVaultJsFs.existsSync(classCountsFileName));
      const classCounter = new ClassCounter(sourceDb, classCountsFileName);
      await classCounter.count();
      assert.isTrue(IVaultJsFs.existsSync(classCountsFileName));
    }

    if (true) {
      // second import with no changes to source, should only update lastmod of elements
      Logger.logInfo(TransformerLoggerCategory.IVaultTransformer, "");
      Logger.logInfo(
        TransformerLoggerCategory.IVaultTransformer,
        "================="
      );
      Logger.logInfo(
        TransformerLoggerCategory.IVaultTransformer,
        "Reimport (no-op)"
      );
      Logger.logInfo(
        TransformerLoggerCategory.IVaultTransformer,
        "================="
      );
      const targetImporter = new RecordingIVaultImporter(targetDb);
      const transformer = await TestIVaultTransformer.create(
        sourceDb,
        targetImporter,
        {
          forceExternalSourceAspectProvenance: true,
        }
      );
      await transformer.process();
      assert.equal(targetImporter.numModelsInserted, 0);
      assert.equal(targetImporter.numModelsUpdated, 0);
      assert.equal(targetImporter.numElementsInserted, 0);
      // TODO: explain which elements are updated
      assert.equal(targetImporter.numElementsUpdated, 38);
      assert.equal(targetImporter.numElementsExplicitlyDeleted, 0);
      assert.equal(targetImporter.numElementAspectsInserted, 0);
      assert.equal(targetImporter.numElementAspectsUpdated, 0);
      assert.equal(targetImporter.numRelationshipsInserted, 0);
      assert.equal(targetImporter.numRelationshipsUpdated, 0);
      assert.equal(targetImporter.numRelationshipsDeleted, 0);
      // assert.equal(numTargetElements, count(targetDb, Element.classFullName), "Second import should not add elements");
      assert.equal(
        numTargetExternalSourceAspects,
        await count(targetDb, ExternalSourceAspect.classFullName),
        "Second import should not add aspects"
      );
      assert.equal(
        numTargetRelationships,
        await count(targetDb, ElementRefersToElements.classFullName),
        "Second import should not add relationships"
      );
      assert.equal(
        3,
        await count(sourceDb, "ExtensiveTestScenario:SourceInformationRecord")
      );
      assert.equal(
        3,
        await count(
          targetDb,
          "ExtensiveTestScenarioTarget:TargetInformationRecord"
        )
      );
      transformer.dispose();
    }

    IVaultTransformerTestUtils.dumpIVaultInfo(sourceDb);
    IVaultTransformerTestUtils.dumpIVaultInfo(targetDb);
    sourceDb.close();
    targetDb.close();
  });

  it("should synchronize changes from master to branch and back", async () => {
    // Simulate branching workflow by initializing branchDb to be a copy of the populated masterDb
    const masterDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "Master.dtw"
    );
    const masterDb = SnapshotDb.createFrom(
      await ReusedSnapshots.extensiveTestScenario,
      masterDbFile
    );
    const branchDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "Branch.dtw"
    );
    const branchDb = SnapshotDb.createFrom(masterDb, branchDbFile, {
      createClassViews: true,
    });

    const numMasterElements = await count(masterDb, Element.classFullName);
    const numMasterRelationships = await count(
      masterDb,
      ElementRefersToElements.classFullName
    );
    assert.isAtLeast(numMasterElements, 12);
    assert.isAtLeast(numMasterRelationships, 1);
    assert.equal(
      numMasterElements,
      await count(branchDb, Element.classFullName)
    );
    assert.equal(
      numMasterRelationships,
      await count(branchDb, ElementRefersToElements.classFullName)
    );
    assert.equal(0, await count(branchDb, ExternalSourceAspect.classFullName));

    // Ensure that master to branch synchronization did not add any new Elements or Relationships, but did add ExternalSourceAspects
    const masterToBranchTransformer = new IVaultTransformer(
      masterDb,
      branchDb,
      { wasSourceIVaultCopiedToTarget: true }
    ); // Note use of `wasSourceIVaultCopiedToTarget` flag
    await masterToBranchTransformer.process();
    masterToBranchTransformer.dispose();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    branchDb.saveChanges();
    assert.equal(
      numMasterElements,
      await count(branchDb, Element.classFullName)
    );
    assert.equal(
      numMasterRelationships,
      await count(branchDb, ElementRefersToElements.classFullName)
    );
    assert.equal(await count(branchDb, ExternalSourceAspect.classFullName), 1); // provenance aspect added for target scope element

    // Confirm that provenance (captured in ExternalSourceAspects) was set correctly
    const sql = `SELECT aspect.Identifier,aspect.Element.Id FROM ${ExternalSourceAspect.classFullName} aspect WHERE aspect.Kind=:kind`;
    const params = new QueryBinder().bindString(
      "kind",
      ExternalSourceAspect.Kind.Element
    );
    for await (const row of branchDb.createQueryReader(sql, params)) {
      const masterElementId = row[0];
      const branchElementId = row[1];
      assert.equal(masterElementId, branchElementId);
    }

    // Make changes to simulate working on the branch
    TransformerExtensiveTestScenario.updateDb(branchDb);
    TransformerExtensiveTestScenario.assertUpdatesInDb(branchDb);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    branchDb.saveChanges();

    const numBranchElements = await count(branchDb, Element.classFullName);
    const numBranchRelationships = await count(
      branchDb,
      ElementRefersToElements.classFullName
    );
    assert.notEqual(numBranchElements, numMasterElements);
    assert.notEqual(numBranchRelationships, numMasterRelationships);

    // Synchronize changes from branch back to master
    const branchToMasterTransformer = new IVaultTransformer(
      branchDb,
      masterDb,
      { noProvenance: true }
    );
    await branchToMasterTransformer.process();
    branchToMasterTransformer.dispose();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    masterDb.saveChanges();
    TransformerExtensiveTestScenario.assertUpdatesInDb(masterDb, false);
    assert.equal(
      numBranchElements,
      (await count(masterDb, Element.classFullName)) - 5
    ); // processAll cannot detect deletes when isReverseSynchronization=true
    assert.equal(
      numBranchRelationships,
      (await count(masterDb, ElementRefersToElements.classFullName)) - 1
    ); // processAll cannot detect deletes when isReverseSynchronization=true
    assert.equal(0, await count(masterDb, ExternalSourceAspect.classFullName));

    masterDb.close();
    branchDb.close();
  });

  async function count(
    iVaultDb: IVaultDb,
    classFullName: string
  ): Promise<number> {
    const sql = `SELECT COUNT(*) FROM ${classFullName}`;
    const reader = iVaultDb.createQueryReader(sql, undefined, {
      usePrimaryConn: true,
    });
    return (await reader.step()) ? reader.current[0] : 0;
  }

  it("should import everything below a Subject", async () => {
    // Source IVaultDb
    const sourceDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "SourceImportSubject.dtw"
    );
    const sourceDb = SnapshotDb.createFrom(
      await ReusedSnapshots.extensiveTestScenario,
      sourceDbFile
    );
    const sourceSubjectId = sourceDb.elements.queryElementIdByCode(
      Subject.createCode(sourceDb, IVault.rootSubjectId, "Subject")
    )!;
    assert.isTrue(Id64.isValidId64(sourceSubjectId));
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();
    // Target IVaultDb
    const targetDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "TargetImportSubject.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbFile, {
      rootSubject: { name: "TargetImportSubject" },
    });
    await TransformerExtensiveTestScenario.prepareTargetDb(targetDb);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const targetSubjectId = Subject.insert(
      targetDb,
      IVault.rootSubjectId,
      "Target Subject",
      "Target Subject Description"
    );
    assert.isTrue(Id64.isValidId64(targetSubjectId));
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();
    // Import from beneath source Subject into target Subject
    const transformer = await TestIVaultTransformer.create(sourceDb, targetDb);
    await transformer.processFonts();
    await transformer.processSubject(sourceSubjectId, targetSubjectId);
    await transformer.processRelationships(
      ElementRefersToElements.classFullName
    );
    transformer.dispose();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();
    TransformerExtensiveTestScenario.assertTargetDbContents(
      sourceDb,
      targetDb,
      { targetSubjectName: "Target Subject" }
    );
    const targetSubject: Subject =
      targetDb.elements.getElement<Subject>(targetSubjectId);
    assert.equal(targetSubject.description, "Target Subject Description");
    // Close
    sourceDb.close();
    targetDb.close();
  });

  /** @note For debugging/testing purposes, you can use `it.only` and hard-code `sourceFileName` to test cloning of a particular iVault. */
  it("should clone test file", async () => {
    // open source iVault
    const sourceFileName = TestUtils.IVaultTestUtils.resolveAssetFile(
      "CompatibilityTestSeed.dtw"
    );
    const sourceDb = SnapshotDb.openFile(sourceFileName);
    const numSourceElements = await count(sourceDb, Element.classFullName);
    assert.exists(sourceDb);
    assert.isAtLeast(numSourceElements, 12);
    // create target iVault
    const targetDbFile = path.join(
      KnownTestLocations.outputDir,
      "IVaultTransformer",
      "Clone-Target.dtw"
    );
    if (IVaultJsFs.existsSync(targetDbFile)) {
      IVaultJsFs.removeSync(targetDbFile);
    }
    const targetDbProps: CreateIVaultProps = {
      rootSubject: {
        name: `Cloned target of ${
          sourceDb.elements.getRootSubject().code.value
        }`,
      },
      ecefLocation: sourceDb.ecefLocation,
    };
    const targetDb = SnapshotDb.createEmpty(targetDbFile, targetDbProps);
    assert.exists(targetDb);
    // import
    const transformer = new IVaultTransformer(sourceDb, targetDb);
    await transformer.processSchemas();
    await transformer.process();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();
    transformer.dispose();
    const numTargetElements = await count(targetDb, Element.classFullName);
    assert.isAtLeast(numTargetElements, numSourceElements);
    assert.deepEqual(sourceDb.ecefLocation, targetDb.ecefLocation);
    // clean up
    sourceDb.close();
    targetDb.close();
  });

  it("should include source provenance", async () => {
    // create source iVault
    const sourceDbFile = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "SourceProvenance.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbFile, {
      rootSubject: { name: "Source Provenance Test" },
    });
    const sourceRepositoryId = IVaultTransformerTestUtils.insertRepositoryLink(
      sourceDb,
      "master.bld",
      "https://test.szewec.com/folder/master.bld",
      "BLD"
    );
    const sourceExternalSourceId =
      IVaultTransformerTestUtils.insertExternalSource(
        sourceDb,
        sourceRepositoryId,
        "Default Model"
      );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const sourceCategoryId = SpatialCategory.insert(
      sourceDb,
      IVault.dictionaryId,
      "SpatialCategory",
      { color: ColorDef.green.toJSON() }
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const sourceModelId = PhysicalModel.insert(
      sourceDb,
      IVault.rootSubjectId,
      "Physical"
    );
    for (const x of [1, 2, 3]) {
      const physicalObjectProps: PhysicalElementProps = {
        classFullName: PhysicalObject.classFullName,
        model: sourceModelId,
        category: sourceCategoryId,
        code: Code.createEmpty(),
        userLabel: `PhysicalObject(${x})`,
        geom: IVaultTransformerTestUtils.createBox(Point3d.create(1, 1, 1)),
        placement: Placement3d.fromJSON({ origin: { x }, angles: {} }),
      };
      const physicalObjectId =
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        sourceDb.elements.insertElement(physicalObjectProps);
      const aspectProps: ExternalSourceAspectProps = {
        // simulate provenance from a Connector
        classFullName: ExternalSourceAspect.classFullName,
        element: {
          id: physicalObjectId,
          relClassName: ElementOwnsExternalSourceAspects.classFullName,
        },
        scope: { id: sourceExternalSourceId },
        source: { id: sourceExternalSourceId },
        identifier: `ID${x}`,
        kind: ExternalSourceAspect.Kind.Element,
      };
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      sourceDb.elements.insertAspect(aspectProps);
    }
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    // create target iVault
    const targetDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "SourceProvenance-Target.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbFile, {
      rootSubject: { name: "Source Provenance Test (Target)" },
    });

    // clone
    const transformer = new IVaultTransformer(sourceDb, targetDb, {
      includeSourceProvenance: true,
    });
    await transformer.process();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    // verify target contents
    assert.equal(1, await count(sourceDb, RepositoryLink.classFullName));
    const targetRepositoryId = targetDb.elements.queryElementIdByCode(
      LinkElement.createCode(targetDb, IVault.repositoryModelId, "master.bld")
    )!;
    assert.isTrue(Id64.isValidId64(targetRepositoryId));
    const targetExternalSourceId = IVaultTransformerTestUtils.queryByUserLabel(
      targetDb,
      "Default Model"
    );
    assert.isTrue(Id64.isValidId64(targetExternalSourceId));
    const targetCategoryId = targetDb.elements.queryElementIdByCode(
      SpatialCategory.createCode(
        targetDb,
        IVault.dictionaryId,
        "SpatialCategory"
      )
    )!;
    assert.isTrue(Id64.isValidId64(targetCategoryId));
    const targetPhysicalObjectIds = [
      IVaultTransformerTestUtils.queryByUserLabel(
        targetDb,
        "PhysicalObject(1)"
      ),
      IVaultTransformerTestUtils.queryByUserLabel(
        targetDb,
        "PhysicalObject(2)"
      ),
      IVaultTransformerTestUtils.queryByUserLabel(
        targetDb,
        "PhysicalObject(3)"
      ),
    ];
    for (const targetPhysicalObjectId of targetPhysicalObjectIds) {
      assert.isTrue(Id64.isValidId64(targetPhysicalObjectId));
      const physicalObject = targetDb.elements.getElement<PhysicalObject>(
        targetPhysicalObjectId,
        PhysicalObject
      );
      assert.equal(physicalObject.category, targetCategoryId);
      const aspects = targetDb.elements.getAspects(
        targetPhysicalObjectId,
        ExternalSourceAspect.classFullName
      );
      assert.equal(1, aspects.length, "Expect original source provenance");
      for (const aspect of aspects) {
        const externalSourceAspect = aspect as ExternalSourceAspect;
        if (
          externalSourceAspect.scope?.id === transformer.targetScopeElementId
        ) {
          // provenance added by IVaultTransformer
          assert.equal(
            externalSourceAspect.kind,
            ExternalSourceAspect.Kind.Element
          );
        } else {
          // provenance carried over from the source iVault
          assert.equal(externalSourceAspect.scope?.id, targetExternalSourceId);
          assert.equal(externalSourceAspect.source!.id, targetExternalSourceId);
          assert.isTrue(externalSourceAspect.identifier.startsWith("ID"));
          assert.isTrue(
            physicalObject.userLabel!.includes(
              externalSourceAspect.identifier[2]
            )
          );
          assert.equal(
            externalSourceAspect.kind,
            ExternalSourceAspect.Kind.Element
          );
        }
      }
    }

    // clean up
    transformer.dispose();
    sourceDb.close();
    targetDb.close();
  });

  it("should transform 3d elements in target iVault", async () => {
    // create source iVault
    const sourceDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "Transform3d-Source.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbFile, {
      rootSubject: { name: "Transform3d-Source" },
    });
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const categoryId: Id64String = SpatialCategory.insert(
      sourceDb,
      IVault.dictionaryId,
      "SpatialCategory",
      { color: ColorDef.green.toJSON() }
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const sourceModelId: Id64String = PhysicalModel.insert(
      sourceDb,
      IVault.rootSubjectId,
      "Physical"
    );
    const xArray: number[] = [1, 3, 5, 7, 9];
    const yArray: number[] = [0, 2, 4, 6, 8];
    for (const x of xArray) {
      for (const y of yArray) {
        const physicalObjectProps1: PhysicalElementProps = {
          classFullName: PhysicalObject.classFullName,
          model: sourceModelId,
          category: categoryId,
          code: Code.createEmpty(),
          userLabel: `PhysicalObject(${x},${y})`,
          geom: IVaultTransformerTestUtils.createBox(Point3d.create(1, 1, 1)),
          placement: Placement3d.fromJSON({ origin: { x, y }, angles: {} }),
        };
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        sourceDb.elements.insertElement(physicalObjectProps1);
      }
    }
    const sourceModel: PhysicalModel =
      sourceDb.models.getModel<PhysicalModel>(sourceModelId);
    const sourceModelExtents: AxisAlignedBox3d = sourceModel.queryExtents();
    assert.deepEqual(sourceModelExtents, new Range3d(1, 0, 0, 10, 9, 1));

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();
    // create target iVault
    const targetDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "Transform3d-Target.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbFile, {
      rootSubject: { name: "Transform3d-Target" },
    });
    // transform
    const transform3d: Transform = Transform.createTranslation(
      new Point3d(100, 200)
    );
    const transformer = new IVaultTransformer3d(
      sourceDb,
      targetDb,
      transform3d
    );
    await transformer.process();
    const targetModelId: Id64String =
      transformer.context.findTargetElementId(sourceModelId);
    const targetModel: PhysicalModel =
      targetDb.models.getModel<PhysicalModel>(targetModelId);
    const targetModelExtents: AxisAlignedBox3d = targetModel.queryExtents();
    assert.deepEqual(targetModelExtents, new Range3d(101, 200, 0, 110, 209, 1));
    assert.deepEqual(
      targetModelExtents,
      transform3d.multiplyRange(sourceModelExtents)
    );
    // clean up
    transformer.dispose();
    sourceDb.close();
    targetDb.close();
  });

  it("should combine models", async () => {
    const sourceDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "source-separate-models.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbFile, {
      rootSubject: { name: "Separate Models" },
    });
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const sourceCategoryId = SpatialCategory.insert(
      sourceDb,
      IVault.dictionaryId,
      "Category",
      {}
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const sourceModelId1 = PhysicalModel.insert(
      sourceDb,
      IVault.rootSubjectId,
      "M1"
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const sourceModelId2 = PhysicalModel.insert(
      sourceDb,
      IVault.rootSubjectId,
      "M2"
    );
    const elementProps11: PhysicalElementProps = {
      classFullName: PhysicalObject.classFullName,
      model: sourceModelId1,
      code: Code.createEmpty(),
      userLabel: "PhysicalObject-M1-E1",
      category: sourceCategoryId,
      geom: IVaultTransformerTestUtils.createBox(new Point3d(1, 1, 1)),
      placement: Placement3d.fromJSON({ origin: { x: 1, y: 1 }, angles: {} }),
    };
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const sourceElementId11 = sourceDb.elements.insertElement(elementProps11);
    const elementProps21: PhysicalElementProps = {
      classFullName: PhysicalObject.classFullName,
      model: sourceModelId2,
      code: Code.createEmpty(),
      userLabel: "PhysicalObject-M2-E1",
      category: sourceCategoryId,
      geom: IVaultTransformerTestUtils.createBox(new Point3d(2, 2, 2)),
      placement: Placement3d.fromJSON({ origin: { x: 2, y: 2 }, angles: {} }),
    };
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const sourceElementId21 = sourceDb.elements.insertElement(elementProps21);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();
    assert.equal(await count(sourceDb, PhysicalPartition.classFullName), 2);
    assert.equal(await count(sourceDb, PhysicalModel.classFullName), 2);
    assert.equal(await count(sourceDb, PhysicalObject.classFullName), 2);

    const targetDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "target-combined-model.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbFile, {
      rootSubject: { name: "Combined Model" },
    });
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const targetModelId = PhysicalModel.insert(
      targetDb,
      IVault.rootSubjectId,
      "PhysicalModel-Combined"
    );

    const transformer = new PhysicalModelConsolidator(
      sourceDb,
      targetDb,
      targetModelId
    );
    await transformer.process();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    const targetElement11 = targetDb.elements.getElement(
      transformer.context.findTargetElementId(sourceElementId11)
    );
    assert.equal(targetElement11.userLabel, "PhysicalObject-M1-E1");
    assert.equal(targetElement11.model, targetModelId);
    const targetElement21 = targetDb.elements.getElement(
      transformer.context.findTargetElementId(sourceElementId21)
    );
    assert.equal(targetElement21.userLabel, "PhysicalObject-M2-E1");
    assert.equal(targetElement21.model, targetModelId);
    const targetPartition = targetDb.elements.getElement(targetModelId);
    assert.equal(
      targetPartition.code.value,
      "PhysicalModel-Combined",
      "Original CodeValue should be retained"
    );
    assert.equal(await count(targetDb, PhysicalPartition.classFullName), 1);
    assert.equal(await count(targetDb, PhysicalModel.classFullName), 1);
    assert.equal(await count(targetDb, PhysicalObject.classFullName), 2);

    transformer.dispose();
    sourceDb.close();
    targetDb.close();
  });

  it("should sync Team iVaults into Shared", async () => {
    const iVaultShared: SnapshotDb =
      IVaultTransformerTestUtils.createSharedIVault(
        outputDir,
        ["A", "B"],
        "shared"
      );

    if (true) {
      const iVaultA: SnapshotDb = IVaultTransformerTestUtils.createTeamIVault(
        outputDir,
        "A",
        Point3d.create(0, 0, 0),
        ColorDef.green,
        "team"
      );
      IVaultTransformerTestUtils.assertTeamIVaultContents(iVaultA, "A");
      const iVaultExporterA = new IVaultExporter(iVaultA);
      iVaultExporterA.excludeElement(
        iVaultA.elements.queryElementIdByCode(
          Subject.createCode(iVaultA, IVault.rootSubjectId, "Context")
        )!
      );
      const subjectId: Id64String = IVaultTransformerTestUtils.querySubjectId(
        iVaultShared,
        "A"
      );
      const transformerA2S = new IVaultTransformer(
        iVaultExporterA,
        iVaultShared,
        {
          targetScopeElementId: subjectId,
          danglingReferencesBehavior: "ignore",
          skipPropagateChangesToRootElements: false,
        }
      );
      transformerA2S.context.remapElement(IVault.rootSubjectId, subjectId);
      await transformerA2S.process();
      transformerA2S.dispose();
      // Make sure some properties, for example, description, can persist
      const teamIVaultA: Subject = iVaultA.elements.getElement<Subject>(
        IVault.rootSubjectId
      );
      const sharedIVaultA: Subject =
        iVaultShared.elements.getElement<Subject>(subjectId);
      assert.equal(teamIVaultA.description, sharedIVaultA.description);
      IVaultTransformerTestUtils.dumpIVaultInfo(iVaultA);
      iVaultA.close();
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      iVaultShared.saveChanges("Imported A");
      IVaultTransformerTestUtils.assertSharedIVaultContents(iVaultShared, [
        "A",
      ]);
    }

    if (true) {
      const iVaultB: SnapshotDb = IVaultTransformerTestUtils.createTeamIVault(
        outputDir,
        "B",
        Point3d.create(0, 10, 0),
        ColorDef.blue
      );
      IVaultTransformerTestUtils.assertTeamIVaultContents(iVaultB, "B");
      const iVaultExporterB = new IVaultExporter(iVaultB);
      iVaultExporterB.excludeElement(
        iVaultB.elements.queryElementIdByCode(
          Subject.createCode(iVaultB, IVault.rootSubjectId, "Context")
        )!
      );
      const subjectId: Id64String = IVaultTransformerTestUtils.querySubjectId(
        iVaultShared,
        "B"
      );
      const transformerB2S = new IVaultTransformer(
        iVaultExporterB,
        iVaultShared,
        {
          targetScopeElementId: subjectId,
          danglingReferencesBehavior: "ignore",
        }
      );
      transformerB2S.context.remapElement(IVault.rootSubjectId, subjectId);
      await transformerB2S.process();
      transformerB2S.dispose();
      IVaultTransformerTestUtils.dumpIVaultInfo(iVaultB);
      iVaultB.close();
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      iVaultShared.saveChanges("Imported B");
      IVaultTransformerTestUtils.assertSharedIVaultContents(iVaultShared, [
        "A",
        "B",
      ]);
    }

    if (true) {
      const iVaultConsolidated: SnapshotDb =
        IVaultTransformerTestUtils.createConsolidatedIVault(
          outputDir,
          "Consolidated"
        );
      const transformerS2C = new IVaultTransformer(
        iVaultShared,
        iVaultConsolidated
      );
      const subjectA: Id64String = IVaultTransformerTestUtils.querySubjectId(
        iVaultShared,
        "A"
      );
      const subjectB: Id64String = IVaultTransformerTestUtils.querySubjectId(
        iVaultShared,
        "B"
      );
      const definitionA: Id64String =
        IVaultTransformerTestUtils.queryDefinitionPartitionId(
          iVaultShared,
          subjectA,
          "A"
        );
      const definitionB: Id64String =
        IVaultTransformerTestUtils.queryDefinitionPartitionId(
          iVaultShared,
          subjectB,
          "B"
        );
      const definitionC: Id64String =
        IVaultTransformerTestUtils.queryDefinitionPartitionId(
          iVaultConsolidated,
          IVault.rootSubjectId,
          "Consolidated"
        );
      transformerS2C.context.remapElement(definitionA, definitionC);
      transformerS2C.context.remapElement(definitionB, definitionC);
      const physicalA: Id64String =
        IVaultTransformerTestUtils.queryPhysicalPartitionId(
          iVaultShared,
          subjectA,
          "A"
        );
      const physicalB: Id64String =
        IVaultTransformerTestUtils.queryPhysicalPartitionId(
          iVaultShared,
          subjectB,
          "B"
        );
      const physicalC: Id64String =
        IVaultTransformerTestUtils.queryPhysicalPartitionId(
          iVaultConsolidated,
          IVault.rootSubjectId,
          "Consolidated"
        );
      transformerS2C.context.remapElement(physicalA, physicalC);
      transformerS2C.context.remapElement(physicalB, physicalC);
      await transformerS2C.processModel(definitionA);
      await transformerS2C.processModel(definitionB);
      await transformerS2C.processModel(physicalA);
      await transformerS2C.processModel(physicalB);
      await transformerS2C.processRelationships(
        ElementRefersToElements.classFullName
      );
      transformerS2C.dispose();
      IVaultTransformerTestUtils.assertConsolidatedIVaultContents(
        iVaultConsolidated,
        "Consolidated"
      );
      IVaultTransformerTestUtils.dumpIVaultInfo(iVaultConsolidated);
      iVaultConsolidated.close();
    }

    IVaultTransformerTestUtils.dumpIVaultInfo(iVaultShared);
    iVaultShared.close();
  });

  it("remap root subject to root subject", async () => {
    const sourceIVaultFile: string =
      IVaultTransformerTestUtils.prepareOutputFile(
        "IVaultTransformer",
        "source.dtw"
      );
    const targetIVaultFile: string =
      IVaultTransformerTestUtils.prepareOutputFile(
        "IVaultTransformer",
        "target.dtw"
      );
    const sourceIVaultDb: SnapshotDb = SnapshotDb.createEmpty(
      sourceIVaultFile,
      {
        rootSubject: { name: "rootSource" },
        createClassViews: true,
      }
    );
    const targetIVaultDb: SnapshotDb = SnapshotDb.createEmpty(
      targetIVaultFile,
      {
        rootSubject: { name: "rootTarget" },
        createClassViews: true,
      }
    );
    assert.exists(sourceIVaultDb);
    assert.exists(targetIVaultDb);

    const transformer = new IVaultTransformer(sourceIVaultDb, targetIVaultDb);
    transformer.context.remapElement(
      IVault.rootSubjectId,
      IVault.rootSubjectId
    );
    await transformer.process();
    transformer.dispose();
    const sourceIVaultSubject: Subject =
      sourceIVaultDb.elements.getElement<Subject>(IVault.rootSubjectId);
    const targetIVaultSubject: Subject =
      targetIVaultDb.elements.getElement<Subject>(IVault.rootSubjectId);
    expect(sourceIVaultSubject).to.have.property("parent").that.is.undefined;
    expect(sourceIVaultSubject.code.scope).to.eq(IVault.rootSubjectId);
    // rootSubjectId's parent still doesn't exist after the clone
    expect(targetIVaultSubject).to.have.property("parent").that.is.undefined;
    // the scope on its code is still itself.
    expect(targetIVaultSubject.code.scope).to.eq(IVault.rootSubjectId);
    sourceIVaultDb.close();
    targetIVaultDb.close();
  });

  it("remap non-root subject to non-root subject", async () => {
    const sourceIVaultFile: string =
      IVaultTransformerTestUtils.prepareOutputFile(
        "IVaultTransformer",
        "source.dtw"
      );
    const targetIVaultFile: string =
      IVaultTransformerTestUtils.prepareOutputFile(
        "IVaultTransformer",
        "target.dtw"
      );
    const sourceIVaultDb: SnapshotDb = SnapshotDb.createEmpty(
      sourceIVaultFile,
      {
        rootSubject: { name: "rootSource" },
        createClassViews: true,
      }
    );
    const targetIVaultDb: SnapshotDb = SnapshotDb.createEmpty(
      targetIVaultFile,
      {
        rootSubject: { name: "rootTarget" },
        createClassViews: true,
      }
    );
    assert.exists(sourceIVaultDb);
    assert.exists(targetIVaultDb);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const sourceSubjectId: Id64String = Subject.insert(
      sourceIVaultDb,
      IVault.rootSubjectId,
      "source"
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const targetSubjectId: Id64String = Subject.insert(
      targetIVaultDb,
      IVault.rootSubjectId,
      "target"
    );
    const transformer = new IVaultTransformer(sourceIVaultDb, targetIVaultDb);
    transformer.context.remapElement(sourceSubjectId, targetSubjectId);
    await transformer.process();
    transformer.dispose();
    const sourceIVaultSubject: Subject =
      sourceIVaultDb.elements.getElement<Subject>(sourceSubjectId);
    const targetIVaultSubject: Subject =
      targetIVaultDb.elements.getElement<Subject>(targetSubjectId);
    // ParentId of non root-subject == rootSubjectId
    expect(sourceIVaultSubject.parent?.id).to.eq(IVault.rootSubjectId);
    expect(targetIVaultSubject.parent?.id).to.eq(IVault.rootSubjectId);
    // rootSubjectId == scope on the code of non root-subject
    expect(sourceIVaultSubject.code.scope).to.eq(IVault.rootSubjectId);
    expect(targetIVaultSubject.code.scope).to.eq(IVault.rootSubjectId);
    // Remapping a non root-subject to a non root-subject keeps its parent and code as expected
    expect(sourceIVaultSubject.parent).to.deep.eq(targetIVaultSubject.parent);
    expect(sourceIVaultSubject.code).to.deep.eq(targetIVaultSubject.code);
    sourceIVaultDb.close();
    targetIVaultDb.close();
  });

  it("remap root subject to non-root subject", async () => {
    const sourceIVaultFile: string =
      IVaultTransformerTestUtils.prepareOutputFile(
        "IVaultTransformer",
        "source.dtw"
      );
    const targetIVaultFile: string =
      IVaultTransformerTestUtils.prepareOutputFile(
        "IVaultTransformer",
        "target.dtw"
      );
    const sourceIVaultDb: SnapshotDb = SnapshotDb.createEmpty(
      sourceIVaultFile,
      {
        rootSubject: { name: "rootSource" },
        createClassViews: true,
      }
    );
    const targetIVaultDb: SnapshotDb = SnapshotDb.createEmpty(
      targetIVaultFile,
      {
        rootSubject: { name: "rootTarget" },
        createClassViews: true,
      }
    );
    assert.exists(sourceIVaultDb);
    assert.exists(targetIVaultDb);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const targetSubjectId: Id64String = Subject.insert(
      targetIVaultDb,
      IVault.rootSubjectId,
      "target"
    );
    const transformer = new IVaultTransformer(sourceIVaultDb, targetIVaultDb, {
      danglingReferencesBehavior: "ignore",
    });
    transformer.context.remapElement(IVault.rootSubjectId, targetSubjectId);
    await transformer.process();
    transformer.dispose();
    const targetIVaultSubject: Subject =
      targetIVaultDb.elements.getElement<Subject>(targetSubjectId);
    expect(targetIVaultSubject.parent?.id).eq(IVault.rootSubjectId);
    expect(targetIVaultSubject.code.scope).eq(IVault.rootSubjectId);
    sourceIVaultDb.close();
    targetIVaultDb.close();
  });

  it("remap root subject to non-root subject with non-root parent", async () => {
    const sourceIVaultFile: string =
      IVaultTransformerTestUtils.prepareOutputFile(
        "IVaultTransformer",
        "source.dtw"
      );
    const targetIVaultFile: string =
      IVaultTransformerTestUtils.prepareOutputFile(
        "IVaultTransformer",
        "target.dtw"
      );
    const sourceIVaultDb: SnapshotDb = SnapshotDb.createEmpty(
      sourceIVaultFile,
      {
        rootSubject: { name: "rootSource" },
        createClassViews: true,
      }
    );
    const targetIVaultDb: SnapshotDb = SnapshotDb.createEmpty(
      targetIVaultFile,
      {
        rootSubject: { name: "rootTarget" },
        createClassViews: true,
      }
    );
    assert.exists(sourceIVaultDb);
    assert.exists(targetIVaultDb);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const targetParentSubjectId: Id64String = Subject.insert(
      targetIVaultDb,
      IVault.rootSubjectId,
      "targetParent"
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const targetChildSubjectId: Id64String = Subject.insert(
      targetIVaultDb,
      targetParentSubjectId,
      "targetChild"
    );
    const transformer = new IVaultTransformer(sourceIVaultDb, targetIVaultDb, {
      danglingReferencesBehavior: "ignore",
    });
    transformer.context.remapElement(
      IVault.rootSubjectId,
      targetChildSubjectId
    );
    await transformer.process();
    transformer.dispose();
    const targetChildIVaultSubject: Subject =
      targetIVaultDb.elements.getElement<Subject>(targetChildSubjectId);
    // child's parent should still be its original parent after remapping
    expect(targetChildIVaultSubject.parent?.id).eq(targetParentSubjectId);
    // child's code scope should still be its parent after remapping
    expect(targetChildIVaultSubject.code.scope).eq(targetParentSubjectId);
    sourceIVaultDb.close();
    targetIVaultDb.close();
  });

  it.skip("should log unresolved references", async () => {
    const iVaultShared: SnapshotDb =
      IVaultTransformerTestUtils.createSharedIVault(outputDir, ["A", "B"]);
    const iVaultA: SnapshotDb = IVaultTransformerTestUtils.createTeamIVault(
      outputDir,
      "A",
      Point3d.create(0, 0, 0),
      ColorDef.green
    );
    IVaultTransformerTestUtils.assertTeamIVaultContents(iVaultA, "A");
    const iVaultExporterA = new IVaultExporter(iVaultA);

    // Exclude element
    const excludedId = iVaultA.elements.queryElementIdByCode(
      Subject.createCode(iVaultA, IVault.rootSubjectId, "Context")
    );
    assert.isDefined(excludedId);
    iVaultExporterA.excludeElement(excludedId);

    const subjectId: Id64String = IVaultTransformerTestUtils.querySubjectId(
      iVaultShared,
      "A"
    );
    const transformerA2S = new IVaultTransformer(
      iVaultExporterA,
      iVaultShared,
      { targetScopeElementId: subjectId, danglingReferencesBehavior: "ignore" }
    );
    transformerA2S.context.remapElement(IVault.rootSubjectId, subjectId);

    // Configure logger to capture warning message about unresolved references
    const messageStart = "The following elements were never fully resolved:\n";
    const messageEnd =
      "\nThis indicates that either some references were excluded from the transformation\nor the source has dangling references.";

    let unresolvedElementMessage: string | undefined;
    const logWarning = (
      _category: string,
      message: string,
      _metaData: LoggingMetaData
    ) => {
      if (message.startsWith(messageStart)) {
        unresolvedElementMessage = message;
      }
    };
    Logger.initialize(undefined, logWarning);
    Logger.setLevelDefault(LogLevel.Warning);

    // Act
    await transformerA2S.process();

    // Collect expected ids
    const result = iVaultA.queryEntityIds({
      from: "BisCore.Element",
      where: "Model.Id = :rootId AND DMInstanceId NOT IN (:excludedId)",
      bindings: { rootId: IVault.rootSubjectId, excludedId },
    });
    const expectedIds = [...result].map((x) => `e${x}`);

    // Collect actual ids
    assert.isDefined(unresolvedElementMessage);
    const actualIds = unresolvedElementMessage
      .split(messageStart)[1]
      .split(messageEnd)[0]
      .split(",");

    // Assert
    assert.equal(actualIds.length, 5);
    assert.sameMembers(actualIds, expectedIds);

    transformerA2S.dispose();
    iVaultA.close();
    iVaultShared.close();
  });

  it("should detect conflicting provenance scopes", async () => {
    const sourceDb1 = IVaultTransformerTestUtils.createTeamIVault(
      outputDir,
      "S1",
      Point3d.create(0, 0, 0),
      ColorDef.green
    );
    const sourceDb2 = IVaultTransformerTestUtils.createTeamIVault(
      outputDir,
      "S2",
      Point3d.create(0, 10, 0),
      ColorDef.blue
    );
    assert.notEqual(sourceDb1.iVaultId, sourceDb2.iVaultId); // iVaultId must be different to detect provenance scope conflicts

    const targetDbFile = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "ConflictingScopes.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbFile, {
      rootSubject: { name: "Conflicting Scopes Test" },
    });

    const transformer1 = new IVaultTransformer(sourceDb1, targetDb); // did not set targetScopeElementId
    const transformer2 = new IVaultTransformer(sourceDb2, targetDb); // did not set targetScopeElementId

    await transformer1.process(); // first one succeeds using IVault.rootSubjectId as the default targetScopeElementId

    try {
      await transformer2.process(); // expect IVaultError to be thrown because of the targetScopeElementId conflict with second transformation
      assert.fail("Expected provenance scope conflict");
    } catch (e) {
      assert.isTrue(e instanceof IVaultError);
    } finally {
      transformer1.dispose();
      transformer2.dispose();
      sourceDb1.close();
      sourceDb2.close();
      targetDb.close();
    }
  });

  it("IVaultElementCloneContext remap tests", async () => {
    const iVaultDb: SnapshotDb = IVaultTransformerTestUtils.createTeamIVault(
      outputDir,
      "Test",
      Point3d.create(0, 0, 0),
      ColorDef.green
    );
    const cloneContext = new IVaultElementCloneContext(iVaultDb);
    const sourceId: Id64String = Id64.fromLocalAndBriefcaseIds(1, 1);
    const targetId: Id64String = Id64.fromLocalAndBriefcaseIds(1, 2);
    cloneContext.remapElement(sourceId, targetId);
    assert.equal(targetId, cloneContext.findTargetElementId(sourceId));
    assert.equal(Id64.invalid, cloneContext.findTargetElementId(targetId));
    assert.equal(Id64.invalid, cloneContext.findTargetCodeSpecId(targetId));
    assert.throws(() =>
      cloneContext.remapCodeSpec("SourceNotFound", "TargetNotFound")
    );
    cloneContext[Symbol.dispose]();
    iVaultDb.close();
  });

  it("should clone across schema versions", async () => {
    // NOTE: schema differences between 01.00.00 and 01.00.01 were crafted to reproduce a cloning bug. The goal of this test is to prevent regressions.
    const cloneTestSchema100 = TestUtils.IVaultTestUtils.resolveAssetFile(
      "CloneTest.01.00.00.dmschema.xml"
    );
    const cloneTestSchema101 = TestUtils.IVaultTestUtils.resolveAssetFile(
      "CloneTest.01.00.01.dmschema.xml"
    );

    const seedDb = SnapshotDb.openFile(
      TestUtils.IVaultTestUtils.resolveAssetFile("CompatibilityTestSeed.dtw")
    );
    const sourceDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "CloneWithSchemaChanges-Source.dtw"
    );
    const sourceDb = SnapshotDb.createFrom(seedDb, sourceDbFile);
    await sourceDb.importSchemas([cloneTestSchema100]);
    const sourceElementProps = {
      classFullName: "CloneTest:PhysicalType",
      model: IVault.dictionaryId,
      code: PhysicalType.createCode(sourceDb, IVault.dictionaryId, "Type1"),
      string1: "a",
      string2: "b",
    };
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const sourceElementId = sourceDb.elements.insertElement(sourceElementProps);
    const sourceElement = sourceDb.elements.getElement(sourceElementId);
    assert.equal(sourceElement.asAny.string1, "a");
    assert.equal(sourceElement.asAny.string2, "b");
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    const targetDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "CloneWithSchemaChanges-Target.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbFile, {
      rootSubject: { name: "CloneWithSchemaChanges-Target" },
    });
    await targetDb.importSchemas([cloneTestSchema101]);

    const transformer = new IVaultTransformer(sourceDb, targetDb);
    await transformer.processElement(sourceElementId);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    const targetElementId =
      transformer.context.findTargetElementId(sourceElementId);
    const targetElement = targetDb.elements.getElement(targetElementId);
    assert.equal(targetElement.asAny.string1, "a");
    assert.equal(targetElement.asAny.string2, "b");

    seedDb.close();
    sourceDb.close();
    targetDb.close();
  });

  it("Should not visit elements or relationships", async () => {
    // class that asserts if it encounters an element or relationship
    class TestExporter extends IVaultExportHandler {
      public iVaultExporter: IVaultExporter;
      public modelCount = 0;
      public constructor(iVaultDb: IVaultDb) {
        super();
        this.iVaultExporter = new IVaultExporter(iVaultDb);
        this.iVaultExporter.registerHandler(this);
      }
      public override async onExportModel(
        _model: Model,
        _isUpdate: boolean | undefined
      ): Promise<void> {
        ++this.modelCount;
      }
      public override async onExportElement(
        _element: Element,
        _isUpdate: boolean | undefined
      ): Promise<void> {
        assert.fail("Should not visit element when visitElements=false");
      }
      public override async onExportRelationship(
        _relationship: Relationship,
        _isUpdate: boolean | undefined
      ): Promise<void> {
        assert.fail(
          "Should not visit relationship when visitRelationship=false"
        );
      }
    }
    const sourceFileName = TestUtils.IVaultTestUtils.resolveAssetFile(
      "CompatibilityTestSeed.dtw"
    );
    const sourceDb: SnapshotDb = SnapshotDb.openFile(sourceFileName);
    const exporter = new TestExporter(sourceDb);
    exporter.iVaultExporter.visitElements = false;
    exporter.iVaultExporter.visitRelationships = false;
    // call various methods to make sure the onExport* callbacks don't assert
    await exporter.iVaultExporter.exportAll();
    await exporter.iVaultExporter.exportElement(IVault.rootSubjectId);
    await exporter.iVaultExporter.exportChildElements(IVault.rootSubjectId);
    await exporter.iVaultExporter.exportModelContents(IVault.repositoryModelId);
    await exporter.iVaultExporter.exportRelationships(
      ElementRefersToElements.classFullName
    );
    // make sure the exporter actually visited something
    assert.isAtLeast(exporter.modelCount, 4);
    sourceDb.close();
  });

  it("Should filter by ViewDefinition", async () => {
    const sourceDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "FilterByView-Source.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbFile, {
      rootSubject: { name: "FilterByView-Source" },
    });
    const categoryNames: string[] = ["C1", "C2", "C3", "C4", "C5"];
    categoryNames.forEach((categoryName) => {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      const categoryId = SpatialCategory.insert(
        sourceDb,
        IVault.dictionaryId,
        categoryName,
        {}
      );
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      CategorySelector.insert(sourceDb, IVault.dictionaryId, categoryName, [
        categoryId,
      ]);
    });
    const modelNames: string[] = ["MA", "MB", "MC", "MD"];
    modelNames.forEach((modelName) => {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      const modelId = PhysicalModel.insert(
        sourceDb,
        IVault.rootSubjectId,
        modelName
      );
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      ModelSelector.insert(sourceDb, IVault.dictionaryId, modelName, [modelId]);
    });
    const projectExtents = new Range3d();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const displayStyleId = DisplayStyle3d.insert(
      sourceDb,
      IVault.dictionaryId,
      "DisplayStyle"
    );
    for (let x = 0; x < categoryNames.length; x++) {
      // eslint-disable-line @typescript-eslint/prefer-for-of
      const categoryId = sourceDb.elements.queryElementIdByCode(
        SpatialCategory.createCode(
          sourceDb,
          IVault.dictionaryId,
          categoryNames[x]
        )
      )!;
      const categorySelectorId = sourceDb.elements.queryElementIdByCode(
        CategorySelector.createCode(
          sourceDb,
          IVault.dictionaryId,
          categoryNames[x]
        )
      )!;
      for (let y = 0; y < modelNames.length; y++) {
        // eslint-disable-line @typescript-eslint/prefer-for-of
        const modelId = sourceDb.elements.queryElementIdByCode(
          PhysicalPartition.createCode(
            sourceDb,
            IVault.rootSubjectId,
            modelNames[y]
          )
        )!;
        const modelSelectorId = sourceDb.elements.queryElementIdByCode(
          ModelSelector.createCode(sourceDb, IVault.dictionaryId, modelNames[y])
        )!;
        const physicalObjectProps: PhysicalElementProps = {
          classFullName: PhysicalObject.classFullName,
          model: modelId,
          category: categoryId,
          code: Code.createEmpty(),
          userLabel: `${PhysicalObject.className}-${categoryNames[x]}-${modelNames[y]}`,
          geom: IVaultTransformerTestUtils.createBox(
            Point3d.create(1, 1, 1),
            categoryId
          ),
          placement: {
            origin: Point3d.create(x * 2, y * 2, 0),
            angles: YawPitchRollAngles.createDegrees(0, 0, 0),
          },
        };
        const physicalObjectId =
          // eslint-disable-next-line @typescript-eslint/no-deprecated
          sourceDb.elements.insertElement(physicalObjectProps);
        const physicalObject = sourceDb.elements.getElement<PhysicalObject>(
          physicalObjectId,
          PhysicalObject
        );
        const viewExtents = physicalObject.placement.calculateRange();
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        OrthographicViewDefinition.insert(
          sourceDb,
          IVault.dictionaryId,
          `View-${categoryNames[x]}-${modelNames[y]}`,
          modelSelectorId,
          categorySelectorId,
          displayStyleId,
          viewExtents,
          StandardViewIndex.Iso
        );
        projectExtents.extendRange(viewExtents);
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.updateProjectExtents(projectExtents);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const exportCategorySelectorId = CategorySelector.insert(
      sourceDb,
      IVault.dictionaryId,
      "Export",
      [
        sourceDb.elements.queryElementIdByCode(
          SpatialCategory.createCode(
            sourceDb,
            IVault.dictionaryId,
            categoryNames[0]
          )
        )!,
        sourceDb.elements.queryElementIdByCode(
          SpatialCategory.createCode(
            sourceDb,
            IVault.dictionaryId,
            categoryNames[2]
          )
        )!,
        sourceDb.elements.queryElementIdByCode(
          SpatialCategory.createCode(
            sourceDb,
            IVault.dictionaryId,
            categoryNames[4]
          )
        )!,
      ]
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const exportModelSelectorId = ModelSelector.insert(
      sourceDb,
      IVault.dictionaryId,
      "Export",
      [
        sourceDb.elements.queryElementIdByCode(
          PhysicalPartition.createCode(
            sourceDb,
            IVault.rootSubjectId,
            modelNames[1]
          )
        )!,
        sourceDb.elements.queryElementIdByCode(
          PhysicalPartition.createCode(
            sourceDb,
            IVault.rootSubjectId,
            modelNames[3]
          )
        )!,
      ]
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const exportViewId = OrthographicViewDefinition.insert(
      sourceDb,
      IVault.dictionaryId,
      "Export",
      exportModelSelectorId,
      exportCategorySelectorId,
      displayStyleId,
      projectExtents,
      StandardViewIndex.Iso
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    const targetDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "FilterByView-Target.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbFile, {
      rootSubject: { name: "FilterByView-Target" },
    });
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.updateProjectExtents(sourceDb.projectExtents);

    const transformer = await FilterByViewTransformer.create(
      sourceDb,
      targetDb,
      exportViewId
    );
    await transformer.processSchemas();
    await transformer.process();
    transformer.dispose();

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();
    targetDb.close();
    sourceDb.close();
  });

  it("processSchemas should handle out-of-order exported schemas", async () => {
    const testSchema1Path = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "TestSchema1.dmschema.xml"
    );
    IVaultJsFs.writeFileSync(
      testSchema1Path,
      `<?xml version="1.0" encoding="UTF-8"?>
      <DMSchema schemaName="TestSchema1" alias="ts1" version="01.00" xmlns="http://www.szewec.com/schemas/Szewec.DMXML.3.1">
          <DMSchemaReference name="BisCore" version="01.00" alias="bis"/>
          <DMEntityClass typeName="TestElement1">
            <BaseClass>bis:PhysicalElement</BaseClass>
            <DMProperty propertyName="MyProp1" typeName="string"/>
          </DMEntityClass>
      </DMSchema>`
    );

    const testSchema2Path = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "TestSchema2.dmschema.xml"
    );
    IVaultJsFs.writeFileSync(
      testSchema2Path,
      `<?xml version="1.0" encoding="UTF-8"?>
      <DMSchema schemaName="TestSchema2" alias="ts2" version="01.00.00" xmlns="http://www.szewec.com/schemas/Szewec.DMXML.3.2">
          <DMSchemaReference name="BisCore" version="01.00.00" alias="bis"/>
          <DMSchemaReference name="TestSchema1" version="01.00.00" alias="ts1"/>
          <DMEntityClass typeName="TestElement2">
            <BaseClass>ts1:TestElement1</BaseClass>
            <DMProperty propertyName="MyProp2" typeName="string"/>
          </DMEntityClass>
      </DMSchema>`
    );

    const sourceDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "OrderTestSource.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbPath, {
      rootSubject: { name: "Order Test" },
    });

    await sourceDb.importSchemas([testSchema1Path, testSchema2Path]);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    class OrderedExporter extends IVaultExporter {
      public override async exportSchemas() {
        const schemaLoader = new SchemaLoader((name: string) =>
          this.sourceDb.getSchemaProps(name)
        );
        const schema1 = schemaLoader.getSchema("TestSchema1");
        const schema2 = schemaLoader.getSchema("TestSchema2");
        // by importing schema2 (which references schema1) first, we
        // prove that the import order in processSchemas does not matter
        await this.handler.onExportSchema(schema2);
        await this.handler.onExportSchema(schema1);
      }
    }

    const targetDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "OrderTestTarget.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbPath, {
      rootSubject: { name: "Order Test" },
    });
    const transformer = new IVaultTransformer(
      new OrderedExporter(sourceDb),
      targetDb
    );

    let error: any;
    try {
      await transformer.processSchemas();
    } catch (_error) {
      error = _error;
    }
    assert.isUndefined(error);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();
    const targetImportedSchemasLoader = new SchemaLoader((name: string) =>
      targetDb.getSchemaProps(name)
    );
    const schema1InTarget =
      targetImportedSchemasLoader.getSchema("TestSchema1");
    assert.isDefined(schema1InTarget);
    const schema2InTarget =
      targetImportedSchemasLoader.getSchema("TestSchema2");
    assert.isDefined(schema2InTarget);

    sourceDb.close();
    targetDb.close();
  });

  it("processSchemas should wait for the schema import to finish to delete the export directory", async () => {
    const cloneTestSchema100 = TestUtils.IVaultTestUtils.resolveAssetFile(
      "CloneTest.01.00.00.dmschema.xml"
    );
    const sourceDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "FinallyFirstTest.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbPath, {
      rootSubject: { name: "FinallyFirstTest" },
    });
    await sourceDb.importSchemas([cloneTestSchema100]);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    const targetDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "FinallyFirstTestOut.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbPath, {
      rootSubject: { name: "FinallyFirstTest" },
    });
    const transformer = new IVaultTransformer(sourceDb, targetDb);

    const importSchemasResolved = sinon.spy();
    let importSchemasPromise: Promise<void>;

    sinon.replace(
      targetDb,
      "importSchemas",
      sinon.fake(async () => {
        importSchemasPromise = new Promise((resolve) =>
          setImmediate(() => {
            importSchemasResolved();
            resolve(undefined);
          })
        );
        return importSchemasPromise;
      })
    );

    const removeSyncSpy = sinon.spy(IVaultJsFs, "removeSync");

    await transformer.processSchemas();
    assert(removeSyncSpy.calledAfter(importSchemasResolved));

    sinon.restore();
    sourceDb.close();
    targetDb.close();
  });

  it("handles definition element scoped by non-definitional element", async () => {
    const sourceDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "BadReferencesExampleSource.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbPath, {
      rootSubject: { name: "BadReferenceExampleSource" },
    });

    // create a document partition in our iVault's root
    const documentListModelId = DocumentListModel.insert(
      sourceDb,
      IVaultDb.rootSubjectId,
      "DocumentList"
    );

    // add a drawing to the document partition's model
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const drawingId = sourceDb.elements.insertElement({
      classFullName: Drawing.classFullName,
      model: documentListModelId,
      code: Drawing.createCode(sourceDb, documentListModelId, "Drawing"),
    });
    expect(Id64.isValidId64(drawingId)).to.be.true;

    // submodel our drawing with a DrawingModel
    const model = sourceDb.models.createModel({
      classFullName: DrawingModel.classFullName,
      modeledElement: { id: drawingId },
    });
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.models.insertModel(model.toJSON());

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const myCodeSpecId = sourceDb.codeSpecs.insert(
      CodeSpec.create(sourceDb, "MyCodeSpec", CodeScopeSpec.Type.RelatedElement)
    );

    // insert a definition element which is scoped by a non-definition element (the drawing)
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const _physicalMaterialId = sourceDb.elements.insertElement({
      classFullName: GenericPhysicalMaterial.classFullName,
      model: IVault.dictionaryId,
      code: new Code({
        spec: myCodeSpecId,
        scope: drawingId,
        value: "physical material",
      }),
    } as DefinitionElementProps);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    const targetDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "BadReferenceExampleTarget.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbPath, {
      rootSubject: { name: sourceDb.rootSubject.name },
    });
    const transformer = new IVaultTransformer(sourceDb, targetDb);

    await expect(transformer.processSchemas()).to.eventually.be.fulfilled;
    await expect(transformer.process()).to.eventually.be.fulfilled;

    // check if target ivault has the elements that source ivault had
    expect(targetDb.codeSpecs.hasName("MyCodeSpec")).to.be.true;
    const myCodeSpecIdTarget = targetDb.codeSpecs.getByName("MyCodeSpec").id;
    expect(myCodeSpecIdTarget).to.not.be.undefined;
    const drawingIdTarget = targetDb.elements.queryElementIdByCode(
      Drawing.createCode(targetDb, documentListModelId, "Drawing")
    ) as string;
    expect(Id64.isValidId64(drawingIdTarget)).to.be.true;
    const physicalMaterialIdTarget = targetDb.elements.queryElementIdByCode(
      new Code({
        spec: myCodeSpecIdTarget,
        scope: drawingIdTarget,
        value: "physical material",
      })
    );
    expect(physicalMaterialIdTarget).to.not.be.undefined;
    expect(Id64.isValidId64(physicalMaterialIdTarget as string)).to.be.true;

    sourceDb.close();
    targetDb.close();
  });

  it("handle backwards related-instance code in model", async () => {
    const sourceDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "BadReferencesExampleSource.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbPath, {
      rootSubject: { name: "BadReferenceExampleSource" },
    });

    // create a document partition in our iVault's root
    const documentListModelId = DocumentListModel.insert(
      sourceDb,
      IVaultDb.rootSubjectId,
      "DocumentList"
    );

    // add a drawing to the document partition's model
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const drawing1Id = sourceDb.elements.insertElement({
      classFullName: Drawing.classFullName,
      model: documentListModelId,
      code: Drawing.createCode(sourceDb, documentListModelId, "Drawing1"),
    });

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const drawing2Id = sourceDb.elements.insertElement({
      classFullName: Drawing.classFullName,
      model: documentListModelId,
      code: Drawing.createCode(sourceDb, documentListModelId, "Drawing2"),
    });

    const drawingModel1 = sourceDb.models.createModel({
      classFullName: DrawingModel.classFullName,
      modeledElement: { id: drawing1Id },
    });
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const drawingModel1Id = sourceDb.models.insertModel(drawingModel1.toJSON());

    const drawingModel2 = sourceDb.models.createModel({
      classFullName: DrawingModel.classFullName,
      modeledElement: { id: drawing2Id },
    });
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const drawingModel2Id = sourceDb.models.insertModel(drawingModel2.toJSON());

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const modelCodeSpec = sourceDb.codeSpecs.insert(
      CodeSpec.create(sourceDb, "ModelCodeSpec", CodeScopeSpec.Type.Model)
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const relatedCodeSpecId = sourceDb.codeSpecs.insert(
      CodeSpec.create(
        sourceDb,
        "RelatedCodeSpec",
        CodeScopeSpec.Type.RelatedElement
      )
    );

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const categoryId = DrawingCategory.insert(
      sourceDb,
      IVault.dictionaryId,
      "DrawingCategory",
      { color: ColorDef.green.toJSON() }
    );

    // we make drawingGraphic2 in drawingModel2 first
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const drawingGraphic2Id = sourceDb.elements.insertElement({
      classFullName: DrawingGraphic.classFullName,
      model: drawingModel2Id,
      code: new Code({
        spec: modelCodeSpec,
        scope: drawingModel2Id,
        value: "drawing graphic 2",
      }),
      category: categoryId,
    } as GeometricElement2dProps);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const _drawingGraphic1Id = sourceDb.elements.insertElement({
      classFullName: DrawingGraphic.classFullName,
      model: drawingModel1Id,
      code: new Code({
        spec: relatedCodeSpecId,
        scope: drawingGraphic2Id,
        value: "drawing graphic 1",
      }),
      category: categoryId,
    } as GeometricElement2dProps);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    const targetDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "BadReferenceExampleTarget.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbPath, {
      rootSubject: { name: sourceDb.rootSubject.name },
    });
    const transformer = new IVaultTransformer(sourceDb, targetDb);

    await expect(transformer.processSchemas()).to.eventually.be.fulfilled;
    await expect(transformer.process()).to.eventually.be.fulfilled;

    // check if target ivault has the elements that source ivault had
    expect(targetDb.codeSpecs.hasName("ModelCodeSpec")).to.be.true;
    expect(targetDb.codeSpecs.hasName("RelatedCodeSpec")).to.be.true;
    const drawingIdTarget1 = targetDb.elements.queryElementIdByCode(
      Drawing.createCode(targetDb, documentListModelId, "Drawing1")
    );
    expect(drawingIdTarget1).to.not.be.undefined;
    expect(Id64.isValidId64(drawingIdTarget1 as string)).to.be.true;

    const drawingIdTarget2 = targetDb.elements.queryElementIdByCode(
      Drawing.createCode(targetDb, documentListModelId, "Drawing2")
    );
    expect(drawingIdTarget2).to.not.be.undefined;
    expect(Id64.isValidId64(drawingIdTarget2 as string)).to.be.true;

    const drawingGraphicIdTarget2Props =
      targetDb.elements.getElementProps(drawingGraphic2Id);
    expect(
      targetDb.elements.queryElementIdByCode(
        new Code(drawingGraphicIdTarget2Props.code)
      )
    ).to.not.be.undefined;
    expect(
      Id64.isValidId64(
        targetDb.elements.queryElementIdByCode(
          new Code(drawingGraphicIdTarget2Props.code)
        ) as string
      )
    ).to.be.true;

    const drawingGraphicIdTarget1Props =
      targetDb.elements.getElementProps(_drawingGraphic1Id);
    expect(
      targetDb.elements.queryElementIdByCode(
        new Code(drawingGraphicIdTarget1Props.code)
      )
    ).to.not.be.undefined;
    expect(
      Id64.isValidId64(
        targetDb.elements.queryElementIdByCode(
          new Code(drawingGraphicIdTarget1Props.code)
        ) as string
      )
    ).to.be.true;
    sourceDb.close();
    targetDb.close();
  });

  // for testing purposes only, based on SetToStandalone.ts, force a snapshot to mimic a standalone iVault
  function setToStandalone(iVaultName: string) {
    StandaloneDb.convertToStandalone(iVaultName);
  }

  it("biscore update is valid", async () => {
    const sourceDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "BisCoreUpdateSource.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbPath, {
      rootSubject: { name: "BisCoreUpdate" },
    });

    // this seed has an old biscore, so we know that transforming an empty source (which starts with a fresh, updated biscore)
    // will cause an update to the old biscore in this target
    const targetDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "BisCoreUpdateTarget.dtw"
    );
    const seedDb = SnapshotDb.openFile(
      TestUtils.IVaultTestUtils.resolveAssetFile("CompatibilityTestSeed.dtw")
    );
    const targetDbTestCopy = SnapshotDb.createFrom(seedDb, targetDbPath);
    targetDbTestCopy.close();
    seedDb.close();
    setToStandalone(targetDbPath);
    // StandaloneDb.upgradeStandaloneSchemas is the suggested method to handle a profile upgrade but that will also upgrade
    // the BisCore schema.  This test is explicitly testing that the BisCore schema will be updated from the source iVault
    const nativeDb = StandaloneDb.openBldDb(
      { path: targetDbPath },
      OpenMode.ReadWrite,
      { profile: ProfileOptions.Upgrade, schemaLockHeld: true }
    );
    nativeDb.closeFile();
    const targetDb = StandaloneDb.openFile(targetDbPath);

    assert(
      Semver.lt(
        Schema.toSemverString(targetDb.querySchemaVersion("BisCore")!),
        Schema.toSemverString(sourceDb.querySchemaVersion("BisCore")!)
      ),
      "The targetDb must have a less up-to-date version of the BisCore schema than the source"
    );

    const transformer = new IVaultTransformer(sourceDb, targetDb);
    await transformer.processSchemas();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    assert(
      Semver.eq(
        Schema.toSemverString(targetDb.querySchemaVersion("BisCore")!),
        Schema.toSemverString(sourceDb.querySchemaVersion("BisCore")!)
      ),
      "The targetDb must now have an equivalent BisCore schema because it was updated"
    );

    sourceDb.close();
    targetDb.close();
  });

  /** gets a mapping of element ids to their content ignoring or removing variance that is expected when transforming */
  async function getAllElementsInvariants(
    db: IVaultDb,
    filterPredicate?: (element: Element) => boolean
  ) {
    // The set of element Ids where the fed guid should be ignored (since it can change between transforms).
    const ignoreFedGuidElementIds = new Set<Id64String>([
      IVault.rootSubjectId,
      IVault.dictionaryId,
      "0xe", // id of realityDataSourcesModel
    ]);
    const result: Record<Id64String, any> = {};
    for await (const row of db.createQueryReader(
      "SELECT * FROM bis.Element",
      undefined,
      {
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        rowFormat: QueryRowFormat.UseJsPropertyNames,
      }
    )) {
      if (!filterPredicate || filterPredicate(db.elements.getElement(row.id))) {
        const { lastMod: _lastMod, ...invariantPortion } = row;
        if (ignoreFedGuidElementIds.has(row.id))
          delete invariantPortion.federationGuid;
        result[row.id] = invariantPortion;
      }
    }
    return result;
  }

  /** gets the ordered list of the relationships inserted earlier */
  async function getInvariantRelationsContent(
    db: IVaultDb,
    filterPredicate?: (rel: { sourceId: string; targetId: string }) => boolean
  ): Promise<{ sourceId: Id64String; targetId: Id64String }[]> {
    const result = [];
    for await (const row of db.createQueryReader(
      "SELECT * FROM bis.ElementRefersToElements",
      undefined,
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      { rowFormat: QueryRowFormat.UseJsPropertyNames }
    )) {
      const { sourceId, targetId } = row;
      if (!filterPredicate || filterPredicate({ sourceId, targetId })) {
        result.push({ sourceId, targetId });
      }
    }
    return result;
  }

  it("preserveId option preserves element ids, not other entity ids", async () => {
    const sourceDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "PreserveIdSource.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbPath, {
      rootSubject: { name: "PreserveId" },
    });

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const spatialCateg1Id = SpatialCategory.insert(
      sourceDb,
      IVaultDb.dictionaryId,
      "spatial-category1",
      { color: ColorDef.blue.toJSON() }
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const spatialCateg2Id = SpatialCategory.insert(
      sourceDb,
      IVaultDb.dictionaryId,
      "spatial-category2",
      { color: ColorDef.red.toJSON() }
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const myPhysModelId = PhysicalModel.insert(
      sourceDb,
      IVaultDb.rootSubjectId,
      "myPhysicalModel"
    );
    const _physicalObjectIds = [
      spatialCateg1Id,
      spatialCateg2Id,
      spatialCateg2Id,
      spatialCateg2Id,
      spatialCateg2Id,
    ].map((categoryId, x) => {
      const physicalObjectProps: PhysicalElementProps = {
        classFullName: PhysicalObject.classFullName,
        model: myPhysModelId,
        category: categoryId,
        code: Code.createEmpty(),
        userLabel: `PhysicalObject(${x})`,
        geom: IVaultTransformerTestUtils.createBox(Point3d.create(1, 1, 1)),
        placement: Placement3d.fromJSON({ origin: { x }, angles: {} }),
      };
      const physicalObjectId =
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        sourceDb.elements.insertElement(physicalObjectProps);
      return physicalObjectId;
    });

    // these link table relationships (ElementRefersToElements > PartitionOriginatesFromRepository) are examples of non-element entities
    const physicalPartitions = new Array(3)
      .fill(null)
      .map((_, index) =>
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        sourceDb.elements.insertElement({
          classFullName: PhysicalPartition.classFullName,
          model: IVaultDb.rootSubjectId,
          parent: {
            id: IVaultDb.rootSubjectId,
            relClassName: ElementOwnsChildElements.classFullName,
          },
          code: PhysicalPartition.createCode(
            sourceDb,
            IVaultDb.rootSubjectId,
            `physical-partition-${index}`
          ),
        } as InformationPartitionElementProps)
      )
      .map((partitionId) => {
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        const modelId = sourceDb.models.insertModel({
          classFullName: PhysicalModel.classFullName,
          modeledElement: { id: partitionId },
        } as ModelProps);
        return { modelId, partitionId }; // these are the same id because of submodeling
      });

    const linksIds = new Array(2).fill(null).map((_, index) => {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      const linkId = sourceDb.elements.insertElement({
        classFullName: RepositoryLink.classFullName,
        code: RepositoryLink.createCode(
          sourceDb,
          IVaultDb.rootSubjectId,
          `repo-link-${index}`
        ),
        model: IVaultDb.rootSubjectId,
        repositoryGuid: `2fd0e5ed-a4d7-40cd-be8a-57552f5736b${index}`, // random, doesn't matter, works for up to 10 of course
        format: "my-format",
      } as RepositoryLinkProps);
      return linkId;
    });

    const _nonElementEntityIds = [
      [physicalPartitions[1].partitionId, linksIds[0]],
      [physicalPartitions[1].partitionId, linksIds[1]],
      [physicalPartitions[2].partitionId, linksIds[0]],
      [physicalPartitions[2].partitionId, linksIds[1]],
    ].map(([sourceId, targetId]) =>
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      sourceDb.relationships.insertInstance({
        classFullName: "BisCore:PartitionOriginatesFromRepository",
        sourceId,
        targetId,
      })
    );

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    const targetDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "PreserveIdTarget.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbPath, {
      rootSubject: { name: "PreserveId" },
    });

    const spatialCateg2 =
      sourceDb.elements.getElement<SpatialCategory>(spatialCateg2Id);

    /** filter the category and all related elements from the source for transformation */
    function filterCategoryTransformationPredicate(elem: Element): boolean {
      // if we don't filter out the elements, the transformer will see that the category is a reference
      // and re-add it to the transformation.
      if (elem instanceof GeometricElement && elem.category === spatialCateg2Id)
        return false;
      if (elem.id === spatialCateg2Id) return false;
      return true;
    }

    /** filter the category and all related elements from the source for transformation */
    function filterRelationshipsToChangeIds({
      sourceId,
      targetId,
    }: {
      sourceId: Id64String;
      targetId: Id64String;
    }): boolean {
      // matches source+target of _nonElementEntityIds[0]
      if (
        sourceId === physicalPartitions[1].partitionId &&
        targetId === linksIds[0]
      )
        return false;
      return true;
    }

    /** filter the category and all related and child elements from the source for comparison, not transformation */
    function filterCategoryContentsPredicate(elem: Element): boolean {
      if (elem instanceof GeometricElement && elem.category === spatialCateg2Id)
        return false;
      if (elem.id === spatialCateg2Id) return false;
      if (elem.id === spatialCateg2.myDefaultSubCategoryId()) return false;
      return true;
    }

    class FilterCategoryTransformer extends IVaultTransformer {
      public override async shouldExportElement(
        elem: Element
      ): Promise<boolean> {
        if (!filterCategoryTransformationPredicate(elem)) return false;
        return super.shouldExportElement(elem);
      }
      public override async shouldExportRelationship(
        rel: Relationship
      ): Promise<boolean> {
        if (!filterRelationshipsToChangeIds(rel)) return false;
        return super.shouldExportRelationship(rel);
      }
    }

    const transformer = new FilterCategoryTransformer(sourceDb, targetDb, {
      preserveElementIdsForFiltering: true,
    });
    await transformer.process();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    const sourceContent = await getAllElementsInvariants(
      sourceDb,
      filterCategoryContentsPredicate
    );
    const targetContent = await getAllElementsInvariants(targetDb);
    expect(targetContent).to.deep.equal(sourceContent);

    const sourceRelations = await getInvariantRelationsContent(
      sourceDb,
      filterRelationshipsToChangeIds
    );
    const targetRelations = await getInvariantRelationsContent(targetDb);
    expect(sourceRelations).to.deep.equal(targetRelations);

    // now try inserting both an element and a relationship into the target to check the two entity id sequences are fine
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const spatialCateg3Id = SpatialCategory.insert(
      targetDb,
      IVaultDb.dictionaryId,
      "spatial-category3",
      { color: ColorDef.black.toJSON() }
    );
    expect(Id64.isValid(spatialCateg3Id)).to.be.true;
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const spatialCateg3Subcateg1Id = SubCategory.insert(
      targetDb,
      spatialCateg3Id,
      "spatial-categ-subcateg-1",
      { color: ColorDef.white.toJSON() }
    );
    expect(Id64.isValid(spatialCateg3Subcateg1Id)).to.be.true;
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const insertedInstance = targetDb.relationships.insertInstance({
      classFullName: "BisCore:PartitionOriginatesFromRepository",
      sourceId: physicalPartitions[1].partitionId,
      targetId: linksIds[0],
    });
    expect(Id64.isValid(insertedInstance)).to.be.true;

    sourceDb.close();
    targetDb.close();
  });

  it("preserveId on test model", async () => {
    const seedDb = SnapshotDb.openFile(
      TestUtils.IVaultTestUtils.resolveAssetFile("CompatibilityTestSeed.dtw")
    );
    const sourceDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "PreserveIdOnTestModel-Source.dtw"
    );
    // transforming the seed to an empty will update it to the latest bis from the new target
    // which minimizes differences we'd otherwise need to filter later
    const sourceDb = SnapshotDb.createEmpty(sourceDbPath, {
      rootSubject: seedDb.rootSubject,
    });
    const seedTransformer = new IVaultTransformer(seedDb, sourceDb);
    await seedTransformer.process();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    const targetDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "PreserveIdOnTestModel-Target.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbPath, {
      rootSubject: sourceDb.rootSubject,
    });

    const transformer = new IVaultTransformer(sourceDb, targetDb, {
      preserveElementIdsForFiltering: true,
    });
    await transformer.process();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    const sourceContent = await getAllElementsInvariants(sourceDb);
    const targetContent = await getAllElementsInvariants(targetDb);
    expect(targetContent).to.deep.equal(sourceContent);

    sourceDb.close();
    targetDb.close();
  });

  function createIVaultWithDanglingReference(opts: {
    name: string;
    path: string;
  }) {
    const sourceDb = SnapshotDb.createEmpty(opts.path, {
      rootSubject: { name: opts.name },
    });

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const sourceCategoryId = SpatialCategory.insert(
      sourceDb,
      IVault.dictionaryId,
      "SpatialCategory",
      { color: ColorDef.green.toJSON() }
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const sourceModelId = PhysicalModel.insert(
      sourceDb,
      IVault.rootSubjectId,
      "Physical"
    );
    const myPhysObjCodeSpec = CodeSpec.create(
      sourceDb,
      "myPhysicalObjects",
      CodeScopeSpec.Type.ParentElement
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const myPhysObjCodeSpecId = sourceDb.codeSpecs.insert(myPhysObjCodeSpec);
    const physicalObjects = [1, 2].map((x) => {
      const code = new Code({
        spec: myPhysObjCodeSpecId,
        scope: sourceModelId,
        value: `PhysicalObject(${x})`,
      });
      const props: PhysicalElementProps = {
        classFullName: PhysicalObject.classFullName,
        model: sourceModelId,
        category: sourceCategoryId,
        code,
        userLabel: `PhysicalObject(${x})`,
        geom: IVaultTransformerTestUtils.createBox(Point3d.create(1, 1, 1)),
        placement: Placement3d.fromJSON({ origin: { x }, angles: {} }),
      };
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      const id = sourceDb.elements.insertElement(props);
      return { code, id };
    });
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const displayStyleId = DisplayStyle3d.insert(
      sourceDb,
      IVault.dictionaryId,
      "MyDisplayStyle",
      {
        excludedElements: physicalObjects.map((o) => o.id),
      }
    );
    const displayStyleCode = sourceDb.elements.getElement(displayStyleId).code;

    const physObjId2 = physicalObjects[1].id;
    // this deletion makes the display style have an reference to a now-gone element
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.elements.deleteElement(physObjId2);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    return [
      sourceDb,
      {
        sourceCategoryId,
        sourceModelId,
        physicalObjects,
        displayStyleId,
        displayStyleCode,
        myPhysObjCodeSpec,
      },
    ] as const;
  }

  function createEmptyTargetWithIdsStartingAfterSource(
    sourceDb: IVaultDb,
    createTarget: () => StandaloneDb
  ): StandaloneDb {
    const nextId = (db: IVaultDb) =>
      db.withSqliteStatement(
        "SELECT Val FROM be_Local WHERE Name='bis_elementidsequence'",
        (s) => [...s]
      )[0].val;
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges(); // save to make sure we get the latest id value
    const sourceNextId = nextId(sourceDb);
    const targetDb = createTarget();
    const pathName = targetDb.pathName;
    targetDb.withSqliteStatement(
      "UPDATE be_Local SET Val=? WHERE Name='bis_elementidsequence'",
      (s) => {
        s.bindInteger(1, sourceNextId + 1);
        assert(s.step() === DbResult.BE_SQLITE_DONE);
      }
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();
    targetDb.close();
    return StandaloneDb.openFile(pathName);
  }

  /**
   * A transformer that resets the target's id sequence to ensure the target doesn't end up with the same ids as the source.
   * Useful if you need to check that some source/target element references match and want to be sure it isn't a coincidence.
   * @note it modifies the target so there are side effects
   */
  class ShiftedIdsEmptyTargetTransformer extends IVaultTransformer {
    constructor(
      source: IVaultDb,
      createTarget: () => StandaloneDb,
      options?: IVaultTransformOptions
    ) {
      super(
        source,
        createEmptyTargetWithIdsStartingAfterSource(source, createTarget),
        options
      );
    }
  }

  /** combination of @see AssertOrderTransformer and @see ShiftedIdsEmptyTargetTransformer */
  class AssertOrderAndShiftIdsTransformer extends AssertOrderTransformer {
    constructor(
      order: Id64String[],
      source: IVaultDb,
      createTarget: () => StandaloneDb,
      options?: IVaultTransformOptions
    ) {
      super(
        order,
        source,
        createEmptyTargetWithIdsStartingAfterSource(source, createTarget),
        options
      );
    }
  }

  it("process() with preserveElementIdsForFiltering set to true should re-add deleted element with same id", async () => {
    const sourceDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "PreserveIdOnTestModel-Source.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbPath, {
      rootSubject: { name: "iVaultA" },
    });
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    Subject.insert(sourceDb, IVault.rootSubjectId, "Subject1");
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    const targetDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "PreserveIdOnTestModel-Target.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbPath, {
      rootSubject: sourceDb.rootSubject,
    });

    // Execute process() so that elements from source are copied to target
    const transformer = new IVaultTransformer(sourceDb, targetDb, {
      preserveElementIdsForFiltering: true,
    });
    await transformer.process();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    let sourceContent = await getAllElementsInvariants(sourceDb);
    let targetContent = await getAllElementsInvariants(targetDb);
    expect(targetContent).to.deep.equal(sourceContent);

    // Delete subject 1 from target
    const code1 = Subject.createCode(
      targetDb,
      IVault.rootSubjectId,
      "Subject1"
    );
    const targetSubjectId1 = targetDb.elements.queryElementIdByCode(code1);
    expect(targetSubjectId1).to.not.be.undefined;
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.elements.deleteElement(targetSubjectId1!);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    // Calling process() for second time with option to preserve elements in hopes of restoring deleted element
    const secondTransformer = new IVaultTransformer(sourceDb, targetDb, {
      preserveElementIdsForFiltering: true,
    });
    await secondTransformer.process(); // should not throw error: duplicate code (65547) and should re-add deleted element
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    // verify that deleted element in target is added back - redundant check for explicitness
    const sourceElementJSON = sourceDb.elements
      .getElement<Subject>(targetSubjectId1!)
      .toJSON();
    const deletedElementInTargetJSON = targetDb.elements
      .getElement<Subject>(targetSubjectId1!)
      .toJSON();
    expect(sourceElementJSON).to.be.deep.equal(deletedElementInTargetJSON);

    sourceContent = await getAllElementsInvariants(sourceDb);
    targetContent = await getAllElementsInvariants(targetDb);
    expect(targetContent).to.deep.equal(sourceContent);

    sourceDb.close();
    targetDb.close();
  });

  it("process() with preserveElementIdsForFiltering set to true should update the element properties if element exists with desired id in target", async () => {
    const sourceDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "PreserveIdOnTestModel-Source.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbPath, {
      rootSubject: { name: "iVaultA" },
    });
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const sourceSubjectId = Subject.insert(
      sourceDb,
      IVault.rootSubjectId,
      "Subject1"
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    const targetDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "PreserveIdOnTestModel-Target.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbPath, {
      rootSubject: sourceDb.rootSubject,
    });

    // Execute process() so that elements from source are copied to target
    const transformer = new IVaultTransformer(sourceDb, targetDb, {
      preserveElementIdsForFiltering: true,
    });
    await transformer.process();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    let sourceContent = await getAllElementsInvariants(sourceDb);
    let targetContent = await getAllElementsInvariants(targetDb);
    expect(targetContent).to.deep.equal(sourceContent);

    // update subject in source
    const sourceSubject =
      sourceDb.elements.getElement<Subject>(sourceSubjectId);
    const updatedDescription = "Subject1 Updated Description";
    sourceSubject.description = updatedDescription;
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.elements.updateElement(sourceSubject.toJSON());
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    // Calling process() for second time with option to preserve elements in hopes of updating element with desired id
    const secondTransformer = new IVaultTransformer(sourceDb, targetDb, {
      preserveElementIdsForFiltering: true,
    });
    await secondTransformer.process(); // should update description for subject element
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    // target subject should have updated description
    const targetSubjectDescription =
      targetDb.elements.getElement<Subject>(sourceSubjectId).description;
    expect(targetSubjectDescription).to.equal(updatedDescription);

    sourceContent = await getAllElementsInvariants(sourceDb);
    targetContent = await getAllElementsInvariants(targetDb);
    expect(targetContent).to.deep.equal(sourceContent);

    sourceDb.close();
    targetDb.close();
  });

  it("process() with preserveElementIdsForFiltering set to true should not throw when called on 2 identical iVaults", async () => {
    const seedDb = SnapshotDb.openFile(
      TestUtils.IVaultTestUtils.resolveAssetFile("CompatibilityTestSeed.dtw")
    );
    const sourceDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "PreserveIdOnTestModel-Source.dtw"
    );
    // transforming the seed to an empty will update it to the latest bis from the new target
    // which minimizes differences we'd otherwise need to filter later
    const sourceDb = SnapshotDb.createEmpty(sourceDbPath, {
      rootSubject: seedDb.rootSubject,
    });
    const seedTransformer = new IVaultTransformer(seedDb, sourceDb);
    await seedTransformer.process();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    const targetDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "PreserveIdOnTestModel-Target.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbPath, {
      rootSubject: sourceDb.rootSubject,
    });

    // Calling process() for first time will add all elements from source to target
    const transformer = new IVaultTransformer(sourceDb, targetDb, {
      preserveElementIdsForFiltering: true,
    });
    await transformer.process();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    // should not throw error: duplicate code (65547)
    const thirdTransformer = new IVaultTransformer(sourceDb, targetDb, {
      preserveElementIdsForFiltering: true,
    });
    await thirdTransformer.process();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    const sourceContent = await getAllElementsInvariants(sourceDb);
    const targetContent = await getAllElementsInvariants(targetDb);
    expect(targetContent).to.deep.equal(sourceContent);

    sourceDb.close();
    targetDb.close();
  });

  it("process() with preserveElementIdsForFiltering set to true should throw error if element exists but has different id in target", async () => {
    const sourceDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "PreserveIdOnTestModel-Source.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbPath, {
      rootSubject: { name: "iVaultA" },
    });
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    Subject.insert(sourceDb, IVault.rootSubjectId, "Subject1");
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    const targetDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "PreserveIdOnTestModel-Target.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbPath, {
      rootSubject: sourceDb.rootSubject,
    });

    // Execute process() so that elements from source are copied to target
    const transformer = new IVaultTransformer(sourceDb, targetDb, {
      preserveElementIdsForFiltering: true,
    });
    await transformer.process();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    const sourceContent = await getAllElementsInvariants(sourceDb);
    const targetContent = await getAllElementsInvariants(targetDb);
    expect(targetContent).to.deep.equal(sourceContent);

    // Delete subject 1 from target
    const code = Subject.createCode(targetDb, IVault.rootSubjectId, "Subject1");
    const targetSubjectId = targetDb.elements.queryElementIdByCode(code);
    expect(targetSubjectId).to.not.be.undefined;

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.elements.deleteElement(targetSubjectId!);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    // save subject 1 element properties for new subject(it should have same fed guid and code)
    const targetSubjectProps = sourceDb.elements.getElementProps(
      targetSubjectId!
    );
    targetSubjectProps.id = undefined;
    assert.isDefined(targetSubjectProps);

    // create new subject that is the same as subject 1 but has a different Id
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const newSubjectId = targetDb.elements.insertElement(targetSubjectProps);
    expect(newSubjectId).to.not.be.undefined;
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    // Calling process() for second time with option to preserve elements in hopes of throwing expected error
    const secondTransformer = new IVaultTransformer(sourceDb, targetDb, {
      preserveElementIdsForFiltering: true,
    });

    await expect(secondTransformer.process()).to.be.rejectedWith(
      `Element id(${targetSubjectId}) cannot be preserved. Found a different mapping(${newSubjectId}) from source element`
    );

    sourceDb.close();
    targetDb.close();
  });

  it("process() with preserveElementIdsForFiltering set to true should throw error if an unrelated element in the target already uses id", async () => {
    const sourceDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "PreserveIdOnTestModel-Source.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbPath, {
      rootSubject: { name: "iVaultA" },
    });
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    Subject.insert(sourceDb, IVault.rootSubjectId, "Subject1");
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    const targetDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "PreserveIdOnTestModel-Target.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbPath, {
      rootSubject: sourceDb.rootSubject,
    });

    // Execute process() so that elements from source are copied to target
    const transformer = new IVaultTransformer(sourceDb, targetDb, {
      preserveElementIdsForFiltering: true,
    });
    await transformer.process();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    const sourceContent = await getAllElementsInvariants(sourceDb);
    const targetContent = await getAllElementsInvariants(targetDb);
    expect(targetContent).to.deep.equal(sourceContent);

    // Delete subject 1 from target
    const code1 = Subject.createCode(
      targetDb,
      IVault.rootSubjectId,
      "Subject1"
    );
    const targetSubjectId1 = targetDb.elements.queryElementIdByCode(code1);
    expect(targetSubjectId1).to.not.be.undefined;

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.elements.deleteElement(targetSubjectId1!);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    // save subject 1 element properties but only use the same id
    const newPropsForSubject3 = sourceDb.elements.getElementProps(
      targetSubjectId1!
    );
    newPropsForSubject3.federationGuid = undefined;
    const code3 = Subject.createCode(
      targetDb,
      IVault.rootSubjectId,
      "Subject3"
    );
    newPropsForSubject3.code = code3;

    // insert an unrelated element that uses same id as subject1
    // insertElement public api does not support forceUseId option
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const targetSubjectId3 = targetDb.elements.insertElement(
      newPropsForSubject3,
      { forceUseId: true }
    );
    expect(targetSubjectId3).to.not.be.undefined;
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    // Calling process() for second time with option to preserve elements in hopes of of throwing expected error
    const secondTransformer = new IVaultTransformer(sourceDb, targetDb, {
      preserveElementIdsForFiltering: true,
    });

    await expect(secondTransformer.process()).to.be.rejectedWith(
      `Element id(${targetSubjectId1}) cannot be preserved. An unrelated element in the target already uses id: ${targetSubjectId1}`
    );

    sourceDb.close();
    targetDb.close();
  });

  it("reference deletion is considered invalid when danglingReferencesBehavior='reject' and that is the default", async () => {
    const sourceDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "DanglingReferenceSource.dtw"
    );
    const [sourceDb, { displayStyleId, physicalObjects }] =
      createIVaultWithDanglingReference({
        name: "DanglingReferences",
        path: sourceDbPath,
      });

    const targetDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "DanglingReferenceTarget-reject.dtw"
    );
    const targetDbForRejected = StandaloneDb.createEmpty(targetDbPath, {
      rootSubject: sourceDb.rootSubject,
    });
    const targetDbForRejectedPath = targetDbForRejected.pathName;
    targetDbForRejected.close();

    const defaultTransformer = new ShiftedIdsEmptyTargetTransformer(
      sourceDb,
      () => StandaloneDb.openFile(targetDbForRejectedPath)
    );
    await expect(defaultTransformer.process()).to.be.rejectedWith(
      /Found a reference to an element "[^"]*" that doesn't exist/
    );
    defaultTransformer.targetDb.close();

    const rejectDanglingReferencesTransformer =
      new ShiftedIdsEmptyTargetTransformer(
        sourceDb,
        () => StandaloneDb.openFile(targetDbForRejectedPath),
        { danglingReferencesBehavior: "reject" }
      );
    await expect(
      rejectDanglingReferencesTransformer.process()
    ).to.be.rejectedWith(
      /Found a reference to an element "[^"]*" that doesn't exist/
    );
    defaultTransformer.targetDb.close();

    const runTransform = async (
      opts: Pick<IVaultTransformOptions, "danglingReferencesBehavior">
    ) => {
      const thisTransformTargetPath =
        IVaultTransformerTestUtils.prepareOutputFile(
          "IVaultTransformer",
          `DanglingReferenceTarget-${opts.danglingReferencesBehavior}.bim`
        );
      const createTargetDb = () =>
        StandaloneDb.createEmpty(thisTransformTargetPath, {
          rootSubject: sourceDb.rootSubject,
        });
      const transformer = new ShiftedIdsEmptyTargetTransformer(
        sourceDb,
        createTargetDb,
        opts
      );
      await expect(transformer.process()).not.to.be.rejected;
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      transformer.targetDb.saveChanges();

      expect(sourceDb.elements.tryGetElement(physicalObjects[1].id)).to.be
        .undefined;
      const displayStyleInSource =
        sourceDb.elements.getElement<DisplayStyle3d>(displayStyleId);
      expect([...displayStyleInSource.settings.excludedElementIds]).to.include(
        physicalObjects[1].id
      );

      const displayStyleInTargetId =
        transformer.context.findTargetElementId(displayStyleId);
      const displayStyleInTarget =
        transformer.targetDb.elements.getElement<DisplayStyle3d>(
          displayStyleInTargetId
        );

      const physObjsInTarget = physicalObjects.map((physObjInSource) => {
        const physObjInTargetId = transformer.context.findTargetElementId(
          physObjInSource.id
        );
        return { ...physObjInSource, id: physObjInTargetId };
      });

      expect(Id64.isValidId64(physObjsInTarget[0].id)).to.be.true;
      expect(Id64.isValidId64(physObjsInTarget[1].id)).not.to.be.true;

      return { displayStyleInTarget, physObjsInTarget };
    };

    const ignoreResult = await runTransform({
      danglingReferencesBehavior: "ignore",
    });

    expect([
      ...ignoreResult.displayStyleInTarget.settings.excludedElementIds,
    ]).to.deep.equal(
      ignoreResult.physObjsInTarget
        .filter(({ id }) => Id64.isValidId64(id))
        .map(({ id }) => id)
    );

    sourceDb.close();
    targetDbForRejected.close();
  });

  it("exports aspects of deferred elements", async () => {
    const sourceDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "DeferredElementWithAspects-Source.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbPath, {
      rootSubject: { name: "deferred-element-with-aspects" },
    });

    const testSchemaPath =
      IVaultTransformerTestUtils.getPathToSchemaWithUniqueAspect();
    await sourceDb.importSchemas([testSchemaPath]);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const myPhysicalModelId = PhysicalModel.insert(
      sourceDb,
      IVaultDb.rootSubjectId,
      "MyPhysicalModel"
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const mySpatialCategId = SpatialCategory.insert(
      sourceDb,
      IVaultDb.dictionaryId,
      "MySpatialCateg",
      { color: ColorDef.black.toJSON() }
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const myPhysicalObjId = sourceDb.elements.insertElement({
      classFullName: PhysicalObject.classFullName,
      model: myPhysicalModelId,
      category: mySpatialCategId,
      code: Code.createEmpty(),
      userLabel: "MyPhysicalObject",
      geom: IVaultTransformerTestUtils.createBox(Point3d.create(1, 1, 1)),
      placement: Placement3d.fromJSON({ origin: { x: 1 }, angles: {} }),
    } as PhysicalElementProps);
    // because they are definition elements, display styles will be transformed first
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const myDisplayStyleId = DisplayStyle3d.insert(
      sourceDb,
      IVaultDb.dictionaryId,
      "MyDisplayStyle3d",
      {
        excludedElements: [myPhysicalObjId],
      }
    );
    const sourceRepositoryId = IVaultTransformerTestUtils.insertRepositoryLink(
      sourceDb,
      "external.repo",
      "https://external.example.com/folder/external.repo",
      "TEST"
    );
    const sourceExternalSourceId =
      IVaultTransformerTestUtils.insertExternalSource(
        sourceDb,
        sourceRepositoryId,
        "HypotheticalDisplayConfigurer"
      );
    // simulate provenance from a connector as an example of a copied over element multi aspect
    const multiAspectProps: ExternalSourceAspectProps = {
      classFullName: ExternalSourceAspect.classFullName,
      element: {
        id: myDisplayStyleId,
        relClassName: ElementOwnsExternalSourceAspects.classFullName,
      },
      scope: { id: sourceExternalSourceId },
      source: { id: sourceExternalSourceId },
      identifier: "ID",
      kind: ExternalSourceAspect.Kind.Element,
    };
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.elements.insertAspect(multiAspectProps);
    const uniqueAspectProps = {
      classFullName: "TestSchema1:MyUniqueAspect",
      element: {
        id: myDisplayStyleId,
        relClassName: ElementOwnsUniqueAspect.classFullName,
      },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      myProp1: "prop_value",
    };
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.elements.insertAspect(uniqueAspectProps);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    const targetDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "PreserveIdOnTestModel-Target.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbPath, {
      rootSubject: sourceDb.rootSubject,
    });

    const transformer = new IVaultTransformer(sourceDb, targetDb, {
      includeSourceProvenance: true,
      noProvenance: true, // don't add transformer provenance aspects, makes querying for aspects later simpler
    });

    await transformer.processSchemas();
    await transformer.process();

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    const targetExternalSourceAspects: any[] = [];
    const targetMyUniqueAspects: any[] = [];
    for await (const row of targetDb.createQueryReader(
      "SELECT * FROM bis.ExternalSourceAspect"
    )) {
      targetExternalSourceAspects.push(row.toRow());
    }
    for await (const row of targetDb.createQueryReader(
      "SELECT * FROM TestSchema1.MyUniqueAspect"
    )) {
      targetMyUniqueAspects.push(row.toRow());
    }

    expect(targetMyUniqueAspects).to.have.lengthOf(1);
    expect(targetMyUniqueAspects[0].MyProp1).to.equal(
      uniqueAspectProps.myProp1
    );
    expect(targetExternalSourceAspects).to.have.lengthOf(1);
    expect(targetExternalSourceAspects[0].Identifier).to.equal(
      multiAspectProps.identifier
    );

    sinon.restore();
    sourceDb.close();
    targetDb.close();
  });

  it("IVaultTransformer processes nav property references even in generated classes", async () => {
    const sourceDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "GeneratedNavPropReferences-Source.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbPath, {
      rootSubject: { name: "GeneratedNavPropReferences" },
    });

    const testSchema1Path = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "TestSchema1.dmschema.xml"
    );
    IVaultJsFs.writeFileSync(
      testSchema1Path,
      `<?xml version="1.0" encoding="UTF-8"?>
      <DMSchema schemaName="TestGeneratedClasses" alias="tgc" version="1.0.0" xmlns="http://www.szewec.com/schemas/Szewec.DMXML.3.1">
        <DMSchemaReference name="BisCore" version="01.00" alias="bis"/>
        <DMEntityClass typeName="TestEntity" description="a sample entity for the end of the test relationships">
          <BaseClass>bis:DefinitionElement</BaseClass>
          <DMProperty propertyName="prop" typeName="string" description="a sample property"/>
        </DMEntityClass>
        <DMRelationshipClass typeName="ElemRel" strength="referencing" description="elem rel 1" modifier="sealed">
          <Source multiplicity="(0..*)" roleLabel="refers to" polymorphic="false">
            <Class class="TestElementWithNavProp"/>
          </Source>
          <Target multiplicity="(0..1)" roleLabel="is referenced by" polymorphic="false">
            <Class class="TestEntity"/>
          </Target>
        </DMRelationshipClass>
        <DMEntityClass typeName="TestElementWithNavProp">
          <BaseClass>bis:DefinitionElement</BaseClass>
          <DMNavigationProperty propertyName="navProp" relationshipName="ElemRel" direction="Forward" />
        </DMEntityClass>
      </DMSchema>`
    );

    await sourceDb.importSchemas([testSchema1Path]);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const navPropTargetId = sourceDb.elements.insertElement({
      classFullName: "TestGeneratedClasses:TestEntity",
      prop: "sample-value",
      model: IVaultDb.dictionaryId,
      code: Code.createEmpty(),
    } as ElementProps);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const elemWithNavPropId = sourceDb.elements.insertElement({
      classFullName: "TestGeneratedClasses:TestElementWithNavProp",
      navProp: {
        id: navPropTargetId,
        relClassName: "TestGeneratedClasses:ElemRel",
      },
      model: IVaultDb.dictionaryId,
      code: Code.createEmpty(),
    } as ElementProps);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    const targetDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "GeneratedNavPropReferences-Target.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbPath, {
      rootSubject: sourceDb.rootSubject,
    });

    class ProcessTargetLastTransformer extends IVaultTransformer {
      public constructor(
        source: IVaultDb,
        target: IVaultDb,
        opts?: IVaultTransformOptions
      ) {
        super(
          new (class extends IVaultExporter {
            public override async exportElement(elementId: string) {
              if (elementId === navPropTargetId) {
                // don't export it, we'll export it later, after the holder
              } else if (elementId === elemWithNavPropId) {
                await super.exportElement(elemWithNavPropId);
                await super.exportElement(navPropTargetId);
              } else {
                await super.exportElement(elementId);
              }
            }
          })(source),
          target,
          opts
        );
      }
    }

    const transformer = new ProcessTargetLastTransformer(sourceDb, targetDb);
    await transformer.processSchemas();
    await transformer.process();

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    async function getNavPropContent(db: IVaultDb) {
      const results: Array<{ id: Id64String; navProp: RelatedElement }> = [];
      for await (const row of db.createQueryReader(
        "SELECT DMInstanceId, navProp FROM TestGeneratedClasses.TestElementWithNavProp"
      )) {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const navPropRaw = row[1] as { Id: Id64String };
        results.push({
          id: row[0] as Id64String,
          navProp: RelatedElement.fromJSON({ id: navPropRaw.Id })!,
        });
      }
      return results;
    }

    for (const navPropHolderInSource of await getNavPropContent(sourceDb)) {
      const navPropHolderInTargetId = transformer.context.findTargetElementId(
        navPropHolderInSource.id
      );
      const navPropHolderInTarget = targetDb.elements.getElement(
        navPropHolderInTargetId
      );
      const navPropTargetInTarget = transformer.context.findTargetElementId(
        navPropHolderInSource.navProp.id
      );
      // cast to any to access untyped instance properties
      expect((navPropHolderInTarget as any)?.navProp?.id).to.equal(
        navPropTargetInTarget
      );
      expect((navPropHolderInTarget as any)?.navProp?.id).not.to.equal(
        Id64.invalid
      );
      expect((navPropHolderInTarget as any)?.navProp?.id).not.to.be.undefined;
    }

    expect(await getNavPropContent(sourceDb)).to.have.length(1);
    expect(await getNavPropContent(targetDb)).to.have.length(1);

    sourceDb.close();
    targetDb.close();
  });

  it("exhaustive identity transform", async () => {
    const seedDb = SnapshotDb.openFile(
      TestUtils.IVaultTestUtils.resolveAssetFile("CompatibilityTestSeed.dtw")
    );
    const sourceDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "ExhaustiveIdentityTransformSource.dtw"
    );
    const sourceDb = SnapshotDb.createFrom(seedDb, sourceDbPath);

    // previously there was a bug where json display properties of models would not be transformed. This should expose that
    const [physicalModelId] = sourceDb.queryEntityIds({
      from: "BisCore.PhysicalModel",
      limit: 1,
    });
    const physicalModel = sourceDb.models.getModel(physicalModelId);
    physicalModel.jsonProperties.formatter.fmtFlags.linPrec = 100;
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    physicalModel.update();

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    const targetDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "ExhaustiveIdentityTransformTarget.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbPath, {
      rootSubject: sourceDb.rootSubject,
    });

    const transformer = new IVaultTransformer(sourceDb, targetDb);
    await transformer.processSchemas();
    await transformer.process();

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    await assertIdentityTransformation(sourceDb, targetDb, transformer, {
      compareElemGeom: true,
    });

    const physicalModelInTargetId =
      transformer.context.findTargetElementId(physicalModelId);
    const physicalModelInTarget = targetDb.models.getModel(
      physicalModelInTargetId
    );
    expect(
      physicalModelInTarget.jsonProperties.formatter.fmtFlags.linPrec
    ).to.equal(100);

    sourceDb.close();
    targetDb.close();
  });

  it("deferred element relationships get exported", async () => {
    const sourceDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "DeferredElementWithRelationships-Source.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbPath, {
      rootSubject: { name: "deferred-element-with-relationships" },
    });

    const testSchema1Path = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "TestSchema1.dmschema.xml"
    );
    // the only two ElementUniqueAspect's in bis are ignored by the transformer, so we add our own to test their export
    IVaultJsFs.writeFileSync(
      testSchema1Path,
      `<?xml version="1.0" encoding="UTF-8"?>
      <DMSchema schemaName="TestSchema1" alias="ts1" version="01.00" xmlns="http://www.szewec.com/schemas/Szewec.DMXML.3.1">
        <DMSchemaReference name="BisCore" version="01.00" alias="bis"/>
        <DMRelationshipClass typeName="MyElemRefersToElem" strength="referencing" modifier="None">
          <BaseClass>bis:ElementRefersToElements</BaseClass>
          <DMProperty propertyName="prop" typeName="string" description="a sample property"/>
          <Source multiplicity="(0..*)" roleLabel="refers to" polymorphic="true">
            <Class class="bis:Element"/>
          </Source>
          <Target multiplicity="(0..*)" roleLabel="is referenced by" polymorphic="true">
            <Class class="bis:Element"/>
          </Target>
        </DMRelationshipClass>
      </DMSchema>`
    );

    await sourceDb.importSchemas([testSchema1Path]);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const myPhysicalModelId = PhysicalModel.insert(
      sourceDb,
      IVaultDb.rootSubjectId,
      "MyPhysicalModel"
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const mySpatialCategId = SpatialCategory.insert(
      sourceDb,
      IVaultDb.dictionaryId,
      "MySpatialCateg",
      { color: ColorDef.black.toJSON() }
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const myPhysicalObjId = sourceDb.elements.insertElement({
      classFullName: PhysicalObject.classFullName,
      model: myPhysicalModelId,
      category: mySpatialCategId,
      code: Code.createEmpty(),
      userLabel: "MyPhysicalObject",
      geom: IVaultTransformerTestUtils.createBox(Point3d.create(1, 1, 1)),
      placement: Placement3d.fromJSON({ origin: { x: 1 }, angles: {} }),
    } as PhysicalElementProps);
    // because they are definition elements, display styles will be transformed first
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const myDisplayStyleId = DisplayStyle3d.insert(
      sourceDb,
      IVaultDb.dictionaryId,
      "MyDisplayStyle3d",
      {
        excludedElements: [myPhysicalObjId],
      }
    );
    const relProps = {
      sourceId: myDisplayStyleId,
      targetId: myPhysicalObjId,
      classFullName: "TestSchema1:MyElemRefersToElem",
      prop: "prop",
    };
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const _relInstId = sourceDb.relationships.insertInstance(
      relProps as RelationshipProps
    );

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();
    const targetDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "DeferredElementWithRelationships-Target.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbPath, {
      rootSubject: sourceDb.rootSubject,
    });

    const transformer = new IVaultTransformer(sourceDb, targetDb);

    await transformer.processSchemas();
    await transformer.process();

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    const targetRelationships: any[] = [];
    for await (const row of targetDb.createQueryReader(
      "SELECT * FROM ts1.MyElemRefersToElem"
    )) {
      targetRelationships.push(row.toRow());
    }

    expect(targetRelationships).to.have.lengthOf(1);
    expect(targetRelationships[0].prop).to.equal(relProps.prop);

    sinon.restore();
    sourceDb.close();
    targetDb.close();
  });

  for (const skipPropagateChangesToRootElements of [true, undefined, false]) {
    it(`should ${
      skipPropagateChangesToRootElements === false ? "update" : "not update"
    } root elements when skipPropagateChangesToRootElements is set to ${skipPropagateChangesToRootElements}`, async () => {
      const iVaultShared: SnapshotDb =
        IVaultTransformerTestUtils.createSharedIVault(outputDir, ["A", "B"]);
      const iVaultA: SnapshotDb = IVaultTransformerTestUtils.createTeamIVault(
        outputDir,
        "A",
        Point3d.create(0, 0, 0),
        ColorDef.green
      );
      IVaultTransformerTestUtils.assertTeamIVaultContents(iVaultA, "A");
      const iVaultExporterA = new IVaultExporter(iVaultA);

      const subjectId: Id64String = IVaultTransformerTestUtils.querySubjectId(
        iVaultShared,
        "A"
      );
      const transformerA2S = new IVaultTransformer(
        iVaultExporterA,
        iVaultShared,
        {
          targetScopeElementId: subjectId,
          danglingReferencesBehavior: "ignore",
          skipPropagateChangesToRootElements,
        }
      );
      transformerA2S.context.remapElement(IVault.rootSubjectId, subjectId);
      // Act
      await transformerA2S.process();
      // Assert
      const rootElements = ["0x10", "0xe"];
      rootElements.forEach((rootElementId) => {
        const rootElement = iVaultShared.elements.getElement(rootElementId);
        if (
          skipPropagateChangesToRootElements === undefined ||
          skipPropagateChangesToRootElements === true
        ) {
          assert.equal(
            rootElement.parent?.id,
            "0x1",
            `Root element '${rootElementId}' parent should not be remapped to '${rootElement.parent?.id}'.`
          );
        } else {
          assert.equal(
            rootElement.parent?.id,
            subjectId,
            `Root element '${rootElementId}' parent should be remapped to '${rootElement.parent?.id}'.`
          );
        }
      });

      transformerA2S.dispose();
      iVaultA.close();
      iVaultShared.close();
    });
  }

  it("IVaultTransformer handles generated class nav property cycle", async () => {
    const sourceDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "NavPropCycleSource.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbPath, {
      rootSubject: { name: "GeneratedNavPropReferences" },
    });

    const testSchema1Path = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "TestSchema1.dmschema.xml"
    );
    IVaultJsFs.writeFileSync(
      testSchema1Path,
      `<?xml version="1.0" encoding="UTF-8"?>
      <DMSchema schemaName="TestSchema" alias="ts" version="1.0.0" xmlns="http://www.szewec.com/schemas/Szewec.DMXML.3.1">
        <DMSchemaReference name="BisCore" version="01.00" alias="bis"/>
        <DMEntityClass typeName="A" description="an A">
          <BaseClass>bis:DefinitionElement</BaseClass>
          <DMNavigationProperty propertyName="anotherA" relationshipName="AtoA" direction="Forward" displayLabel="Horizontal Alignment" />
        </DMEntityClass>
        <DMRelationshipClass typeName="AtoA" strength="referencing" description="a to a" modifier="sealed">
          <Source multiplicity="(0..*)" roleLabel="refers to" polymorphic="false">
            <Class class="A"/>
          </Source>
          <Target multiplicity="(0..1)" roleLabel="is referenced by" polymorphic="false">
            <Class class="A"/>
          </Target>
        </DMRelationshipClass>
      </DMSchema>`
    );

    await sourceDb.importSchemas([testSchema1Path]);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const a1Id = sourceDb.elements.insertElement({
      classFullName: "TestSchema:A",
      // will be updated later to include this
      // anotherA: { id: a3Id, relClassName: "TestSchema:AtoA", },
      model: IVaultDb.dictionaryId,
      code: Code.createEmpty(),
    } as ElementProps);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const a2Id = sourceDb.elements.insertElement({
      classFullName: "TestSchema:A",
      anotherA: { id: a1Id, relClassName: "TestSchema:AtoA" },
      model: IVaultDb.dictionaryId,
      code: Code.createEmpty(),
    } as ElementProps);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.elements.updateElement({
      id: a1Id,
      anotherA: { id: a2Id, relClassName: "TestSchema:AtoA" },
    } as any);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const a4Id = sourceDb.elements.insertElement({
      classFullName: "TestSchema:A",
      // will be updated later to include this
      // anotherA: { id: a4Id, relClassName: "TestSchema:AtoA", },
      model: IVaultDb.dictionaryId,
      code: Code.createEmpty(),
    } as ElementProps);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.elements.updateElement({
      id: a4Id,
      anotherA: { id: a4Id, relClassName: "TestSchema:AtoA" },
    } as any);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    const targetDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "NavPropCycleTarget.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbPath, {
      rootSubject: sourceDb.rootSubject,
    });

    const transformer = new IVaultTransformer(sourceDb, targetDb);
    await transformer.processSchemas();
    await transformer.process();

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    await assertIdentityTransformation(sourceDb, targetDb, transformer);

    sourceDb.close();
    targetDb.close();
  });

  it("handle out-of-order references in aspects during consolidations", async () => {
    const sourceDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "AspectCyclicRefs.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbPath, {
      rootSubject: { name: "aspect-cyclic-refs" },
    });

    // as a member of the repository model hierarchy, and not the root subject hierarchy, it will be exported after the element which is inserted later
    const sourceRepositoryId = IVaultTransformerTestUtils.insertRepositoryLink(
      sourceDb,
      "anything.bld",
      "https://test.szewec.com/folder/anything.bld",
      "BLD"
    );

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const elem1Id = PhysicalModel.insert(
      sourceDb,
      IVault.rootSubjectId,
      "phys-model-in-target"
    );
    const extSrcAspect1: ExternalSourceAspectProps = {
      classFullName: ExternalSourceAspect.classFullName,
      element: { id: elem1Id },
      kind: ExternalSourceAspect.Kind.Element,
      identifier: Guid.empty, // doesn't matter, any identifier in the hypothetical source
      scope: { id: sourceRepositoryId },
    };
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const _extSrcAspect1Id = sourceDb.elements.insertAspect(extSrcAspect1);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    const targetDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "AspectCyclicRefsTarget.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbPath, {
      rootSubject: sourceDb.rootSubject,
    });

    const transformer = new AssertOrderTransformer(
      [elem1Id, sourceRepositoryId],
      sourceDb,
      targetDb,
      { includeSourceProvenance: true }
    );

    await expect(transformer.processSchemas()).to.eventually.be.fulfilled;
    await expect(transformer.process()).to.eventually.be.fulfilled;

    const elem1InTargetId = transformer.context.findTargetElementId(elem1Id);
    const elem1AspectsInTarget = targetDb.elements.getAspects(elem1InTargetId);
    expect(elem1AspectsInTarget).to.have.lengthOf(1);

    const extSrcAspect1InTarget = elem1AspectsInTarget[0];
    assert(extSrcAspect1InTarget instanceof ExternalSourceAspect);
    expect(extSrcAspect1InTarget.identifier).to.equal(extSrcAspect1.identifier);

    const sourceRepositoryInTargetId =
      transformer.context.findTargetElementId(sourceRepositoryId);
    expect(extSrcAspect1InTarget?.scope?.id).to.equal(
      sourceRepositoryInTargetId
    );

    sourceDb.close();
    targetDb.close();
  });

  it("returns ids in order when exporting multiple ElementMultiAspect of multiple classes", async () => {
    const sourceDbFile = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "AspectIdOrderSrc.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbFile, {
      rootSubject: { name: "AspectIdOrderSource" },
    });
    await TransformerExtensiveTestScenario.prepareDb(sourceDb);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const spatialCategoryId = SpatialCategory.insert(
      sourceDb,
      IVault.dictionaryId,
      "SpatialCategory",
      { color: ColorDef.green.toJSON() }
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const physicalModelId = PhysicalModel.insert(
      sourceDb,
      IVault.rootSubjectId,
      "phys-model"
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const physicalObj1InSourceId = sourceDb.elements.insertElement({
      classFullName: PhysicalObject.classFullName,
      model: physicalModelId,
      category: spatialCategoryId,
      code: Code.createEmpty(),
      userLabel: "PhysicalObject1",
      geom: TestUtils.IVaultTestUtils.createBox(
        Point3d.create(1, 1, 1),
        spatialCategoryId
      ),
      placement: {
        origin: Point3d.create(1, 1, 1),
        angles: YawPitchRollAngles.createDegrees(0, 0, 0),
      },
    } as PhysicalElementProps);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.elements.insertAspect({
      classFullName: "ExtensiveTestScenario:AdditionalMultiAspect",
      element: new ElementOwnsMultiAspects(physicalObj1InSourceId),
      value: "1",
    } as ElementAspectProps);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.elements.insertAspect({
      classFullName: "ExtensiveTestScenario:SourceMultiAspect",
      element: new ElementOwnsMultiAspects(physicalObj1InSourceId),
      commonDouble: 2.2,
      commonString: "2",
      commonLong: physicalObj1InSourceId,
      sourceDouble: 22.2,
      sourceString: "2",
      sourceLong: physicalObj1InSourceId,
      sourceGuid: Guid.createValue(),
      extraString: "2",
    } as ElementAspectProps);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.elements.insertAspect({
      classFullName: "ExtensiveTestScenario:AdditionalMultiAspect",
      element: new ElementOwnsMultiAspects(physicalObj1InSourceId),
      value: "3",
    } as ElementAspectProps);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    const targetDbFile = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "AspectIdOrderTarget.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbFile, {
      rootSubject: { name: "AspectIdOrderTarget" },
    });
    await TransformerExtensiveTestScenario.prepareDb(targetDb);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    const importer = new AspectTrackingImporter(targetDb);
    const transformer = new AspectTrackingTransformer(sourceDb, importer);
    assert.isTrue(transformer.context.isBetweenIVaults);
    await transformer.process();
    transformer.dispose();

    const physicalObj1InTargetId = IVaultTransformerTestUtils.queryByUserLabel(
      targetDb,
      "PhysicalObject1"
    );
    assert(physicalObj1InSourceId !== Id64.invalid);
    assert(physicalObj1InTargetId !== Id64.invalid);

    const exportedAspectSources = transformer.exportedAspectIdsByElement.get(
      physicalObj1InSourceId
    );
    const importedAspectTargetIds = importer.importedAspectIdsByElement.get(
      physicalObj1InTargetId
    );
    assert(exportedAspectSources !== undefined);
    assert(importedAspectTargetIds !== undefined);
    assert(exportedAspectSources.length === importedAspectTargetIds.length);

    // confirm the assumption that there are multiple aspect classes and their instances are not consecutive
    expect(
      exportedAspectSources[0].classFullName !==
        exportedAspectSources[1].classFullName &&
        exportedAspectSources[1].classFullName !==
          exportedAspectSources[2].classFullName &&
        exportedAspectSources[0].classFullName ===
          exportedAspectSources[2].classFullName
    );

    for (let i = 0; i < exportedAspectSources.length; ++i) {
      const sourceId = exportedAspectSources[i].id;
      const targetId = importedAspectTargetIds[i];
      const mappedTarget = transformer.context.findTargetAspectId(sourceId);
      assert(mappedTarget !== Id64.invalid);
      const indexInResult = importedAspectTargetIds.findIndex(
        (id) => id === mappedTarget
      );
      assert(
        mappedTarget === targetId,
        `aspect ${i} (${sourceId} in source, ${mappedTarget} in target) but got ${targetId} and the expected id was at index ${indexInResult}`
      );
    }
  });

  it("handles nested schema references during schema export", async () => {
    const sourceDbFile = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "NestedSchemaOrderSrc.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbFile, {
      rootSubject: { name: "NestedSchemaOrderSrc" },
    });

    const testSchema1 = `
      <?xml version="1.0" encoding="UTF-8"?>
      <DMSchema schemaName="TestSchema1" alias="ts1" version="01.00" xmlns="http://www.szewec.com/schemas/Szewec.DMXML.3.1">
        <DMSchemaReference name="Units" version="01.00.05" alias="u"/>
      </DMSchema>`;

    const testSchema2 = `
      <?xml version="1.0" encoding="UTF-8"?>
      <DMSchema schemaName="TestSchema2" alias="ts2" version="01.00" xmlns="http://www.szewec.com/schemas/Szewec.DMXML.3.1">
          <DMSchemaReference name="TestSchema1" version="01.00" alias="ts1"/>
          <DMSchemaReference name="BisCore" version="01.00" alias="bis"/>
          <DMEntityClass typeName="TestElement">
            <BaseClass>bis:PhysicalElement</BaseClass>
            <DMProperty propertyName="MyProp1" typeName="string"/>
          </DMEntityClass>
      </DMSchema>`;

    await sourceDb.importSchemaStrings([testSchema1, testSchema2]);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    const targetDbFile = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "NestedSchemaRefs.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbFile, {
      rootSubject: { name: "NestedSchemaRefsTarget" },
    });

    const transformer = new IVaultTransformer(sourceDb, targetDb);
    assert.isTrue(transformer.context.isBetweenIVaults);
    // no need to expect.eventually.fulfilled, because chai-as-promised ellipses long error messages so best
    // to just let it throw itself since that's what we're testing
    await transformer.processSchemas();
    transformer.dispose();
  });

  it("handles unknown new schema references in biscore", async () => {
    const sourceDbFile = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "UnknownBisCoreNewSchemaRef.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbFile, {
      rootSubject: { name: "UnknownBisCoreNewSchemaRef" },
    });

    const biscoreVersion = sourceDb.querySchemaVersion("BisCore");
    assert(biscoreVersion !== undefined);
    const fakeSchemaVersion = "1.0.99";
    expect(Semver.lt(biscoreVersion, fakeSchemaVersion)).to.be.true;

    const biscoreText = await SchemaTestUtils.schemaToXmlString(
      "BisCore",
      sourceDb
    );
    assert(biscoreText !== undefined);

    const fakeBisCoreUpdateText = biscoreText
      .replace(
        /(<DMSchema .*?>)/,
        '$1 <DMSchemaReference name="NewRef" version="01.00.00" alias="nr"/>'
      )
      .replace(/(?<=alias="bis" version=")[^"]*(?=")/, fakeSchemaVersion);
    // console.log(fakeBisCoreUpdateText.slice(0, 2000));

    const newReffedSchema = `<?xml version="1.0" encoding="UTF-8"?>
      <DMSchema schemaName="NewRef" alias="nr" version="01.00.00" xmlns="http://www.szewec.com/schemas/Szewec.DMXML.3.1">
        <DMSchemaReference name="units" version="01.00" alias="u"/>
      </DMSchema>
    `;

    await sourceDb.importSchemaStrings([
      newReffedSchema,
      fakeBisCoreUpdateText,
    ]);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    const targetDb1File = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "UnknownBisCoreNewSchemaRefTarget1.dtw"
    );
    const targetDb1 = SnapshotDb.createEmpty(targetDb1File, {
      rootSubject: { name: "UnknownBisCoreNewSchemaRefTarget1" },
    });

    const transformer = new IVaultTransformer(sourceDb, targetDb1);
    expect(transformer.exporter.wantSystemSchemas).to.be.true;
    await transformer.processSchemas();
    transformer.dispose();

    const targetDb2File = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "UnknownBisCoreNewSchemaRefTarget2.dtw"
    );
    const targetDb2 = SnapshotDb.createEmpty(targetDb2File, {
      rootSubject: { name: "UnknownBisCoreNewSchemaRefTarget2" },
    });

    const noSystemSchemasExporter = new IVaultExporter(sourceDb);
    noSystemSchemasExporter.wantSystemSchemas = false;
    const noSystemSchemasTransformer = new IVaultTransformer(
      noSystemSchemasExporter,
      targetDb2
    );
    expect(noSystemSchemasExporter.wantSystemSchemas).to.be.false;
    expect(noSystemSchemasTransformer.exporter.wantSystemSchemas).to.be.false;
    await noSystemSchemasTransformer.processSchemas();
    noSystemSchemasTransformer.dispose();
  });

  it("transform iVaults with profile upgrade", async () => {
    const oldDbPath = TestUtils.IVaultTestUtils.resolveAssetFile(
      "CompatibilityTestSeed.dtw"
    );
    const oldDb = SnapshotDb.openFile(oldDbPath);

    const newDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "ProfileTests-New.dtw"
    );
    let newDb = SnapshotDb.createFrom(oldDb, newDbPath);
    newDb.close();
    setToStandalone(newDbPath);
    StandaloneDb.upgradeStandaloneSchemas(newDbPath);
    newDb = SnapshotDb.openFile(newDbPath);

    const bisCoreVersionInOld = oldDb.querySchemaVersion("BisCore")!;
    const bisCoreVersionInNew = newDb.querySchemaVersion("BisCore")!;
    assert(
      Semver.lt(
        Schema.toSemverString(bisCoreVersionInOld),
        Schema.toSemverString(bisCoreVersionInNew)
      ),
      `The 'old' database with biscore version ${bisCoreVersionInOld} was not less than the 'new' database biscore of ${bisCoreVersionInNew}`
    );

    const oldDbProfileIsOlder =
      cmpProfileVersion(getProfileVersion(oldDb), getProfileVersion(newDb)) ===
      -1;
    assert(
      oldDbProfileIsOlder,
      "The 'old' database unexpectedly did not have an older profile version"
    );

    const sourceDbs = [oldDb, newDb];
    const targetSeeds = [oldDb, newDb];
    const doUpgradeVariants = [true, false];

    const targetDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "ProfileTests-Target.dtw"
    );

    const expectedFailureCases = [
      { sourceDb: newDb, targetSeed: oldDb, doUpgrade: false },
    ] as const;

    for (const sourceDb of sourceDbs)
      for (const targetSeed of targetSeeds)
        for (const doUpgrade of doUpgradeVariants) {
          if (IVaultJsFs.existsSync(targetDbPath))
            IVaultJsFs.unlinkSync(targetDbPath);

          let targetDb: IVaultDb = SnapshotDb.createFrom(
            targetSeed,
            targetDbPath
          );
          targetDb.close();
          setToStandalone(targetDbPath);
          if (doUpgrade) StandaloneDb.upgradeStandaloneSchemas(targetDbPath);
          targetDb = StandaloneDb.openFile(targetDbPath);

          const transformer = new IVaultTransformer(sourceDb, targetDb);
          try {
            await transformer.processSchemas();
          } catch (err) {
            const wasExpected = expectedFailureCases.find(
              (c) =>
                c.sourceDb.pathName === sourceDb.pathName &&
                c.targetSeed.pathName === targetSeed.pathName &&
                c.doUpgrade === doUpgrade
            );
            if (!wasExpected) {
              // eslint-disable-next-line no-console
              console.log(
                [
                  "Unexpected failure:",
                  `sourceDb: ${sourceDb.pathName}`,
                  `targetSeed: ${targetSeed.pathName}`,
                  `doUpgrade: ${doUpgrade}`,
                ].join("\n")
              );
              throw err;
            }
          }

          transformer.dispose();
          targetDb.close();
        }

    oldDb.close();
    newDb.close();
  });

  it("transforms code values with non standard space characters", async () => {
    const sourceDbFile = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "CodeValNbspSrc.dtw"
    );
    let sourceDb = SnapshotDb.createEmpty(sourceDbFile, {
      rootSubject: { name: "CodeValNbspSrc" },
    });

    const nbsp = "\xa0";

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const spatialCategId = SpatialCategory.insert(
      sourceDb,
      IVaultDb.dictionaryId,
      `SpatialCategory${nbsp}`,
      {}
    );
    const subCategId = Id64.fromUint32Pair(parseInt(spatialCategId, 16) + 1, 0);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const physModelId = PhysicalModel.insert(
      sourceDb,
      IVaultDb.rootSubjectId,
      `PhysicalModel${nbsp}`
    );

    const physObjectProps: PhysicalElementProps = {
      classFullName: PhysicalObject.classFullName,
      model: physModelId,
      category: spatialCategId,
      code: new Code({
        scope: "0x1",
        spec: "0x1",
        value: `PhysicalObject${nbsp}`,
      }),
      userLabel: `PhysicalObject${nbsp}`,
      geom: IVaultTransformerTestUtils.createBox(Point3d.create(1, 1, 1)),
      placement: Placement3d.fromJSON({ origin: { x: 0 }, angles: {} }),
    };

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const physObjectId = sourceDb.elements.insertElement(physObjectProps);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    expect(sourceDb.elements.getElement(spatialCategId).code.value).to.equal(
      "SpatialCategory"
    );
    expect(sourceDb.elements.getElement(subCategId).code.value).to.equal(
      "SpatialCategory"
    );
    expect(sourceDb.elements.getElement(physModelId).code.value).to.equal(
      "PhysicalModel"
    );
    expect(sourceDb.elements.getElement(physObjectId).code.value).to.equal(
      "PhysicalObject"
    );

    const addNonBreakingSpaceToCodeValue = (
      db: IVaultDb,
      initialCodeValue: string
    ) =>
      db.withSqliteStatement(
        `UPDATE bis_Element SET CodeValue='${initialCodeValue}${nbsp}' WHERE CodeValue='${initialCodeValue}'`,
        (s) => {
          let result: DbResult;
          while ((result = s.step()) === DbResult.BE_SQLITE_ROW) {}
          assert(result === DbResult.BE_SQLITE_DONE);
        }
      );

    for (const label of ["SpatialCategory", "PhysicalModel", "PhysicalObject"])
      addNonBreakingSpaceToCodeValue(sourceDb, label);

    const getCodeValRawSqlite = (
      db: IVaultDb,
      args: { initialVal: string; expected: string; expectedMatchCount: number }
    ) => {
      db.withSqliteStatement(
        `SELECT CodeValue FROM bis_Element WHERE CodeValue LIKE '${args.initialVal}%'`,
        (stmt) => {
          let rows = 0;
          for (const { codeValue } of stmt) {
            rows++;
            expect(codeValue).to.equal(args.expected);
          }
          expect(rows).to.equal(args.expectedMatchCount);
        }
      );
    };

    const getCodeValDmSql = async (
      db: IVaultDb,
      args: { initialVal: string; expected: string; expectedMatchCount: number }
    ) => {
      let rows = 0;
      for await (const row of db.createQueryReader(
        `SELECT CodeValue FROM bis.Element WHERE CodeValue LIKE '${args.initialVal}%'`,
        undefined,
        { usePrimaryConn: true }
      )) {
        rows++;
        expect(row.codeValue).to.equal(args.expected);
      }
      expect(rows).to.equal(args.expectedMatchCount);
    };

    // eslint-disable-next-line @typescript-eslint/no-shadow
    for (const [initialVal, expectedMatchCount] of [
      ["SpatialCategory", 2],
      ["PhysicalModel", 1],
      ["PhysicalObject", 1],
    ] as const) {
      getCodeValRawSqlite(sourceDb, {
        initialVal,
        expected: `${initialVal}${nbsp}`,
        expectedMatchCount,
      });
      await getCodeValDmSql(sourceDb, {
        initialVal,
        expected: `${initialVal}${nbsp}`,
        expectedMatchCount,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();
    sourceDb.close();
    sourceDb = SnapshotDb.openFile(sourceDbFile);

    // eslint-disable-next-line @typescript-eslint/no-shadow
    for (const [initialVal, expectedMatchCount] of [
      ["SpatialCategory", 2],
      ["PhysicalModel", 1],
      ["PhysicalObject", 1],
    ] as const) {
      getCodeValRawSqlite(sourceDb, {
        initialVal,
        expected: `${initialVal}${nbsp}`,
        expectedMatchCount,
      });
      await getCodeValDmSql(sourceDb, {
        initialVal,
        expected: `${initialVal}${nbsp}`,
        expectedMatchCount,
      });
    }

    const targetDbFile = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "CoreNewSchemaRefTarget.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbFile, {
      rootSubject: { name: "CodeValNbspTarget" },
    });

    const transformer = new IVaultTransformer(sourceDb, targetDb);
    await transformer.process();

    const spatialCategoryInTargetId =
      transformer.context.findTargetElementId(spatialCategId);
    const subCategoryInTargetId =
      transformer.context.findTargetElementId(subCategId);
    const physModelInTargetId =
      transformer.context.findTargetElementId(physModelId);
    const physObjectInTargetId =
      transformer.context.findTargetElementId(physObjectId);

    expect(
      targetDb.elements.getElement(spatialCategoryInTargetId).code.value
    ).to.equal("SpatialCategory");
    expect(
      targetDb.elements.getElement(subCategoryInTargetId).code.value
    ).to.equal("SpatialCategory");
    expect(
      targetDb.elements.getElement(physModelInTargetId).code.value
    ).to.equal("PhysicalModel");
    expect(
      targetDb.elements.getElement(physObjectInTargetId).code.value
    ).to.equal("PhysicalObject");

    // eslint-disable-next-line @typescript-eslint/no-shadow
    for (const [initialVal, expectedMatchCount] of [
      ["SpatialCategory", 2],
      ["PhysicalModel", 1],
      ["PhysicalObject", 1],
    ] as const) {
      const expected = `${initialVal}${nbsp}`;
      getCodeValRawSqlite(targetDb, {
        initialVal,
        expected,
        expectedMatchCount,
      });
      await getCodeValDmSql(targetDb, {
        initialVal,
        expected,
        expectedMatchCount,
      });
    }

    transformer.dispose();
    sourceDb.close();
    targetDb.close();
  });

  it("should not change code scope to root subject when code spec type is Repository", async () => {
    const sourceDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "source-with-bad-CodeScopes.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbFile, {
      rootSubject: { name: "Separate Models" },
    });
    const codeSpec = CodeSpec.create(
      sourceDb,
      "Test CodeSpec",
      CodeScopeSpec.Type.Repository,
      CodeScopeSpec.ScopeRequirement.ElementId
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const codeSpecId = sourceDb.codeSpecs.insert(codeSpec);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const category = SpatialCategory.insert(
      sourceDb,
      IVault.dictionaryId,
      "TestCategory",
      {}
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const subject = Subject.insert(
      sourceDb,
      IVault.rootSubjectId,
      "Clashing Codes Container"
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const model1 = PhysicalModel.insert(sourceDb, subject, "Model 1");
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const model2 = PhysicalModel.insert(sourceDb, subject, "Model 2");
    const element11Props: PhysicalElementProps = {
      category,
      classFullName: PhysicalObject.classFullName,
      code: new Code({
        scope: model1,
        spec: codeSpecId,
        value: "Clashing code",
      }),
      model: model1,
    };
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const element11 = sourceDb.elements.insertElement(element11Props);
    const element12Props: PhysicalElementProps = {
      category,
      classFullName: PhysicalObject.classFullName,
      code: new Code({ scope: model1, spec: codeSpecId, value: "Element 1.2" }),
      model: model1,
      parent: new ElementOwnsChildElements(element11),
    };
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const element12 = sourceDb.elements.insertElement(element12Props);
    const element21Props: PhysicalElementProps = {
      category,
      classFullName: PhysicalObject.classFullName,
      code: new Code({
        scope: model2,
        spec: codeSpecId,
        value: "Clashing code",
      }),
      model: model2,
    };
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const element21 = sourceDb.elements.insertElement(element21Props);
    const element22Props: PhysicalElementProps = {
      category,
      classFullName: PhysicalObject.classFullName,
      code: new Code({ scope: model2, spec: codeSpecId, value: "Element 2.2" }),
      model: model2,
      parent: new ElementOwnsChildElements(element21),
    };
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const element22 = sourceDb.elements.insertElement(element22Props);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    const targetDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "target-combined-model.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbFile, {
      rootSubject: { name: "Combined Model" },
    });

    const transformer = new IVaultTransformer(sourceDb, targetDb);
    await expect(transformer.process()).not.to.be.rejected;
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    const targetElement11 = targetDb.elements.getElement(
      transformer.context.findTargetElementId(element11)
    );
    const targetElement12 = targetDb.elements.getElement(
      transformer.context.findTargetElementId(element12)
    );
    const targetElement21 = targetDb.elements.getElement(
      transformer.context.findTargetElementId(element21)
    );
    const targetElement22 = targetDb.elements.getElement(
      transformer.context.findTargetElementId(element22)
    );

    assert.notEqual(targetElement11.code.scope, IVault.rootSubjectId);
    assert.notEqual(targetElement12.code.scope, IVault.rootSubjectId);
    assert.notEqual(targetElement21.code.scope, IVault.rootSubjectId);
    assert.notEqual(targetElement22.code.scope, IVault.rootSubjectId);

    transformer.dispose();
    sourceDb.close();
    targetDb.close();
  });

  it("handles long schema names and references to them", async function () {
    const longSchema1Name = `ThisSchemaIs${"Long".repeat(100)}`;
    assert(Buffer.from(longSchema1Name).byteLength > 255);
    const longSchema2Name = `${longSchema1Name}ButEndsDifferently`;

    if (process.platform !== "win32") {
      // windows has no bound on path segment (file name) length, (it does have a bound on total path length),
      // so we don't expect this to throw only on Mac/Linux where 255 byte limit is common
      expect(() => fs.writeFileSync(longSchema1Name, "")).to.throw(/too long/);
    }

    const sourceDbFile = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "LongSchemaRef.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbFile, {
      rootSubject: { name: "UnknownBisCoreNewSchemaRef" },
    });

    const longSchema1 = `<?xml version="1.0" encoding="UTF-8"?>
      <DMSchema schemaName="${longSchema1Name}" alias="ls" version="01.00.00" xmlns="http://www.szewec.com/schemas/Szewec.DMXML.3.1">
        <DMSchemaReference name="units" version="01.00" alias="u"/>
      </DMSchema>
    `;

    const longSchema2 = `<?xml version="1.0" encoding="UTF-8"?>
      <DMSchema schemaName="${longSchema2Name}" alias="ls2" version="01.00.00" xmlns="http://www.szewec.com/schemas/Szewec.DMXML.3.1">
        <DMSchemaReference name="units" version="01.00" alias="u"/>
      </DMSchema>
    `;

    const reffingSchemaName = "Reffing";
    const reffingSchema = `<?xml version="1.0" encoding="UTF-8"?>
      <DMSchema schemaName="${reffingSchemaName}" alias="refg" version="01.00.00" xmlns="http://www.szewec.com/schemas/Szewec.DMXML.3.1">
        <DMSchemaReference name="${longSchema1Name}" version="01.00" alias="ls" />
        <DMSchemaReference name="${longSchema2Name}" version="01.00" alias="ls2" />
      </DMSchema>
    `;

    await sourceDb.importSchemaStrings([
      longSchema1,
      longSchema2,
      reffingSchema,
    ]);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    const targetDbFile = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "LongSchemaRefTarget.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbFile, {
      rootSubject: { name: "LongSchemaRefTarget" },
    });

    const exportedSchemaPaths: string[] = [];
    let outOfOrderExportedSchemas: string[];

    class TrackSchemaExportsExporter extends IVaultExporter {
      public override async exportSchemas(): Promise<void> {
        await super.exportSchemas();
        assert(exportedSchemaPaths.length === 4);
        const reffingSchemaFile = path.join(
          transformer["_schemaExportDir"],
          `${reffingSchemaName}.dmschema.xml`
        );
        assert(
          exportedSchemaPaths.includes(reffingSchemaFile),
          `Expected ${reffingSchemaFile} in ${exportedSchemaPaths}`
        );
        // make sure the referencing schema is first, so it is imported first, and the schema locator is forced
        // to look for its references (like the long name schema) that haven't been imported yet
        outOfOrderExportedSchemas = [
          reffingSchemaFile,
          ...exportedSchemaPaths.filter((s) => s !== reffingSchemaFile),
        ];
      }
    }

    // using this class instead of sinon.replace provides some gurantees that subclasses can use the onExportSchema result as expected
    class TrackSchemaExportsTransformer extends IVaultTransformer {
      public constructor(
        source: IVaultDb,
        target: IVaultDb,
        opts?: IVaultTransformOptions
      ) {
        super(new TrackSchemaExportsExporter(source), target, opts);
      }
      public override async onExportSchema(schema: DMSchemaMetaData.Schema) {
        const exportResult = await super.onExportSchema(schema);
        assert(exportResult?.schemaPath); // IVaultTransformer guarantees that it returns a valid schemaPath, the type is wide for subclasses
        exportedSchemaPaths.push(exportResult.schemaPath);
        return exportResult;
      }
    }

    const transformer = new TrackSchemaExportsTransformer(sourceDb, targetDb);

    try {
      // force import references out of order to make sure we hit an issue if schema locator can't find things
      sinon.replace(IVaultJsFs, "readdirSync", () =>
        outOfOrderExportedSchemas.map((s) => path.basename(s))
      );
      await transformer.processSchemas();
      expect(targetDb.querySchemaVersion(longSchema1Name)).not.to.be.undefined;
      expect(targetDb.querySchemaVersion(longSchema2Name)).not.to.be.undefined;
    } finally {
      sourceDb.close();
      targetDb.close();
      transformer.dispose();
      sinon.restore();
    }
  });

  it("should transform correctly when some elements are not exported", async () => {
    // create source iVault
    const sourceDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "TransformWithSkippedElements-Source.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbFile, {
      rootSubject: { name: "TransformWithSkippedElements-Source" },
    });
    const customSchema = `<?xml version="1.0" encoding="UTF-8"?>
    <DMSchema schemaName="CustomSchema" alias="cs" version="01.00.00" xmlns="http://www.szewec.com/schemas/Szewec.DMXML.3.1" description="Custom schema to test optional reference handling when referenced elements are not exported">
      <DMSchemaReference name="BisCore" version="01.00.04" alias="bis"/>
      <DMEntityClass typeName="CustomPhysicalElement" modifier="Sealed" description="For testing optional navigational properties to skipped elements">
        <BaseClass>bis:PhysicalElement</BaseClass>
        <DMNavigationProperty propertyName="ReferencedElement" relationshipName="CustomNavigationalPropertyRelationship" direction="Forward" description="Navigational property to other CustomPhysicalElement"/>
      </DMEntityClass>
      <DMRelationshipClass typeName="CustomNavigationalPropertyRelationship" strength="referencing" modifier="None">
        <Source multiplicity="(0..*)" roleLabel="uses" polymorphic="true">
            <Class class="CustomPhysicalElement" />
        </Source>
        <Target multiplicity="(0..1)" roleLabel="is used by" polymorphic="true">
            <Class class="CustomPhysicalElement"/>
        </Target>
      </DMRelationshipClass>
    </DMSchema>
    `;
    await sourceDb.importSchemaStrings([customSchema]);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const sourceCategoryId = SpatialCategory.insert(
      sourceDb,
      IVault.dictionaryId,
      "SpatialCategory",
      { color: ColorDef.blue.toJSON() }
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const sourceModelId = PhysicalModel.insert(
      sourceDb,
      IVault.rootSubjectId,
      "PhysicalModel"
    );
    const sourceReferencedElementProps: PhysicalElementProps = {
      classFullName: "CustomSchema:CustomPhysicalElement",
      category: sourceCategoryId,
      code: Code.createEmpty(),
      userLabel: "Referenced Element",
      model: sourceModelId,
    };
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const sourceReferencedElementId = sourceDb.elements.insertElement(
      sourceReferencedElementProps
    );
    const defaultSourceReferencerElementProps = {
      classFullName: "CustomSchema:CustomPhysicalElement",
      category: sourceCategoryId,
      code: Code.createEmpty(),
      model: sourceModelId,
      referencedElement: {
        id: sourceReferencedElementId,
        relClassName: "CustomSchema:CustomNavigationalPropertyRelationship",
      },
    };

    for (let i = 0; i < 10; ++i) {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      sourceDb.elements.insertElement({
        ...defaultSourceReferencerElementProps,
        userLabel: `Referencer ${i}`,
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    // create target iVault
    const targetDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "TransformWithSkippedElements-Target.dtw"
    );
    const targetDb = StandaloneDb.createEmpty(targetDbFile, {
      rootSubject: { name: "TransformWithSkippedElements-Target" },
    });

    class SkipElementTransformer extends IVaultTransformer {
      public skippedElement = Id64.invalid;

      public override async shouldExportElement(
        sourceElement: Element
      ): Promise<boolean> {
        return this.skippedElement !== sourceElement.id;
      }
    }

    const transformer = new SkipElementTransformer(sourceDb, targetDb);
    transformer.skippedElement = sourceReferencedElementId;
    await transformer.processSchemas();
    await transformer.process();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();
    const sql =
      "SELECT ReferencedElement.Id FROM CustomSchema:CustomPhysicalElement WHERE UserLabel LIKE '%Referencer%'";
    for await (const row of targetDb.createQueryReader(sql)) {
      assert(row[0] === null || row[0] === undefined);
    }
  });

  it("should transform all aspects when detachedAspectProcessing is turned on", async () => {
    // arrange
    // prepare source
    const sourceDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "DetachedAspectProcessing.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbFile, {
      rootSubject: { name: "DetachedAspectProcessing" },
    });
    const elements = [
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      Subject.insert(sourceDb, IVault.rootSubjectId, "Subject1"),
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      Subject.insert(sourceDb, IVault.rootSubjectId, "Subject2"),
    ];

    // 10 aspects in total (5 per element)
    elements.forEach((element) => {
      for (let i = 0; i < 5; ++i) {
        const aspectProps: ExternalSourceAspectProps = {
          classFullName: ExternalSourceAspect.classFullName,
          element: new ElementOwnsExternalSourceAspects(element),
          identifier: `${i}`,
          kind: "Element",
          scope: {
            id: IVault.rootSubjectId,
            relClassName: "BisCore:ElementScopesExternalSourceIdentifier",
          },
        };

        // eslint-disable-next-line @typescript-eslint/no-deprecated
        sourceDb.elements.insertAspect(aspectProps);
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    // create target iVault
    const targetDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "DetachedAspectProcessing-Target.dtw"
    );
    const targetDb = StandaloneDb.createEmpty(targetDbFile, {
      rootSubject: { name: "DetachedAspectProcessing-Target" },
    });

    const exporter = new IVaultExporter(
      sourceDb,
      DetachedExportElementAspectsStrategy
    );
    const transformer = new IVaultTransformer(exporter, targetDb, {
      includeSourceProvenance: true,
    });

    // act
    await transformer.process();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    // assert
    const numSourceSubjectIds = await count(sourceDb, Subject.classFullName);
    const elementIds = targetDb.queryEntityIds({ from: Subject.classFullName });

    expect(elementIds.size).to.be.equal(numSourceSubjectIds);
    elementIds.forEach((elementId) => {
      if (elementId === IVault.rootSubjectId) {
        return;
      }
      const targetAspects = targetDb.elements.getAspects(
        elementId,
        ExternalSourceAspect.classFullName
      );
      const sourceAspects = sourceDb.elements.getAspects(
        elementId,
        ExternalSourceAspect.classFullName
      );
      expect(targetAspects.length).to.be.equal(sourceAspects.length);
    });
  });

  it("should transform all aspects when detachedAspectProcessing is turned on and schema name and aspect class name has SQLite reserved keyword", async () => {
    // arrange
    // prepare source
    const sourceDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "DetachedAspectProcessingWithReservedSQLiteKeyword.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbFile, {
      rootSubject: {
        name: "DetachedAspectProcessingWithReservedSQLiteKeyword",
      },
    });
    const elements = [
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      Subject.insert(sourceDb, IVault.rootSubjectId, "Subject1"),
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      Subject.insert(sourceDb, IVault.rootSubjectId, "Subject2"),
    ];
    const customSchema = `<?xml version="1.0" encoding="UTF-8"?>
    <DMSchema schemaName="SELECT" alias="cs" version="01.00.00" xmlns="http://www.szewec.com/schemas/Szewec.DMXML.3.1" description="Custom schema to test aspect class which has SQLite reserved keyword as its name">
      <DMSchemaReference name="BisCore" version="01.00.04" alias="bis"/>
      <DMEntityClass typeName="JOIN" modifier="Sealed" description="Aspect class with SQLite reserved keyword">
        <BaseClass>bis:ElementMultiAspect</BaseClass>
      </DMEntityClass>
    </DMSchema>
    `;
    await sourceDb.importSchemaStrings([customSchema]);

    // 10 aspects in total (5 per element)
    elements.forEach((element) => {
      for (let i = 0; i < 5; ++i) {
        const aspectProps: ElementAspectProps = {
          classFullName: "SELECT:JOIN",
          element: new ElementOwnsMultiAspects(element),
        };

        // eslint-disable-next-line @typescript-eslint/no-deprecated
        sourceDb.elements.insertAspect(aspectProps);
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    // create target iVault
    const targetDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "DetachedAspectProcessingWithReservedSQLiteKeyword-Target.dtw"
    );
    const targetDb = StandaloneDb.createEmpty(targetDbFile, {
      rootSubject: {
        name: "DetachedAspectProcessingWithReservedSQLiteKeyword-Target",
      },
    });

    const exporter = new IVaultExporter(
      sourceDb,
      DetachedExportElementAspectsStrategy
    );
    const transformer = new IVaultTransformer(exporter, targetDb, {
      includeSourceProvenance: true,
    });

    // act
    await transformer.process();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    // assert
    const elementIds = targetDb.queryEntityIds({ from: Subject.classFullName });
    elementIds.forEach((elementId) => {
      if (elementId === IVault.rootSubjectId) {
        return;
      }
      const targetAspects = targetDb.elements.getAspects(
        elementId,
        ExternalSourceAspect.classFullName
      );
      const sourceAspects = sourceDb.elements.getAspects(
        elementId,
        ExternalSourceAspect.classFullName
      );
      expect(targetAspects.length).to.be.equal(sourceAspects.length);
    });
  });

  it("should remap textures in target iVault", async function () {
    const atleastInItjs4x = Semver.gte(coreBackendPkgJson.version, "4.0.0");
    if (!atleastInItjs4x) this.skip();

    // create source iVault
    const sourceDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "Transform3d-Source.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbFile, {
      rootSubject: { name: "Transform3d-Source" },
    });
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const categoryId = SpatialCategory.insert(
      sourceDb,
      IVault.dictionaryId,
      "SpatialCategory",
      { color: ColorDef.green.toJSON() }
    );
    const category = sourceDb.elements.getElement<SpatialCategory>(categoryId);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const sourceModelId = PhysicalModel.insert(
      sourceDb,
      IVault.rootSubjectId,
      "Physical"
    );

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const renderMaterialBothImgsId = RenderMaterialElement.insert(
      sourceDb,
      IVault.dictionaryId,
      "TextureMaterialBothImgs",
      {
        paletteName: "something",
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const texture1Id = Texture.insertTexture(
      sourceDb,
      IVault.dictionaryId,
      "Texture1",
      ImageSourceFormat.Png,
      TestUtils.samplePngTexture.base64,
      "texture 1"
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const texture2Id = Texture.insertTexture(
      sourceDb,
      IVault.dictionaryId,
      "Texture2",
      ImageSourceFormat.Png,
      TestUtils.samplePngTexture.base64,
      "texture 2"
    );

    const renderMaterialBothImgs =
      sourceDb.elements.getElement<RenderMaterialElement>(
        renderMaterialBothImgsId
      );
    // update the texture id into the model so that they are processed out of order (material exported before texture)
    if (
      renderMaterialBothImgs.jsonProperties.materialAssets.renderMaterial
        .Map === undefined
    )
      renderMaterialBothImgs.jsonProperties.materialAssets.renderMaterial.Map =
        {};
    if (
      renderMaterialBothImgs.jsonProperties.materialAssets.renderMaterial.Map
        .Pattern === undefined
    )
      renderMaterialBothImgs.jsonProperties.materialAssets.renderMaterial.Map.Pattern =
        {};
    if (
      renderMaterialBothImgs.jsonProperties.materialAssets.renderMaterial.Map
        .Normal === undefined
    )
      renderMaterialBothImgs.jsonProperties.materialAssets.renderMaterial.Map.Normal =
        {};
    renderMaterialBothImgs.jsonProperties.materialAssets.renderMaterial.Map.TextureId =
      texture1Id;
    renderMaterialBothImgs.jsonProperties.materialAssets.renderMaterial.Map.Pattern.TextureId =
      texture1Id;
    renderMaterialBothImgs.jsonProperties.materialAssets.renderMaterial.Map.Normal.TextureId =
      texture2Id;
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    renderMaterialBothImgs.update();

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const renderMaterialOnlyPatternId = RenderMaterialElement.insert(
      sourceDb,
      IVault.dictionaryId,
      "TextureMaterialOnlyPattern",
      {
        paletteName: "something",
        patternMap: {
          TextureId: texture1Id, // eslint-disable-line @typescript-eslint/naming-convention
        },
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const renderMaterialOnlyNormalId = RenderMaterialElement.insert(
      sourceDb,
      IVault.dictionaryId,
      "TextureMaterialOnlyNormal",
      {
        paletteName: "something",
        normalMap: {
          TextureId: texture2Id, // eslint-disable-line @typescript-eslint/naming-convention
        },
      }
    );

    const physObjs = [
      renderMaterialBothImgsId,
      renderMaterialOnlyNormalId,
      renderMaterialOnlyPatternId,
    ].map((renderMaterialId) => {
      const physicalObjectProps1: PhysicalElementProps = {
        classFullName: PhysicalObject.classFullName,
        model: sourceModelId,
        category: categoryId,
        code: Code.createEmpty(),
        userLabel: "PhysicalObject",
        geom: IVaultTransformerTestUtils.createBox(
          Point3d.create(1, 1, 1),
          categoryId,
          category.myDefaultSubCategoryId(),
          renderMaterialId
        ),
        placement: Placement3d.fromJSON({ origin: { x: 0, y: 0 }, angles: {} }),
      };
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      return sourceDb.elements.insertElement(physicalObjectProps1);
    });

    // create target iVault
    const targetDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "Transform3d-Target.dtw"
    );
    const createTargetDb = () =>
      StandaloneDb.createEmpty(targetDbFile, {
        rootSubject: { name: "Transform3d-Target" },
      });

    // transform
    const transformer = new AssertOrderAndShiftIdsTransformer(
      [renderMaterialBothImgsId, texture1Id],
      sourceDb,
      createTargetDb
    );
    await transformer.process();

    const texture1IdInTarget =
      transformer.context.findTargetElementId(texture1Id);
    const texture2IdInTarget =
      transformer.context.findTargetElementId(texture2Id);
    assert(Id64.isValidId64(texture1IdInTarget));
    assert(Id64.isValidId64(texture2IdInTarget));

    for (const objId of physObjs) {
      const objInTargetId = transformer.context.findTargetElementId(objId);
      const objInTarget =
        transformer.targetDb.elements.getElement<PhysicalObject>({
          id: objInTargetId,
          wantGeometry: true,
        });
      assert(objInTarget.geom);
      const materialOfObjInTargetId = objInTarget.geom.find(
        (g) => g.material?.materialId
      )?.material?.materialId;
      assert(materialOfObjInTargetId);

      const materialOfObjInTarget =
        transformer.targetDb.elements.getElement<RenderMaterialElement>(
          materialOfObjInTargetId
        );
      if (
        materialOfObjInTarget.jsonProperties.materialAssets.renderMaterial.Map
          .Pattern
      )
        expect(
          materialOfObjInTarget.jsonProperties.materialAssets.renderMaterial.Map
            .Pattern.TextureId
        ).to.equal(texture1IdInTarget);
      if (
        materialOfObjInTarget.jsonProperties.materialAssets.renderMaterial.Map
          .Normal
      )
        expect(
          materialOfObjInTarget.jsonProperties.materialAssets.renderMaterial.Map
            .Normal.TextureId
        ).to.equal(texture2IdInTarget);
    }

    // clean up
    transformer.dispose();
    sourceDb.close();
    transformer.targetDb.close();
  });

  it("handle same name dynamic schemas", async function () {
    const makeDynamicSchema = (
      version: string
    ) => `<?xml version="1.0" encoding="UTF-8"?>
        <DMSchema schemaName="Dynamic" alias="d1" version="${version}" displayLabel="dyn" xmlns="http://www.szewec.com/schemas/Szewec.DMXML.3.2">
            <DMCustomAttributes>
                <DynamicSchema xmlns="CoreCustomAttributes.01.00.03"/>
            </DMCustomAttributes>
        </DMSchema>
    `;

    const sourceDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "DynSchemas-Source.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbFile, {
      rootSubject: { name: "DynSchemaSource" },
    });
    await sourceDb.importSchemaStrings([makeDynamicSchema("01.07.00")]);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    const targetDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "DynSchemas-Target.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbFile, {
      rootSubject: { name: "DynSchemasTarget" },
    });
    await targetDb.importSchemaStrings([makeDynamicSchema("01.05.02")]);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    const transformer = new IVaultTransformer(sourceDb, targetDb);
    // expect this to not reject, adding chai as promised makes the error less readable
    await transformer.processSchemas();

    expect(targetDb.querySchemaVersion("Dynamic")).to.equal("1.7.0");

    // clean up
    transformer.dispose();
    sourceDb.close();
    targetDb.close();
  });

  /** unskip to generate a javascript CPU profile on just the processAll portion of an iVault */
  it.skip("should profile an IVault transformation", async function () {
    const sourceDbFile = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "ProfileTransformation.dtw"
    );
    const sourceDb = SnapshotDb.createFrom(
      await ReusedSnapshots.extensiveTestScenario,
      sourceDbFile
    );
    const targetDbFile = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "ProfileTransformationTarget.dtw"
    );
    const targetDb = SnapshotDb.createEmpty(targetDbFile, {
      rootSubject: { name: "ProfileTransformationTarget" },
    });
    const transformer = new IVaultTransformer(sourceDb, targetDb);
    // force initialize to not profile the schema reference cache hydration that will happen the first time an IVaultCloneContext is created
    await transformer.initialize();
    await transformer.processSchemas();
    await runWithCpuProfiler(
      async () => {
        await transformer.process();
      },
      {
        profileName: `newbranch_${this.test?.title.replace(/ /g, "_")}`,
        timestamp: true,
        sampleIntervalMicroSec: 30, // this is a quick transformation, let's get more resolution
      }
    );
    transformer.dispose();
    sourceDb.close();
    targetDb.close();
  });

  it("should transform iVault with DMView successfully", async function () {
    if (!Semver.gte(coreBackendPkgJson.version, "4.6.0")) {
      return; // Pre 4.6.0 does not have QueryView support. https://www.szewtwinjs.org/bis/domains/dmdbmap.dmschema/#queryview
    }
    const createSnapshot = (name: string): SnapshotDb => {
      return SnapshotDb.createEmpty(
        IVaultTransformerTestUtils.prepareOutputFile(
          "IVaultTransformer",
          `${name}.bim`
        ),
        { rootSubject: { name } }
      );
    };
    const sourceDb = createSnapshot("DMView-Source");
    const targetDb = createSnapshot("DMView-Target");
    await sourceDb.importSchemas([
      path.join(KnownTestLocations.assetsDir, "TestQueryView.dmschema.xml"),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const modelId = PhysicalModel.insert(
      sourceDb,
      IVault.rootSubjectId,
      "PhysicalModel"
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const categoryId = SpatialCategory.insert(
      sourceDb,
      IVault.dictionaryId,
      "SpatialCategory",
      {}
    );
    const elementProps1: GeometricElement3dProps = {
      category: categoryId,
      model: modelId,
      code: PhysicalType.createCode(sourceDb, modelId, "PhysicalObject1"),
      classFullName: PhysicalObject.classFullName,
      placement: {
        origin: { x: 0, y: 0, z: 0 },
        angles: { yaw: { degrees: 45 } },
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const sourceElement1Id = sourceDb.elements.insertElement(elementProps1);
    const elementProps2: GeometricElement3dProps = {
      category: categoryId,
      model: modelId,
      code: PhysicalType.createCode(sourceDb, modelId, "PhysicalObject2"),
      classFullName: PhysicalObject.classFullName,
      parent: {
        id: sourceElement1Id,
        relClassName: ElementOwnsChildElements.classFullName,
      },
      placement: {
        origin: { x: 0, y: 0, z: 0 },
        angles: { yaw: { degrees: 90 } },
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.elements.insertElement(elementProps2);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    sourceDb.saveChanges();

    const transformer = new IVaultTransformer(sourceDb, targetDb);
    await transformer.processSchemas();
    await transformer.process();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    targetDb.saveChanges();

    const getTestViewElements = async (ivaultDb: IVaultDb) => {
      const viewElements = [];
      for await (const row of ivaultDb.createQueryReader(
        "SELECT * FROM TestGeneratedClassesNew.TestView"
      )) {
        viewElements.push(row.toRow());
      }
      return viewElements;
    };
    const sourceViews = await getTestViewElements(sourceDb);
    const targetViews = await getTestViewElements(targetDb);

    expect(sourceViews.length).to.equal(targetViews.length).and.to.equal(2);
    expect(sourceViews[0]).to.deep.equal(targetViews[0]);
    expect(sourceViews[1]).to.deep.equal(targetViews[1]);

    // clean up
    transformer.dispose();
    sourceDb.close();
    targetDb.close();
  });
  it("should import line style from geometry stream", async function () {
    if (!Semver.gte(coreBackendPkgJson.version, "4.10.12")) {
      return; // Pre 4.10.12 does not properly import line styles, so test will fail in older versions
    }
    const sourceDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "LineStyle.dtw"
    );
    const iVaultDb = SnapshotDb.createEmpty(sourceDbFile, {
      rootSubject: { name: "LineStyle" },
    });
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const subjectId = Subject.insert(
      iVaultDb,
      IVault.rootSubjectId,
      "My objects"
    );
    const defModelId = DefinitionModel.insert(
      iVaultDb,
      subjectId,
      "DefinitionModel"
    );

    // Entires in be_Prop table:
    const lsStrokes1: LineStyleDefinition.Strokes = [];
    const lsStrokes2: LineStyleDefinition.Strokes = [];
    lsStrokes1.push({
      length: 4,
      strokeMode: LineStyleDefinition.StrokeMode.Dash,
    });
    lsStrokes1.push({ length: 2 });
    lsStrokes2.push({
      length: 1,
      strokeMode: LineStyleDefinition.StrokeMode.Dash,
    });
    lsStrokes2.push({ length: 1 });
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const styleProps1 = LineStyleDefinition.Utils.createStrokePatternComponent(
      iVaultDb,
      { descr: "line1", strokes: lsStrokes1 }
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const styleProps2 = LineStyleDefinition.Utils.createStrokePatternComponent(
      iVaultDb,
      { descr: "line2", strokes: lsStrokes2 }
    );
    styleProps2.unitDef = 2;

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const lineStyle1Id = LineStyleDefinition.Utils.createStyle(
      iVaultDb,
      defModelId,
      "LineStyle1",
      styleProps1
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const lineStyle2Id = LineStyleDefinition.Utils.createStyle(
      iVaultDb,
      defModelId,
      "LineStyle2",
      styleProps2
    );

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const category1Id = SpatialCategory.insert(
      iVaultDb,
      defModelId,
      "Red category",
      { color: ColorDef.red.toJSON() }
    );
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const category2Id = SpatialCategory.insert(
      iVaultDb,
      defModelId,
      "Green category",
      { color: ColorDef.green.toJSON() }
    );

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const modelId = GenericGraphicalModel3d.insert(
      iVaultDb,
      subjectId,
      "lines"
    );

    // Insert Line1
    const code1 = Code.createEmpty();
    code1.value = "line1";
    const geometryBuilder1 = new GeometryStreamBuilder();
    const geometryParams1 = new GeometryParams(category1Id);
    geometryParams1.styleInfo = new LineStyle.Info(lineStyle1Id);
    geometryBuilder1.appendGeometryParamsChange(geometryParams1);
    geometryBuilder1.appendGeometry(LineSegment3d.createXYXY(0, 0, 0, 50));
    const graphicElement1Props: GeometricElement3dProps = {
      category: category1Id,
      model: modelId,
      code: code1,
      classFullName: Graphic3d.classFullName,
      geom: geometryBuilder1.geometryStream,
    };
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    iVaultDb.elements.insertElement(graphicElement1Props);

    // Insert Line2
    const code2 = Code.createEmpty();
    code2.value = "line2";
    const geometryBuilder2 = new GeometryStreamBuilder();
    const geometryParams2 = new GeometryParams(category2Id);
    geometryParams2.styleInfo = new LineStyle.Info(lineStyle2Id);
    geometryBuilder2.appendGeometryParamsChange(geometryParams2);
    geometryBuilder2.appendGeometry(LineSegment3d.createXYXY(10, 0, 10, 50));
    const graphicElement2Props: GeometricElement3dProps = {
      category: category2Id,
      model: modelId,
      code: code2,
      classFullName: Graphic3d.classFullName,
      geom: geometryBuilder2.geometryStream,
    };
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    iVaultDb.elements.insertElement(graphicElement2Props);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    iVaultDb.saveChanges();

    // create target iVault
    const targetDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "LineStyle-Target.dtw"
    );
    const targetDb = StandaloneDb.createEmpty(targetDbFile, {
      rootSubject: { name: "LineStyle-Target" },
    });
    const transformer = new IVaultTransformer(iVaultDb, targetDb);
    await transformer.process();

    const fedGuid = iVaultDb.elements.getElement(lineStyle1Id).federationGuid;
    const fedGuid2 = iVaultDb.elements.getElement(lineStyle2Id).federationGuid;
    const srcCode1 = iVaultDb.elements.getElement(lineStyle1Id).toJSON().code;
    const srcCode2 = iVaultDb.elements.getElement(lineStyle2Id).toJSON().code;

    const copiedElement = targetDb.elements.getElement(fedGuid!);
    const copiedElement2 = targetDb.elements.getElement(fedGuid2!);

    // verify that line style value matches copied elements with same fed guids
    assert(srcCode1.value! === copiedElement.toJSON().code.value);
    assert(srcCode2.value! === copiedElement2.toJSON().code.value);

    const compIds = [JSON.parse(copiedElement.asAny.toJSON().data).compId];
    compIds.push(JSON.parse(copiedElement2.asAny.toJSON().data).compId);

    // Verify comp Id's are correctly mapped between bis_Element and be_Prop tables
    targetDb.withPreparedSqliteStatement(
      "SELECT Name,Id,StrData FROM be_Prop WHERE Namespace='bld_LStyle'",
      (stmt: SqliteStatement) => {
        let rowCount: number = 0;
        while (stmt.step() === DbResult.BE_SQLITE_ROW) {
          const row = stmt.getRow();
          assert.equal(compIds[rowCount], row.id);
          assert.equal(row.name, "LineCodeV1");
          rowCount++;
        }
        assert.equal(rowCount, 2);
      }
    );

    transformer.dispose();
    iVaultDb.close();
    targetDb.close();
    IVaultJsFs.removeSync(targetDbFile);
    IVaultJsFs.removeSync(sourceDbFile);
  });

  it("should import compound line style from geometry stream", async function () {
    if (!Semver.gte(coreBackendPkgJson.version, "4.10.12")) {
      return; // Pre 4.10.12 does not properly import line styles, so test will fail in older versions
    }
    const sourceDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "CompoundLineStyle.dtw"
    );
    const iVaultDb = SnapshotDb.createEmpty(sourceDbFile, {
      rootSubject: { name: "LineStyle" },
    });
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const subjectId = Subject.insert(
      iVaultDb,
      IVault.rootSubjectId,
      "My objects"
    );
    const defModelId = DefinitionModel.insert(
      iVaultDb,
      subjectId,
      "DefinitionModel"
    );

    const lsStrokes: LineStyleDefinition.Strokes = [];
    lsStrokes.push({
      length: 0.25,
      orgWidth: 0.0,
      endWidth: 0.025,
      strokeMode: LineStyleDefinition.StrokeMode.Dash,
      widthMode: LineStyleDefinition.StrokeWidth.Left,
    });
    lsStrokes.push({ length: 0.1 });
    lsStrokes.push({
      length: 0.1,
      orgWidth: 0.025,
      endWidth: 0.025,
      strokeMode: LineStyleDefinition.StrokeMode.Dash,
      widthMode: LineStyleDefinition.StrokeWidth.Full,
    });
    lsStrokes.push({ length: 0.1 });
    lsStrokes.push({
      length: 0.25,
      orgWidth: 0.025,
      endWidth: 0.0,
      strokeMode: LineStyleDefinition.StrokeMode.Dash,
      widthMode: LineStyleDefinition.StrokeWidth.Right,
    });
    lsStrokes.push({ length: 0.1 });

    const strokePatternData =
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      LineStyleDefinition.Utils.createStrokePatternComponent(iVaultDb, {
        descr: "TestDashDotDashLineCode",
        strokes: lsStrokes,
      });
    assert.isTrue(undefined !== strokePatternData);

    const partBuilder = new GeometryStreamBuilder();
    partBuilder.appendGeometry(Arc3d.createXY(Point3d.createZero(), 0.05));

    const partProps: GeometryPartProps = {
      classFullName: GeometryPart.classFullName,
      model: IVault.dictionaryId,
      code: Code.createEmpty(),
      geom: partBuilder.geometryStream,
    };
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const partId = iVaultDb.elements.insertElement(partProps);
    assert.isTrue(Id64.isValidId64(partId));

    const pointSymbolData =
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      LineStyleDefinition.Utils.createPointSymbolComponent(iVaultDb, {
        geomPartId: partId,
      }); // base and size will be set automatically...
    assert.isTrue(undefined !== pointSymbolData);

    const lsSymbols: LineStyleDefinition.Symbols = [];
    lsSymbols.push({
      symId: pointSymbolData!.compId,
      strokeNum: 1,
      mod1: LineStyleDefinition.SymbolOptions.Center,
    });
    lsSymbols.push({
      symId: pointSymbolData!.compId,
      strokeNum: 3,
      mod1: LineStyleDefinition.SymbolOptions.Center,
    });

    const strokePointData =
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      LineStyleDefinition.Utils.createStrokePointComponent(iVaultDb, {
        descr: "TestGapSymbolsLinePoint",
        lcId: strokePatternData.compId,
        symbols: lsSymbols,
      });
    assert.isTrue(undefined !== strokePointData);

    const lsComponents: LineStyleDefinition.Components = [];
    lsComponents.push({
      id: strokePointData.compId,
      type: strokePointData.compType,
    });
    lsComponents.push({
      id: strokePatternData.compId,
      type: strokePatternData.compType,
    });

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const compoundData = LineStyleDefinition.Utils.createCompoundComponent(
      iVaultDb,
      { comps: lsComponents }
    );
    assert.isTrue(undefined !== compoundData);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const styleId = LineStyleDefinition.Utils.createStyle(
      iVaultDb,
      IVault.dictionaryId,
      "TestDashCircleDotCircleDashStyle",
      compoundData
    );
    assert.isTrue(Id64.isValidId64(styleId));

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const category1Id = SpatialCategory.insert(
      iVaultDb,
      defModelId,
      "Red category",
      { color: ColorDef.red.toJSON() }
    );

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const modelId = GenericGraphicalModel3d.insert(
      iVaultDb,
      subjectId,
      "lines"
    );
    // Insert Line1
    const code1 = Code.createEmpty();
    code1.value = "line1";
    const geometryBuilder1 = new GeometryStreamBuilder();
    const geometryParams1 = new GeometryParams(category1Id);
    geometryParams1.styleInfo = new LineStyle.Info(styleId);
    geometryBuilder1.appendGeometryParamsChange(geometryParams1);
    geometryBuilder1.appendGeometry(LineSegment3d.createXYXY(0, 0, 0, 50));
    const graphicElement1Props: GeometricElement3dProps = {
      category: category1Id,
      model: modelId,
      code: code1,
      classFullName: Graphic3d.classFullName,
      geom: geometryBuilder1.geometryStream,
    };
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    iVaultDb.elements.insertElement(graphicElement1Props);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    iVaultDb.saveChanges();

    const targetDbFile: string = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultTransformer",
      "CompoundLineStyle-Target.dtw"
    );
    const targetDb = StandaloneDb.createEmpty(targetDbFile, {
      rootSubject: { name: "LineStyle-Target" },
    });
    const transformer = new IVaultTransformer(iVaultDb, targetDb);
    await transformer.process();

    const fedGuid = iVaultDb.elements.getElement(styleId).federationGuid;
    const srcCode1 = iVaultDb.elements.getElement(styleId).toJSON().code;

    const copiedElement = targetDb.elements.getElement(fedGuid!);

    // verify that line style value matches copied element with same fed guids
    assert(srcCode1.value! === copiedElement.toJSON().code.value);

    const compId = JSON.parse(copiedElement.asAny.toJSON().data).compId;

    let rowCount: number = 0;
    const styleTypes: string[] = [];
    iVaultDb.withPreparedSqliteStatement(
      "SELECT Name,Id,StrData FROM be_Prop WHERE Namespace='bld_LStyle'",
      (stmt: SqliteStatement) => {
        while (stmt.step() === DbResult.BE_SQLITE_ROW) {
          styleTypes.push(stmt.getRow().name);
          rowCount++;
        }
      }
    );

    // Verify comp Id is correctly mapped between bis_Element and be_Prop tables
    targetDb.withPreparedSqliteStatement(
      "SELECT Name,Id,StrData FROM be_Prop WHERE Namespace='bld_LStyle'",
      (stmt: SqliteStatement) => {
        let i: number = 0;
        while (stmt.step() === DbResult.BE_SQLITE_ROW) {
          const row = stmt.getRow();
          assert.equal(compId, row.id);
          assert(styleTypes.includes(row.name), "style type not found");
          i++;
        }
        assert.equal(rowCount, i, "row counts do not match");
      }
    );

    transformer.dispose();
    iVaultDb.close();
    targetDb.close();
    IVaultJsFs.removeSync(targetDbFile);
    IVaultJsFs.removeSync(sourceDbFile);
  });
});
