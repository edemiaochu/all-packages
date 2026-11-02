/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Mock, vi } from "vitest";
import { DM } from "../shared/Metadata.js";
import { parseFullClassName } from "../shared/Utils.js";

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
interface SchemaStub {
  name: string;
  getClass: Mock;
  classes: Map<string, DM.Class>;
}
export function createDMSchemaProviderStub() {
  const schemaStubs: { [schemaName: string]: SchemaStub } = {};
  const stub = {
    getSchema: vi.fn(async (schemaName: string): Promise<DM.Schema | undefined> => {
      return schemaStubs[schemaName];
    }),
  };
  const getSchemaStub = (schemaName: string) => {
    let schemaStub = schemaStubs[schemaName];
    if (!schemaStub) {
      const classMap = new Map<string, DM.Class>();
      schemaStub = {
        name: schemaName,
        classes: classMap,
        getClass: vi.fn(async (className: string) => classMap.get(className)),
      };
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
    is: vi.fn(async (targetClassOrClassName: DM.Class | string, schemaName?: string) => {
      if (!props.is) {
        return false;
      }
      if (typeof targetClassOrClassName === "string") {
        return props.is(`${schemaName!}.${targetClassOrClassName}`);
      }
      // need this just to make sure `.` is used for separating schema and class names
      const { schemaName: parsedSchemaName, className: parsedClassName } = parseFullClassName(
        targetClassOrClassName.fullName,
      );
      return props.is(`${parsedSchemaName}.${parsedClassName}`);
    }),
    isEntityClass: () => false,
    isRelationshipClass: () => false,
  });
  const stubEntityClass: TStubEntityClassFunc = (props) => {
    const res = { ...createBaseClassProps(props), isEntityClass: () => true } as unknown as DM.EntityClass;
    getSchemaStub(props.schemaName).classes.set(props.className, res);
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
    getSchemaStub(props.schemaName).classes.set(props.className, res);
    return res;
  };
  const stubOtherClass: TStubClassFunc = (props) => {
    const res = { ...createBaseClassProps(props) } as unknown as DM.Class;
    getSchemaStub(props.schemaName).classes.set(props.className, res);
    return res;
  };
  return {
    ...stub,
    stubEntityClass,
    stubRelationshipClass,
    stubOtherClass,
    getClassRequestCount(props: { schemaName: string; className: string }): number {
      const schemaStub = schemaStubs[props.schemaName];
      if (!schemaStub) {
        return 0;
      }
      return schemaStub.getClass.mock.calls.filter((call) => call[0] === props.className).length;
    },
  };
}
