/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { beforeEach, describe, expect, it } from "vitest";
import { DM } from "@szewtwin/presentation-shared";
import { GroupingNodeKey } from "../../../../hierarchies/HierarchyNodeKey.js";
import * as baseClassGrouping from "../../../../hierarchies/ivault/operators/grouping/BaseClassGrouping.js";
import {
  createIVaultAccessStub,
  createTestGenericNodeKey,
  createTestProcessedGroupingNode,
  createTestProcessedInstanceNode,
} from "../../../Utils.js";

describe("BaseClassGrouping", () => {
  let ivaultAccess: ReturnType<typeof createIVaultAccessStub>;
  beforeEach(() => {
    ivaultAccess = createIVaultAccessStub();
  });

  describe("getBaseClassGroupingDMClasses", () => {
    it("extracts DMClasses in the order: the most base -> lesser base -> least base DMClass", async () => {
      const nodes = [
        createTestProcessedInstanceNode({
          key: { type: "instances", instanceKeys: [{ className: "TestSchema.TestClass", id: "0x1" }] },
          processingParams: {
            grouping: {
              byBaseClasses: { fullClassNames: ["TestSchema.Class2", "TestSchema.Class1", "TestSchema.Class3"] },
            },
          },
        }),
      ];
      ivaultAccess.stubEntityClass({ schemaName: "TestSchema", className: "Class1" });
      ivaultAccess.stubEntityClass({
        schemaName: "TestSchema",
        className: "Class2",
        is: async (className) => className === "TestSchema.Class1",
      });
      ivaultAccess.stubEntityClass({ schemaName: "TestSchema", className: "Class3", is: async () => true });
      const result = await baseClassGrouping.getBaseClassGroupingDMClasses(ivaultAccess, undefined, nodes);
      expect(result).toHaveLength(3);
      expect(result[0].fullName).toBe("TestSchema.Class1");
      expect(result[1].fullName).toBe("TestSchema.Class2");
      expect(result[2].fullName).toBe("TestSchema.Class3");
    });

    it("returns classes that are deeper in class hierarchy than the class of parent class grouping node", async () => {
      const parentNode = createTestProcessedGroupingNode({
        key: { type: "class-grouping", className: "TestSchema.Class2" },
      });
      const nodes = [
        createTestProcessedInstanceNode({
          key: { type: "instances", instanceKeys: [{ className: "TestSchema.TestClass4", id: "0x1" }] },
          processingParams: {
            grouping: {
              byBaseClasses: {
                fullClassNames: ["TestSchema.Class1", "TestSchema.Class2", "TestSchema.Class3", "TestSchema.Class4"],
              },
            },
          },
        }),
      ];
      ivaultAccess.stubEntityClass({ schemaName: "TestSchema", className: "Class1", is: async () => false });
      ivaultAccess.stubEntityClass({
        schemaName: "TestSchema",
        className: "Class2",
        is: async (className) => className === "TestSchema.Class1",
      });
      ivaultAccess.stubEntityClass({
        schemaName: "TestSchema",
        className: "Class3",
        is: async (className) => className === "TestSchema.Class1" || className === "TestSchema.Class2",
      });
      ivaultAccess.stubEntityClass({ schemaName: "TestSchema", className: "Class4", is: async () => true });
      const result = await baseClassGrouping.getBaseClassGroupingDMClasses(ivaultAccess, parentNode, nodes);
      expect(result).toHaveLength(2);
      expect(result[0].fullName).toBe("TestSchema.Class3");
      expect(result[1].fullName).toBe("TestSchema.Class4");
    });

    it("returns empty classes list when the class of parent class grouping node matches grouping class", async () => {
      const parentNode = createTestProcessedGroupingNode({
        key: { type: "class-grouping", className: "TestSchema.Class1" },
      });
      const nodes = [
        createTestProcessedInstanceNode({
          key: { type: "instances", instanceKeys: [{ className: "TestSchema.TestClass2", id: "0x1" }] },
          processingParams: { grouping: { byBaseClasses: { fullClassNames: ["TestSchema.Class1"] } } },
        }),
      ];
      ivaultAccess.stubEntityClass({ schemaName: "TestSchema", className: "Class1", is: async () => false });
      ivaultAccess.stubEntityClass({
        schemaName: "TestSchema",
        className: "Class2",
        is: async (className) => className === "TestSchema.Class1",
      });
      const result = await baseClassGrouping.getBaseClassGroupingDMClasses(ivaultAccess, parentNode, nodes);
      expect(result).toHaveLength(0);
    });

    it("returns empty classes list when the class of parent class grouping node doesn't match any of the grouping class ancestors", async () => {
      const parentNode = createTestProcessedGroupingNode({
        key: { type: "class-grouping", className: "TestSchema.Class2" },
      });
      const nodes = [
        createTestProcessedInstanceNode({
          key: { type: "instances", instanceKeys: [{ className: "TestSchema.TestClass2", id: "0x1" }] },
          processingParams: { grouping: { byBaseClasses: { fullClassNames: ["TestSchema.Class1"] } } },
        }),
      ];
      ivaultAccess.stubEntityClass({ schemaName: "TestSchema", className: "Class1", is: async () => false });
      ivaultAccess.stubEntityClass({
        schemaName: "TestSchema",
        className: "Class2",
        is: async (className) => className === "TestSchema.Class1",
      });
      const result = await baseClassGrouping.getBaseClassGroupingDMClasses(ivaultAccess, parentNode, nodes);
      expect(result).toHaveLength(0);
    });

    it("doesn't extract DMClasses that are not of entity or relationship type", async () => {
      const nodes = [
        createTestProcessedInstanceNode({
          key: { type: "instances", instanceKeys: [{ className: "TestSchema.TestClass", id: "0x1" }] },
          processingParams: { grouping: { byBaseClasses: { fullClassNames: ["TestSchema.Class"] } } },
        }),
      ];
      ivaultAccess.stubOtherClass({ schemaName: "TestSchema", className: "Class" });
      const result = await baseClassGrouping.getBaseClassGroupingDMClasses(ivaultAccess, undefined, nodes);
      expect(result).toEqual([]);
    });

    it("returns empty array if base classes aren't provided", async () => {
      const nodes = [
        createTestProcessedInstanceNode({
          key: { type: "instances", instanceKeys: [{ className: "TestSchema.TestClass", id: "0x1" }] },
        }),
      ];
      const result = await baseClassGrouping.getBaseClassGroupingDMClasses(ivaultAccess, undefined, nodes);
      expect(result).toEqual([]);
    });
  });

  describe("createBaseClassGroupsForSingleBaseClass", async () => {
    it("doesn't group if provided DMClass is not in the nodes' grouping base class list", async () => {
      const nodes = [
        createTestProcessedInstanceNode({
          key: { type: "instances", instanceKeys: [{ className: "TestSchema.TestClass", id: "0x1" }] },
          parentKeys: [createTestGenericNodeKey({ id: "x" })],
          processingParams: { grouping: { byBaseClasses: { fullClassNames: ["TestSchema.Class"] } } },
        }),
      ];
      const dmClass = { fullName: "TestSchema.ParentClass", label: "ParentClass" } as unknown as DM.Class;
      expect(await baseClassGrouping.createBaseClassGroupsForSingleBaseClass(nodes, dmClass, ivaultAccess)).toEqual({
        groupingType: "base-class",
        grouped: [],
        ungrouped: nodes,
      });
    });

    it("groups one instance node", async () => {
      const nodes = [
        createTestProcessedInstanceNode({
          key: { type: "instances", instanceKeys: [{ className: "TestSchema.TestClass", id: "0x1" }] },
          parentKeys: [createTestGenericNodeKey({ id: "x" })],
          processingParams: { grouping: { byBaseClasses: { fullClassNames: ["TestSchema.ParentClass"] } } },
        }),
      ];
      const eCClass = { fullName: "TestSchema.ParentClass", name: "Parent Class" } as unknown as DM.Class;

      ivaultAccess.stubEntityClass({ schemaName: "TestSchema", className: "TestClass", is: async () => true });

      const expectedGroupingNodeKey: GroupingNodeKey = { type: "class-grouping", className: eCClass.fullName };
      expect(await baseClassGrouping.createBaseClassGroupsForSingleBaseClass(nodes, eCClass, ivaultAccess)).toEqual({
        groupingType: "base-class",
        grouped: [
          createTestProcessedGroupingNode({
            label: eCClass.name,
            key: expectedGroupingNodeKey,
            parentKeys: [createTestGenericNodeKey({ id: "x" })],
            groupedInstanceKeys: nodes.flatMap((n) => n.key.instanceKeys),
            children: nodes.map((n) => ({
              ...n,
              parentKeys: [createTestGenericNodeKey({ id: "x" }), expectedGroupingNodeKey],
            })),
          }),
        ],
        ungrouped: [],
      });
    });

    it("groups multiple instance nodes", async () => {
      const nodes = [
        createTestProcessedInstanceNode({
          key: { type: "instances", instanceKeys: [{ className: "TestSchema.A", id: "0x1" }] },
          parentKeys: [createTestGenericNodeKey({ id: "x" })],
          label: "1",
          processingParams: { grouping: { byBaseClasses: { fullClassNames: ["TestSchema.ParentClass"] } } },
        }),
        createTestProcessedInstanceNode({
          key: { type: "instances", instanceKeys: [{ className: "TestSchema.B", id: "0x2" }] },
          parentKeys: [createTestGenericNodeKey({ id: "x" })],
          label: "2",
          processingParams: { grouping: { byBaseClasses: { fullClassNames: ["TestSchema.ParentClass"] } } },
        }),
      ];

      ivaultAccess.stubEntityClass({
        schemaName: "TestSchema",
        className: "A",
        classLabel: "Class A",
        is: async () => true,
      });
      ivaultAccess.stubEntityClass({
        schemaName: "TestSchema",
        className: "B",
        classLabel: "Class B",
        is: async () => true,
      });
      const dmClass = { fullName: "TestSchema.ParentClass", label: "ParentClass" } as unknown as DM.Class;

      const expectedGroupingNodeKey: GroupingNodeKey = { type: "class-grouping", className: dmClass.fullName };

      expect(await baseClassGrouping.createBaseClassGroupsForSingleBaseClass(nodes, dmClass, ivaultAccess)).toEqual({
        groupingType: "base-class",
        grouped: [
          createTestProcessedGroupingNode({
            label: dmClass.label,
            key: expectedGroupingNodeKey,
            parentKeys: [createTestGenericNodeKey({ id: "x" })],
            groupedInstanceKeys: nodes.flatMap((n) => n.key.instanceKeys),
            children: nodes.map((n) => ({
              ...n,
              parentKeys: [createTestGenericNodeKey({ id: "x" }), expectedGroupingNodeKey],
            })),
          }),
        ],
        ungrouped: [],
      });
    });

    it("groups only nodes for which DMClass is base", async () => {
      const nodes = [
        createTestProcessedInstanceNode({
          key: { type: "instances", instanceKeys: [{ className: "TestSchema.A", id: "0x1" }] },
          parentKeys: [createTestGenericNodeKey({ id: "x" })],
          label: "1",
          processingParams: { grouping: { byBaseClasses: { fullClassNames: ["TestSchema.ParentClass"] } } },
        }),
        createTestProcessedInstanceNode({
          key: { type: "instances", instanceKeys: [{ className: "TestSchema.B", id: "0x2" }] },
          parentKeys: [createTestGenericNodeKey({ id: "x" })],
          label: "2",
          processingParams: { grouping: { byBaseClasses: { fullClassNames: ["TestSchema.ParentClass"] } } },
        }),
      ];
      ivaultAccess.stubEntityClass({
        schemaName: "TestSchema",
        className: "A",
        classLabel: "Class A",
        is: async () => true,
      });
      ivaultAccess.stubEntityClass({
        schemaName: "TestSchema",
        className: "B",
        classLabel: "Class B",
        is: async () => false,
      });
      const dmClass = { fullName: "TestSchema.ParentClass", label: "ParentClass" } as unknown as DM.Class;

      const expectedGroupingNodeKey: GroupingNodeKey = { type: "class-grouping", className: dmClass.fullName };

      expect(await baseClassGrouping.createBaseClassGroupsForSingleBaseClass(nodes, dmClass, ivaultAccess)).toEqual({
        groupingType: "base-class",
        grouped: [
          createTestProcessedGroupingNode({
            label: dmClass.label,
            key: expectedGroupingNodeKey,
            parentKeys: [createTestGenericNodeKey({ id: "x" })],
            groupedInstanceKeys: nodes[0].key.instanceKeys,
            children: [nodes[0]].map((n) => ({
              ...n,
              parentKeys: [createTestGenericNodeKey({ id: "x" }), expectedGroupingNodeKey],
            })),
          }),
        ],
        ungrouped: [nodes[1]],
      });
    });
  });

  describe("createBaseClassGroupingHandlers", () => {
    it("creates base class grouping handlers from the provided fullClassNames", async () => {
      const nodes = [
        createTestProcessedInstanceNode({
          key: { type: "instances", instanceKeys: [{ className: "TestSchema.TestClass", id: "0x1" }] },
          processingParams: { grouping: { byBaseClasses: { fullClassNames: ["TestSchema.Class"] } } },
        }),
      ];
      ivaultAccess.stubEntityClass({ schemaName: "TestSchema", className: "Class" });
      ivaultAccess.stubEntityClass({ schemaName: "TestSchema", className: "TestClass", is: async () => true });

      const result = await baseClassGrouping.createBaseClassGroupingHandlers(ivaultAccess, undefined, nodes);
      expect(result).toHaveLength(1);
      const handlerResult = await result[0](nodes, []);
      expect(handlerResult.groupingType).toBe("base-class");
    });
  });
});
