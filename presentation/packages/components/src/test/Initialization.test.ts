/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, it, vi } from "vitest";
import { PropertyValueRendererManager } from "@szewtwin/components-react";
import { Localization } from "@szewtwin/core-common";
import { Presentation } from "@szewtwin/presentation-frontend";
import { initializeLocalization, initializePropertyValueRenderers } from "../presentation-components/Initialization.js";
import { createStub } from "./TestUtils.js";

describe("initializeLocalization", () => {
  it("registers and unregisters namespace", async () => {
    const i18n = {
      registerNamespace: createStub<Localization["registerNamespace"]>().mockResolvedValue(),
      unregisterNamespace: createStub<Localization["unregisterNamespace"]>(),
    };
    vi.spyOn(Presentation, "localization", "get").mockReturnValue(i18n as unknown as Localization);

    const terminate = await initializeLocalization();
    expect(i18n.registerNamespace).toHaveBeenCalledOnce();
    terminate();
    expect(i18n.unregisterNamespace).toHaveBeenCalledOnce();
  });
});

describe("initializePropertyValueRenderers", () => {
  it("registers custom renderers", async () => {
    const registerSpy = vi.spyOn(PropertyValueRendererManager.defaultManager, "registerRenderer");
    const unregisterSpy = vi.spyOn(PropertyValueRendererManager.defaultManager, "unregisterRenderer");

    const unregisterCallback = await initializePropertyValueRenderers();
    expect(registerSpy).toHaveBeenCalledExactlyOnceWith("SelectableInstance", expect.any(Object));
    expect(unregisterSpy).not.toHaveBeenCalled();

    unregisterCallback();
    expect(unregisterSpy).toHaveBeenCalledExactlyOnceWith("SelectableInstance");
  });
});
