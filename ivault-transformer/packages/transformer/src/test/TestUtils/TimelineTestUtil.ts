/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { assert, expect } from "chai";
import {
  BriefcaseDb,
  IVaultDb,
  IVaultHost,
  PhysicalModel,
  PhysicalObject,
  PhysicalPartition,
  SpatialCategory,
  withEditTxn,
} from "@szewtwin/core-backend";
import { _hubAccess } from "@szewtwin/core-backend/lib/cjs/internal/Symbols";
import {
  ChangesetIdWithIndex,
  Code,
  ElementProps,
  IVault,
  PhysicalElementProps,
  RelationshipProps,
  SubCategoryAppearance,
} from "@szewtwin/core-common";
import { Point3d, YawPitchRollAngles } from "@szewtwin/core-geometry";
import {
  IVaultTransformer,
  IVaultTransformOptions,
} from "../../IVaultTransformer";
import {
  HubWrappers,
  IVaultTransformerTestUtils,
} from "../IVaultTransformerUtils";
import { IVaultTestUtils } from "./IVaultTestUtils";
import { omit } from "@szewtwin/core-szewec";

const saveAndPushChanges = async (
  accessToken: string,
  briefcase: BriefcaseDb,
  description: string
) => IVaultTestUtils.saveAndPushChanges(accessToken, briefcase, description);

export const deleted = Symbol("DELETED");

// NOTE: this is not done optimally
export async function getIVaultState(
  db: IVaultDb
): Promise<TimelineIVaultElemState> {
  const result = {} as TimelineIVaultElemState;
  const elemIds = [];
  const sql = `
    SELECT DMInstanceId
    FROM Bis.Element
    WHERE DMInstanceId>${IVaultDb.dictionaryId}
      -- ignore the known required elements set in 'populateTimelineSeed'
      AND CodeValue NOT IN ('SpatialCategory', 'PhysicalModel')
  `;
  const reader = db.createQueryReader(sql, undefined, { usePrimaryConn: true });
  for await (const row of reader) {
    elemIds.push(row.id);
  }

  for (const elemId of elemIds) {
    const elem = db.elements.getElement(elemId);
    const tag = elem.userLabel ?? elem.id;
    if (tag in result)
      throw Error("timelines only support iVaults with unique user labels");
    const isSimplePhysicalObject =
      elem.jsonProperties.updateState !== undefined;

    result[tag] = isSimplePhysicalObject
      ? elem.jsonProperties.updateState
      : elem.toJSON();
  }

  const supportedRelIds = [];
  const supportedRelIdsSql = `
    SELECT erte.DMInstanceId AS id, dm_classname(erte.DMClassId, 's.c') AS className,
        se.DMInstanceId AS sourceId, se.UserLabel AS sourceUserLabel,
        te.DMInstanceId AS targetId, te.UserLabel AS targetUserLabel
    FROM Bis.ElementRefersToElements erte
    JOIN Bis.Element se
      ON se.DMInstanceId=erte.SourceDMInstanceId
    JOIN Bis.Element te
      ON te.DMInstanceId=erte.TargetDMInstanceId
  `;
  for await (const row of db.createQueryReader(supportedRelIdsSql, undefined, {
    usePrimaryConn: true,
  })) {
    supportedRelIds.push(row.toRow());
  }

  for (const {
    id,
    className,
    sourceId,
    sourceUserLabel,
    targetId,
    targetUserLabel,
  } of supportedRelIds) {
    const relProps = db.relationships.getInstanceProps(className, id);
    const tag = `REL_${sourceUserLabel ?? sourceId}_${
      targetUserLabel ?? targetId
    }_${className}`;
    if (tag in result)
      throw Error("timelines only support iVaults with unique user labels");

    result[tag] = omit(relProps, ["id"]);
  }

  return result;
}

export function applyDelta(
  state: TimelineIVaultElemState,
  patch: TimelineIVaultElemStateDelta
): TimelineIVaultElemState {
  const patched = { ...state, ...patch };

  for (const [key, value] of Object.entries(patched)) {
    if (value === deleted) delete patched[key];
  }

  return patched as TimelineIVaultElemState;
}

export function populateTimelineSeed(
  db: IVaultDb,
  state?: TimelineIVaultElemStateDelta
): void {
  withEditTxn(db, "populate timeline seed", (txn) => {
    SpatialCategory.insert(
      txn,
      IVault.dictionaryId,
      "SpatialCategory",
      new SubCategoryAppearance()
    );
    PhysicalModel.insert(txn, IVault.rootSubjectId, "PhysicalModel");
  });
  if (state) maintainObjects(db, state);
  db.performCheckpoint();
}

export async function assertElemState(
  db: IVaultDb,
  state: TimelineIVaultElemStateDelta,
  { subset = false } = {}
): Promise<void> {
  const ivaultState = await getIVaultState(db);
  expect(ivaultState).to.deep.subsetEqual(state, {
    useSubsetEquality: subset,
  });
}

function maintainObjects(
  iVaultDb: IVaultDb,
  delta: TimelineIVaultElemStateDelta
): void {
  const modelId = iVaultDb.elements.queryElementIdByCode(
    PhysicalPartition.createCode(
      iVaultDb,
      IVault.rootSubjectId,
      "PhysicalModel"
    )
  )!;
  const categoryId = iVaultDb.elements.queryElementIdByCode(
    SpatialCategory.createCode(iVaultDb, IVault.dictionaryId, "SpatialCategory")
  )!;

  withEditTxn(iVaultDb, "maintain objects", (txn) => {
    for (const [elemName, upsertVal] of Object.entries(delta)) {
      const isRel = (d: TimelineElemDelta): d is RelationshipProps =>
        (d as RelationshipProps).sourceId !== undefined;

      if (isRel(upsertVal))
        throw Error(
          "adding relationships to the small delta format is not supported" +
            "use a `manualUpdate` step instead"
        );

      const [id] = iVaultDb.queryEntityIds({
        from: "Bis.Element",
        where: "UserLabel=?",
        bindings: [elemName],
      });

      if (upsertVal === deleted) {
        assert(id, "tried to delete an element that wasn't in the database");
        txn.deleteElement(id);
        continue;
      }

      const props: ElementProps | PhysicalElementProps =
        typeof upsertVal !== "number"
          ? upsertVal
          : {
              classFullName: PhysicalObject.classFullName,
              model: modelId,
              category: categoryId,
              code: new Code({
                spec: IVaultDb.rootSubjectId,
                scope: IVaultDb.rootSubjectId,
                value: elemName,
              }),
              userLabel: elemName,
              geom: IVaultTransformerTestUtils.createBox(
                Point3d.create(1, 1, 1)
              ),
              placement: {
                origin: Point3d.create(0, 0, 0),
                angles: YawPitchRollAngles.createDegrees(0, 0, 0),
              },
              jsonProperties: {
                updateState: upsertVal,
              },
            };

      props.id = id;

      if (id === undefined) txn.insertElement(props);
      else txn.updateElement(props);
    }
  });
}

export type TimelineElemState =
  | number
  | Omit<ElementProps, "userLabel">
  | RelationshipProps;
export type TimelineElemDelta = TimelineElemState | typeof deleted;

export interface TimelineIVaultElemStateDelta {
  [name: string]: TimelineElemDelta;
}

/** [name: string]: Becomes the userlabel / codevalue of a physical object in the iVault.
 * Note that since JS converts all keys to strings, passing keys as numbers is also allowed. They will be converted to strings.
 * TimelineElemState if it is a number sets a json property on the physicalobject to the number provided.
 */
export interface TimelineIVaultElemState {
  [name: string]: TimelineElemState;
}

export interface TimelineIVaultState {
  state: TimelineIVaultElemState;
  id: string;
  db: BriefcaseDb;
}

export type ManualUpdateFunc = (db: IVaultDb) => void | Promise<void>;

export type TimelineStateChange =
  // update the state of that model to match and push a changeset
  | TimelineIVaultElemStateDelta
  // create a new iVault from a seed
  | { seed: TimelineIVaultState }
  // create a branch from an existing iVault with a given name
  | { branch: string }
  // synchronize with the changes in an iVault of a given name from a starting timeline point
  | {
      sync: [
        source: string,
        opts?: {
          since?: number;
          initTransformer?: (transformer: IVaultTransformer) => void;
          expectThrow?: boolean;
          assert?: {
            afterProcessChanges?: (transformer: IVaultTransformer) => void;
          };
        },
      ];
    }
  // manually update an iVault, state will be automatically detected after. Useful for more complicated
  // element changes with inter-dependencies.
  // @note: the key for the element in the state will be the userLabel or if none, the id
  | { manualUpdate: ManualUpdateFunc }
  // manually update an iVault, like `manualUpdate`, but close and reopen the db after. This is
  // if you're doing something weird like a raw sqlite update on the file.
  | { manualUpdateAndReopen: ManualUpdateFunc };

/** an object that helps resolve ids from names */
export type TimelineReferences = Record<string, ElementProps>;

/**
 * A small tree-sitter inspired DSL for building timelines of iVault updates and branching/forking events
 * The `$` can be used to refer to props that aren't resolved until later (e.g. the id of inserted elements)
 *
 * For each step in timeline, an object of iVaults mapping to the event that occurs for them:
 * - a 'seed' event with an iVault to seed from, creating the iVault
 * - a 'branch' event with the name of an iVault to seed from, creating the iVault
 * - a 'sync' event with the name of an iVault and timeline point to sync from
 * - an object containing a mapping of user labels to elements to be upserted or to the `deleted` symbol
 *    for elements to be deleted. If the iVault doesn't exist, it is created.
 * - an 'assert' function to run on the state of all the iVaults in the timeline
 *
 * @note because the timeline manages PhysicalObjects for the state, any seed must contain the necessary
 *       model and category, which can be added to your seed by calling @see populateTimelineSeed
 */
export type Timeline = Record<
  number,
  {
    assert?: (ivaults: Record<string, TimelineIVaultState>) => void;
    [modelName: string]:
      | undefined // only necessary for the previous optional properties
      | ((ivaults: Record<string, TimelineIVaultState>) => void) // only necessary for the assert property
      | TimelineStateChange;
  }
>;

export interface TestContextOpts {
  szewTwinId: string;
  accessToken: string;
  transformerOpts?: IVaultTransformOptions;
}

/**
 * Run the branching and synchronization events in a @see Timeline object
 * you can print additional debug info from this by setting in your env TRANSFORMER_BRANCH_TEST_DEBUG=1
 * @note expected state after synchronization is not asserted because element deletions and elements that are
 * updated only in the target are hard to track. You can assert it yourself with @see assertElemState in
 * an assert step for your timeline
 */
export async function runTimeline(
  timeline: Timeline,
  { szewTwinId, accessToken, transformerOpts }: TestContextOpts
) {
  const trackedIVaults = new Map<string, TimelineIVaultState>();
  const masterOfBranch = new Map<string, string>();

  const timelineStates = new Map<
    number,
    {
      states: { [iVaultName: string]: TimelineIVaultElemStateDelta };
      changesets: { [iVaultName: string]: ChangesetIdWithIndex };
    }
  >();

  function printChangelogs() {
    const rows = [...timelineStates.values()].map((state) =>
      Object.fromEntries(
        Object.entries(state.changesets)
          .map(([name, cs]) => [
            [name, `${cs.index} ${cs.id.slice(0, 5)}`],
            [
              `${name} state`,
              `${Object.keys(state.states[name]).map((k) => k.slice(0, 6))}`,
            ],
          ])
          .flat()
      )
    );
    // eslint-disable-next-line no-console
    console.table(rows);
  }

  const getSeed = (model: TimelineStateChange) =>
    (model as { seed: TimelineIVaultState | undefined }).seed;
  const getBranch = (model: TimelineStateChange) =>
    (model as { branch: string | undefined }).branch;
  const getSync = (model: TimelineStateChange) =>
    // HACK: concat {} so destructuring works if opts were undefined
    (model as any).sync?.concat({}) as
      | [
          src: string,
          opts: {
            since?: number;
            initTransformer?: (transformer: IVaultTransformer) => void;
            expectThrow?: boolean;
            assert?: {
              afterProcessChanges?: (transformer: IVaultTransformer) => void;
            };
          },
        ]
      | undefined;
  const getManualUpdate = (
    model: TimelineStateChange
  ): { update: ManualUpdateFunc; doReopen: boolean } | undefined =>
    (model as any).manualUpdate || (model as any).manualUpdateAndReopen
      ? {
          update:
            (model as any).manualUpdate ?? (model as any).manualUpdateAndReopen,
          doReopen: !!(model as any).manualUpdateAndReopen,
        }
      : undefined;

  for (let i = 0; i < Object.values(timeline).length; ++i) {
    const pt = timeline[i];
    if (process.env.TRANSFORMER_BRANCH_TEST_DEBUG)
      console.log(`pt[${i}] -> ${JSON.stringify(pt)}`); // eslint-disable-line no-console

    const iVaultChanges = Object.entries(pt).filter(
      (entry): entry is [string, TimelineStateChange] =>
        entry[0] !== "assert" && trackedIVaults.has(entry[0])
    );

    const newIVaults = Object.keys(pt).filter(
      (s) => s !== "assert" && !trackedIVaults.has(s)
    );

    for (const newIVaultName of newIVaults) {
      assert(
        newIVaultName !== "assert",
        "should have already been filtered out"
      );

      const newIVaultEvent = pt[newIVaultName];
      assert(typeof newIVaultEvent === "object");
      assert(
        !("sync" in newIVaultEvent),
        "cannot sync an iVault that hasn't been created yet!"
      );
      assert(
        !Object.values(newIVaultEvent).includes(deleted),
        "cannot delete elements in an iVault that you are creating now!"
      );

      const seed =
        (getSeed(newIVaultEvent) ??
          (getBranch(newIVaultEvent) &&
            trackedIVaults.get(getBranch(newIVaultEvent)!))) ||
        undefined;

      seed?.db.performCheckpoint(); // make sure WAL is flushed before we use this as a file seed
      const newIVaultId = await IVaultHost[_hubAccess].createNewIVault({
        szewTwinId,
        iVaultName: newIVaultName,
        version0: seed?.db.pathName,
        noLocks: true,
      });

      const newIVaultDb = await HubWrappers.downloadAndOpenBriefcase({
        accessToken,
        szewTwinId,
        iVaultId: newIVaultId,
      });
      assert.isTrue(newIVaultDb.isBriefcaseDb());
      assert.equal(newIVaultDb.szewTwinId, szewTwinId);

      const newTrackedIVault = {
        state: seed?.state ?? (newIVaultEvent as TimelineIVaultElemState),
        db: newIVaultDb,
        id: newIVaultId,
      };

      trackedIVaults.set(newIVaultName, newTrackedIVault);

      const isNewBranch = "branch" in newIVaultEvent;
      if (isNewBranch) {
        assert(seed);
        masterOfBranch.set(newIVaultName, newIVaultEvent.branch as string);
        const master = seed;
        const branchDb = newIVaultDb;
        // record branch provenance
        const provenanceInserter = new IVaultTransformer(master.db, branchDb, {
          ...transformerOpts,
          wasSourceIVaultCopiedToTarget: true,
        });
        await provenanceInserter.process();
        provenanceInserter.dispose();
        await saveAndPushChanges(
          accessToken,
          branchDb,
          "initialized branch provenance"
        );
      } else if ("seed" in newIVaultEvent) {
        await saveAndPushChanges(
          accessToken,
          newIVaultDb,
          `seeded from '${getSeed(newIVaultEvent)!.id}' at point ${i}`
        );
      } else {
        populateTimelineSeed(newIVaultDb);
        const maybeManualUpdate = getManualUpdate(newIVaultEvent);
        if (maybeManualUpdate) {
          await maybeManualUpdate.update(newIVaultDb);
          if (maybeManualUpdate.doReopen) {
            const fileName = newTrackedIVault.db.pathName;
            newTrackedIVault.db.close();
            newTrackedIVault.db = await BriefcaseDb.open({ fileName });
          }
          newTrackedIVault.state = await getIVaultState(newIVaultDb);
        } else
          maintainObjects(
            newIVaultDb,
            newIVaultEvent as TimelineIVaultElemStateDelta
          );
        await saveAndPushChanges(
          accessToken,
          newIVaultDb,
          `new with state [${JSON.stringify(newIVaultEvent)}] at point ${i}`
        );
      }

      if (seed) {
        await assertElemState(newIVaultDb, seed.state);
      }
    }

    for (const [iVaultName, event] of iVaultChanges) {
      if ("branch" in event || "seed" in event) {
        // "branch" and "seed" event has already been handled in the new ivaults loop above
        continue;
      } else if ("sync" in event) {
        const [
          syncSource,
          {
            since: startIndex,
            initTransformer,
            expectThrow,
            assert: assertFxns,
          },
        ] = getSync(event)!;
        // if the synchronization source is master, it's a normal sync
        const isForwardSync = masterOfBranch.get(iVaultName) === syncSource;
        const target = trackedIVaults.get(iVaultName)!;
        const source = trackedIVaults.get(syncSource)!;

        let targetStateBefore: TimelineIVaultElemState | undefined;
        if (process.env.TRANSFORMER_BRANCH_TEST_DEBUG)
          targetStateBefore = await getIVaultState(target.db);

        const syncer = new IVaultTransformer(source.db, target.db, {
          ...transformerOpts,
          argsForProcessChanges: {
            startChangeset: startIndex
              ? { index: startIndex }
              : { index: undefined },
          },
        });
        initTransformer?.(syncer);
        try {
          await syncer.process();
          expect(
            expectThrow === false || expectThrow === undefined,
            "expectThrow was set to true and transformer succeeded."
          ).to.be.true;
          assertFxns?.afterProcessChanges?.(syncer);
        } catch (err: any) {
          if (/startChangesetId should be exactly/.test(err.message)) {
            console.log("change history:"); // eslint-disable-line
            printChangelogs();
          }
          if (
            !expectThrow ||
            (expectThrow &&
              err.message.includes(
                "expectThrow was set to true and transformer succeeded."
              ))
          )
            throw err;
        } finally {
          syncer.dispose();
        }

        const stateMsg = `synced changes from ${syncSource} to ${iVaultName} at ${i}`;
        if (process.env.TRANSFORMER_BRANCH_TEST_DEBUG) {
          /* eslint-disable no-console */
          console.log(stateMsg);
          console.log(`       source state: ${JSON.stringify(source.state)}`);
          const targetState = getIVaultState(target.db);
          console.log(
            `target before state: ${JSON.stringify(targetStateBefore!)}`
          );
          console.log(` target after state: ${JSON.stringify(targetState)}`);
          /* eslint-enable no-console */
        }

        target.state = await getIVaultState(target.db); // update the tracking state

        if (!expectThrow) {
          if (!isForwardSync)
            await saveAndPushChanges(accessToken, source.db, stateMsg);
          await saveAndPushChanges(accessToken, target.db, stateMsg);
        }
      } else {
        const alreadySeenIVault = trackedIVaults.get(iVaultName)!;
        let stateMsg: string;

        if ("manualUpdate" in event || "manualUpdateAndReopen" in event) {
          const manualUpdate = getManualUpdate(event)!;
          await manualUpdate.update(alreadySeenIVault.db);
          if (manualUpdate.doReopen) {
            const fileName = alreadySeenIVault.db.pathName;
            alreadySeenIVault.db.close();
            alreadySeenIVault.db = await BriefcaseDb.open({ fileName });
          }
          alreadySeenIVault.state = await getIVaultState(alreadySeenIVault.db);
          stateMsg =
            `${iVaultName} becomes: ${JSON.stringify(
              alreadySeenIVault.state
            )}, ` + `after manual update, at ${i}`;
        } else {
          const delta = event;
          alreadySeenIVault.state = applyDelta(alreadySeenIVault.state, delta);
          maintainObjects(alreadySeenIVault.db, delta);
          stateMsg =
            `${iVaultName} becomes: ${JSON.stringify(
              alreadySeenIVault.state
            )}, ` + `delta: [${JSON.stringify(delta)}], at ${i}`;
        }

        if (process.env.TRANSFORMER_BRANCH_TEST_DEBUG) console.log(stateMsg); // eslint-disable-line no-console

        await saveAndPushChanges(accessToken, alreadySeenIVault.db, stateMsg);
      }
    }

    if (pt.assert) {
      pt.assert(Object.fromEntries(trackedIVaults));
    }

    timelineStates.set(i, {
      changesets: Object.fromEntries(
        [...trackedIVaults].map(([name, state]) => [name, state.db.changeset])
      ),
      states: Object.fromEntries(
        [...trackedIVaults].map(([name, state]) => [name, state.state])
      ),
    });
  }

  return {
    trackedIVaults,
    timelineStates,
    tearDown: async () => {
      for (const [, state] of trackedIVaults) {
        state.db.close();
        await IVaultHost[_hubAccess].deleteIVault({
          szewTwinId,
          iVaultId: state.id,
        });
      }
    },
    printChangelogs,
  };
}
