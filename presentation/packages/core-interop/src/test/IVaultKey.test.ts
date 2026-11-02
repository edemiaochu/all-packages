/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, it } from "vitest";
import { createIVaultKey } from "../core-interop/IVaultKey.js";

describe("createIVaultKey", () => {
  it("returns `key` if set", () => {
    expect(createIVaultKey({ key: "k", name: "n" })).toBe("k");
  });

  it("returns `name` if `key` is not set", () => {
    expect(createIVaultKey({ key: "", name: "n" })).toBe("n");
  });

  it("throws if neither `name` nor `key` are set", () => {
    expect(() => createIVaultKey({ key: "", name: "" })).toThrow();
  });
});
