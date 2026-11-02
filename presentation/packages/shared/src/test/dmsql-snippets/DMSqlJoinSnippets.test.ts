/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { ResolvablePromise } from "presentation-test-utilities";
import { beforeEach, describe, expect, it } from "vitest";
import { createRelationshipPathJoinClause } from "../../shared/dmsql-snippets/DMSqlJoinSnippets.js";
import { DM } from "../../shared/Metadata.js";
import { trimWhitespace } from "../../shared/Utils.js";
import { createDMSchemaProviderStub } from "../MetadataProviderStub.js";

describe("createRelationshipPathJoinClause", () => {
  let schemaProvider: ReturnType<typeof createDMSchemaProviderStub>;
  const schemaName = "x";

  beforeEach(() => {
    schemaProvider = createDMSchemaProviderStub();
  });

  it("returns empty string if given empty relationship path", async () => {
    expect(await createRelationshipPathJoinClause({ schemaProvider, path: [] })).toBe("");
  });

  describe("using navigation properties", () => {
    it("creates a forward join on forward navigation property with forward relationship", async () => {
      const { sourceClass, targetClass, relationship } = await setupNavigationPropertyRelationshipClasses({
        navigationPropertyDirection: "Forward",
        navigationPropertyName: "PhysicalMaterial",
        source: "PhysicalElement",
        target: "PhysicalMaterial",
        relationship: { name: "PhysicalElementIsOfPhysicalMaterial", direction: "Forward" },
      });
      expect(
        trimWhitespace(
          await createRelationshipPathJoinClause({
            schemaProvider,
            path: [
              {
                sourceClassName: sourceClass.fullName,
                sourceAlias: "s",
                relationshipName: relationship.fullName,
                relationshipAlias: "r",
                targetClassName: targetClass.fullName,
                targetAlias: "t",
              },
            ],
          }),
        ),
      ).toBe(
        trimWhitespace(
          `INNER JOIN [${schemaName}].[PhysicalMaterial] [t] ON [t].[DMInstanceId] = [s].[PhysicalMaterial].[Id]`,
        ),
      );
    });

    it("creates a forward join on forward navigation property with backward relationship", async () => {
      const { sourceClass, targetClass, relationship } = await setupNavigationPropertyRelationshipClasses({
        navigationPropertyDirection: "Forward",
        navigationPropertyName: "ModeledElement",
        source: "Model",
        target: "Element",
        relationship: { name: "ModelModelsElement", direction: "Backward" },
      });
      expect(
        trimWhitespace(
          await createRelationshipPathJoinClause({
            schemaProvider,
            path: [
              {
                sourceClassName: sourceClass.fullName,
                sourceAlias: "s",
                relationshipName: relationship.fullName,
                relationshipAlias: "r",
                targetClassName: targetClass.fullName,
                targetAlias: "t",
              },
            ],
          }),
        ),
      ).toBe(
        trimWhitespace(`INNER JOIN [${schemaName}].[Element] [t] ON [t].[DMInstanceId] = [s].[ModeledElement].[Id]`),
      );
    });

    it("creates a forward join on backward navigation property with forward relationship", async () => {
      const { sourceClass, targetClass, relationship } = await setupNavigationPropertyRelationshipClasses({
        navigationPropertyDirection: "Backward",
        navigationPropertyName: "Model",
        source: "Model",
        target: "Element",
        relationship: { name: "ModelContainsElements", direction: "Forward" },
      });
      expect(
        trimWhitespace(
          await createRelationshipPathJoinClause({
            schemaProvider,
            path: [
              {
                sourceClassName: sourceClass.fullName,
                sourceAlias: "s",
                relationshipName: relationship.fullName,
                relationshipAlias: "r",
                targetClassName: targetClass.fullName,
                targetAlias: "t",
              },
            ],
          }),
        ),
      ).toBe(trimWhitespace(`INNER JOIN [${schemaName}].[Element] [t] ON [t].[Model].[Id] = [s].[DMInstanceId]`));
    });

    it("creates a forward join on backward navigation property with backward relationship", async () => {
      const { sourceClass, targetClass, relationship } = await setupNavigationPropertyRelationshipClasses({
        navigationPropertyDirection: "Backward",
        navigationPropertyName: "Scope",
        source: "Element",
        target: "ExternalSourceAspect",
        relationship: { name: "ElementScopesExternalSourceIdentifier", direction: "Backward" },
      });
      expect(
        trimWhitespace(
          await createRelationshipPathJoinClause({
            schemaProvider,
            path: [
              {
                sourceClassName: sourceClass.fullName,
                sourceAlias: "s",
                relationshipName: relationship.fullName,
                relationshipAlias: "r",
                targetClassName: targetClass.fullName,
                targetAlias: "t",
              },
            ],
          }),
        ),
      ).toBe(
        trimWhitespace(
          `INNER JOIN [${schemaName}].[ExternalSourceAspect] [t] ON [t].[Scope].[Id] = [s].[DMInstanceId]`,
        ),
      );
    });

    it("creates a reversed join on forward navigation property with forward relationship", async () => {
      const { sourceClass, targetClass, relationship } = await setupNavigationPropertyRelationshipClasses({
        navigationPropertyDirection: "Forward",
        navigationPropertyName: "PhysicalMaterial",
        source: "PhysicalElement",
        target: "PhysicalMaterial",
        relationship: { name: "PhysicalElementIsOfPhysicalMaterial", direction: "Forward" },
      });
      expect(
        trimWhitespace(
          await createRelationshipPathJoinClause({
            schemaProvider,
            path: [
              {
                sourceClassName: targetClass.fullName,
                sourceAlias: "s",
                relationshipName: relationship.fullName,
                relationshipAlias: "r",
                relationshipReverse: true,
                targetClassName: sourceClass.fullName,
                targetAlias: "t",
              },
            ],
          }),
        ),
      ).toBe(
        trimWhitespace(
          `INNER JOIN [${schemaName}].[PhysicalElement] [t] ON [t].[PhysicalMaterial].[Id] = [s].[DMInstanceId]`,
        ),
      );
    });

    it("creates a reversed join on forward navigation property with backward relationship", async () => {
      const { sourceClass, targetClass, relationship } = await setupNavigationPropertyRelationshipClasses({
        navigationPropertyDirection: "Forward",
        navigationPropertyName: "ModeledElement",
        source: "Model",
        target: "Element",
        relationship: { name: "ModelModelsElement", direction: "Backward" },
      });
      expect(
        trimWhitespace(
          await createRelationshipPathJoinClause({
            schemaProvider,
            path: [
              {
                sourceClassName: targetClass.fullName,
                sourceAlias: "s",
                relationshipName: relationship.fullName,
                relationshipAlias: "r",
                relationshipReverse: true,
                targetClassName: sourceClass.fullName,
                targetAlias: "t",
              },
            ],
          }),
        ),
      ).toBe(
        trimWhitespace(`INNER JOIN [${schemaName}].[Model] [t] ON [t].[ModeledElement].[Id] = [s].[DMInstanceId]`),
      );
    });

    it("creates a reversed join on backward navigation property with forward relationship", async () => {
      const { sourceClass, targetClass, relationship } = await setupNavigationPropertyRelationshipClasses({
        navigationPropertyDirection: "Backward",
        navigationPropertyName: "Model",
        source: "Model",
        target: "Element",
        relationship: { name: "ModelContainsElements", direction: "Forward" },
      });
      expect(
        trimWhitespace(
          await createRelationshipPathJoinClause({
            schemaProvider,
            path: [
              {
                sourceClassName: targetClass.fullName,
                sourceAlias: "s",
                relationshipName: relationship.fullName,
                relationshipAlias: "r",
                relationshipReverse: true,
                targetClassName: sourceClass.fullName,
                targetAlias: "t",
              },
            ],
          }),
        ),
      ).toBe(trimWhitespace(`INNER JOIN [${schemaName}].[Model] [t] ON [t].[DMInstanceId] = [s].[Model].[Id]`));
    });

    it("creates a reversed join on backward navigation property with backward relationship", async () => {
      const { sourceClass, targetClass, relationship } = await setupNavigationPropertyRelationshipClasses({
        navigationPropertyDirection: "Backward",
        navigationPropertyName: "Scope",
        source: "Element",
        target: "ExternalSourceAspect",
        relationship: { name: "ElementScopesExternalSourceIdentifier", direction: "Backward" },
      });
      expect(
        trimWhitespace(
          await createRelationshipPathJoinClause({
            schemaProvider,
            path: [
              {
                sourceClassName: targetClass.fullName,
                sourceAlias: "s",
                relationshipName: relationship.fullName,
                relationshipAlias: "r",
                relationshipReverse: true,
                targetClassName: sourceClass.fullName,
                targetAlias: "t",
              },
            ],
          }),
        ),
      ).toBe(trimWhitespace(`INNER JOIN [${schemaName}].[Element] [t] ON [t].[DMInstanceId] = [s].[Scope].[Id]`));
    });
  });

  describe("using link table relationships", () => {
    it("creates a forward inner join", async () => {
      const { sourceClass, targetClass, relationship } = setupLinkTableRelationshipClasses();
      expect(
        trimWhitespace(
          await createRelationshipPathJoinClause({
            schemaProvider,
            path: [
              {
                sourceClassName: sourceClass.fullName,
                sourceAlias: "s",
                relationshipName: relationship.fullName,
                relationshipAlias: "r",
                targetClassName: targetClass.fullName,
                targetAlias: "t",
              },
            ],
          }),
        ),
      ).toBe(
        trimWhitespace(`
          INNER JOIN [${schemaName}].[${relationship.name}] [r] ON [r].[SourceDMInstanceId] = [s].[DMInstanceId]
          INNER JOIN [${schemaName}].[${targetClass.name}] [t] ON [t].[DMInstanceId] = [r].[TargetDMInstanceId]
        `),
      );
    });

    it("creates a forward outer join", async () => {
      const { sourceClass, targetClass, relationship } = setupLinkTableRelationshipClasses();
      expect(
        trimWhitespace(
          await createRelationshipPathJoinClause({
            schemaProvider,
            path: [
              {
                sourceClassName: sourceClass.fullName,
                sourceAlias: "s",
                relationshipName: relationship.fullName,
                relationshipAlias: "r",
                targetClassName: targetClass.fullName,
                targetAlias: "t",
                joinType: "outer",
              },
            ],
          }),
        ),
      ).toBe(
        trimWhitespace(`
          OUTER JOIN (
            SELECT [r].*
            FROM [${schemaName}].[${relationship.name}] [r]
            INNER JOIN [${schemaName}].[${targetClass.name}] [t] ON [t].[DMInstanceId] = [r].[TargetDMInstanceId]
          ) [r] ON [r].[SourceDMInstanceId] = [s].[DMInstanceId]
          OUTER JOIN [${schemaName}].[${targetClass.name}] [t] ON [t].[DMInstanceId] = [r].[TargetDMInstanceId]
        `),
      );
    });

    it("creates a reversed inner join", async () => {
      const { sourceClass, targetClass, relationship } = setupLinkTableRelationshipClasses();
      expect(
        trimWhitespace(
          await createRelationshipPathJoinClause({
            schemaProvider,
            path: [
              {
                sourceClassName: targetClass.fullName,
                sourceAlias: "s",
                relationshipName: relationship.fullName,
                relationshipAlias: "r",
                relationshipReverse: true,
                targetClassName: sourceClass.fullName,
                targetAlias: "t",
              },
            ],
          }),
        ),
      ).toBe(
        trimWhitespace(`
          INNER JOIN [${schemaName}].[${relationship.name}] [r] ON [r].[TargetDMInstanceId] = [s].[DMInstanceId]
          INNER JOIN [${schemaName}].[${sourceClass.name}] [t] ON [t].[DMInstanceId] = [r].[SourceDMInstanceId]
        `),
      );
    });
  });

  describe("multi-step joins", () => {
    it("creates 2 navigation property joins", async () => {
      const step1 = await setupNavigationPropertyRelationshipClasses({
        navigationPropertyDirection: "Forward",
        navigationPropertyName: "nav-prop-1",
        source: "a",
        relationship: "r1",
        target: "b",
      });
      const step2 = await setupNavigationPropertyRelationshipClasses({
        navigationPropertyDirection: "Backward",
        navigationPropertyName: "nav-prop-2",
        source: step1.targetClass,
        relationship: "r2",
        target: "c",
      });
      expect(
        trimWhitespace(
          await createRelationshipPathJoinClause({
            schemaProvider,
            path: [
              {
                sourceClassName: step1.sourceClass.fullName,
                sourceAlias: "a",
                relationshipName: step1.relationship.fullName,
                relationshipAlias: "r1",
                targetClassName: step1.targetClass.fullName,
                targetAlias: "b",
              },
              {
                sourceClassName: step2.sourceClass.fullName,
                sourceAlias: "b",
                relationshipName: step2.relationship.fullName,
                relationshipAlias: "r2",
                targetClassName: step2.targetClass.fullName,
                targetAlias: "c",
              },
            ],
          }),
        ),
      ).toBe(
        trimWhitespace(`
          INNER JOIN [${schemaName}].[${step1.targetClass.name}] [b] ON [b].[DMInstanceId] = [a].[${step1.navigationProperty.name}].[Id]
          INNER JOIN [${schemaName}].[${step2.targetClass.name}] [c] ON [c].[${step2.navigationProperty.name}].[Id] = [b].[DMInstanceId]
        `),
      );
    });

    it("creates 2 link table relationship joins", async () => {
      const step1 = setupLinkTableRelationshipClasses({ source: "a", relationship: "r1", target: "b" });
      const step2 = setupLinkTableRelationshipClasses({ source: step1.targetClass, relationship: "r2", target: "c" });
      expect(
        trimWhitespace(
          await createRelationshipPathJoinClause({
            schemaProvider,
            path: [
              {
                sourceClassName: step1.sourceClass.fullName,
                sourceAlias: "a",
                relationshipName: step1.relationship.fullName,
                relationshipAlias: "r1",
                targetClassName: step1.targetClass.fullName,
                targetAlias: "b",
              },
              {
                sourceClassName: step2.sourceClass.fullName,
                sourceAlias: "b",
                relationshipName: step2.relationship.fullName,
                relationshipAlias: "r2",
                targetClassName: step2.targetClass.fullName,
                targetAlias: "c",
              },
            ],
          }),
        ),
      ).toBe(
        trimWhitespace(`
          INNER JOIN [${schemaName}].[${step1.relationship.name}] [r1] ON [r1].[SourceDMInstanceId] = [a].[DMInstanceId]
          INNER JOIN [${schemaName}].[${step1.targetClass.name}] [b] ON [b].[DMInstanceId] = [r1].[TargetDMInstanceId]
          INNER JOIN [${schemaName}].[${step2.relationship.name}] [r2] ON [r2].[SourceDMInstanceId] = [b].[DMInstanceId]
          INNER JOIN [${schemaName}].[${step2.targetClass.name}] [c] ON [c].[DMInstanceId] = [r2].[TargetDMInstanceId]
        `),
      );
    });

    it("creates link table join after navigation property join", async () => {
      const step1 = await setupNavigationPropertyRelationshipClasses({
        navigationPropertyDirection: "Forward",
        navigationPropertyName: "nav-prop-1",
        source: "a",
        relationship: "r1",
        target: "b",
      });
      const step2 = setupLinkTableRelationshipClasses({ source: step1.targetClass, relationship: "r2", target: "c" });
      expect(
        trimWhitespace(
          await createRelationshipPathJoinClause({
            schemaProvider,
            path: [
              {
                sourceClassName: step1.sourceClass.fullName,
                sourceAlias: "a",
                relationshipName: step1.relationship.fullName,
                relationshipAlias: "r1",
                targetClassName: step1.targetClass.fullName,
                targetAlias: "b",
              },
              {
                sourceClassName: step2.sourceClass.fullName,
                sourceAlias: "b",
                relationshipName: step2.relationship.fullName,
                relationshipAlias: "r2",
                targetClassName: step2.targetClass.fullName,
                targetAlias: "c",
              },
            ],
          }),
        ),
      ).toBe(
        trimWhitespace(`
          INNER JOIN [${schemaName}].[${step1.targetClass.name}] [b] ON [b].[DMInstanceId] = [a].[${step1.navigationProperty.name}].[Id]
          INNER JOIN [${schemaName}].[${step2.relationship.name}] [r2] ON [r2].[SourceDMInstanceId] = [b].[DMInstanceId]
          INNER JOIN [${schemaName}].[${step2.targetClass.name}] [c] ON [c].[DMInstanceId] = [r2].[TargetDMInstanceId]
        `),
      );
    });

    it("creates navigation property join after link table join", async () => {
      const step1 = setupLinkTableRelationshipClasses({ source: "a", relationship: "r1", target: "b" });
      const step2 = await setupNavigationPropertyRelationshipClasses({
        navigationPropertyDirection: "Backward",
        navigationPropertyName: "nav-prop-2",
        source: step1.targetClass,
        relationship: "r2",
        target: "c",
      });
      expect(
        trimWhitespace(
          await createRelationshipPathJoinClause({
            schemaProvider,
            path: [
              {
                sourceClassName: step1.sourceClass.fullName,
                sourceAlias: "a",
                relationshipName: step1.relationship.fullName,
                relationshipAlias: "r1",
                targetClassName: step1.targetClass.fullName,
                targetAlias: "b",
              },
              {
                sourceClassName: step2.sourceClass.fullName,
                sourceAlias: "b",
                relationshipName: step2.relationship.fullName,
                relationshipAlias: "r2",
                targetClassName: step2.targetClass.fullName,
                targetAlias: "c",
              },
            ],
          }),
        ),
      ).toBe(
        trimWhitespace(`
          INNER JOIN [${schemaName}].[${step1.relationship.name}] [r1] ON [r1].[SourceDMInstanceId] = [a].[DMInstanceId]
          INNER JOIN [${schemaName}].[${step1.targetClass.name}] [b] ON [b].[DMInstanceId] = [r1].[TargetDMInstanceId]
          INNER JOIN [${schemaName}].[${step2.targetClass.name}] [c] ON [c].[${step2.navigationProperty.name}].[Id] = [b].[DMInstanceId]
        `),
      );
    });
  });

  async function setupNavigationPropertyRelationshipClasses(props: {
    navigationPropertyDirection: "Forward" | "Backward";
    navigationPropertyName?: string;
    source?: Partial<Omit<DM.Class, "is">> | string;
    relationship?: Partial<Omit<DM.RelationshipClass, "is">> | string;
    target?: Partial<Omit<DM.Class, "is">> | string;
  }) {
    const navigationRelationshipRes = new ResolvablePromise<DM.RelationshipClass>();
    const navigationProperty = {
      name: props?.navigationPropertyName ?? "navigation-property",
      isNavigation: () => true,
      direction: props.navigationPropertyDirection,
      relationshipClass: navigationRelationshipRes,
    } as unknown as DM.NavigationProperty;
    const sourceClass = schemaProvider.stubEntityClass({
      schemaName,
      className: typeof props.source === "string" ? props.source : "source",
      properties: props.navigationPropertyDirection === "Forward" ? [navigationProperty] : [],
      ...(typeof props.source === "object" ? props.source : undefined),
    });
    const targetClass = schemaProvider.stubEntityClass({
      schemaName,
      className: typeof props.target === "string" ? props.target : "target",
      properties: props.navigationPropertyDirection === "Backward" ? [navigationProperty] : [],
      ...(typeof props.target === "object" ? props.target : undefined),
    });
    const relationship = schemaProvider.stubRelationshipClass({
      schemaName,
      className: typeof props.relationship === "string" ? props.relationship : "relationship",
      direction: "Forward",
      source: { polymorphic: false, abstractConstraint: Promise.resolve(sourceClass) },
      target: { polymorphic: false, abstractConstraint: Promise.resolve(targetClass) },
      ...(typeof props.relationship === "object" ? props.relationship : undefined),
    });
    await navigationRelationshipRes.resolve(relationship);
    return { sourceClass, targetClass, relationship, navigationProperty };
  }

  function setupLinkTableRelationshipClasses(props?: {
    source?: DM.Class | string;
    target?: DM.Class | string;
    relationship?: DM.RelationshipClass | string;
  }) {
    const sourceClass =
      typeof props?.source === "object"
        ? props.source
        : schemaProvider.stubEntityClass({ schemaName, className: props?.source ?? "source" });
    const targetClass =
      typeof props?.target === "object"
        ? props.target
        : schemaProvider.stubEntityClass({ schemaName, className: props?.target ?? "target" });
    const relationship =
      typeof props?.relationship === "object"
        ? props.relationship
        : schemaProvider.stubRelationshipClass({
            schemaName,
            className: props?.relationship ?? "relationship",
            direction: "Forward",
            source: { polymorphic: false, abstractConstraint: Promise.resolve(sourceClass) },
            target: { polymorphic: false, abstractConstraint: Promise.resolve(targetClass) },
          });
    return { sourceClass, targetClass, relationship };
  }
});
