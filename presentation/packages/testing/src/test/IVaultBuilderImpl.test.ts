/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, it, vi } from "vitest";
import { CodeSpecs, IVaultDb, Relationships } from "@szewtwin/core-backend";
import {
  BisCodeSpec,
  Code,
  CodeScopeProps,
  CodeSpec,
  ElementAspectProps,
  ElementProps,
  ModelProps,
  RelationshipProps,
} from "@szewtwin/core-common";
import { TestIVaultBuilderImpl } from "../presentation-testing/IVaultBuilderImpl.js";
import { createStub } from "./Utils.js";

describe("TestIVaultBuilderImpl", () => {
  it("insertModel calls iVault.models.insertModel", async () => {
    const ivault = { models: { insertModel: createStub<IVaultDb.Models["insertModel"]>() } };

    const builder = new TestIVaultBuilderImpl(ivault as unknown as IVaultDb);
    builder.insertModel({} as ModelProps);

    expect(ivault.models.insertModel).toHaveBeenCalledOnce();
  });

  it("insertElement calls iVault.elements.insertElement", async () => {
    const ivault = { elements: { insertElement: createStub<IVaultDb.Elements["insertElement"]>() } };

    const builder = new TestIVaultBuilderImpl(ivault as unknown as IVaultDb);
    builder.insertElement({} as ElementProps);

    expect(ivault.elements.insertElement).toHaveBeenCalledOnce();
  });

  it("insertAspect calls iVault.elements.insertAspect", async () => {
    const ivault = { elements: { insertAspect: createStub<IVaultDb.Elements["insertAspect"]>() } };

    const builder = new TestIVaultBuilderImpl(ivault as unknown as IVaultDb);
    builder.insertAspect({} as ElementAspectProps);

    expect(ivault.elements.insertAspect).toHaveBeenCalledOnce();
  });

  it("insertRelationship calls iVault.relationships.insertInstance", async () => {
    const ivault = { relationships: { insertInstance: createStub<Relationships["insertInstance"]>() } };

    const builder = new TestIVaultBuilderImpl(ivault as unknown as IVaultDb);
    builder.insertRelationship({} as RelationshipProps);

    expect(ivault.relationships.insertInstance).toHaveBeenCalledOnce();
  });

  it("createCode calls iVault.codeSpecs.getByName", () => {
    const ivault = {
      codeSpecs: {
        getByName: createStub<CodeSpecs["getByName"]>().mockImplementation(
          (name) => ({ id: "code_spec_id", name }) as CodeSpec,
        ),
      },
    };

    const builder = new TestIVaultBuilderImpl(ivault as unknown as IVaultDb);
    const result = builder.createCode({} as CodeScopeProps, BisCodeSpec.drawing, "codeValue");

    const expected = new Code({ spec: "code_spec_id", scope: {} as CodeScopeProps, value: "codeValue" });
    expect(result).toEqual(expected);
  });

  it("importSchema calls iVault.importSchemaStrings", async () => {
    const importSchemaStringsStub = vi.fn().mockResolvedValue(undefined);
    const ivault = { importSchemaStrings: importSchemaStringsStub } as unknown as IVaultDb;

    const builder = new TestIVaultBuilderImpl(ivault);
    await builder.importSchema("test xml");
    expect(importSchemaStringsStub).toHaveBeenCalledExactlyOnceWith(["test xml"]);
  });
});
