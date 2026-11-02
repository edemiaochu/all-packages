/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/* eslint-disable @szewtwin/no-internal */

import { expect } from "chai";
import * as path from "path";
import "./TransformerTestStartup"; // calls startup/shutdown IVaultHost before/after all tests
import {
  BriefcaseDb,
  BriefcaseManager,
  IVaultJsFs,
  Subject,
  withEditTxn,
} from "@szewtwin/core-backend";
import { HubMock } from "@szewtwin/core-backend/lib/cjs/internal/HubMock";
import { IVault } from "@szewtwin/core-common";
import { GuidString, Logger } from "@szewtwin/core-szewec";
import { KnownTestLocations } from "../TestUtils/KnownTestLocations";
import { IVaultImporter } from "../../IVaultImporter";

/**
 * This test reproduces the issue described in:
 * https://github.com/szewTwin/szewtwinjs-core/issues/9176
 *
 * When an iVault has no geometry, computeProjectExtents returns a "null" range
 * with values like [1e+200, 1e+200, 1e+200] for low and [-1e+200, -1e+200, -1e+200] for high.
 * This causes issues when the transformer uses these extents.
 */
describe("computeProjectExtents with no geometry", () => {
  const outputDir = path.join(
    KnownTestLocations.outputDir,
    "QueryProjectExtents"
  );
  let szewTwinId: GuidString;

  before(() => {
    HubMock.startup("QueryProjectExtents", KnownTestLocations.outputDir);
    szewTwinId = HubMock.szewTwinId;
    IVaultJsFs.recursiveMkDirSync(outputDir);
  });

  after(() => {
    HubMock.shutdown();
  });

  /**
   * Helper to create an iVault with no geometric elements
   */
  async function createEmptyIVault(name: string): Promise<BriefcaseDb> {
    const iVaultId = await HubMock.createNewIVault({
      iVaultName: name,
      szewTwinId,
    });
    const briefcaseProps = await BriefcaseManager.downloadBriefcase({
      accessToken: "test token",
      szewTwinId,
      iVaultId,
    });
    const iVaultDb = await BriefcaseDb.open({
      fileName: briefcaseProps.fileName,
    });
    return iVaultDb;
  }

  it("should use IVaultImporter.computeProjectExtents and verify the issue", async () => {
    const iVaultDb = await createEmptyIVault("ImporterExtentsTest");

    try {
      // Acquire locks and insert a subject (non-geometric element)
      await iVaultDb.locks.acquireLocks({
        shared: [IVault.repositoryModelId],
        exclusive: [IVault.repositoryModelId],
      });
      withEditTxn(iVaultDb, "Added subject", (txn) => {
        Subject.insert(txn, IVault.rootSubjectId, "TestSubject");
      });

      const originalExtents = iVaultDb.projectExtents.clone();
      Logger.logInfo(
        "QueryProjectExtents.test",
        `Original projectExtents=${JSON.stringify(originalExtents)}`
      );

      // Create an importer with autoExtendProjectExtents enabled (default behavior when not excluding outliers)
      const importer = new IVaultImporter(iVaultDb, {
        autoExtendProjectExtents: true,
      });

      // This will compute and update project extents using the same logic as the transformer
      importer.computeProjectExtents();

      const updatedExtents = iVaultDb.projectExtents;

      expect(
        !updatedExtents.isNull,
        "Project extents should not become null, but instead keep default extents"
      ).to.be.true;
    } finally {
      iVaultDb.close();
    }
  });
});
