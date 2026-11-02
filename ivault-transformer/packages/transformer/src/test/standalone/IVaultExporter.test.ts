/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import {
  // eslint-disable-next-line @typescript-eslint/no-redeclare
  Element,
  ElementRefersToElements,
  GeometryPart,
  GraphicalElement3dRepresentsElement,
  IVaultJsFs,
  PhysicalModel,
  PhysicalObject,
  SnapshotDb,
  SpatialCategory,
  withEditTxn,
} from "@szewtwin/core-backend";
import { Id64 } from "@szewtwin/core-szewec";
import {
  Code,
  GeometryPartProps,
  GeometryStreamBuilder,
  IVault,
  PhysicalElementProps,
  RelationshipProps,
  SubCategoryAppearance,
} from "@szewtwin/core-common";
import { Point3d, YawPitchRollAngles } from "@szewtwin/core-geometry";
import { assert, expect } from "chai";
import * as path from "path";
import { IVaultExporter, IVaultExportHandler } from "../../IVaultExporter";
import { IVaultTransformerTestUtils } from "../IVaultTransformerUtils";
import { createBRepDataProps } from "../TestUtils/GeometryTestUtil";
import { KnownTestLocations } from "../TestUtils/KnownTestLocations";

import "./TransformerTestStartup"; // calls startup/shutdown IVaultHost before/after all tests

describe("IVaultExporter", () => {
  const outputDir = path.join(KnownTestLocations.outputDir, "IVaultExporter");

  before(async () => {
    if (!IVaultJsFs.existsSync(KnownTestLocations.outputDir)) {
      IVaultJsFs.mkdirSync(KnownTestLocations.outputDir);
    }
    if (!IVaultJsFs.existsSync(outputDir)) {
      IVaultJsFs.mkdirSync(outputDir);
    }
  });

  it("export element with brep geometry", async () => {
    const sourceDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultExporter",
      "RoundtripBrep.dtw"
    );
    const sourceDb = SnapshotDb.createEmpty(sourceDbPath, {
      rootSubject: { name: "brep-roundtrip" },
    });

    const builder = new GeometryStreamBuilder();
    builder.appendBRepData(
      createBRepDataProps(
        Point3d.create(5, 10, 0),
        YawPitchRollAngles.createDegrees(45, 0, 0)
      )
    );

    const geomPartId = withEditTxn(sourceDb, "insert brep geom part", (txn) => {
      return txn.insertElement({
        classFullName: GeometryPart.classFullName,
        model: IVault.dictionaryId,
        code: Code.createEmpty(),
        geom: builder.geometryStream,
      } as GeometryPartProps);
    });

    assert(Id64.isValidId64(geomPartId));
    const geomPartInSource = sourceDb.elements.getElement<GeometryPart>(
      { id: geomPartId, wantGeometry: true, wantBRepData: true },
      GeometryPart
    );
    assert(geomPartInSource.geom?.[1]?.brep?.data !== undefined);

    const flatTargetDbPath = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultExporter",
      "RoundtripBrepTarget.dtw"
    );
    const flatTargetDb = SnapshotDb.createEmpty(flatTargetDbPath, {
      rootSubject: sourceDb.rootSubject,
    });

    class TestFlatImportHandler extends IVaultExportHandler {
      public override async onExportElement(elem: Element): Promise<void> {
        if (elem instanceof GeometryPart)
          withEditTxn(flatTargetDb, "insert exported element", (txn) => {
            txn.insertElement(elem.toJSON());
          });
      }
    }

    const exporter = new IVaultExporter(sourceDb);
    exporter.registerHandler(new TestFlatImportHandler());
    exporter.wantGeometry = true;
    await expect(exporter.exportAll()).to.eventually.be.fulfilled;

    const geomPartInTarget = flatTargetDb.elements.getElement<GeometryPart>(
      { id: geomPartId, wantGeometry: true, wantBRepData: true },
      GeometryPart
    );
    assert(geomPartInTarget.geom?.[1]?.brep?.data !== undefined);

    sourceDb.close();
  });

  describe("exportRelationships", () => {
    it("should not export invalid relationships", async () => {
      const sourceDbPath = IVaultTransformerTestUtils.prepareOutputFile(
        "IVaultExporter",
        "InvalidRelationship.dtw"
      );
      const sourceDb = SnapshotDb.createEmpty(sourceDbPath, {
        rootSubject: { name: "invalid-relationships" },
      });

      const physicalObject1 = withEditTxn(
        sourceDb,
        "setup elements and relationships",
        (txn) => {
          const categoryId = SpatialCategory.insert(
            txn,
            IVault.dictionaryId,
            "SpatialCategory",
            new SubCategoryAppearance()
          );
          const sourceModelId = PhysicalModel.insert(
            txn,
            IVault.rootSubjectId,
            "PhysicalModel"
          );
          const physicalObjectProps: PhysicalElementProps = {
            classFullName: PhysicalObject.classFullName,
            model: sourceModelId,
            category: categoryId,
            code: Code.createEmpty(),
          };
          const obj1 = txn.insertElement(physicalObjectProps);
          const obj2 = txn.insertElement(physicalObjectProps);
          const obj3 = txn.insertElement(physicalObjectProps);
          const obj4 = txn.insertElement(physicalObjectProps);

          const invalidRelationshipsProps: RelationshipProps[] = [
            // target element will be deleted
            {
              classFullName: GraphicalElement3dRepresentsElement.classFullName,
              targetId: obj1,
              sourceId: obj2,
            },
            // target and source elements are invalid
            {
              classFullName: GraphicalElement3dRepresentsElement.classFullName,
              targetId: "",
              sourceId: "",
            },
            // only target element is invalid
            {
              classFullName: GraphicalElement3dRepresentsElement.classFullName,
              targetId: "",
              sourceId: obj3,
            },
            // only source element is invalid
            {
              classFullName: GraphicalElement3dRepresentsElement.classFullName,
              targetId: obj4,
              sourceId: "",
            },
          ];

          invalidRelationshipsProps.forEach((props) =>
            txn.insertRelationship(props)
          );

          return obj1;
        }
      );

      // this is used to substitute low level C++ functions the connectors would used to introduce invalid relationships.
      sourceDb.withSqliteStatement(
        `DELETE FROM bis_Element WHERE Id = ${physicalObject1}`,
        (stmt) => stmt.next()
      );
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- saving raw SQL changes
      sourceDb.saveChanges();

      const sourceRelationships = [];
      for await (const row of sourceDb.createQueryReader(
        "SELECT DMInstanceId FROM bis.ElementRefersToElements"
      )) {
        sourceRelationships.push(row);
      }
      expect(sourceRelationships.length).to.be.equal(4);

      const targetDbFile = IVaultTransformerTestUtils.prepareOutputFile(
        "IVaultTransformer",
        "relationships-Target.dtw"
      );
      const targetDb = SnapshotDb.createEmpty(targetDbFile, {
        rootSubject: { name: "relationships-Target" },
      });

      const exporter = new IVaultExporter(sourceDb);
      await expect(
        exporter.exportRelationships(ElementRefersToElements.classFullName)
      ).to.eventually.be.fulfilled;

      const targetRelationships = [];
      for await (const row of targetDb.createQueryReader(
        "SELECT DMInstanceId FROM bis.ElementRefersToElements"
      )) {
        targetRelationships.push(row);
      }
      expect(
        targetRelationships.length,
        "TargetDb should not contain any invalid relationships"
      ).to.be.equal(0);

      sourceDb.close();
    });
  });
});
