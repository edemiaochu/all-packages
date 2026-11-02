/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Logger } from "@szewtwin/core-szewec";
import { IVaultApp, NoRenderApp } from "@szewtwin/core-frontend";
import { UiIVaultComponents } from "../ivault-components-react.js";
import TestUtils from "./TestUtils.js";

describe("UiIVaultComponents", () => {
  beforeEach(() => {
    TestUtils.terminateUiIVaultComponents();
  });

  afterEach(async () => {
    await IVaultApp.shutdown();
  });

  it("i18nNamespace should return 'UiIVaultComponents'", () => {
    expect(UiIVaultComponents.localizationNamespace).toEqual(
      "UiIVaultComponents"
    );
  });

  it("packageName should return 'ivault-components-react'", () => {
    expect(UiIVaultComponents.packageName).toEqual("ivault-components-react");
  });

  it("translate should return the key (in test environment)", async () => {
    await NoRenderApp.startup();
    await TestUtils.initializeUiIVaultComponents();
    expect(UiIVaultComponents.translate("test1.test2")).toEqual("test1.test2");
    TestUtils.terminateUiIVaultComponents();
  });

  it("translate should return blank and log error if UiIVaultComponents not initialized", () => {
    const spyLogger = vi.spyOn(Logger, "logError");
    expect(UiIVaultComponents.translate("xyz")).toEqual("");
    expect(spyLogger).toHaveBeenCalledOnce();
  });

  it("calling initialize twice should log", async () => {
    const spyLogger = vi.spyOn(Logger, "logInfo");
    expect(UiIVaultComponents.initialized).toEqual(false);
    await UiIVaultComponents.initialize();
    expect(UiIVaultComponents.initialized).toEqual(true);
    await UiIVaultComponents.initialize();
    expect(spyLogger).toHaveBeenCalledOnce();
  });

  it("calling initialize without I18N will use IVaultApp.i18n", async () => {
    await NoRenderApp.startup();

    await UiIVaultComponents.initialize();
    await IVaultApp.shutdown();
  });
});
