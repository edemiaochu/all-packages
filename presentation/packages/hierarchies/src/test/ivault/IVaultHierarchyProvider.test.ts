/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { collect, createAsyncIterator, ResolvablePromise, waitFor } from "presentation-test-utilities";
import { afterAll, beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { BeEvent, omit } from "@szewtwin/core-szewec";
import { GenericInstanceFilter } from "@szewtwin/core-common";
import { DM, DMSqlQueryDef, InstanceKey, trimWhitespace, TypedPrimitiveValue } from "@szewtwin/presentation-shared";
import { RowsLimitExceededError } from "../../hierarchies/HierarchyErrors.js";
import { GroupingHierarchyNode, HierarchyNode, ParentHierarchyNode } from "../../hierarchies/HierarchyNode.js";
import { GroupingNodeKey } from "../../hierarchies/HierarchyNodeKey.js";
import {
  DMSQL_COLUMN_NAME_FilterClassName,
  DMSQL_COLUMN_NAME_FilterDMInstanceId,
} from "../../hierarchies/ivault/FilteringHierarchyDefinition.js";
import {
  DefineHierarchyLevelProps,
  HierarchyDefinition,
  NodeParser,
} from "../../hierarchies/ivault/IVaultHierarchyDefinition.js";
import {
  InstanceHierarchyNodeProcessingParams,
  ProcessedHierarchyNode,
  SourceInstanceHierarchyNode,
} from "../../hierarchies/ivault/IVaultHierarchyNode.js";
import { createIVaultHierarchyProvider } from "../../hierarchies/ivault/IVaultHierarchyProvider.js";
import { LimitingDMSqlQueryExecutor } from "../../hierarchies/ivault/LimitingDMSqlQueryExecutor.js";
import { NodeSelectClauseColumnNames } from "../../hierarchies/ivault/NodeSelectQueryFactory.js";
import { RowDef } from "../../hierarchies/ivault/TreeNodesReader.js";
import {
  createIVaultAccessStub,
  createTestGenericNode,
  createTestGenericNodeKey,
  createTestInstanceKey,
  createTestSourceGenericNode,
} from "../Utils.js";

describe("createIVaultHierarchyProvider", () => {
  let ivaultAccess: ReturnType<typeof createIVaultAccessStub> & {
    createQueryReader: Mock<LimitingDMSqlQueryExecutor["createQueryReader"]>;
    ivaultKey: string;
  };

  beforeEach(() => {
    ivaultAccess = { ...createIVaultAccessStub(), createQueryReader: vi.fn(), ivaultKey: "test-ivault" };
  });

  it("loads root generic nodes", async () => {
    const node = createTestSourceGenericNode();
    using provider = createIVaultHierarchyProvider({
      ivaultAccess,
      hierarchyDefinition: {
        async defineHierarchyLevel({ parentNode }) {
          if (!parentNode) {
            return [{ node }];
          }
          return [];
        },
      },
    });
    const nodes = await collect(provider.getNodes({ parentNode: undefined }));
    expect(nodes).toEqual([
      { ...node, key: createTestGenericNodeKey({ source: ivaultAccess.ivaultKey }), parentKeys: [], children: false },
    ]);
  });

  it("loads root instance nodes", async () => {
    ivaultAccess.createQueryReader.mockReturnValue(
      createAsyncIterator<RowDef>([
        {
          [NodeSelectClauseColumnNames.FullClassName]: "a.b",
          [NodeSelectClauseColumnNames.DMInstanceId]: "0x123",
          [NodeSelectClauseColumnNames.DisplayLabel]: "test label",
        },
      ]),
    );
    const query: DMSqlQueryDef = {
      dmsql: "QUERY",
      bindings: [{ type: "string", value: "test binding" }],
      ctes: ["CTE"],
    };
    using provider = createIVaultHierarchyProvider({
      ivaultAccess,
      hierarchyDefinition: {
        async defineHierarchyLevel({ parentNode }) {
          if (!parentNode) {
            return [{ fullClassName: "x.y", query }];
          }
          return [];
        },
      },
    });
    const nodes = await collect(provider.getNodes({ parentNode: undefined }));
    expect(ivaultAccess.createQueryReader).toHaveBeenCalledExactlyOnceWith(
      query,
      expect.objectContaining({ rowFormat: "DMSqlPropertyNames", restartToken: expect.any(String) }),
    );
    expect(nodes).toEqual([
      {
        key: { type: "instances", instanceKeys: [{ className: "a.b", id: "0x123", ivaultKey: "test-ivault" }] },
        parentKeys: [],
        label: "test label",
        children: false,
      } as HierarchyNode,
    ]);
  });

  it("loads child nodes", async () => {
    const rootNode = createTestGenericNode({
      key: createTestGenericNodeKey({ id: "root", source: ivaultAccess.ivaultKey }),
    });
    const childNode = createTestSourceGenericNode({ key: "child" });
    using provider = createIVaultHierarchyProvider({
      ivaultAccess,
      hierarchyDefinition: {
        async defineHierarchyLevel({ parentNode }) {
          if (parentNode && HierarchyNode.isGeneric(parentNode) && parentNode.key.id === "root") {
            return [{ node: childNode }];
          }
          return [];
        },
      },
    });

    const nodes = await collect(provider.getNodes({ parentNode: rootNode }));
    const expectedChild = {
      ...childNode,
      key: createTestGenericNodeKey({ id: "child", source: ivaultAccess.ivaultKey }),
      parentKeys: [rootNode.key],
      children: false,
    };
    expect(nodes).toEqual([expectedChild]);
  });

  [
    {
      parentNode: createTestGenericNode({
        key: createTestGenericNodeKey({ id: "generic node", source: "unknown source" }),
      }) satisfies ParentHierarchyNode,
    },
    {
      parentNode: {
        key: { type: "instances" as const, instanceKeys: [createTestInstanceKey({ ivaultKey: "unknown ivault" })] },
        label: "instances node",
        parentKeys: [],
      } satisfies ParentHierarchyNode,
    },
  ].forEach(({ parentNode }) => {
    it(`doesn't load children for ${parentNode.key.type} parent of different source`, async () => {
      const hierarchyDefinition: HierarchyDefinition = {
        async defineHierarchyLevel() {
          return [];
        },
      };
      using provider = createIVaultHierarchyProvider({ ivaultAccess, hierarchyDefinition });
      const spy = vi.spyOn(hierarchyDefinition, "defineHierarchyLevel");

      const nodes = await collect(provider.getNodes({ parentNode }));
      expect(nodes).toHaveLength(0);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("Reacting to iVault data changes", () => {
    it("unsubscribes from `ivaultChanged` event when disposed", () => {
      const evt = new BeEvent();
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        ivaultChanged: evt,
        hierarchyDefinition: {
          async defineHierarchyLevel() {
            return [];
          },
        },
      });
      expect(evt.numberOfListeners).toBe(1);
      provider[Symbol.dispose]();
      expect(evt.numberOfListeners).toBe(0);
    });

    it("raises `hierarchyChanged` event on `ivaultChanged` event", () => {
      const evt = new BeEvent();
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        ivaultChanged: evt,
        hierarchyDefinition: {
          async defineHierarchyLevel() {
            return [];
          },
        },
      });
      const spy = vi.fn();
      provider.hierarchyChanged.addListener(spy);

      evt.raiseEvent();
      expect(spy).toHaveBeenCalledOnce();
    });
  });

  describe("Custom parsing", async () => {
    it("calls hierarchy definition factory parser if supplied", async () => {
      const node: SourceInstanceHierarchyNode = {
        key: { type: "instances", instanceKeys: [{ className: "a.b", id: "0x123" }] },
        label: "test",
        children: false,
      };
      const parserMock = vi.fn().mockReturnValue(node);
      const parser: NodeParser = parserMock;
      const row: RowDef = {
        [NodeSelectClauseColumnNames.FullClassName]: "a.b",
        [NodeSelectClauseColumnNames.DMInstanceId]: "0x123",
        [NodeSelectClauseColumnNames.DisplayLabel]: "test label",
      };
      ivaultAccess.createQueryReader.mockReturnValue(createAsyncIterator([row]));
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          parseNode: parser,
          async defineHierarchyLevel({ parentNode }) {
            if (!parentNode) {
              return [{ fullClassName: "x.y", query: { dmsql: "QUERY" } }];
            }
            return [];
          },
        },
      });
      const nodes = await collect(provider.getNodes({ parentNode: undefined }));
      expect(parserMock).toHaveBeenCalledOnce();
      expect(parserMock.mock.calls[0][0]).toEqual(row);
      expect(nodes).toEqual([
        {
          ...node,
          key: { ...node.key, instanceKeys: node.key.instanceKeys.map((k) => ({ ...k, ivaultKey: "test-ivault" })) },
          parentKeys: [],
        },
      ]);
    });

    it("calls hierarchy definition factory parser that returns a promise if supplied", async () => {
      const node: SourceInstanceHierarchyNode = {
        key: { type: "instances", instanceKeys: [{ className: "a.b", id: "0x123" }] },
        label: "test",
        children: false,
      };
      const parserMock2 = vi.fn().mockResolvedValue(node);
      const parser: NodeParser = parserMock2;
      const row: RowDef = {
        [NodeSelectClauseColumnNames.FullClassName]: "a.b",
        [NodeSelectClauseColumnNames.DMInstanceId]: "0x123",
        [NodeSelectClauseColumnNames.DisplayLabel]: "test label",
      };
      ivaultAccess.createQueryReader.mockReturnValue(createAsyncIterator([row]));
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          parseNode: parser,
          async defineHierarchyLevel({ parentNode }) {
            if (!parentNode) {
              return [{ fullClassName: "x.y", query: { dmsql: "QUERY" } }];
            }
            return [];
          },
        },
      });
      const nodes = await collect(provider.getNodes({ parentNode: undefined }));
      expect(parserMock2).toHaveBeenCalledOnce();
      expect(parserMock2.mock.calls[0][0]).toEqual(row);
      expect(nodes).toEqual([
        {
          ...node,
          key: { ...node.key, instanceKeys: node.key.instanceKeys.map((k) => ({ ...k, ivaultKey: "test-ivault" })) },
          parentKeys: [],
        },
      ]);
    });
  });

  describe("Custom processing", () => {
    class TestHierarchyDefinition implements HierarchyDefinition {
      public async preProcessNode<TNode>(node: TNode) {
        return { ...node, isPreprocessed: true };
      }
      public async postProcessNode(node: ProcessedHierarchyNode) {
        return { ...node, isPostprocessed: true };
      }
      public async defineHierarchyLevel({ parentNode }: DefineHierarchyLevelProps) {
        if (!parentNode) {
          return [{ node: createTestSourceGenericNode() }];
        }
        return [];
      }
    }

    describe("Pre-processing", async () => {
      it("calls hierarchy definition factory pre-processor if supplied", async () => {
        const node = createTestSourceGenericNode();
        // const preprocess = vi.fn().mockResolvedValue({ ...node, isPreprocessed: true });
        using provider = createIVaultHierarchyProvider({
          ivaultAccess,
          hierarchyDefinition: {
            preProcessNode: async (n) => ({ ...n, isPreprocessed: true }),
            async defineHierarchyLevel({ parentNode }) {
              if (!parentNode) {
                return [{ node }];
              }
              return [];
            },
          },
        });
        const nodes = await collect(provider.getNodes({ parentNode: undefined }));
        expect(nodes).toHaveLength(1);
        expect(nodes).toEqual(expect.arrayContaining([expect.objectContaining({ isPreprocessed: true })]));
      });

      it("removes node from hierarchy if pre-processor returns `undefined`", async () => {
        const node = createTestSourceGenericNode();
        const preprocess = vi.fn().mockResolvedValue(undefined);
        using provider = createIVaultHierarchyProvider({
          ivaultAccess,
          hierarchyDefinition: {
            preProcessNode: preprocess,
            async defineHierarchyLevel({ parentNode }) {
              if (!parentNode) {
                return [{ node }];
              }
              return [];
            },
          },
        });
        const nodes = await collect(provider.getNodes({ parentNode: undefined }));
        expect(preprocess).toHaveBeenCalledExactlyOnceWith({
          ...node,
          key: createTestGenericNodeKey({ source: ivaultAccess.ivaultKey }),
          parentKeys: [],
        });
        expect(nodes).toEqual([]);
      });

      it("keeps `this` context", async () => {
        const definition = new TestHierarchyDefinition();
        const preprocessSpy = vi.spyOn(definition, "preProcessNode");
        using provider = createIVaultHierarchyProvider({ ivaultAccess, hierarchyDefinition: definition });
        await collect(provider.getNodes({ parentNode: undefined }));
        expect(preprocessSpy).toHaveBeenCalledOnce();
        expect(preprocessSpy.mock.contexts[0]).toBe(definition);
      });
    });

    describe("Post-processing", async () => {
      it("calls hierarchy definition factory post-processor if supplied", async () => {
        const node = createTestSourceGenericNode();
        const postprocess = vi.fn().mockResolvedValue({ ...node, isPostprocessed: true });
        using provider = createIVaultHierarchyProvider({
          ivaultAccess,
          hierarchyDefinition: {
            postProcessNode: postprocess,
            async defineHierarchyLevel({ parentNode }) {
              if (!parentNode) {
                return [{ node }];
              }
              return [];
            },
          },
        });
        const nodes = await collect(provider.getNodes({ parentNode: undefined }));
        expect(postprocess).toHaveBeenCalledExactlyOnceWith({
          ...node,
          key: createTestGenericNodeKey({ source: ivaultAccess.ivaultKey }),
          parentKeys: [],
          children: false,
        });
        expect(nodes).toHaveLength(1);
        expect(nodes).toEqual(expect.arrayContaining([expect.objectContaining({ isPostprocessed: true })]));
      });

      it("keeps `this` context", async () => {
        const definition = new TestHierarchyDefinition();
        const postprocessSpy = vi.spyOn(definition, "postProcessNode");
        using provider = createIVaultHierarchyProvider({ ivaultAccess, hierarchyDefinition: definition });
        await collect(provider.getNodes({ parentNode: undefined }));
        expect(postprocessSpy).toHaveBeenCalledOnce();
        expect(postprocessSpy.mock.contexts[0]).toBe(definition);
      });
    });
  });

  describe("Grouping", () => {
    it("returns grouping node children", async () => {
      const propertyClass = ivaultAccess.stubEntityClass({
        schemaName: "a",
        className: "b",
        properties: [
          {
            name: "MyProperty",
            primitiveType: "Integer",
            isPrimitive: () => true,
            isNavigation: () => false,
          } as unknown as DM.PrimitiveProperty,
        ],
      });
      ivaultAccess.createQueryReader.mockReturnValue(
        createAsyncIterator<RowDef>([
          {
            [NodeSelectClauseColumnNames.FullClassName]: "a.b",
            [NodeSelectClauseColumnNames.DMInstanceId]: "0x123",
            [NodeSelectClauseColumnNames.DisplayLabel]: "test label",
            [NodeSelectClauseColumnNames.Grouping]: JSON.stringify({
              byProperties: {
                propertiesClassName: propertyClass.fullName,
                propertyGroups: [{ propertyName: "MyProperty", propertyValue: 123 }],
              },
            } satisfies InstanceHierarchyNodeProcessingParams["grouping"]),
          },
        ]),
      );
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel({ parentNode }) {
            if (!parentNode) {
              return [{ fullClassName: "a.b", query: { dmsql: "QUERY" } }];
            }
            return [];
          },
        },
      });

      const rootNodes = await collect(provider.getNodes({ parentNode: undefined }));
      const expectedKey: GroupingNodeKey = {
        type: "property-grouping:value",
        propertyClassName: propertyClass.fullName,
        propertyName: "MyProperty",
        formattedPropertyValue: "123",
      };
      expect(rootNodes).toEqual([
        {
          key: expectedKey,
          parentKeys: [],
          groupedInstanceKeys: [{ className: "a.b", id: "0x123", ivaultKey: "test-ivault" }],
          label: "123",
          children: true,
        } satisfies GroupingHierarchyNode,
      ]);

      const childNodes = await collect(provider.getNodes({ parentNode: rootNodes[0] }));
      expect(childNodes).toEqual([
        {
          key: { type: "instances", instanceKeys: [{ className: "a.b", id: "0x123", ivaultKey: "test-ivault" }] },
          parentKeys: [expectedKey],
          label: "test label",
          children: false,
        } satisfies HierarchyNode,
      ]);
    });
  });

  describe("Hiding hierarchy levels", () => {
    it("hides root hierarchy level", async () => {
      const rootNode = createTestSourceGenericNode({ key: "root", processingParams: { hideInHierarchy: true } });
      const childNode = createTestSourceGenericNode({ key: "visible child" });
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel({ parentNode }) {
            if (!parentNode) {
              return [{ node: rootNode }];
            }
            if (HierarchyNode.isGeneric(parentNode) && parentNode.key.id === "root") {
              return [{ node: childNode }];
            }
            return [];
          },
        },
      });
      const rootNodes = await collect(provider.getNodes({ parentNode: undefined }));
      expect(rootNodes).toEqual([
        {
          ...childNode,
          key: createTestGenericNodeKey({ id: "visible child", source: ivaultAccess.ivaultKey }),
          parentKeys: [createTestGenericNodeKey({ id: "root", source: ivaultAccess.ivaultKey })],
          children: false,
        },
      ]);
    });

    it("determines children when immediate child node is hidden", async () => {
      const rootNode = createTestSourceGenericNode({ key: "root" });
      const hiddenChildNode = createTestSourceGenericNode({
        key: "hidden child",
        processingParams: { hideInHierarchy: true },
      });
      const visibleChildNode = createTestSourceGenericNode({ key: "visible child" });
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel({ parentNode }) {
            if (!parentNode) {
              return [{ node: rootNode }];
            }
            if (HierarchyNode.isGeneric(parentNode) && parentNode.key.id === "root") {
              return [{ node: hiddenChildNode }];
            }
            if (HierarchyNode.isGeneric(parentNode) && parentNode.key.id === "hidden child") {
              return [{ node: visibleChildNode }];
            }
            return [];
          },
        },
      });
      const rootNodes = await collect(provider.getNodes({ parentNode: undefined }));
      expect(rootNodes).toEqual([
        {
          ...rootNode,
          key: createTestGenericNodeKey({ id: "root", source: ivaultAccess.ivaultKey }),
          parentKeys: [],
          children: true,
        },
      ]);
      const childNodes = await collect(provider.getNodes({ parentNode: rootNodes[0] }));
      expect(childNodes).toEqual([
        {
          ...visibleChildNode,
          key: createTestGenericNodeKey({ id: "visible child", source: ivaultAccess.ivaultKey }),
          parentKeys: [
            createTestGenericNodeKey({ id: "root", source: ivaultAccess.ivaultKey }),
            createTestGenericNodeKey({ id: "hidden child", source: ivaultAccess.ivaultKey }),
          ],
          children: false,
        },
      ]);
    });

    // note: the feature of not checking children for nodes that say they do have them is very important for performance - this test
    // should not be removed
    it("doesn't load children of hidden child node when determining parent's children if the hidden child says it always has children", async () => {
      const rootNode = createTestSourceGenericNode({ key: "root" });
      const hiddenChildNode = createTestSourceGenericNode({
        key: "hidden child",
        processingParams: { hideInHierarchy: true },
        children: true,
      });
      const visibleChildNode = createTestSourceGenericNode({ key: "visible child" });
      const hierarchyDefinition = {
        defineHierarchyLevel: vi.fn().mockImplementation(async ({ parentNode }) => {
          if (!parentNode) {
            return [{ node: rootNode }];
          }
          if (HierarchyNode.isGeneric(parentNode) && parentNode.key.id === "root") {
            return [{ node: hiddenChildNode }];
          }
          if (HierarchyNode.isGeneric(parentNode) && parentNode.key.id === "hidden child") {
            return [{ node: visibleChildNode }];
          }
          return [];
        }),
      };
      using provider = createIVaultHierarchyProvider({ ivaultAccess, hierarchyDefinition });
      const rootNodes = await collect(provider.getNodes({ parentNode: undefined }));
      expect(rootNodes).toEqual([
        {
          ...rootNode,
          key: createTestGenericNodeKey({ id: "root", source: ivaultAccess.ivaultKey }),
          parentKeys: [],
          children: true,
        },
      ]);
      expect(hierarchyDefinition.defineHierarchyLevel).toHaveBeenCalledTimes(2);
      expect(hierarchyDefinition.defineHierarchyLevel).toHaveBeenNthCalledWith(1, { parentNode: undefined });
      expect(hierarchyDefinition.defineHierarchyLevel).toHaveBeenNthCalledWith(2, { parentNode: rootNodes[0] });
    });
  });

  describe("Hiding nodes without children", () => {
    it("hides node without children", async () => {
      const rootNode = createTestSourceGenericNode({ key: "root" });
      const hiddenChildNode = createTestSourceGenericNode({
        key: "hidden child",
        processingParams: { hideIfNoChildren: true },
      });
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel({ parentNode }) {
            if (!parentNode) {
              return [{ node: rootNode }];
            }
            if (HierarchyNode.isGeneric(parentNode) && parentNode.key.id === "root") {
              return [{ node: hiddenChildNode }];
            }
            return [];
          },
        },
      });
      const rootNodes = await collect(provider.getNodes({ parentNode: undefined }));
      expect(rootNodes).toEqual([
        {
          ...rootNode,
          key: createTestGenericNodeKey({ id: "root", source: ivaultAccess.ivaultKey }),
          parentKeys: [],
          children: false,
        },
      ]);
      const childNodes = await collect(provider.getNodes({ parentNode: rootNodes[0] }));
      expect(childNodes).toEqual([]);
    });

    it("doesn't hide node with children", async () => {
      const rootNode = createTestSourceGenericNode({ key: "root" });
      const hiddenChildNode = createTestSourceGenericNode({
        key: "hidden child",
        processingParams: { hideIfNoChildren: true },
      });
      const grandChildNode = createTestSourceGenericNode({ key: "grand child", children: false });
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel({ parentNode }) {
            if (!parentNode) {
              return [{ node: rootNode }];
            }
            if (HierarchyNode.isGeneric(parentNode) && parentNode.key.id === "root") {
              return [{ node: hiddenChildNode }];
            }
            if (HierarchyNode.isGeneric(parentNode) && parentNode.key.id === "hidden child") {
              return [{ node: grandChildNode }];
            }
            return [];
          },
        },
      });
      const rootNodes = await collect(provider.getNodes({ parentNode: undefined }));
      expect(rootNodes).toEqual([
        {
          ...rootNode,
          key: createTestGenericNodeKey({ id: "root", source: ivaultAccess.ivaultKey }),
          parentKeys: [],
          children: true,
        },
      ]);
      const childNodes = await collect(provider.getNodes({ parentNode: rootNodes[0] }));
      expect(childNodes).toEqual([
        omit(
          {
            ...hiddenChildNode,
            key: createTestGenericNodeKey({ id: "hidden child", source: ivaultAccess.ivaultKey }),
            parentKeys: [createTestGenericNodeKey({ id: "root", source: ivaultAccess.ivaultKey })],
            children: true,
          },
          ["processingParams"],
        ),
      ]);
      const grandChildNodes = await collect(provider.getNodes({ parentNode: childNodes[0] }));
      expect(grandChildNodes).toEqual([
        {
          ...grandChildNode,
          key: createTestGenericNodeKey({ id: "grand child", source: ivaultAccess.ivaultKey }),
          parentKeys: [
            createTestGenericNodeKey({ id: "root", source: ivaultAccess.ivaultKey }),
            createTestGenericNodeKey({ id: "hidden child", source: ivaultAccess.ivaultKey }),
          ],
          children: false,
        },
      ]);
    });
  });

  describe("Labels formatting", () => {
    it("returns formatted label", async () => {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      const formatter = vi.fn().mockImplementation(async (v: TypedPrimitiveValue) => `_${v.value.toString()}_`);
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel() {
            return [{ node: createTestSourceGenericNode({ label: "test label", children: false }) }];
          },
        },
        formatter,
      });
      const rootNodes = await collect(provider.getNodes({ parentNode: undefined }));
      expect(formatter).toHaveBeenCalledExactlyOnceWith({ value: "test label", type: "String" });
      expect(rootNodes[0].label).toBe("_test label_");
    });
  });

  describe("Hierarchy filtering", () => {
    it("triggers `hierarchyChanged` event when filter is set", () => {
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel() {
            return [];
          },
        },
      });

      const hierarchyChangedListener = vi.fn();
      provider.hierarchyChanged.addListener(hierarchyChangedListener);

      // setting a filter should trigger `hierarchyChangedListener`
      const filter = { paths: [] };
      provider.setHierarchyFilter(filter);
      expect(hierarchyChangedListener).toHaveBeenCalledExactlyOnceWith({ filterChange: { newFilter: filter } });
      hierarchyChangedListener.mockClear();

      // setting to `undefined` should trigger `hierarchyChangedListener`
      provider.setHierarchyFilter(undefined);
      expect(hierarchyChangedListener).toHaveBeenCalledExactlyOnceWith({ filterChange: { newFilter: undefined } });
    });

    it("applies filtering on query definitions", async () => {
      ivaultAccess.stubEntityClass({
        schemaName: "a",
        className: "b",
        is: async (fullClassName) => fullClassName === "a.b",
      });

      ivaultAccess.createQueryReader.mockImplementation(() =>
        createAsyncIterator<
          RowDef & { [DMSQL_COLUMN_NAME_FilterDMInstanceId]: string; [DMSQL_COLUMN_NAME_FilterClassName]: string }
        >([
          {
            [NodeSelectClauseColumnNames.FullClassName]: "a.b",
            [NodeSelectClauseColumnNames.DMInstanceId]: "0x123",
            [NodeSelectClauseColumnNames.DisplayLabel]: "test label",
            [DMSQL_COLUMN_NAME_FilterDMInstanceId]: "0x123",
            [DMSQL_COLUMN_NAME_FilterClassName]: "a.b",
          },
        ]),
      );
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel({ parentNode }) {
            if (!parentNode) {
              return [{ fullClassName: "a.b", query: { dmsql: "QUERY" } }];
            }
            return [];
          },
        },
        filtering: {
          paths: [
            [
              { className: "a.b", id: "0x123" },
              { className: "c.d", id: "0x456" },
            ],
          ],
        },
      });
      let nodes = await collect(provider.getNodes({ parentNode: undefined }));
      expect(ivaultAccess.createQueryReader).toHaveBeenCalledOnce();
      {
        const [filteringQueryArg, filteringOptionsArg] = ivaultAccess.createQueryReader.mock.calls[0];
        expect(trimWhitespace((filteringQueryArg as any).ctes[0])).toBe(
          trimWhitespace(
            `
                FilteringInfo(DMInstanceId, FilterClassName) AS (
                SELECT
                  DMInstanceId,
                  'a.b' AS FilterClassName
                FROM
                  a.b
                WHERE
                  DMInstanceId IN (0x123)
              )`,
          ),
        );
        expect(trimWhitespace((filteringQueryArg as any).dmsql)).toBe(
          trimWhitespace(
            `
                SELECT
                    [q].*,
                    IdToHex([f].[DMInstanceId]) AS [${DMSQL_COLUMN_NAME_FilterDMInstanceId}],
                    [f].[FilterClassName] AS [${DMSQL_COLUMN_NAME_FilterClassName}]
                  FROM (QUERY) [q]
                  JOIN FilteringInfo [f] ON [f].[DMInstanceId] = [q].[DMInstanceId]
                `,
          ),
        );
        expect(filteringOptionsArg).toEqual(
          expect.objectContaining({ rowFormat: "DMSqlPropertyNames", restartToken: expect.any(String) }),
        );
      }
      expect(nodes).toEqual([
        {
          key: { type: "instances", instanceKeys: [{ className: "a.b", id: "0x123", ivaultKey: "test-ivault" }] },
          parentKeys: [],
          label: "test label",
          children: false,
          filtering: {
            filteredChildrenIdentifierPaths: [{ path: [{ className: "c.d", id: "0x456" }], options: undefined }],
          },
        },
      ]);

      // reset the filter and confirm the query is not filtered anymore
      provider.setHierarchyFilter(undefined);
      ivaultAccess.createQueryReader.mockClear();
      nodes = await collect(provider.getNodes({ parentNode: undefined }));
      expect(ivaultAccess.createQueryReader).toHaveBeenCalledOnce();
      {
        const [unfilteredQueryArg, unfilteredOptionsArg] = ivaultAccess.createQueryReader.mock.calls[0];
        expect((unfilteredQueryArg as any).dmsql).toBe("QUERY");
        expect(unfilteredOptionsArg).toEqual(
          expect.objectContaining({ rowFormat: "DMSqlPropertyNames", restartToken: expect.any(String) }),
        );
      }
      expect(nodes).toEqual([
        {
          key: { type: "instances", instanceKeys: [{ className: "a.b", id: "0x123", ivaultKey: "test-ivault" }] },
          parentKeys: [],
          label: "test label",
          children: false,
        },
      ]);
    });

    it("applies child nodes filter when hierarchy filter is set in-between requests", async () => {
      ivaultAccess.stubEntityClass({
        schemaName: "a",
        className: "b",
        is: async (fullClassName) => fullClassName === "a.b",
      });
      ivaultAccess.stubEntityClass({
        schemaName: "c",
        className: "d",
        is: async (fullClassName) => fullClassName === "c.d",
      });

      const rootNodePromise = new ResolvablePromise<
        RowDef & { [DMSQL_COLUMN_NAME_FilterDMInstanceId]: string; [DMSQL_COLUMN_NAME_FilterClassName]: string }
      >();
      const childNodePromise = new ResolvablePromise<
        RowDef & { [DMSQL_COLUMN_NAME_FilterDMInstanceId]: string; [DMSQL_COLUMN_NAME_FilterClassName]: string }
      >();
      ivaultAccess.createQueryReader.mockImplementation(async function* ({ dmsql, ctes }) {
        if (dmsql.includes("ROOT QUERY")) {
          yield await rootNodePromise;
          return;
        }
        if (dmsql.includes("CHILDREN QUERY")) {
          // ctes is empty for non-filtered case and has one item for filtered case
          if (!ctes?.length) {
            yield await childNodePromise;
          }
          return;
        }
      });
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel({ parentNode }) {
            if (!parentNode) {
              return [{ fullClassName: "a.b", query: { dmsql: "ROOT QUERY" } }];
            }
            return [{ fullClassName: "a.b", query: { dmsql: "CHILDREN QUERY" } }];
          },
        },
      });

      // request non-filtered root nodes
      const unfilteredRootNodeIter = provider.getNodes({ parentNode: undefined }).next();
      await waitFor(() => expect(ivaultAccess.createQueryReader).toHaveBeenCalledOnce());

      // set the filter and request filtered nodes AFTER the root node query has been executed
      provider.setHierarchyFilter({
        paths: [
          [
            { className: "a.b", id: "0x123" },
            { className: "c.d", id: "0x456" },
          ],
        ],
      });
      const filteredRootNodeIter = provider.getNodes({ parentNode: undefined }).next();

      // all requests are made in correct order, now resolve the responses
      await rootNodePromise.resolve({
        [NodeSelectClauseColumnNames.FullClassName]: "a.b",
        [NodeSelectClauseColumnNames.DMInstanceId]: "0x123",
        [NodeSelectClauseColumnNames.DisplayLabel]: "ab",
        [DMSQL_COLUMN_NAME_FilterDMInstanceId]: "0x123",
        [DMSQL_COLUMN_NAME_FilterClassName]: "a.b",
      });
      await childNodePromise.resolve({
        [NodeSelectClauseColumnNames.FullClassName]: "c.d",
        [NodeSelectClauseColumnNames.DMInstanceId]: "0x456",
        [NodeSelectClauseColumnNames.DisplayLabel]: "cd",
        [DMSQL_COLUMN_NAME_FilterDMInstanceId]: "0x456",
        [DMSQL_COLUMN_NAME_FilterClassName]: "c.d",
      });

      // setting instance filter while a nodes request is in progress cancels the request - ensure we get undefined
      const unfilteredRootNode = (await unfilteredRootNodeIter).value;
      expect(unfilteredRootNode).toBeUndefined();

      // ensure the filtered node resolves with `children: false` and has filtering props
      const filteredRootNode = (await filteredRootNodeIter).value;
      expect(filteredRootNode).toMatchObject({
        key: { type: "instances", instanceKeys: [{ className: "a.b", id: "0x123" }] },
        children: false,
        filtering: {
          filteredChildrenIdentifierPaths: [{ path: [{ className: "c.d", id: "0x456" }], options: undefined }],
        },
      });

      // ensure requesting children for the filtered node returns empty list
      const filteredChildren = await collect(provider.getNodes({ parentNode: filteredRootNode }));
      expect(filteredChildren).toHaveLength(0);
    });

    it("applies grouped nodes filter when hierarchy filter is set in-between requests", async () => {
      ivaultAccess.stubEntityClass({
        schemaName: "a",
        className: "b",
        is: async (fullClassName) => fullClassName === "a.b",
      });

      const rootNodePromise = new ResolvablePromise<RowDef>();
      ivaultAccess.createQueryReader.mockImplementation(async function* ({ dmsql, ctes }) {
        if (dmsql.includes("ROOT QUERY")) {
          yield {
            [NodeSelectClauseColumnNames.FullClassName]: "a.b",
            [NodeSelectClauseColumnNames.DMInstanceId]: "0x456",
            [NodeSelectClauseColumnNames.DisplayLabel]: "ab",
            [NodeSelectClauseColumnNames.Grouping]: JSON.stringify({
              byLabel: true,
            } satisfies InstanceHierarchyNodeProcessingParams["grouping"]),
          };

          // ctes is empty for non-filtered case and has one item for filtered case
          if (!ctes?.length) {
            yield await rootNodePromise;
          }
          return;
        }
      });
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel({ parentNode }) {
            if (!parentNode) {
              return [{ fullClassName: "a.b", query: { dmsql: "ROOT QUERY" } }];
            }
            return [];
          },
        },
      });

      // request non-filtered root nodes
      const unfilteredRootNodeIter = provider.getNodes({ parentNode: undefined }).next();
      await waitFor(() => expect(ivaultAccess.createQueryReader).toHaveBeenCalledOnce());

      // set the filter and request filtered nodes AFTER the root node query has been executed
      provider.setHierarchyFilter({ paths: [[{ className: "a.b", id: "0x456" }]] });
      const filteredRootNodeIter = provider.getNodes({ parentNode: undefined }).next();

      // all requests are made in correct order, now resolve the responses
      await rootNodePromise.resolve({
        [NodeSelectClauseColumnNames.FullClassName]: "a.b",
        [NodeSelectClauseColumnNames.DMInstanceId]: "0x123",
        [NodeSelectClauseColumnNames.DisplayLabel]: "ab",
        [NodeSelectClauseColumnNames.Grouping]: JSON.stringify({
          byLabel: true,
        } satisfies InstanceHierarchyNodeProcessingParams["grouping"]),
      });

      // setting instance filter while a nodes request is in progress cancels the request - ensure we get undefined
      const unfilteredRootNode = (await unfilteredRootNodeIter).value;
      expect(unfilteredRootNode).toBeUndefined();

      // ensure we do get the filtered grouping node
      const filteredRootNode = (await filteredRootNodeIter).value;
      expect(filteredRootNode).toMatchObject({
        key: { type: "label-grouping", label: "ab" },
      } satisfies Partial<HierarchyNode>);

      // ensure requesting children for the filtered node returns one grouped node
      expect(await collect(provider.getNodes({ parentNode: filteredRootNode }))).toHaveLength(1);
    });
  });

  describe("Hierarchy level filtering", () => {
    const instanceFilter: GenericInstanceFilter = {
      propertyClassNames: ["x.y"],
      relatedInstances: [],
      rules: {
        operator: "and",
        rules: [
          {
            propertyName: "z",
            propertyTypeName: "string",
            sourceAlias: "this",
            operator: "is-equal",
            value: { rawValue: "test value", displayValue: "test value" },
          },
        ],
      },
    };

    it("filters hierarchy levels with nodes that are hidden if no children", async () => {
      const rootNode = createTestSourceGenericNode({ key: "root", processingParams: { hideIfNoChildren: true } });
      const childNode = createTestSourceGenericNode({ key: "child", children: true });
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel({ parentNode, instanceFilter: requestedFilter }) {
            if (!parentNode) {
              // simulate the root node matching requested instance filter
              expect(requestedFilter).toBe(instanceFilter);
              return [{ node: rootNode }];
            }
            if (HierarchyNode.isGeneric(parentNode) && parentNode.key.id === "root") {
              // we're expecting the filter to be used only for root nodes
              expect(requestedFilter).toBeUndefined();
              return requestedFilter ? [] : [{ node: childNode }];
            }
            return [];
          },
        },
      });
      const rootNodes = await collect(provider.getNodes({ parentNode: undefined, instanceFilter }));
      expect(rootNodes).toEqual([
        createTestGenericNode({
          key: createTestGenericNodeKey({ id: "root", source: ivaultAccess.ivaultKey }),
          children: true,
        }),
      ]);
    });
  });

  describe("Hierarchy level instance keys", () => {
    const instanceFilter: GenericInstanceFilter = {
      propertyClassNames: ["x.y"],
      relatedInstances: [],
      rules: {
        operator: "and",
        rules: [
          {
            propertyName: "z",
            propertyTypeName: "string",
            sourceAlias: "this",
            operator: "is-equal",
            value: { rawValue: "test value", displayValue: "test value" },
          },
        ],
      },
    };

    it("returns grouped instance keys for parent grouping node", async () => {
      const groupingNode: GroupingHierarchyNode = {
        key: { type: "class-grouping", className: "x.y" },
        parentKeys: [],
        label: "test",
        children: true,
        groupedInstanceKeys: [
          { className: "a.b", id: "0x1" },
          { className: "c.d", id: "0x2" },
        ],
      };
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel() {
            return [];
          },
        },
      });
      const keys = await collect(provider.getNodeInstanceKeys({ parentNode: groupingNode }));
      expect(keys).toEqual(groupingNode.groupedInstanceKeys);
    });

    it("returns empty list for parent generic node", async () => {
      const genericNode = createTestSourceGenericNode({ key: "custom", label: "test", children: false });
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel({ parentNode }) {
            if (!parentNode) {
              return [{ node: genericNode }];
            }
            return [];
          },
        },
      });
      const keys = await collect(provider.getNodeInstanceKeys({ parentNode: undefined }));
      expect(keys).toHaveLength(0);
    });

    it("returns instance nodes' keys", async () => {
      ivaultAccess.createQueryReader.mockReturnValue(
        createAsyncIterator([
          { [0]: "a.b", [1]: "0x123", [2]: false },
          { [0]: "c:d", [1]: "0x456", [2]: false },
        ]),
      );
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel({ parentNode }) {
            if (!parentNode) {
              return [{ fullClassName: "x.y", query: { dmsql: "query" } }];
            }
            return [];
          },
        },
      });
      const keys = await collect(provider.getNodeInstanceKeys({ parentNode: undefined }));
      expect(keys).toHaveLength(2);
      expect(keys).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ className: "a.b", id: "0x123" }),
          expect.objectContaining({ className: "c.d", id: "0x456" }),
        ]),
      );
    });

    it("returns child instance nodes' keys of hidden custom node", async () => {
      const customNode = {
        key: "custom",
        parentKeys: [],
        label: "test",
        children: false,
        processingParams: { hideInHierarchy: true },
      };
      ivaultAccess.createQueryReader.mockReturnValue(createAsyncIterator([{ [0]: "a.b", [1]: "0x123", [2]: false }]));
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel({ parentNode }) {
            if (!parentNode) {
              return [{ node: customNode }];
            }
            if (HierarchyNode.isGeneric(parentNode) && parentNode.key.id === "custom") {
              return [{ fullClassName: "x.y", query: { dmsql: "query" } }];
            }
            return [];
          },
        },
      });
      const keys = await collect(provider.getNodeInstanceKeys({ parentNode: undefined }));
      expect(keys).toHaveLength(1);
      expect(keys).toEqual(expect.arrayContaining([expect.objectContaining({ className: "a.b", id: "0x123" })]));
    });

    it("returns child instance nodes' keys of hidden instance node", async () => {
      ivaultAccess.createQueryReader.mockReturnValueOnce(
        createAsyncIterator([{ [0]: "a.b", [1]: "0x123", [2]: true }]),
      );
      ivaultAccess.createQueryReader.mockReturnValueOnce(
        createAsyncIterator([{ [0]: "c.d", [1]: "0x456", [2]: false }]),
      );
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel({ parentNode }) {
            if (!parentNode) {
              return [{ fullClassName: "x.y", query: { dmsql: "root" } }];
            }
            if (
              HierarchyNode.isInstancesNode(parentNode) &&
              parentNode.key.instanceKeys.some((k) => k.className === "a.b")
            ) {
              return [{ fullClassName: "x.y", query: { dmsql: "child" } }];
            }
            return [];
          },
        },
      });
      const keys = await collect(provider.getNodeInstanceKeys({ parentNode: undefined }));
      expect(keys).toHaveLength(1);
      expect(keys).toEqual(expect.arrayContaining([expect.objectContaining({ className: "c.d", id: "0x456" })]));
    });

    it("merges same-class instance keys under a single parent node when requesting child node keys for hidden parent instance nodes", async () => {
      ivaultAccess.createQueryReader.mockReturnValueOnce(
        createAsyncIterator([
          { [0]: "a.b", [1]: "0x123", [2]: true },
          { [0]: "a.b", [1]: "0x456", [2]: true },
        ]),
      );
      ivaultAccess.createQueryReader.mockReturnValueOnce(
        createAsyncIterator([{ [0]: "c.d", [1]: "0x789", [2]: false }]),
      );
      const hierarchyDefinition = {
        defineHierarchyLevel: vi.fn().mockImplementation(async ({ parentNode }: DefineHierarchyLevelProps) => {
          if (!parentNode) {
            return [{ fullClassName: "x.y", query: { dmsql: "root" } }];
          }
          if (
            HierarchyNode.isInstancesNode(parentNode) &&
            parentNode.key.instanceKeys.some((k) => k.className === "a.b")
          ) {
            return [{ fullClassName: "x.y", query: { dmsql: "child" } }];
          }
          return [];
        }),
      };
      using provider = createIVaultHierarchyProvider({ ivaultAccess, hierarchyDefinition });
      const keys = await collect(provider.getNodeInstanceKeys({ parentNode: undefined }));
      expect(keys).toHaveLength(1);
      expect(keys).toEqual(expect.arrayContaining([expect.objectContaining({ className: "c.d", id: "0x789" })]));
      expect(hierarchyDefinition.defineHierarchyLevel).toHaveBeenCalledTimes(2);
      {
        const secondCallArg = hierarchyDefinition.defineHierarchyLevel.mock.calls[1][0] as DefineHierarchyLevelProps;
        expect(secondCallArg.parentNode).toBeTruthy();
        expect(HierarchyNode.isInstancesNode(secondCallArg.parentNode!)).toBe(true);
        expect((secondCallArg.parentNode as any).key.instanceKeys).toHaveLength(2);
        expect(
          InstanceKey.equals((secondCallArg.parentNode as any).key.instanceKeys[0], { className: "a.b", id: "0x123" }),
        ).toBe(true);
        expect(
          InstanceKey.equals((secondCallArg.parentNode as any).key.instanceKeys[1], { className: "a.b", id: "0x456" }),
        ).toBe(true);
      }
    });

    it("applies instance filter", async () => {
      ivaultAccess.createQueryReader.mockReturnValue(
        createAsyncIterator([
          { [0]: "a.b", [1]: "0x123", [2]: false },
          { [0]: "a.b", [1]: "0x456", [2]: false },
        ]),
      );
      const hierarchyDefinition = {
        defineHierarchyLevel: vi
          .fn()
          .mockImplementation(
            async ({ parentNode, instanceFilter: requestedInstanceFilter }: DefineHierarchyLevelProps) => {
              if (parentNode === undefined && requestedInstanceFilter) {
                return [{ fullClassName: "x.y", query: { dmsql: "root" } }];
              }
              return [];
            },
          ),
      };
      using provider = createIVaultHierarchyProvider({ ivaultAccess, hierarchyDefinition });
      const keys = await collect(provider.getNodeInstanceKeys({ parentNode: undefined, instanceFilter }));
      expect(keys).toHaveLength(2);
      expect(keys).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ className: "a.b", id: "0x123" }),
          expect.objectContaining({ className: "a.b", id: "0x456" }),
        ]),
      );
      expect(hierarchyDefinition.defineHierarchyLevel).toHaveBeenCalledOnce();
      {
        const firstCallArg = hierarchyDefinition.defineHierarchyLevel.mock.calls[0][0] as DefineHierarchyLevelProps;
        expect(firstCallArg.parentNode).toBeUndefined();
        expect(firstCallArg.instanceFilter).toBe(instanceFilter);
      }
    });

    it("applies hierarchy level size limit", async () => {
      ivaultAccess.createQueryReader.mockReturnValue(createAsyncIterator([{ [0]: "a.b", [1]: "0x123", [2]: false }]));
      const hierarchyDefinition = {
        defineHierarchyLevel: vi.fn().mockImplementation(async ({ parentNode }: DefineHierarchyLevelProps) => {
          if (parentNode === undefined) {
            return [{ fullClassName: "x.y", query: { dmsql: "root" } }];
          }
          return [];
        }),
      };
      using provider = createIVaultHierarchyProvider({ ivaultAccess, hierarchyDefinition });
      const keys = await collect(provider.getNodeInstanceKeys({ parentNode: undefined, hierarchyLevelSizeLimit: 1 }));
      expect(keys).toHaveLength(1);
      expect(keys).toEqual(expect.arrayContaining([expect.objectContaining({ className: "a.b", id: "0x123" })]));
      expect(hierarchyDefinition.defineHierarchyLevel).toHaveBeenCalledOnce();
      expect(ivaultAccess.createQueryReader).toHaveBeenCalledOnce();
      {
        const [, limitConfigArg] = ivaultAccess.createQueryReader.mock.calls[0];
        expect((limitConfigArg as any)?.limit).toBe(1);
      }
    });
  });

  describe("Error handling", () => {
    it("rethrows hierarchy definitions' factory errors", async () => {
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel() {
            throw new Error("test error");
          },
        },
      });
      await expect(provider.getNodes({ parentNode: undefined }).next()).rejects.toThrow("test error");
      await expect(provider.getNodeInstanceKeys({ parentNode: undefined }).next()).rejects.toThrow("test error");
    });

    it("rethrows query executor errors", async () => {
      ivaultAccess.createQueryReader.mockImplementation(() =>
        (async function* () {
          throw new Error("test error");
        })(),
      );
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel() {
            return [{ fullClassName: "x.y", query: { dmsql: "QUERY" } }];
          },
        },
      });
      await expect(provider.getNodes({ parentNode: undefined }).next()).rejects.toThrow("test error");
      await expect(provider.getNodeInstanceKeys({ parentNode: undefined }).next()).rejects.toThrow("test error");
    });

    it("rethrows query executor errors thrown while determining children", async () => {
      ivaultAccess.createQueryReader.mockImplementation(() =>
        (async function* () {
          throw new Error("test error");
        })(),
      );
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel({ parentNode }) {
            if (!parentNode) {
              return [{ node: createTestSourceGenericNode({ key: "root" }) }];
            }
            return [{ fullClassName: "x.y", query: { dmsql: "QUERY" } }];
          },
        },
      });
      await expect(provider.getNodes({ parentNode: undefined }).next()).rejects.toThrow("test error");
    });

    it("sets children flag on parent node to `true` when determining children throws with `rows limit exceeded` error", async () => {
      ivaultAccess.createQueryReader.mockImplementation(() =>
        (async function* () {
          throw new RowsLimitExceededError(123);
        })(),
      );
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel({ parentNode }) {
            if (!parentNode) {
              return [{ node: createTestSourceGenericNode({ key: "root" }) }];
            }
            return [{ fullClassName: "x.y", query: { dmsql: "QUERY" } }];
          },
        },
      });

      const rootNodes = await collect(provider.getNodes({ parentNode: undefined }));
      expect(rootNodes).toEqual([
        createTestGenericNode({
          key: createTestGenericNodeKey({ id: "root", source: ivaultAccess.ivaultKey }),
          children: true,
        }),
      ]);

      await expect(provider.getNodes({ parentNode: rootNodes[0] }).next()).rejects.toThrow(RowsLimitExceededError);
    });
  });

  describe("Caching", () => {
    it("doesn't query same root nodes more than once", async () => {
      ivaultAccess.createQueryReader.mockReturnValue(createAsyncIterator([]));
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel({ parentNode }) {
            if (!parentNode) {
              return [{ fullClassName: "x.y", query: { dmsql: "QUERY" } }];
            }
            return [];
          },
        },
        queryCacheSize: 10,
      });
      await collect(provider.getNodes({ parentNode: undefined }));
      await collect(provider.getNodes({ parentNode: undefined }));
      expect(ivaultAccess.createQueryReader).toHaveBeenCalledOnce();
    });

    it("doesn't query same child nodes more than once", async () => {
      ivaultAccess.createQueryReader.mockReturnValue(createAsyncIterator([]));
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel({ parentNode }) {
            if (!parentNode) {
              return [{ node: createTestSourceGenericNode({ key: "root" }) }];
            }
            if (HierarchyNode.isGeneric(parentNode) && parentNode.key.id === "root") {
              return [{ fullClassName: "x.y", query: { dmsql: "QUERY" } }];
            }
            return [];
          },
        },
        queryCacheSize: 10,
      });
      const rootNodes = await collect(provider.getNodes({ parentNode: undefined }));
      expect(rootNodes).toHaveLength(1);
      await collect(provider.getNodes({ parentNode: rootNodes[0] }));
      await collect(provider.getNodes({ parentNode: rootNodes[0] }));
      expect(ivaultAccess.createQueryReader).toHaveBeenCalledOnce();
    });

    it("queries the same nodes more than once when `queryCacheSize` is set to `0`", async () => {
      ivaultAccess.createQueryReader.mockReturnValue(createAsyncIterator([]));
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel({ parentNode }) {
            if (!parentNode) {
              return [{ fullClassName: "x.y", query: { dmsql: "QUERY" } }];
            }
            return [];
          },
        },
        queryCacheSize: 0,
      });
      await collect(provider.getNodes({ parentNode: undefined }));
      await collect(provider.getNodes({ parentNode: undefined }));
      expect(ivaultAccess.createQueryReader).toHaveBeenCalledTimes(2);
    });

    it("queries the same root nodes more than once when `ignoreCache` is set to true", async () => {
      ivaultAccess.createQueryReader.mockReturnValue(createAsyncIterator([]));
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel({ parentNode }) {
            if (!parentNode) {
              return [{ fullClassName: "x.y", query: { dmsql: "QUERY" } }];
            }
            return [];
          },
        },
        queryCacheSize: 10,
      });
      await collect(provider.getNodes({ parentNode: undefined }));
      await collect(provider.getNodes({ parentNode: undefined, ignoreCache: true }));
      expect(ivaultAccess.createQueryReader).toHaveBeenCalledTimes(2);
    });

    it("queries variations of the same hierarchy level", async () => {
      ivaultAccess.createQueryReader.mockReturnValue(createAsyncIterator([]));
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel({ parentNode, instanceFilter }) {
            if (!parentNode) {
              return [{ fullClassName: "x.y", query: { dmsql: `QUERY WHERE ${JSON.stringify(instanceFilter)}` } }];
            }
            return [];
          },
        },
        queryCacheSize: 10,
      });
      await collect(provider.getNodes({ parentNode: undefined }));
      await collect(provider.getNodes({ parentNode: undefined, instanceFilter: {} as GenericInstanceFilter })); // variation of previous, so should cause a query
      await collect(provider.getNodes({ parentNode: undefined, instanceFilter: {} as GenericInstanceFilter })); // same as previous, so this one one shouldn't cause a query
      expect(ivaultAccess.createQueryReader).toHaveBeenCalledTimes(2);
    });

    it("queries grouped instance nodes when requesting grouped children if the query is pushed-out of cache", async () => {
      ivaultAccess.stubEntityClass({ schemaName: "x", className: "y", classLabel: "Class Y" });
      ivaultAccess.createQueryReader.mockImplementation((query) => {
        if (query.dmsql.includes("ROOT")) {
          return createAsyncIterator<RowDef>([
            {
              [NodeSelectClauseColumnNames.FullClassName]: `x.y`,
              [NodeSelectClauseColumnNames.DMInstanceId]: `0x1`,
              [NodeSelectClauseColumnNames.DisplayLabel]: `one`,
              [NodeSelectClauseColumnNames.HasChildren]: true,
              [NodeSelectClauseColumnNames.Grouping]: JSON.stringify({
                byClass: true,
              } satisfies InstanceHierarchyNodeProcessingParams["grouping"]),
            },
          ]);
        } else if (query.dmsql.includes("CHILD")) {
          return createAsyncIterator<RowDef>([
            {
              [NodeSelectClauseColumnNames.FullClassName]: `x.y`,
              [NodeSelectClauseColumnNames.DMInstanceId]: `0x2`,
              [NodeSelectClauseColumnNames.DisplayLabel]: `two`,
              [NodeSelectClauseColumnNames.HasChildren]: false,
            },
          ]);
        }
        return createAsyncIterator([]);
      });
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel({ parentNode }) {
            if (!parentNode) {
              return [{ fullClassName: "x.y", query: { dmsql: "ROOT" } }];
            }
            if (parentNode.label === "one") {
              return [{ fullClassName: "x.y", query: { dmsql: "CHILD" } }];
            }
            return [];
          },
        },
        queryCacheSize: 1,
      });

      // requesting root nodes should query root instance nodes and return a class grouping node
      const groupingNodes = await collect(provider.getNodes({ parentNode: undefined }));
      expect(ivaultAccess.createQueryReader).toHaveBeenCalledOnce();
      expect(ivaultAccess.createQueryReader.mock.calls[0][0].dmsql).toBe("ROOT");
      expect(groupingNodes).toEqual([
        {
          key: { type: "class-grouping", className: "x.y" },
          groupedInstanceKeys: [{ className: "x.y", id: "0x1", ivaultKey: "test-ivault" }],
          parentKeys: [],
          label: "Class Y",
          children: true,
        } satisfies GroupingHierarchyNode,
      ]);

      // requesting children for the class grouping node shouldn't execute a query and should return the instance node
      const rootInstanceNodes = await collect(provider.getNodes({ parentNode: groupingNodes[0] }));
      expect(ivaultAccess.createQueryReader).toHaveBeenCalledOnce();
      expect(rootInstanceNodes).toEqual([
        {
          key: { type: "instances", instanceKeys: [{ className: "x.y", id: "0x1", ivaultKey: "test-ivault" }] },
          parentKeys: [{ type: "class-grouping", className: "x.y" }],
          label: "one",
          children: true,
        } as HierarchyNode,
      ]);
      ivaultAccess.createQueryReader.mockClear();

      // requesting children for the root instance node should push grouping node child instance nodes out of cache
      const childInstanceNodes = await collect(provider.getNodes({ parentNode: rootInstanceNodes[0] }));
      expect(ivaultAccess.createQueryReader).toHaveBeenCalledOnce();
      expect(ivaultAccess.createQueryReader.mock.calls[0][0].dmsql).toBe("CHILD");
      expect(childInstanceNodes).toEqual([
        {
          key: { type: "instances", instanceKeys: [{ className: "x.y", id: "0x2", ivaultKey: "test-ivault" }] },
          parentKeys: [
            { type: "class-grouping", className: "x.y" },
            { type: "instances", instanceKeys: [{ className: "x.y", id: "0x1", ivaultKey: "test-ivault" }] },
          ],
          label: "two",
          children: false,
        } as HierarchyNode,
      ]);
      ivaultAccess.createQueryReader.mockClear();

      // requesting children for the class grouping node again should re-execute the root query, filtered by grouped instance DMInstanceIds
      const rootInstanceNodes2 = await collect(provider.getNodes({ parentNode: groupingNodes[0] }));
      expect(ivaultAccess.createQueryReader).toHaveBeenCalledOnce();
      {
        const cachedQueryArg = ivaultAccess.createQueryReader.mock.calls[0][0];
        expect(cachedQueryArg.dmsql).toContain("FROM (ROOT)");
        expect(cachedQueryArg.bindings).toHaveLength(1);
        expect(cachedQueryArg.bindings?.[0].value).toBe("0x1");
      }
      expect(rootInstanceNodes2).toEqual(rootInstanceNodes);
      ivaultAccess.createQueryReader.mockClear();

      // requesting root nodes again should re-execute the root query, NOT filtered by grouped instance DMInstanceIds
      const groupingNodes2 = await collect(provider.getNodes({ parentNode: undefined }));
      expect(ivaultAccess.createQueryReader).toHaveBeenCalledOnce();
      {
        const rootQueryArg = ivaultAccess.createQueryReader.mock.calls[0][0];
        expect(rootQueryArg.dmsql).toBe("ROOT");
        expect(rootQueryArg.bindings).toBeUndefined();
      }
      expect(groupingNodes2).toEqual(groupingNodes);
    });

    it("clears cache on data source change", async () => {
      ivaultAccess.createQueryReader.mockReturnValue(createAsyncIterator([]));
      const ivaultChanged = new BeEvent();
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        ivaultChanged,
        hierarchyDefinition: {
          async defineHierarchyLevel() {
            return [{ fullClassName: "x.y", query: { dmsql: "QUERY" } }];
          },
        },
      });
      expect(await collect(provider.getNodes({ parentNode: undefined }))).toEqual([]);
      expect(ivaultAccess.createQueryReader).toHaveBeenCalledOnce();
      expect(await collect(provider.getNodes({ parentNode: undefined }))).toEqual([]);
      expect(ivaultAccess.createQueryReader).toHaveBeenCalledOnce();

      ivaultChanged.raiseEvent();
      expect(await collect(provider.getNodes({ parentNode: undefined }))).toEqual([]);
      expect(ivaultAccess.createQueryReader).toHaveBeenCalledTimes(2);
      expect(await collect(provider.getNodes({ parentNode: undefined }))).toEqual([]);
      expect(ivaultAccess.createQueryReader).toHaveBeenCalledTimes(2);
    });
  });

  describe("setFormatter", () => {
    afterAll(() => {
      vi.restoreAllMocks();
    });

    it("raises `hierarchyChanged` event with new formatter", async () => {
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel() {
            return [];
          },
        },
      });

      const hierarchyChangedListener = vi.fn();
      provider.hierarchyChanged.addListener(hierarchyChangedListener);

      // setting to custom formatter should trigger `hierarchyChangedListener` with the new formatter
      const formatter = async () => `doesn't matter`;
      provider.setFormatter(formatter);
      expect(hierarchyChangedListener).toHaveBeenCalledExactlyOnceWith({
        formatterChange: { newFormatter: formatter },
      });
      hierarchyChangedListener.mockClear();

      // setting to `undefined` should trigger `hierarchyChangedListener` with the default formatter
      provider.setFormatter(undefined);
      expect(hierarchyChangedListener).toHaveBeenCalledOnce();
      {
        const [listenerArg] = hierarchyChangedListener.mock.calls[0];
        expect(listenerArg.formatterChange).toBeDefined();
        expect(typeof listenerArg.formatterChange.newFormatter).toBe("function");
        expect(listenerArg.formatterChange.newFormatter).not.toBe(formatter);
      }
    });

    it("`getNodes` doesn't re-query with same props and a different formatter", async () => {
      ivaultAccess.createQueryReader.mockImplementation(() =>
        createAsyncIterator<RowDef>([
          {
            [NodeSelectClauseColumnNames.FullClassName]: "a.b",
            [NodeSelectClauseColumnNames.DMInstanceId]: "0x123",
            [NodeSelectClauseColumnNames.DisplayLabel]: "test label",
            [NodeSelectClauseColumnNames.HasChildren]: false,
          },
        ]),
      );
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel({ parentNode }) {
            if (!parentNode) {
              return [{ fullClassName: "x.y", query: { dmsql: "QUERY" } }];
            }
            return [];
          },
        },
      });

      expect(await collect(provider.getNodes({ parentNode: undefined }))).toEqual(
        expect.arrayContaining([expect.objectContaining({ label: "test label" })]),
      );

      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      provider.setFormatter(async (val: TypedPrimitiveValue) => `_formatted_${val.value.toString()}`);
      expect(await collect(provider.getNodes({ parentNode: undefined }))).toEqual(
        expect.arrayContaining([expect.objectContaining({ label: "_formatted_test label" })]),
      );
      expect(ivaultAccess.createQueryReader).toHaveBeenCalledOnce();
    });

    it("`getNodes` uses formatter that is provided to `setFormatter`", async () => {
      const node = createTestSourceGenericNode({ children: false });
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel({ parentNode }) {
            if (!parentNode) {
              return [{ node }];
            }
            return [];
          },
        },
      });
      expect((await collect(provider.getNodes({ parentNode: undefined }))).map((n) => n.label)).toEqual([node.label]);
      provider.setFormatter(async (val: TypedPrimitiveValue) => `_formatted_${JSON.stringify(val)}`);
      expect((await collect(provider.getNodes({ parentNode: undefined }))).map((n) => n.label)).toEqual([
        `_formatted_${JSON.stringify({ value: node.label, type: "String" })}`,
      ]);
    });

    it("`getNodes` uses default formatter when `setFormatter` is provided an `undefined` value", async () => {
      const node = createTestSourceGenericNode({ children: false });
      using provider = createIVaultHierarchyProvider({
        ivaultAccess,
        hierarchyDefinition: {
          async defineHierarchyLevel({ parentNode }) {
            if (!parentNode) {
              return [{ node }];
            }
            return [];
          },
        },
        formatter: async (val: TypedPrimitiveValue) => `_formatted_${JSON.stringify(val)}`,
      });
      expect((await collect(provider.getNodes({ parentNode: undefined }))).map((n) => n.label)).toEqual([
        `_formatted_${JSON.stringify({ value: node.label, type: "String" })}`,
      ]);
      provider.setFormatter(undefined);
      expect((await collect(provider.getNodes({ parentNode: undefined }))).map((n) => n.label)).toEqual([node.label]);
    });
  });
});
