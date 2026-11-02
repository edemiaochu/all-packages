/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { LRUMap } from "@szewtwin/core-szewec";
import { parseFullClassName } from "./Utils.js";

/**
 * An interface for an object that knows how to get an DMSchema from an iVault.
 *
 * @see `createDMSchemaProvider` in `@szewtwin/presentation-core-interop`.
 * @public
 */
export interface DMSchemaProvider {
  getSchema(schemaName: string): Promise<DM.Schema | undefined>;
}

/**
 * An interface for a class hierarchy inspector that can be used to determine if one class derives from another.
 * @see `createCachingDMClassHierarchyInspector`
 * @public
 */
export interface DMClassHierarchyInspector {
  classDerivesFrom(derivedClassFullName: string, candidateBaseClassFullName: string): Promise<boolean> | boolean;
}

/**
 * Creates a new `DMClassHierarchyInspector` that caches results of `derivesFrom` calls.
 * @public
 */
export function createCachingDMClassHierarchyInspector(props: {
  /** Schema provider used to load schemas and their classes. */
  schemaProvider: DMSchemaProvider;
  /** Optional cache size, describing the number of derived/base class combinations to store in cache. Defaults to `0`, which means no caching. */
  cacheSize?: number;
}): DMClassHierarchyInspector {
  const map = new LRUMap<string, Promise<boolean> | boolean>(props.cacheSize ?? 0);
  function createCacheKey(derivedClassName: string, baseClassName: string) {
    return `${derivedClassName}/${baseClassName}`;
  }
  return {
    classDerivesFrom(derivedClassFullName: string, candidateBaseClassFullName: string): Promise<boolean> | boolean {
      const cacheKey = createCacheKey(derivedClassFullName, candidateBaseClassFullName);
      let result = map.get(cacheKey);
      if (result === undefined) {
        result = Promise.all([
          getClass(props.schemaProvider, derivedClassFullName),
          getClass(props.schemaProvider, candidateBaseClassFullName),
        ]).then(async ([derivedClass, baseClass]) => {
          const resolvedResult = await derivedClass.is(baseClass);
          map.set(cacheKey, resolvedResult);
          return resolvedResult;
        });
        map.set(cacheKey, result);
      }
      return result;
    },
  };
}

/**
 * A namespace containing various [DM types](https://www.szewtwinjs.org/bis/dm/).
 * @public
 * @see `DMSchemaProvider`
 */
export namespace DM {
  /**
   * Represents an DMSchema that contains classes, relationships, etc.
   * @see https://www.szewtwinjs.org/reference/dmschema-metadata/metadata/schema/
   * @public
   */
  export interface Schema {
    name: string;
    getClass(name: string): Promise<Class | undefined>;
  }

  /**
   * Represents an DMSchema item - a class, relationship, etc.
   * @see https://www.szewtwinjs.org/reference/dmschema-metadata/metadata/schemaitem/
   * @public
   */
  export interface SchemaItem {
    schema: Schema;
    fullName: string;
    name: string;
    label?: string;
  }

  /**
   * Represents an DMClass.
   * @see https://www.szewtwinjs.org/reference/dmschema-metadata/metadata/dmclass/
   * @public
   */
  export interface Class extends SchemaItem {
    is(className: string, schemaName: string): Promise<boolean>;
    is(other: Class): Promise<boolean>;
    getProperty(name: string): Promise<Property | undefined>;
    getProperties(): Promise<Array<Property>>;
    isEntityClass(): this is EntityClass;
    isRelationshipClass(): this is RelationshipClass;
    isStructClass(): this is StructClass;
    isMixin(): this is Mixin;
  }

  /**
   * Represents an entity class.
   * @see https://www.szewtwinjs.org/reference/dmschema-metadata/metadata/entityclass/
   * @public
   */
  export type EntityClass = Class;

  /**
   * Represents a struct class.
   * @see https://www.szewtwinjs.org/reference/dmschema-metadata/metadata/structclass/
   * @public
   */
  export type StructClass = Class;

  /**
   * Represents a mixin.
   * @see https://www.szewtwinjs.org/reference/dmschema-metadata/metadata/mixin/
   * @public
   */
  export type Mixin = Class;

  /**
   * Represents a kind of quantity.
   * @see https://www.szewtwinjs.org/reference/dmschema-metadata/metadata/kindofquantity/
   * @public
   */
  export type KindOfQuantity = SchemaItem;

  /**
   * Represents a relationship constraint multiplicity.
   * @see https://www.szewtwinjs.org/reference/dmschema-metadata/metadata/relationshipmultiplicity/
   * @public
   */
  export interface RelationshipConstraintMultiplicity {
    lowerLimit: number;
    upperLimit: number;
  }

  /**
   * Represents a relationship constraint.
   * @see https://www.szewtwinjs.org/reference/dmschema-metadata/metadata/relationshipconstraint/
   * @public
   */
  export interface RelationshipConstraint {
    multiplicity?: RelationshipConstraintMultiplicity;
    polymorphic: boolean;
    abstractConstraint: Promise<EntityClass | Mixin | RelationshipClass | undefined>;
  }

  /**
   * Represents a relationship class.
   * @see https://www.szewtwinjs.org/reference/dmschema-metadata/metadata/relationshipclass/
   * @public
   */
  export interface RelationshipClass extends Class {
    direction: "Forward" | "Backward";
    source: RelationshipConstraint;
    target: RelationshipConstraint;
  }

  /**
   * Represents an enumerator.
   * @see https://www.szewtwinjs.org/reference/dmschema-metadata/metadata/enumerator/
   * @public
   */
  export interface Enumerator<T> {
    name: string;
    value: T;
    label?: string;
    description?: string;
  }

  /**
   * Represents an enumeration.
   * @see https://www.szewtwinjs.org/reference/dmschema-metadata/metadata/enumeration/
   * @public
   */
  export interface Enumeration extends SchemaItem {
    enumerators: Array<Enumerator<string | number>>;
    type: "String" | "Number";
    isStrict: boolean;
  }

  /**
   * Represents a property.
   * @see https://www.szewtwinjs.org/reference/dmschema-metadata/metadata/property/
   * @public
   */
  export interface Property {
    name: string;
    class: Class;
    label?: string;
    kindOfQuantity: Promise<KindOfQuantity | undefined>;

    isArray(): this is ArrayProperty;
    isStruct(): this is StructProperty;
    isPrimitive(): this is PrimitiveProperty;
    isEnumeration(): this is EnumerationProperty;
    isNavigation(): this is NavigationProperty;
  }

  /**
   * Defines array property attributes.
   * @see https://www.szewtwinjs.org/reference/dmschema-metadata/metadata/arrayproperty/
   * @public
   */
  export interface ArrayPropertyAttributes {
    minOccurs: number;
    maxOccurs?: number;
  }

  /**
   * Defines a structs array property.
   * @see https://www.szewtwinjs.org/reference/dmschema-metadata/metadata/structarrayproperty/
   * @public
   */
  export type StructArrayProperty = StructProperty & ArrayPropertyAttributes;
  /**
   * Defines an enumerations array property.
   * @see https://www.szewtwinjs.org/reference/dmschema-metadata/metadata/enumerationarrayproperty/
   * @public
   */
  export type EnumerationArrayProperty = EnumerationProperty & ArrayPropertyAttributes;
  /**
   * Defines a primitives array property.
   * @see https://www.szewtwinjs.org/reference/dmschema-metadata/metadata/primitivearrayproperty/
   * @public
   */
  export type PrimitiveArrayProperty = PrimitiveProperty & ArrayPropertyAttributes;
  /**
   * Defines an array property.
   * @see https://www.szewtwinjs.org/reference/dmschema-metadata/metadata/anyarrayproperty/
   * @public
   */
  export type ArrayProperty = StructArrayProperty | EnumerationArrayProperty | PrimitiveArrayProperty;

  /**
   * Defines a struct property.
   * @see https://www.szewtwinjs.org/reference/dmschema-metadata/metadata/structproperty/
   * @public
   */
  export interface StructProperty extends Property {
    structClass: StructClass;
  }

  /**
   * Defines an enumeration property.
   * @see https://www.szewtwinjs.org/reference/dmschema-metadata/metadata/enumerationproperty/
   * @public
   */
  export interface EnumerationProperty extends Property {
    enumeration: Promise<Enumeration | undefined>;
    extendedTypeName?: string;
  }

  /**
   * Defines a navigation property.
   * @see https://www.szewtwinjs.org/reference/dmschema-metadata/metadata/navigationproperty/
   * @public
   */
  export interface NavigationProperty extends Property {
    relationshipClass: Promise<RelationshipClass>;
    direction: "Forward" | "Backward";
  }

  /**
   * Defines a primitive property type.
   * @see https://www.szewtwinjs.org/reference/dmschema-metadata/metadata/primitivetype/
   * @public
   */
  export type PrimitiveType =
    | "Binary"
    | "Boolean"
    | "DateTime"
    | "Double"
    | "Integer"
    | "Long"
    | "Point2d"
    | "Point3d"
    | "String"
    | "IGeometry";

  /**
   * Defines a primitive property.
   * @see https://www.szewtwinjs.org/reference/dmschema-metadata/metadata/primitiveproperty/
   * @public
   */
  export interface PrimitiveProperty extends Property {
    primitiveType: PrimitiveType;
    extendedTypeName?: string;
  }
}

/**
 * An identifiers' union of all supported primitive value types.
 * @public
 */
export type PrimitiveValueType = "Id" | Exclude<DM.PrimitiveType, "Binary" | "IGeometry">;

/**
 * Describes a single step through an DMRelationship from source DMClass to target DMClass.
 * @public
 */
export interface RelationshipPathStep {
  /** Full name of the source DMClass */
  sourceClassName: string;
  /** Full name of the target DMClass */
  targetClassName: string;
  /** Full name of the DMRelationshipClass */
  relationshipName: string;
  /**
   * Indicates that the relationship direction be reversed. This should be set to `true` when step direction
   * doesn't match relationship direction, e.g. relationship is from source `A` to target `B` and the step
   * describes a step from `B` to `A`.
   */
  relationshipReverse?: boolean;
}

/**
 * Describes a path from source DMClass to target DMClass through multiple DMRelationships.
 * @public
 */
export type RelationshipPath<TStep extends RelationshipPathStep = RelationshipPathStep> = TStep[];

/**
 * Finds a class with the specified full class name using the given `DMSchemaProvider`.
 * @throws Error if the schema or class is not found.
 * @public
 */
export async function getClass(schemaProvider: DMSchemaProvider, fullClassName: string): Promise<DM.Class> {
  const { schemaName, className } = parseFullClassName(fullClassName);
  const schema = await schemaProvider.getSchema(schemaName);
  if (!schema) {
    throw new Error(`Schema "${schemaName}" not found.`);
  }
  const lookupClass = await schema.getClass(className);
  if (!lookupClass) {
    throw new Error(`Class "${className}" not found in schema "${schemaName}".`);
  }
  return lookupClass;
}
