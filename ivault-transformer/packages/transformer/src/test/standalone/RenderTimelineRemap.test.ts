/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import {
  EditTxn,
  GenericSchema,
  PhysicalModel,
  PhysicalObject,
  PhysicalPartition,
  RenderTimeline,
  SpatialCategory,
  StandaloneDb,
  SubjectOwnsPartitionElements,
  withEditTxn,
} from "@szewtwin/core-backend";
import { IVaultTestUtils } from "../TestUtils/IVaultTestUtils";
import { CompressedId64Set, Guid, Id64, Id64String } from "@szewtwin/core-szewec";
import {
  Code,
  GeometryStreamBuilder,
  IVault,
  PhysicalElementProps,
  RenderSchedule,
  RenderTimelineProps,
} from "@szewtwin/core-common";
import {
  Box,
  Point3d,
  Vector3d,
  YawPitchRollAngles,
} from "@szewtwin/core-geometry";
import { IVaultTransformer } from "../../IVaultTransformer";

import "./TransformerTestStartup"; // calls startup/shutdown IVaultHost before/after all tests

describe("RenderTimeline Remap", () => {
  before(() => {
    GenericSchema.registerSchema();
  });

  function makeScriptProps(): RenderSchedule.ScriptProps {
    return [
      {
        modelId: "0x123",
        elementTimelines: [
          {
            batchId: 1,
            elementIds: ["0xabc", "0xdef"],
            visibilityTimeline: [{ time: 42, value: 50 }],
          },
        ],
      },
    ];
  }

  function insertTimeline(
    txn: EditTxn,
    _ivault: StandaloneDb,
    scriptProps?: RenderSchedule.ScriptProps
  ): Id64String {
    const script = JSON.stringify(scriptProps ?? makeScriptProps());
    const props: RenderTimelineProps = {
      model: IVault.dictionaryId,
      classFullName: RenderTimeline.classFullName,
      code: Code.createEmpty(),
      script,
    };
    return txn.insertElement(props);
  }

  function insertPhysicalModel(txn: EditTxn, db: StandaloneDb): Id64String {
    const partitionProps = {
      classFullName: PhysicalPartition.classFullName,
      model: IVault.repositoryModelId,
      parent: new SubjectOwnsPartitionElements(IVault.rootSubjectId),
      code: PhysicalPartition.createCode(
        db,
        IVault.rootSubjectId,
        `PhysicalPartition_${Guid.createValue()}`
      ),
    };

    const partitionId = txn.insertElement(partitionProps);
    expect(Id64.isValidId64(partitionId)).to.be.true;

    const model = db.models.createModel({
      classFullName: PhysicalModel.classFullName,
      modeledElement: { id: partitionId },
    });

    expect(model instanceof PhysicalModel).to.be.true;

    const modelId = txn.insertModel(model.toJSON());
    expect(Id64.isValidId64(modelId)).to.be.true;
    return modelId;
  }

  function insertPhysicalElement(
    txn: EditTxn,
    _db: StandaloneDb,
    model: Id64String,
    category: Id64String
  ): Id64String {
    const geomBuilder = new GeometryStreamBuilder();
    geomBuilder.appendGeometry(
      Box.createBldBox(
        Point3d.createZero(),
        Vector3d.unitX(),
        Vector3d.unitY(),
        new Point3d(0, 0, 2),
        2,
        2,
        2,
        2,
        true
      )!
    );
    const props: PhysicalElementProps = {
      classFullName: PhysicalObject.classFullName,
      model,
      category,
      code: Code.createEmpty(),
      geom: geomBuilder.geometryStream,
      placement: {
        origin: Point3d.create(1, 1, 1),
        angles: YawPitchRollAngles.createDegrees(0, 0, 0),
      },
    };

    const elemId = txn.insertElement(props);
    expect(Id64.isValid(elemId)).to.be.true;
    return elemId;
  }

  function createIVault(name: string): StandaloneDb {
    const props = {
      rootSubject: {
        name,
      },
      allowEdit: '{ "txns": true }',
    };
    const filename = IVaultTestUtils.prepareOutputFile(
      "RenderTimeline",
      `${name}.bim`
    );
    return StandaloneDb.createEmpty(filename, props);
  }

  it("remaps schedule script Ids on clone", async () => {
    const sourceDb = createIVault("remap-source");
    const {
      model: _model,
      category: _category,
      elementIds: _elementIds,
      sourceTimelineId,
      scriptProps,
    } = withEditTxn(sourceDb, "setup source", (txn) => {
      const modelId = insertPhysicalModel(txn, sourceDb);
      const catId = SpatialCategory.insert(txn, IVault.dictionaryId, "cat", {});
      const elemIds: Id64String[] = [];
      for (let i = 0; i < 3; i++)
        elemIds.push(insertPhysicalElement(txn, sourceDb, modelId, catId));

      const script: RenderSchedule.ScriptProps = [
        {
          modelId,
          elementTimelines: [
            {
              batchId: 1,
              elementIds: elemIds,
              visibilityTimeline: [{ time: 42, value: 50 }],
            },
          ],
        },
      ];

      const timelineId = insertTimeline(txn, sourceDb, script);
      return {
        model: modelId,
        category: catId,
        elementIds: elemIds,
        sourceTimelineId: timelineId,
        scriptProps: script,
      };
    });

    // Make sure targetDb has more elements in it to start with than sourceDb does, so element Ids will be different.
    const targetDb = createIVault("remap-target");
    withEditTxn(targetDb, "setup target", (txn) => {
      for (let i = 0; i < 3; i++) insertPhysicalModel(txn, targetDb);
    });

    const transformer = new IVaultTransformer(sourceDb, targetDb);
    await transformer.process();

    const targetTimelineIds = targetDb.queryEntityIds({
      from: RenderTimeline.classFullName,
    });
    expect(targetTimelineIds.size).to.equal(1);
    let targetTimelineId: Id64String | undefined;
    for (const id of targetTimelineIds) targetTimelineId = id;

    const sourceTimeline =
      sourceDb.elements.getElement<RenderTimeline>(sourceTimelineId);
    expect(sourceTimeline.scriptProps).to.deep.equal(scriptProps);

    const targetTimeline = targetDb.elements.getElement<RenderTimeline>(
      targetTimelineId!
    );
    expect(targetTimeline.scriptProps).not.to.deep.equal(scriptProps);
    expect(targetTimeline.scriptProps.length).to.equal(1);

    expect(targetTimeline.scriptProps[0].modelId).not.to.equal(
      scriptProps[0].modelId
    );
    expect(
      targetDb.models.getModel<PhysicalModel>(
        targetTimeline.scriptProps[0].modelId
      )
    ).instanceof(PhysicalModel);

    expect(targetTimeline.scriptProps[0].elementTimelines.length).to.equal(1);
    const timeline = targetTimeline.scriptProps[0].elementTimelines[0];

    let numElements = 0;
    expect(typeof timeline.elementIds).to.equal("string"); // remapping also compresses Ids if they weren't already.
    for (const elementId of CompressedId64Set.iterable(
      timeline.elementIds as string
    )) {
      ++numElements;
      expect(
        targetDb.elements.getElement<PhysicalObject>(elementId)
      ).instanceof(PhysicalObject);
    }
    expect(numElements).to.equal(3);
  });
});
