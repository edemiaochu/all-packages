/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import "./TransformerTestStartup";
import {
  ElementOwnsMultiAspects,
  StandaloneDb,
  Subject,
} from "@szewtwin/core-backend";
import { Code, ElementAspectProps, IVault } from "@szewtwin/core-common";
import { Id64String } from "@szewtwin/core-szewec";
import { IVaultImporter } from "../../IVaultImporter";
import { IVaultTransformerTestUtils } from "../IVaultTransformerUtils";

async function expectRejected(
  run: () => Promise<unknown>,
  match: RegExp
): Promise<void> {
  let error: Error | undefined;
  try {
    await run();
  } catch (caught) {
    error = caught as Error;
  }
  expect(error, "expected the call to throw").to.not.be.undefined;
  expect(error!.message).to.match(match);
}

describe("IVaultImporter", () => {
  it("deleteElement skips elements in doNotUpdateElementIds (no-op guard)", async () => {
    const targetDbFile = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultImporter",
      "DeleteElementGuard.dtw"
    );
    const targetDb = StandaloneDb.createEmpty(targetDbFile, {
      rootSubject: { name: "DeleteElementGuard" },
    });
    try {
      const protectedId: Id64String =
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        Subject.insert(targetDb, IVault.rootSubjectId, "Protected");
      const deletableId: Id64String =
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        Subject.insert(targetDb, IVault.rootSubjectId, "Deletable");
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      targetDb.saveChanges();

      const importer = new IVaultImporter(targetDb);
      importer.doNotUpdateElementIds.add(protectedId);

      await importer.deleteElement(protectedId);
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      targetDb.saveChanges();
      expect(
        targetDb.elements.tryGetElement(protectedId),
        "guarded element should NOT be deleted"
      ).to.not.be.undefined;

      // Control: an element not in the set is actually deleted.
      await importer.deleteElement(deletableId);
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      targetDb.saveChanges();
      expect(
        targetDb.elements.tryGetElement(deletableId),
        "unguarded element should be deleted"
      ).to.be.undefined;
    } finally {
      targetDb.close();
    }
  });

  it("importElementMultiAspects deletes surplus aspects via onDeleteElementAspect", async () => {
    const targetDbFile = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultImporter",
      "DeleteElementAspect.dtw"
    );
    const targetDb = StandaloneDb.createEmpty(targetDbFile, {
      rootSubject: { name: "DeleteElementAspect" },
    });
    try {
      const schema = `<?xml version="1.0" encoding="UTF-8"?>
<DMSchema schemaName="TestImporterSchema" alias="tis" version="01.00.00" xmlns="http://www.szewec.com/schemas/Szewec.DMXML.3.1">
  <DMSchemaReference name="BisCore" version="01.00.04" alias="bis"/>
  <DMEntityClass typeName="TestMultiAspect" modifier="Sealed">
    <BaseClass>bis:ElementMultiAspect</BaseClass>
  </DMEntityClass>
</DMSchema>`;
      await targetDb.importSchemaStrings([schema]);

      const elementId: Id64String =
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        Subject.insert(targetDb, IVault.rootSubjectId, "AspectHost");
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      targetDb.saveChanges();

      const aspectClassFullName = "TestImporterSchema:TestMultiAspect";
      const makeAspectProps = (): ElementAspectProps => ({
        classFullName: aspectClassFullName,
        element: new ElementOwnsMultiAspects(elementId),
      });

      const importer = new IVaultImporter(targetDb);

      await importer.importElementMultiAspects([
        makeAspectProps(),
        makeAspectProps(),
      ]);
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      targetDb.saveChanges();
      expect(
        targetDb.elements.getAspects(elementId, aspectClassFullName).length,
        "two aspects should have been inserted"
      ).to.equal(2);

      // Re-import with one aspect: the surplus is removed via onDeleteElementAspect.
      await importer.importElementMultiAspects([makeAspectProps()]);
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      targetDb.saveChanges();
      expect(
        targetDb.elements.getAspects(elementId, aspectClassFullName).length,
        "surplus aspect should have been deleted"
      ).to.equal(1);
    } finally {
      targetDb.close();
    }
  });

  it("insert write paths surface a helpful error when the class is missing from the target", async () => {
    const targetDbFile = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultImporter",
      "MissingClass.dtw"
    );
    const targetDb = StandaloneDb.createEmpty(targetDbFile, {
      rootSubject: { name: "MissingClass" },
    });
    try {
      const importer = new IVaultImporter(targetDb);
      const missing = "TestImporterSchema:DoesNotExist";
      await expectRejected(
        () =>
          (importer as any).onInsertModel({
            classFullName: missing,
            modeledElement: { id: IVault.rootSubjectId },
          }),
        /not found in the target iVault/
      );
      await expectRejected(
        () =>
          (importer as any).onInsertElement({
            classFullName: missing,
            model: IVault.repositoryModelId,
            code: Code.createEmpty(),
          }),
        /not found in the target iVault/
      );
      await expectRejected(
        () =>
          (importer as any).onInsertElementAspect({
            classFullName: missing,
            element: { id: IVault.rootSubjectId },
          }),
        /not found in the target iVault/
      );
      await expectRejected(
        () =>
          (importer as any).onInsertRelationship({
            classFullName: missing,
            sourceId: IVault.rootSubjectId,
            targetId: IVault.rootSubjectId,
          }),
        /not found in the target iVault/
      );
      expect(
        await importer.importElementMultiAspects([]),
        "empty aspect array should be a no-op"
      ).to.deep.equal([]);
    } finally {
      targetDb.close();
    }
  });

  it("write-path guard clauses throw when required ids are missing", async () => {
    const targetDbFile = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultImporter",
      "MissingIds.dtw"
    );
    const targetDb = StandaloneDb.createEmpty(targetDbFile, {
      rootSubject: { name: "MissingIds" },
    });
    try {
      const importer = new IVaultImporter(targetDb);
      await expectRejected(
        async () => importer.importModel({} as any),
        /Model Id not provided/
      );
      await expectRejected(
        () => (importer as any).onUpdateElement({ classFullName: "BisCore:Subject" }),
        /ElementId not provided/
      );
      await expectRejected(
        () =>
          (importer as any).onUpdateRelationship({
            classFullName: "BisCore:ElementRefersToElements",
          }),
        /Relationship instance Id not provided/
      );
    } finally {
      targetDb.close();
    }
  });

  it("importElement requires an id when preserveElementIdsForFiltering is set", async () => {
    const targetDbFile = IVaultTransformerTestUtils.prepareOutputFile(
      "IVaultImporter",
      "PreserveIds.dtw"
    );
    const targetDb = StandaloneDb.createEmpty(targetDbFile, {
      rootSubject: { name: "PreserveIds" },
    });
    try {
      const importer = new IVaultImporter(targetDb, {
        preserveElementIdsForFiltering: true,
      });
      await expectRejected(
        async () =>
          importer.importElement({
            classFullName: "BisCore:Subject",
            model: IVault.repositoryModelId,
            code: Code.createEmpty(),
          } as any),
        /must be defined during a preserveIds operation/
      );
    } finally {
      targetDb.close();
    }
  });
});
