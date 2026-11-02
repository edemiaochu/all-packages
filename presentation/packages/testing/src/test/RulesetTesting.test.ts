/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Id64 } from "@szewtwin/core-szewec";
import { IVaultApp, IVaultConnection } from "@szewtwin/core-frontend";
import { SchemaFormatsProvider } from "@szewtwin/dmschema-metadata";
import { Ruleset } from "@szewtwin/presentation-common";
import { ContentBuilder } from "../presentation-testing.js";
import { initialize, terminate } from "../presentation-testing/Helpers.js";
import { HierarchyBuilder } from "../presentation-testing/HierarchyBuilder.js";
import { TestIVaultConnection } from "../presentation-testing/IVaultUtilities.js";

let iVault: IVaultConnection;

const iVaultPath = "assets/datasets/Properties_60InstancesWithUrl2.ibim";

const MY_HIERARCHY_RULESET: Ruleset = {
  id: "my-test-hierarchy",
  rules: [
    {
      ruleType: "RootNodes",
      autoExpand: true,
      specifications: [
        {
          specType: "InstanceNodesOfSpecificClasses",
          classes: [{ schemaName: "BisCore", classNames: ["Subject"], arePolymorphic: false }],
          instanceFilter: "this.Parent = NULL",
          groupByClass: false,
          groupByLabel: false,
        },
      ],
    },
    {
      ruleType: "ChildNodes",
      condition: `ParentNode.IsOfClass("Subject", "BisCore")`,
      onlyIfNotHandled: true,
      specifications: [
        {
          specType: "RelatedInstanceNodes",
          relationshipPaths: [
            { relationship: { schemaName: "BisCore", className: "SubjectOwnsSubjects" }, direction: "Forward" },
          ],
          groupByClass: false,
          groupByLabel: false,
        },
        {
          specType: "InstanceNodesOfSpecificClasses",
          classes: { schemaName: "BisCore", classNames: ["Model"], arePolymorphic: true },
          relatedInstances: [
            {
              relationshipPath: {
                relationship: { schemaName: "BisCore", className: "ModelModelsElement" },
                direction: "Forward",
                targetClass: { schemaName: "BisCore", className: "InformationPartitionElement" },
              },
              alias: "partition",
              isRequired: true,
            },
          ],
          instanceFilter: "partition.Parent.Id = parent.DMInstanceId AND NOT this.IsPrivate",
          groupByClass: false,
          groupByLabel: false,
        },
      ],
    },
    {
      ruleType: "ChildNodes",
      condition: `ParentNode.IsOfClass("Model", "BisCore")`,
      onlyIfNotHandled: true,
      specifications: [
        {
          specType: "RelatedInstanceNodes",
          relationshipPaths: [
            { relationship: { schemaName: "BisCore", className: "ModelContainsElements" }, direction: "Forward" },
          ],
          instanceFilter: "this.Parent = NULL",
          groupByClass: false,
          groupByLabel: false,
        },
      ],
    },
    {
      ruleType: "ChildNodes",
      condition: `ParentNode.IsOfClass("Element", "BisCore")`,
      onlyIfNotHandled: true,
      specifications: [
        {
          specType: "RelatedInstanceNodes",
          relationshipPaths: [
            { relationship: { schemaName: "BisCore", className: "ElementOwnsChildElements" }, direction: "Forward" },
          ],
          groupByClass: false,
          groupByLabel: false,
        },
      ],
    },
  ],
};

const MY_CONTENT_RULESET: Ruleset = {
  id: "my-test-content",
  rules: [
    { ruleType: "Content", specifications: [{ specType: "SelectedNodeInstances" }] },
    {
      ruleType: "ContentModifier",
      class: { schemaName: "Generic", className: "PhysicalObject" },
      propertyOverrides: [
        { name: "Model", isDisplayed: false },
        { name: "Category", isDisplayed: false },
      ],
      relatedProperties: [
        {
          propertiesSource: [
            { relationship: { schemaName: "BisCore", className: "ModelContainsElements" }, direction: "Backward" },
            { relationship: { schemaName: "BisCore", className: "ModelModelsElement" }, direction: "Forward" },
            {
              relationship: { schemaName: "BisCore", className: "ElementHasLinks" },
              targetClass: { schemaName: "BisCore", className: "RepositoryLink" },
              direction: "Forward",
            },
          ],
          properties: "_none_",
        },
      ],
    },
  ],
};

describe.skip("RulesetTesting", () => {
  beforeAll(async () => {
    // __PUBLISH_EXTRACT_START__ Presentation.Testing.Rulesets.Setup
    // initialize presentation-testing
    await initialize();

    // set up for testing iVault presentation data
    iVault = TestIVaultConnection.openFile(iVaultPath);

    // set up schema-based formatter
    IVaultApp.formatsProvider = new SchemaFormatsProvider(iVault.schemaContext, "metric");
    // __PUBLISH_EXTRACT_END__
  });

  afterAll(async () => {
    // __PUBLISH_EXTRACT_START__ Presentation.Testing.Rulesets.Terminate
    // close the tested iVault
    await iVault.close();

    // terminate presentation-testing
    await terminate();
    // __PUBLISH_EXTRACT_END__
  });

  // __PUBLISH_EXTRACT_START__ Presentation.Testing.Rulesets.Hierarchies
  it("generates correct hierarchy", async () => {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const builder = new HierarchyBuilder({ ivault: iVault });

    // generate the hierarchy using our custom ruleset
    const hierarchy = await builder.createHierarchy(MY_HIERARCHY_RULESET);

    // verify it through snapshot
    expect(hierarchy).toMatchSnapshot();
  });
  // __PUBLISH_EXTRACT_END__

  // __PUBLISH_EXTRACT_START__ Presentation.Testing.Rulesets.Content
  it("generates correct content", async () => {
    const builder = new ContentBuilder({ ivault: iVault, decimalPrecision: 8 });

    // generate content using our custom ruleset
    const myElementKey = { className: "Generic:PhysicalObject", id: Id64.fromLocalAndBriefcaseIds(116, 0) };
    const records = await builder.createContent(MY_CONTENT_RULESET, [myElementKey]);

    // verify the records through snapshot
    expect(records).toMatchSnapshot();
  });
  // __PUBLISH_EXTRACT_END__
});
