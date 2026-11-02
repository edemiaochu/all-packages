/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { afterEach, beforeEach, describe, expect, it, MockInstance, vi } from "vitest";
import { IVaultHost } from "@szewtwin/core-backend";
import { Guid } from "@szewtwin/core-szewec";
import { IVaultApp, NoRenderApp } from "@szewtwin/core-frontend";
import { HierarchyCacheMode, Presentation as PresentationBackend } from "@szewtwin/presentation-backend";
import { Presentation as PresentationFrontend } from "@szewtwin/presentation-frontend";
import { initialize, PresentationTestingInitProps, terminate } from "../presentation-testing/Helpers.js";

const rimrafSyncMock = vi.hoisted(() => vi.fn());
vi.mock("rimraf", () => ({ sync: rimrafSyncMock }));

describe("Helpers", () => {
  let backendInitializationStub: MockInstance;
  let frontendInitializationStub: MockInstance;
  let backendTerminationStub: MockInstance;
  let frontendTerminationStub: MockInstance;

  beforeEach(() => {
    backendInitializationStub = vi.spyOn(PresentationBackend, "initialize").mockImplementation(() => {});
    frontendInitializationStub = vi.spyOn(PresentationFrontend, "initialize").mockImplementation(async () => {});
    backendTerminationStub = vi.spyOn(PresentationBackend, "terminate").mockImplementation(() => {});
    frontendTerminationStub = vi.spyOn(PresentationFrontend, "terminate").mockImplementation(() => {});
    vi.spyOn(IVaultHost, "startup").mockResolvedValue();
    vi.spyOn(NoRenderApp, "startup").mockResolvedValue();
    vi.spyOn(IVaultApp, "localization", "get").mockReturnValue({ getLanguageList: () => ["en"] } as any);
  });

  describe("initialize", () => {
    afterEach(async () => {
      await terminate();
    });

    it("initializes PresentationBackend and PresentationFrontend on initialize", async () => {
      await initialize();
      expect(backendInitializationStub).toHaveBeenCalledOnce();
      expect(frontendInitializationStub).toHaveBeenCalledOnce();
    });

    it("does not initialize PresentationBackend and PresentationFrontend on second call to initialize", async () => {
      await initialize();
      expect(backendInitializationStub).toHaveBeenCalledOnce();
      expect(frontendInitializationStub).toHaveBeenCalledOnce();

      vi.clearAllMocks();

      await initialize();
      expect(backendInitializationStub).not.toHaveBeenCalled();
      expect(frontendInitializationStub).not.toHaveBeenCalled();
    });

    it("initializes PresentationBackend and PresentationFrontend with provided props", async () => {
      const frontendAppStartupSpy = vi.fn();
      const props: PresentationTestingInitProps = {
        backendProps: { id: Guid.createValue() },
        frontendApp: { startup: frontendAppStartupSpy },
        frontendProps: { presentation: { clientId: Guid.createValue() } },
      };

      await initialize(props);
      expect(backendInitializationStub).toHaveBeenCalledExactlyOnceWith(props.backendProps);
      expect(frontendInitializationStub).toHaveBeenCalledExactlyOnceWith(props.frontendProps);
      expect(frontendAppStartupSpy).toHaveBeenCalledOnce();
    });
  });

  describe("terminate", () => {
    it("terminates PresentationBackend and PresentationFrontend on terminate", async () => {
      await initialize();
      await terminate();
      expect(backendTerminationStub).toHaveBeenCalledOnce();
      expect(frontendTerminationStub).toHaveBeenCalledOnce();
    });

    it("does not terminate PresentationBackend and PresentationFrontend on second call to terminate", async () => {
      await initialize();

      await terminate();
      expect(backendTerminationStub).toHaveBeenCalledOnce();
      expect(frontendTerminationStub).toHaveBeenCalledOnce();

      vi.clearAllMocks();

      await terminate();
      expect(backendTerminationStub).not.toHaveBeenCalled();
      expect(frontendTerminationStub).not.toHaveBeenCalled();
    });

    it("clears cache directory when PresentationBackend has DiskHierarchyCacheConfig in initProps", async () => {
      const testDirectory = "/test/directory/";
      vi.spyOn(PresentationBackend, "initProps", "get").mockReturnValue({
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        caching: { hierarchies: { mode: HierarchyCacheMode.Disk, directory: testDirectory } },
      });
      await initialize();

      await terminate();
      expect(rimrafSyncMock).toHaveBeenCalledExactlyOnceWith(testDirectory);
    });

    it("clears cache directory when PresentationBackend has HybridCacheConfig in initProps", async () => {
      const testDirectory = "/test/directory/";
      vi.spyOn(PresentationBackend, "initProps", "get").mockReturnValue({
        caching: {
          hierarchies: {
            // eslint-disable-next-line @typescript-eslint/no-deprecated
            mode: HierarchyCacheMode.Hybrid,
            // eslint-disable-next-line @typescript-eslint/no-deprecated
            disk: { mode: HierarchyCacheMode.Disk, directory: testDirectory },
          },
        },
      });
      await initialize();

      await terminate();
      expect(rimrafSyncMock).toHaveBeenCalledExactlyOnceWith(testDirectory);
    });
  });
});
