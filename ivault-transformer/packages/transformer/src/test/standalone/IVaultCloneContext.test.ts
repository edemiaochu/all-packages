/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import {
  ElementRefersToElements,
  EntityReferences,
  GraphicalElement3dRepresentsElement,
  IVaultJsFs,
  PhysicalModel,
  PhysicalObject,
  SnapshotDb,
  SpatialCategory,
  withEditTxn,
} from "@szewtwin/core-backend";
import { Id64, Id64String } from "@szewtwin/core-szewec";
import {
  Code,
  ConcreteEntityTypes,
  IVault,
  PhysicalElementProps,
  RelationshipProps,
  SubCategoryAppearance,
} from "@szewtwin/core-common";
import { expect } from "chai";
import * as path from "path";
import { IVaultTransformerTestUtils } from "../IVaultTransformerUtils";
import { KnownTestLocations } from "../TestUtils/KnownTestLocations";

import { IVaultTransformer } from "../../IVaultTransformer";
import "./TransformerTestStartup"; // calls startup/shutdown IVaultHost before/after all tests

describe("IVaultCloneContext", () => {
  const outputDir = path.join(
    KnownTestLocations.outputDir,
    "IVaultTransformer"
  );

  before(async () => {
    if (!IVaultJsFs.existsSync(KnownTestLocations.outputDir)) {
      IVaultJsFs.mkdirSync(KnownTestLocations.outputDir);
    }
    if (!IVaultJsFs.existsSync(outputDir)) {
      IVaultJsFs.mkdirSync(outputDir);
    }
  });

  describe("findTargetEntityId", () => {
    it("should return target relationship id", async () => {
      // Setup
      // Source IVaultDb
      const sourceDbPath = IVaultTransformerTestUtils.prepareOutputFile(
        "IVaultCloneContext",
        "ShouldReturnRelationShipId.dtw"
      );
      const sourceDb = SnapshotDb.createEmpty(sourceDbPath, {
        rootSubject: { name: "invalid-relationships" },
      });

      withEditTxn(
        sourceDb,
        "setup source elements and relationships",
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

          const relationshipsProps: RelationshipProps[] = [
            {
              classFullName: GraphicalElement3dRepresentsElement.classFullName,
              targetId: obj1,
              sourceId: obj2,
            },
            {
              classFullName: GraphicalElement3dRepresentsElement.classFullName,
              targetId: obj2,
              sourceId: obj1,
            },
            {
              classFullName: GraphicalElement3dRepresentsElement.classFullName,
              targetId: obj2,
              sourceId: obj3,
            },
            {
              classFullName: GraphicalElement3dRepresentsElement.classFullName,
              targetId: obj3,
              sourceId: obj2,
            },
          ];

          relationshipsProps.forEach((props) => txn.insertRelationship(props));
        }
      );

      // Target IVaultDb
      const targetDbFile = IVaultTransformerTestUtils.prepareOutputFile(
        "IVaultTransformer",
        "relationships-Target.dtw"
      );
      const targetDb = SnapshotDb.createEmpty(targetDbFile, {
        rootSubject: { name: "relationships-Target" },
      });
      // Import from beneath source Subject into target Subject
      const transformer = new IVaultTransformer(sourceDb, targetDb);
      await transformer.process();
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- saving changes from transformer.process()
      targetDb.saveChanges();

      // Assertion
      const sql = `SELECT r.DMInstanceId FROM ${ElementRefersToElements.classFullName} r
                    JOIN bis.Element s ON s.DMInstanceId = r.SourceDMInstanceId
                    JOIN bis.Element t ON t.DMInstanceId = r.TargetDMInstanceId
                    WHERE s.DMInstanceId IS NOT NULL AND t.DMInstanceId IS NOT NULL`;
      const sourceRelationshipIds: Id64String[] = [];
      for await (const row of sourceDb.createQueryReader(sql)) {
        sourceRelationshipIds.push(row.id);
      }
      let atLeastOneRelIdMissMatches = false;
      for (const sourceRelId of sourceRelationshipIds) {
        const targetRelId = EntityReferences.toId64(
          await transformer.context.findTargetEntityId(
            EntityReferences.fromEntityType(
              sourceRelId,
              ConcreteEntityTypes.Relationship
            )
          )
        );
        expect(targetRelId).to.not.be.equal(
          EntityReferences.fromEntityType(
            Id64.invalid,
            ConcreteEntityTypes.Relationship
          )
        ).and.to.be.not.undefined;

        if (!atLeastOneRelIdMissMatches)
          atLeastOneRelIdMissMatches = targetRelId !== sourceRelId;
      }
      /**
       * If this fails, then relationship ids match, and we don't really know if sourceDb and targetDb relationship ids differ.
       * It doesn't mean that functionality fails by itself.
       */
      expect(atLeastOneRelIdMissMatches).to.be.true;

      // Cleanup
      transformer.dispose();
      sourceDb.close();
      targetDb.close();
    });
  });
});
