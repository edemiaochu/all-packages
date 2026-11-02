/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { vi } from "vitest";
import { Logger, LogLevel } from "@szewtwin/core-szewec";
import { DM, DMClassHierarchyInspector, DMSchemaProvider, parseFullClassName } from "@szewtwin/presentation-shared";
import { NonGroupingHierarchyNode } from "../hierarchies/HierarchyNode.js";
import { GenericNodeKey, HierarchyNodeKey, IVaultInstanceKey } from "../hierarchies/HierarchyNodeKey.js";
import {
  ProcessedGenericHierarchyNode,
  ProcessedGroupingHierarchyNode,
  ProcessedInstanceHierarchyNode,
  SourceGenericHierarchyNode,
  SourceInstanceHierarchyNode,
} from "../hierarchies/ivault/IVaultHierarchyNode.js";

export function setupLogging(levels: Array<{ namespace: string; level: LogLevel }>) {
  Logger.initializeToConsole();
  Logger.turnOffCategories();
  levels.forEach(({ namespace, level }) => Logger.setLevel(namespace, level));
}

export function createTestGenericNodeKey(src?: Partial<GenericNodeKey>): GenericNodeKey {
  return { type: "generic", id: "test", ...src };
}

export function createTestGenericNode(src?: Partial<NonGroupingHierarchyNode>): NonGroupingHierarchyNode {
  return { label: "test", key: createTestGenericNodeKey(), children: false, parentKeys: [], ...src };
}

export function createTestSourceGenericNode(src?: Partial<SourceGenericHierarchyNode>): SourceGenericHierarchyNode {
  return { label: "test", key: "test", ...src };
}

export function createTestSourceInstanceNode(src?: Partial<SourceInstanceHierarchyNode>): SourceInstanceHierarchyNode {
  return { label: "test", key: { type: "instances", instanceKeys: [] }, ...src };
}

export function createTestProcessedGenericNode(
  src?: Partial<ProcessedGenericHierarchyNode>,
): ProcessedGenericHierarchyNode {
  return { label: "test", key: createTestGenericNodeKey(), parentKeys: [], ...src };
}

export function createTestProcessedInstanceNode(
  src?: Partial<ProcessedInstanceHierarchyNode>,
): ProcessedInstanceHierarchyNode {
  return { label: "test", key: { type: "instances", instanceKeys: [] }, parentKeys: [], ...src };
}

export function createTestProcessedGroupingNode<
  TChild = ProcessedGroupingHierarchyNode | ProcessedInstanceHierarchyNode,
>(
  src?: Partial<Omit<ProcessedGroupingHierarchyNode, "children">> & { children?: TChild[] },
): Omit<ProcessedGroupingHierarchyNode, "children"> & { children: TChild[] } {
  return {
    label: "test",
    key: { type: "class-grouping", className: "test class" },
    parentKeys: [],
    groupedInstanceKeys: [],
    children: new Array<TChild>(),
    ...src,
  };
}

export function createTestInstanceKey(src?: Partial<IVaultInstanceKey>): IVaultInstanceKey {
  return { className: "TestSchema.TestClass", id: "0x1", ...src };
}

export function createTestNodeKey(): HierarchyNodeKey {
  return { type: "instances", instanceKeys: [] };
}

export interface StubClassFuncProps {
  schemaName: string;
  className: string;
  classLabel?: string;
  properties?: DM.Property[];
  is?: (fullClassName: string) => Promise<boolean>;
}
export interface StubRelationshipClassFuncProps extends StubClassFuncProps {
  source?: DM.RelationshipConstraint;
  target?: DM.RelationshipConstraint;
  direction?: "Forward" | "Backward";
}
export type TStubClassFunc = (props: StubClassFuncProps) => DM.Class;
export type TStubEntityClassFunc = (props: StubClassFuncProps) => DM.EntityClass;
export type TStubRelationshipClassFunc = (props: StubRelationshipClassFuncProps) => DM.RelationshipClass;

export function createDMSchemaProviderStub(): {
  stubEntityClass: TStubEntityClassFunc;
  stubRelationshipClass: TStubRelationshipClassFunc;
  stubOtherClass: TStubClassFunc;
} & DMSchemaProvider {
  interface SchemaStub {
    name: string;
    getClass: DM.Schema["getClass"];
    classMap: Map<string, DM.Class>;
  }
  const schemaStubs: { [schemaName: string]: SchemaStub } = {};
  const getSchemaStub = (schemaName: string) => {
    let schemaStub = schemaStubs[schemaName];
    if (!schemaStub) {
      const classMap = new Map<string, DM.Class>();
      const getClass: DM.Schema["getClass"] = vi
        .fn()
        .mockImplementation(async (name: string) => classMap.get(name)) as unknown as DM.Schema["getClass"];
      schemaStub = { name: schemaName, getClass, classMap };
      schemaStubs[schemaName] = schemaStub;
    }
    return schemaStub;
  };
  const createBaseClassProps = (props: StubClassFuncProps) => ({
    schema: { name: props.schemaName },
    fullName: `${props.schemaName}.${props.className}`,
    name: props.className,
    label: props.classLabel,
    getProperty: async (propertyName: string): Promise<DM.Property | undefined> => {
      if (!props.properties) {
        return undefined;
      }
      return props.properties.find((p) => p.name === propertyName);
    },
    getProperties: async (): Promise<Array<DM.Property>> => props.properties ?? [],
    is: vi.fn().mockImplementation(async (targetClassOrClassName: DM.Class | string, schemaName?: string) => {
      if (typeof targetClassOrClassName === "string") {
        return props.is
          ? props.is(`${schemaName!}.${targetClassOrClassName}`)
          : schemaName === props.schemaName && targetClassOrClassName === props.className;
      }
      // need this just to make sure `.` is used for separating schema and class names
      const { schemaName: parsedSchemaName, className: parsedClassName } = parseFullClassName(
        targetClassOrClassName.fullName,
      );
      return props.is
        ? props.is(`${parsedSchemaName}.${parsedClassName}`)
        : parsedSchemaName === props.schemaName && parsedClassName === props.className;
    }),
    isEntityClass: () => false,
    isRelationshipClass: () => false,
  });
  const stubEntityClass: TStubEntityClassFunc = (props) => {
    const res = { ...createBaseClassProps(props), isEntityClass: () => true } as unknown as DM.EntityClass;
    getSchemaStub(props.schemaName).classMap.set(props.className, res);
    return res;
  };
  const stubRelationshipClass: TStubRelationshipClassFunc = (props) => {
    const res = {
      ...createBaseClassProps(props),
      direction: props.direction ?? "Forward",
      source: props.source ?? { polymorphic: true, abstractConstraint: async () => undefined },
      target: props.target ?? { polymorphic: true, abstractConstraint: async () => undefined },
      isRelationshipClass: () => true,
    } as unknown as DM.RelationshipClass;
    getSchemaStub(props.schemaName).classMap.set(props.className, res);
    return res;
  };
  const stubOtherClass: TStubClassFunc = (props) => {
    const res = { ...createBaseClassProps(props) } as unknown as DM.Class;
    getSchemaStub(props.schemaName).classMap.set(props.className, res);
    return res;
  };
  return {
    stubEntityClass,
    stubRelationshipClass,
    stubOtherClass,
    getSchema: vi.fn().mockImplementation(async (schemaName: string): Promise<DM.Schema | undefined> => {
      return schemaStubs[schemaName] as unknown as DM.Schema | undefined;
    }) as unknown as DMSchemaProvider["getSchema"],
  };
}

export function createClassHierarchyInspectorStub(
  schemaProvider = createDMSchemaProviderStub(),
): {
  stubEntityClass: TStubEntityClassFunc;
  stubRelationshipClass: TStubRelationshipClassFunc;
  stubOtherClass: TStubClassFunc;
} & DMClassHierarchyInspector {
  return {
    stubEntityClass: schemaProvider.stubEntityClass,
    stubRelationshipClass: schemaProvider.stubRelationshipClass,
    stubOtherClass: schemaProvider.stubOtherClass,
    classDerivesFrom: vi.fn().mockImplementation(async (derived: string, base: string) => {
      const { schemaName: derivedSchemaName, className: derivedClassName } = parseFullClassName(derived);
      const { schemaName: baseSchemaName, className: baseClassName } = parseFullClassName(base);
      const schemaStub = await schemaProvider.getSchema(derivedSchemaName);
      if (!schemaStub) {
        return false;
      }
      const derivedClass = await schemaStub.getClass(derivedClassName);
      if (!derivedClass) {
        return false;
      }
      return derivedClass.is(baseClassName, baseSchemaName);
    }) as unknown as DMClassHierarchyInspector["classDerivesFrom"],
  };
}

export function createIVaultAccessStub() {
  const schemaProvider = createDMSchemaProviderStub();
  return { ...schemaProvider, ...createClassHierarchyInspectorStub(schemaProvider) };
}

export function createInstanceLabelSelectClauseFactoryStub() {
  return {
    async createSelectClause(props: {
      classAlias: string;
      className?: string;
      selectorsConcatenator?: any;
    }): Promise<string> {
      return `[${props.classAlias}].[LabelProperty]`;
    },
  };
}

export const testLocalizedStrings = { other: "_Other_", unspecified: "_Unspecified_" };
