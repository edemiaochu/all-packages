/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import {
  ElementGroupsMembers,
  ExternalSource,
  ExternalSourceAspect,
  ExternalSourceIsInRepository,
  IVaultDb,
  PhysicalModel,
  PhysicalObject,
  RepositoryLink,
  SpatialCategory,
  StandaloneDb,
  withEditTxn,
} from "@szewtwin/core-backend";
import {
  initializeBranchProvenance,
  ProvenanceInitArgs,
  ProvenanceInitResult,
} from "../../BranchProvenanceInitializer";
import {
  assertIdentityTransformation,
  IVaultTransformerTestUtils,
} from "../IVaultTransformerUtils";
import {
  Code,
  ExternalSourceProps,
  RepositoryLinkProps,
} from "@szewtwin/core-common";
import { IVaultTransformer } from "../../IVaultTransformer";
import { Guid, OpenMode, TupleKeyedMap } from "@szewtwin/core-szewec";
import { assert, expect } from "chai";
import { Point3d, YawPitchRollAngles } from "@szewtwin/core-geometry";
import "./TransformerTestStartup"; // calls startup/shutdown IVaultHost before/after all tests

describe("compare ivaults from BranchProvenanceInitializer and traditional branch init", () => {
  // truth table (sourceHasFedGuid, targetHasFedGuid, forceCreateFedGuidsForMaster) -> (relSourceAspectNum, relTargetAspectNum)
  const sourceTargetFedGuidToAspectCountMap = new TupleKeyedMap([
    [
      [false, false, false],
      [2, 1],
    ],
    // "keep-reopened-db" is truthy but also equal to an optimized optional argument that we use
    [
      [false, false, "keep-reopened-db"],
      [0, 0],
    ],
    [
      [false, true, false],
      [2, 0],
    ],
    [
      [false, true, "keep-reopened-db"],
      [0, 0],
    ],
    [
      [true, false, false],
      [1, 1],
    ],
    [
      [true, false, "keep-reopened-db"],
      [0, 0],
    ],
    [
      [true, true, false],
      [0, 0],
    ],
    [
      [true, true, "keep-reopened-db"],
      [0, 0],
    ],
  ]);

  let generatedIVault: StandaloneDb;
  let sourceTargetFedGuidsToElemIds: TupleKeyedMap<
    [boolean, boolean],
    [string, string]
  >;

  let transformerBranchInitResult: ProvenanceInitResult | undefined;
  let noTransformerBranchInitResult: ProvenanceInitResult | undefined;
  let transformerForkDb: StandaloneDb | undefined;
  let noTransformerForkDb: StandaloneDb | undefined;

  before(async () => {
    [generatedIVault, sourceTargetFedGuidsToElemIds] = setupIVault();
  });

  for (const doBranchProv of [true, false]) {
    for (const createFedGuidsForMaster of [
      "keep-reopened-db",
      false,
    ] as const) {
      it(`branch provenance init with ${[
        doBranchProv && "branchProvenance",
        !doBranchProv && "classicTransformerProvenance",
        createFedGuidsForMaster && "createFedGuidsForMaster",
      ]
        .filter(Boolean)
        .join(",")}`, async () => {
        const masterPath = IVaultTransformerTestUtils.prepareOutputFile(
          "IVaultTransformer",
          `${doBranchProv ? "noTransformer" : "Transformer"}_${
            createFedGuidsForMaster ?? "createFedGuids"
          }Master_STC`
        );
        const forkPath = IVaultTransformerTestUtils.prepareOutputFile(
          "IVaultTransformer",
          `${doBranchProv ? "noTransformer" : "Transformer"}_${
            createFedGuidsForMaster ?? "createFedGuids"
          }Fork_STC`
        );

        await Promise.all([
          fs.promises.copyFile(generatedIVault!.pathName, masterPath),
          fs.promises.copyFile(generatedIVault!.pathName, forkPath),
        ]);

        setToStandalone(masterPath);
        setToStandalone(forkPath);
        const masterMode = createFedGuidsForMaster
          ? OpenMode.ReadWrite
          : OpenMode.Readonly;
        let masterDb = StandaloneDb.openFile(masterPath, masterMode);
        let forkDb = StandaloneDb.openFile(forkPath, OpenMode.ReadWrite);

        const baseInitProvenanceArgs = {
          createFedGuidsForMaster,
          masterDescription: "master iVault repository",
          masterUrl: "https://example.com/mytest",
        };

        const initProvenanceArgs: ProvenanceInitArgs = {
          ...baseInitProvenanceArgs,
          master: masterDb,
          branch: forkDb,
        };

        if (doBranchProv) {
          const result = await initializeBranchProvenance(initProvenanceArgs);
          // initializeBranchProvenance resets the passed in databases when we use "keep-reopened-db"
          masterDb = initProvenanceArgs.master as StandaloneDb;
          forkDb = initProvenanceArgs.branch as StandaloneDb;
          // eslint-disable-next-line @typescript-eslint/no-deprecated -- saving changes from initializeBranchProvenance
          forkDb.saveChanges();

          // Assert all 4 permutations of sourceHasFedGuid,targetHasFedGuid matches our expectations
          for (const sourceHasFedGuid of [true, false]) {
            for (const targetHasFedGuid of [true, false]) {
              const logMessage = () => {
                return `Expected the createFedGuidsForMaster: ${createFedGuidsForMaster} element pair: sourceHasFedGuid: ${sourceHasFedGuid}, targetHasFedGuid: ${targetHasFedGuid}`;
              };
              const [sourceElem, targetElem] =
                sourceTargetFedGuidsToElemIds.get([
                  sourceHasFedGuid,
                  targetHasFedGuid,
                ])!;
              const sourceNumAspects = forkDb.elements.getAspects(
                sourceElem,
                ExternalSourceAspect.classFullName
              ).length;
              const targetNumAspects = forkDb.elements.getAspects(
                targetElem,
                ExternalSourceAspect.classFullName
              ).length;
              const expectedNumAspects =
                sourceTargetFedGuidToAspectCountMap.get([
                  sourceHasFedGuid,
                  targetHasFedGuid,
                  createFedGuidsForMaster,
                ])!;
              expect(
                [sourceNumAspects, targetNumAspects],
                `${logMessage()} to have sourceNumAspects: ${
                  expectedNumAspects[0]
                } got ${sourceNumAspects}, targetNumAspects: ${
                  expectedNumAspects[1]
                } got ${targetNumAspects}`
              ).to.deep.equal(expectedNumAspects);

              const relHasFedguidProvenance =
                (sourceHasFedGuid && targetHasFedGuid) ||
                createFedGuidsForMaster;
              const expectedSourceAspectNum =
                (sourceHasFedGuid ? 0 : createFedGuidsForMaster ? 0 : 1) +
                (relHasFedguidProvenance ? 0 : 1);
              const expectedTargetAspectNum =
                targetHasFedGuid || createFedGuidsForMaster ? 0 : 1;
              expect(
                sourceNumAspects,
                `${logMessage()} to have sourceNumAspects: ${expectedSourceAspectNum}. Got ${sourceNumAspects}`
              ).to.equal(expectedSourceAspectNum);
              expect(
                targetNumAspects,
                `${logMessage()} to have targetNumAspects: ${expectedTargetAspectNum}. Got ${targetNumAspects}`
              ).to.equal(expectedTargetAspectNum);
            }
          }

          // Save off the initializeBranchProvenance result and db for later comparison with the classicalTransformerBranchInit result and db.
          if (!createFedGuidsForMaster) {
            noTransformerBranchInitResult = result;
            noTransformerForkDb = forkDb;
          } else {
            forkDb.close(); // The createFedGuidsForMaster forkDb is no longer necessary so close it.
          }
        } else {
          const result = await classicalTransformerBranchInit({
            ...baseInitProvenanceArgs,
            master: masterDb,
            branch: forkDb,
          });
          // eslint-disable-next-line @typescript-eslint/no-deprecated -- saving changes from classicalTransformerBranchInit
          forkDb.saveChanges();

          // Save off the classicalTransformerBranchInit result and db for later comparison with the branchProvenance result and db.
          if (!createFedGuidsForMaster) {
            transformerBranchInitResult = result;
            transformerForkDb = forkDb;
          } else {
            forkDb.close(); // The createFedGuidsForMaster forkDb is no longer necessary so close it.
          }
        }
        masterDb.close();
      });
    }
  }

  it("should have identityTransformation between branchProvenance and classic transformer provenance when createFedGuidsForMaster is false", async () => {
    assert(
      transformerForkDb !== undefined &&
        noTransformerForkDb !== undefined &&
        transformerBranchInitResult !== undefined &&
        noTransformerBranchInitResult !== undefined,
      "This test has to run last in this suite. It relies on the previous tests to set transfomerForkDb, noTransformerForkDb, transformerBranchInitResult, and noTransformerBranchInitResult when createFedGuidsForMaster is false."
    );
    try {
      await assertIdentityTransformation(
        transformerForkDb,
        noTransformerForkDb,
        undefined,
        {
          allowPropChange(inSourceElem, inTargetElem, propName) {
            if (propName !== "federationGuid") return undefined;

            if (
              inTargetElem.id ===
                noTransformerBranchInitResult!.masterRepositoryLinkId &&
              inSourceElem.id ===
                transformerBranchInitResult!.masterRepositoryLinkId
            )
              return true;
            if (
              inTargetElem.id ===
                noTransformerBranchInitResult!.masterExternalSourceId &&
              inSourceElem.id ===
                transformerBranchInitResult!.masterExternalSourceId
            )
              return true;

            return undefined;
          },
        }
      );
    } finally {
      transformerForkDb.close();
      noTransformerForkDb.close();
    }
  });
});

/**
 * setupIVault populates an empty StandaloneDb with four different element pairs.
 * Whats different about these 4 pairs is whether or not the elements within the pair have fedguids defined on them.
 * This gives us 4 pairs by permuting over sourceHasFedGuid (true/false) and targetHasFedGuid (true/false).
 * Each pair is also part of a relationship ElementGroupsMembers.
 * @returns a tuple containing the IVault and a TupleKeyedMap where the key is [boolean,boolean] (sourceHasFedGuid, targetHasFedGuid) and the value is [string,string] (sourceId, targetId).
 */
function setupIVault(): [
  StandaloneDb,
  TupleKeyedMap<[boolean, boolean], [string, string]>,
] {
  const sourceTargetFedGuidToElemIds = new TupleKeyedMap<
    [boolean, boolean],
    [string, string]
  >();
  const sourceFileName = "ProvInitSource_STC.dtw";
  const sourcePath = IVaultTransformerTestUtils.prepareOutputFile(
    "IVaultTransformer",
    sourceFileName
  );
  if (fs.existsSync(sourcePath)) fs.unlinkSync(sourcePath);

  const generatedIVault = StandaloneDb.createEmpty(sourcePath, {
    rootSubject: { name: sourceFileName },
  });
  const { physModelId, categoryId } = withEditTxn(
    generatedIVault,
    "insert model and category",
    (txn) => ({
      physModelId: PhysicalModel.insert(
        txn,
        IVaultDb.rootSubjectId,
        "physical model"
      ),
      categoryId: SpatialCategory.insert(
        txn,
        IVaultDb.dictionaryId,
        "spatial category",
        {}
      ),
    })
  );

  for (const sourceHasFedGuid of [true, false]) {
    for (const targetHasFedGuid of [true, false]) {
      const baseProps = {
        classFullName: PhysicalObject.classFullName,
        category: categoryId,
        geom: IVaultTransformerTestUtils.createBox(Point3d.create(1, 1, 1)),
        placement: {
          origin: Point3d.create(1, 1, 1),
          angles: YawPitchRollAngles.createDegrees(1, 1, 1),
        },
        model: physModelId,
      };

      const { sourceElem, targetElem } = withEditTxn(
        generatedIVault,
        "insert physical objects",
        (txn) => {
          const sourceFedGuid = sourceHasFedGuid ? undefined : Guid.empty;
          const srcElem = new PhysicalObject(
            {
              ...baseProps,
              code: Code.createEmpty(),
              federationGuid: sourceFedGuid,
            },
            generatedIVault
          ).insert(txn);

          const targetFedGuid = targetHasFedGuid ? undefined : Guid.empty;
          const tgtElem = new PhysicalObject(
            {
              ...baseProps,
              code: Code.createEmpty(),
              federationGuid: targetFedGuid,
            },
            generatedIVault
          ).insert(txn);

          return { sourceElem: srcElem, targetElem: tgtElem };
        }
      );

      sourceTargetFedGuidToElemIds.set(
        [sourceHasFedGuid, targetHasFedGuid],
        [sourceElem, targetElem]
      );

      withEditTxn(generatedIVault, "insert relationship", (txn) => {
        const rel = new ElementGroupsMembers(
          {
            classFullName: ElementGroupsMembers.classFullName,
            sourceId: sourceElem,
            targetId: targetElem,
            memberPriority: 1,
          },
          generatedIVault
        );
        rel.insert(txn);
      });
      generatedIVault.performCheckpoint();
    }
  }
  return [generatedIVault, sourceTargetFedGuidToElemIds];
}

async function classicalTransformerBranchInit(
  args: ProvenanceInitArgs
): Promise<ProvenanceInitResult> {
  // create an external source and owning repository link to use as our *Target Scope Element* for future synchronizations
  const { masterLinkRepoId, masterExternalSourceId } = withEditTxn(
    args.branch,
    "insert repository link and external source",
    (txn) => {
      const repoLinkId = args.branch
        .constructEntity<RepositoryLink, RepositoryLinkProps>({
          classFullName: RepositoryLink.classFullName,
          code: RepositoryLink.createCode(
            args.branch,
            IVaultDb.repositoryModelId,
            "test-ivault"
          ),
          model: IVaultDb.repositoryModelId,
          url: args.masterUrl,
          format: "iVault",
          repositoryGuid: args.master.iVaultId,
          description: args.masterDescription,
        })
        .insert(txn);

      const extSourceId = args.branch
        .constructEntity<ExternalSource, ExternalSourceProps>({
          classFullName: ExternalSource.classFullName,
          model: IVaultDb.rootSubjectId,
          code: Code.createEmpty(),
          repository: new ExternalSourceIsInRepository(repoLinkId),
          // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
          connectorName: require("../../../../package.json").name,
          // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
          connectorVersion: require("../../../../package.json").version,
        })
        .insert(txn);

      return {
        masterLinkRepoId: repoLinkId,
        masterExternalSourceId: extSourceId,
      };
    }
  );

  // initialize the branch provenance
  const branchInitializer = new IVaultTransformer(args.master, args.branch, {
    // tells the transformer that we have a raw copy of a source and the target should receive
    // provenance from the source that is necessary for performing synchronizations in the future
    wasSourceIVaultCopiedToTarget: true,
    // store the synchronization provenance in the scope of our representation of the external source, master
    targetScopeElementId: masterExternalSourceId,
  });

  await branchInitializer.process();
  // save+push our changes to whatever hub we're using
  const description = "initialized branch iVault";
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- saving changes from transformer.process()
  args.branch.saveChanges(description);

  branchInitializer.dispose();

  return {
    masterExternalSourceId,
    targetScopeElementId: masterExternalSourceId,
    masterRepositoryLinkId: masterLinkRepoId,
  };
}

function setToStandalone(iVaultName: string) {
  StandaloneDb.convertToStandalone(iVaultName);
}
