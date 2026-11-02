/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { join } from "path";
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";
import { IVaultJsFs, SnapshotDb } from "@szewtwin/core-backend";
import { BeEvent } from "@szewtwin/core-szewec";
import { CreateEmptySnapshotIVaultProps } from "@szewtwin/core-common";
import { IVaultConnection } from "@szewtwin/core-frontend";
import { createFileNameFromString, getTestOutputDir } from "../presentation-testing/FilenameUtils.js";
import { buildTestIVault, TestIVaultConnection } from "../presentation-testing/IVaultUtilities.js";
import { createStub } from "./Utils.js";

describe("buildTestIVault", () => {
  const snapshotDb = { saveChanges: createStub<SnapshotDb["saveChanges"]>(), close: createStub<SnapshotDb["close"]>() };
  const testIVaultConnection = Object.create(TestIVaultConnection.prototype);
  testIVaultConnection._db = snapshotDb;
  testIVaultConnection.onClose = new BeEvent();

  let createSnapshotDb: MockInstance<(filePath: string, options: CreateEmptySnapshotIVaultProps) => SnapshotDb>;

  beforeEach(() => {
    createSnapshotDb = vi.spyOn(SnapshotDb, "createEmpty").mockReturnValue(snapshotDb as unknown as SnapshotDb);
    vi.spyOn(TestIVaultConnection, "openFile").mockResolvedValue(testIVaultConnection);
  });

  afterEach(() => {
    snapshotDb.saveChanges.mockReset();
    snapshotDb.close.mockReset();
  });

  it("calls IVaultJsFs.mkdirSync if directory does not exist", async () => {
    vi.spyOn(IVaultJsFs, "existsSync").mockReturnValue(false);
    const mkdirFake = vi.fn();
    vi.spyOn(IVaultJsFs, "mkdirSync").mockImplementation(mkdirFake);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    await buildTestIVault("name", async () => {});

    expect(mkdirFake).toHaveBeenCalledExactlyOnceWith(getTestOutputDir());
  });

  it("calls IVaultJsFs.unlinkSync if output file exists", async () => {
    const fileName = "fileName";
    vi.spyOn(IVaultJsFs, "existsSync").mockReturnValue(true);
    const unlinkFake = vi.fn();
    vi.spyOn(IVaultJsFs, "unlinkSync").mockImplementation(unlinkFake);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    await buildTestIVault(fileName, async () => {});

    const outputFile = join(getTestOutputDir(), `${fileName}.bim`);
    expect(unlinkFake).toHaveBeenCalledExactlyOnceWith(outputFile);
  });

  it("does not call IVaultJsFs.unlinkSync if directory does not exist", async () => {
    vi.spyOn(IVaultJsFs, "existsSync").mockReturnValue(false);
    const mkdirFake = vi.fn();
    vi.spyOn(IVaultJsFs, "mkdirSync").mockImplementation(mkdirFake);
    const unlinkFake = vi.fn();
    vi.spyOn(IVaultJsFs, "unlinkSync").mockImplementation(unlinkFake);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    await buildTestIVault("name", async () => {});

    expect(unlinkFake).not.toHaveBeenCalled();
  });

  it("does not call IVaultJsFs.mkdirSync if output file exists", async () => {
    const fileName = "fileName";
    vi.spyOn(IVaultJsFs, "existsSync").mockReturnValue(true);
    const mkdirFake = vi.fn();
    vi.spyOn(IVaultJsFs, "mkdirSync").mockImplementation(mkdirFake);
    const unlinkFake = vi.fn();
    vi.spyOn(IVaultJsFs, "unlinkSync").mockImplementation(unlinkFake);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    await buildTestIVault(fileName, async () => {});

    expect(mkdirFake).not.toHaveBeenCalled();
  });

  it("calls `SnapshotDb.createEmpty` with correct parameters when using overload with ivault name", async () => {
    const fileName = "fileName";
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    await buildTestIVault(fileName, async () => {});

    expect(createSnapshotDb.mock.calls[0][0]).toContain(fileName);
    expect(createSnapshotDb.mock.calls[0][1]).toEqual({ rootSubject: { name: fileName } });
  });

  it("calls `SnapshotDb.createEmpty` with correct parameters when using overload with test context", async () => {
    // Construct a fake test context-shaped object with a deterministic title.
    const testContext = {
      test: {
        fullTitle: () => "calls `SnapshotDb.createEmpty` with correct parameters when using overload with test context",
      },
    };
    const fileName = createFileNameFromString(testContext.test.fullTitle());

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    await buildTestIVault(testContext, async () => {});

    expect(createSnapshotDb.mock.calls[0][0]).toContain(fileName);
    expect(createSnapshotDb.mock.calls[0][1]).toEqual({ rootSubject: { name: fileName } });
  });

  it("builder calls provided callback function", async () => {
    const cb = vi.fn().mockResolvedValue(undefined);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    await buildTestIVault("name", cb);

    expect(cb).toHaveBeenCalledOnce();
  });

  it("builder saves database changes and closes it when callback succeeds", async () => {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    await buildTestIVault("name", async () => {});

    expect(snapshotDb.saveChanges).toHaveBeenCalledExactlyOnceWith("Created test IVault");
    expect(snapshotDb.close).toHaveBeenCalledOnce();
  });

  it("builder saves database changes and closes it when callback throws", async () => {
    const cb = async () => {
      throw new Error("TestError");
    };

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const promise = buildTestIVault("name", cb);

    await expect(promise).rejects.toThrow(Error);
    expect(snapshotDb.saveChanges).toHaveBeenCalledExactlyOnceWith("Created test IVault");
    expect(snapshotDb.close).toHaveBeenCalledOnce();
  });

  it("returns result of TestIVaultConnection.openFile", async () => {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const promise = buildTestIVault("name", async () => {});
    const result = await promise;

    expect(result).toBe(testIVaultConnection);
  });

  it("raises onClose event when TestIVaultConnection.close is called", async () => {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const result = await buildTestIVault("name", async () => {});
    expect(result).toBe(testIVaultConnection);
    const ivaultListenerStub = vi.fn();
    const ivaultConnectionListenerStub = vi.fn();
    result.onClose.addOnce(ivaultListenerStub);
    IVaultConnection.onClose.addOnce(ivaultConnectionListenerStub);
    await result.close();
    expect(ivaultListenerStub).toHaveBeenCalledOnce();
    expect(ivaultConnectionListenerStub).toHaveBeenCalledOnce();
  });
});
