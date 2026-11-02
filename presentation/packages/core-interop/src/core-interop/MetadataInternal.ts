/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { assert } from "@szewtwin/core-szewec";
import {
  DMClass as CoreClass,
  EntityClass as CoreEntityClass,
  Enumeration as CoreEnumeration,
  EnumerationArrayProperty as CoreEnumerationArrayProperty,
  EnumerationProperty as CoreEnumerationProperty,
  KindOfQuantity as CoreKindOfQuantity,
  Mixin as CoreMixin,
  NavigationProperty as CoreNavigationProperty,
  PrimitiveArrayProperty as CorePrimitiveArrayProperty,
  PrimitiveProperty as CorePrimitiveProperty,
  Property as CoreProperty,
  RelationshipClass as CoreRelationshipClass,
  RelationshipConstraint as CoreRelationshipConstraint,
  Schema as CoreSchema,
  SchemaItem as CoreSchemaItem,
  StructArrayProperty as CoreStructArrayProperty,
  StructClass as CoreStructClass,
  StructProperty as CoreStructProperty,
  LazyLoadedSchemaItem,
  PrimitiveType,
  SchemaItemType,
  StrengthDirection,
} from "@szewtwin/dmschema-metadata";
import * as ecschemaMetadata from "@szewtwin/dmschema-metadata";
import { DM } from "@szewtwin/presentation-shared";

/** @internal */
export function createDMSchema(schema: CoreSchema): DM.Schema {
  return {
    name: schema.name,
    async getClass(name) {
      // TODO: replace with `schema.getItem(name, CoreClass)` when szewtwinjs-core 4.x is dropped
      const item = await schema.getItem(name);
      return item ? createDMClass(item as CoreClass, this) : undefined;
    },
  };
}

abstract class DMSchemaItemImpl<TCoreSchemaItem extends CoreSchemaItem> implements DM.SchemaItem {
  private _schema: DM.Schema;
  protected constructor(
    protected _coreSchemaItem: TCoreSchemaItem,
    schema?: DM.Schema,
  ) {
    this._schema = schema ?? createDMSchema(this._coreSchemaItem.schema);
  }
  public get schema() {
    return this._schema;
  }
  public get fullName() {
    return this._coreSchemaItem.fullName;
  }
  public get name() {
    return this._coreSchemaItem.name;
  }
  public get label() {
    return this._coreSchemaItem.label;
  }
}

/** @internal */
export function createDMClass(coreClass: CoreClass, schema?: DM.Schema): DM.Class {
  switch (coreClass.schemaItemType) {
    case SchemaItemType.EntityClass:
      return new DMEntityClassImpl(coreClass as CoreEntityClass, schema);
    case SchemaItemType.RelationshipClass:
      return new DMRelationshipClassImpl(coreClass as CoreRelationshipClass, schema);
    case SchemaItemType.StructClass:
      return new DMStructClassImpl(coreClass as CoreStructClass, schema);
    case SchemaItemType.Mixin:
      return new DMMixinImpl(coreClass as CoreMixin, schema);
  }
  throw new Error(`Invalid class type "${coreClass.schemaItemType}" for class ${coreClass.fullName}`);
}

abstract class DMClassImpl<TCoreClass extends CoreClass> extends DMSchemaItemImpl<TCoreClass> implements DM.Class {
  protected constructor(coreClass: TCoreClass, schema?: DM.Schema) {
    super(coreClass, schema);
  }
  public isEntityClass(): this is DM.EntityClass {
    return false;
  }
  public isRelationshipClass(): this is DM.RelationshipClass {
    return false;
  }
  public isStructClass(): this is DM.StructClass {
    return false;
  }
  public isMixin(): this is DM.Mixin {
    return false;
  }
  public async is(classOrClassName: DM.Class | string, schemaName?: string) {
    if (typeof classOrClassName === "string") {
      return this._coreSchemaItem.is(classOrClassName, schemaName!);
    }
    return this._coreSchemaItem.is(classOrClassName.name, classOrClassName.schema.name);
  }
  public async getProperty(name: string): Promise<DM.Property | undefined> {
    const coreProperty = await this._coreSchemaItem.getProperty(
      name,
      // TODO: remove this when szewtwinjs-core 4.x support is dropped.
      // `SchemaFormatsProvider` was introduced around the same time the meaning of this second argument was changed
      // from `includeInherited` to `excludeInherited` - we're using its existence to determine what we need to pass to get
      // inherited properties.
      /* v8 ignore next -- @preserve */
      ecschemaMetadata.SchemaFormatsProvider ? false : true,
    );
    return coreProperty ? createDMProperty(coreProperty, this) : undefined;
  }
  public async getProperties(): Promise<Array<DM.Property>> {
    const coreProperties = await this._coreSchemaItem.getProperties();
    const result = new Array<DM.Property>();
    for (const coreProperty of coreProperties) {
      result.push(createDMProperty(coreProperty, this));
    }
    return result;
  }
}

class DMEntityClassImpl extends DMClassImpl<CoreEntityClass> implements DM.EntityClass {
  constructor(coreClass: CoreEntityClass, schema?: DM.Schema) {
    super(coreClass, schema);
  }
  public override isEntityClass(): this is DM.EntityClass {
    return true;
  }
}

class DMRelationshipClassImpl extends DMClassImpl<CoreRelationshipClass> implements DM.RelationshipClass {
  constructor(coreClass: CoreRelationshipClass, schema?: DM.Schema) {
    super(coreClass, schema);
  }
  public override isRelationshipClass(): this is DM.RelationshipClass {
    return true;
  }
  public get direction() {
    switch (this._coreSchemaItem.strengthDirection) {
      case StrengthDirection.Forward:
        return "Forward";
      case StrengthDirection.Backward:
        return "Backward";
    }
  }
  public get source() {
    return new DMRelationshipConstraintImpl(this._coreSchemaItem.source, this.schema);
  }
  public get target() {
    return new DMRelationshipConstraintImpl(this._coreSchemaItem.target, this.schema);
  }
}

class DMStructClassImpl extends DMClassImpl<CoreStructClass> implements DM.StructClass {
  constructor(coreClass: CoreStructClass, schema?: DM.Schema) {
    super(coreClass, schema);
  }
  public override isStructClass(): this is DM.StructClass {
    return true;
  }
}

class DMMixinImpl extends DMClassImpl<CoreMixin> implements DM.Mixin {
  constructor(coreClass: CoreMixin, schema?: DM.Schema) {
    super(coreClass, schema);
  }
  public override isMixin(): this is DM.Mixin {
    return true;
  }
}

/** @internal */
export function createDMProperty(coreProperty: CoreProperty, dmClass: DM.Class): DM.Property {
  if (coreProperty.isArray()) {
    if (coreProperty.isPrimitive()) {
      return new DMPrimitivesArrayPropertyImpl(coreProperty, dmClass);
    }
    if (coreProperty.isEnumeration()) {
      return new DMEnumerationArrayPropertyImpl(coreProperty, dmClass);
    }
    return new DMStructArrayPropertyImpl(coreProperty, dmClass);
  }
  if (coreProperty.isStruct()) {
    return new DMStructPropertyImpl(coreProperty, dmClass);
  }
  if (coreProperty.isEnumeration()) {
    return new DMEnumerationPropertyImpl(coreProperty, dmClass);
  }
  if (coreProperty.isNavigation()) {
    return new DMNavigationPropertyImpl(coreProperty, dmClass);
  }
  assert(coreProperty.isPrimitive());
  return new DMPrimitivePropertyImpl(coreProperty, dmClass);
}

abstract class DMPropertyImpl<TCoreProperty extends CoreProperty> implements DM.Property {
  protected constructor(
    protected _coreProperty: TCoreProperty,
    protected _class: DM.Class,
  ) {}
  public isArray(): this is DM.ArrayProperty {
    return false;
  }
  public isStruct(): this is DM.StructProperty {
    return false;
  }
  public isPrimitive(): this is DM.PrimitiveProperty {
    return false;
  }
  public isEnumeration(): this is DM.EnumerationProperty {
    return false;
  }
  public isNavigation(): this is DM.NavigationProperty {
    return false;
  }
  public get class() {
    return this._class;
  }
  public get name() {
    return this._coreProperty.name;
  }
  public get label() {
    return this._coreProperty.label;
  }
  public get kindOfQuantity(): Promise<DM.KindOfQuantity | undefined> {
    return createFromOptionalLazyLoaded(
      this._coreProperty.kindOfQuantity,
      (coreKindOfQuantity) => new DMKindOfQuantityImpl(coreKindOfQuantity),
    );
  }
}

class DMPrimitivePropertyImpl<TCoreProperty extends CorePrimitiveProperty>
  extends DMPropertyImpl<TCoreProperty>
  implements DM.PrimitiveProperty
{
  constructor(coreProperty: TCoreProperty, c: DM.Class) {
    super(coreProperty, c);
  }
  public override isPrimitive(): this is DM.PrimitiveProperty {
    return true;
  }
  public get extendedTypeName() {
    return this._coreProperty.extendedTypeName;
  }
  public get primitiveType() {
    switch (this._coreProperty.primitiveType) {
      case PrimitiveType.Binary:
        return "Binary";
      case PrimitiveType.Boolean:
        return "Boolean";
      case PrimitiveType.DateTime:
        return "DateTime";
      case PrimitiveType.Double:
        return "Double";
      case PrimitiveType.IGeometry:
        return "IGeometry";
      case PrimitiveType.Integer:
        return "Integer";
      case PrimitiveType.Long:
        return "Long";
      case PrimitiveType.Point2d:
        return "Point2d";
      case PrimitiveType.Point3d:
        return "Point3d";
      case PrimitiveType.String:
        return "String";
    }
    throw new Error("Primitive property is not initialized");
  }
}

class DMNavigationPropertyImpl extends DMPropertyImpl<CoreNavigationProperty> implements DM.NavigationProperty {
  constructor(coreProperty: CoreNavigationProperty, c: DM.Class) {
    super(coreProperty, c);
  }
  public override isNavigation(): this is DM.NavigationProperty {
    return true;
  }
  public get relationshipClass() {
    return createFromLazyLoaded(this._coreProperty.relationshipClass, (r) => new DMRelationshipClassImpl(r));
  }
  public get direction() {
    switch (this._coreProperty.direction) {
      case StrengthDirection.Backward:
        return "Backward";
      case StrengthDirection.Forward:
        return "Forward";
    }
  }
}

class DMEnumerationPropertyImpl<TCoreProperty extends CoreEnumerationProperty>
  extends DMPropertyImpl<TCoreProperty>
  implements DM.EnumerationProperty
{
  constructor(coreProperty: TCoreProperty, c: DM.Class) {
    super(coreProperty, c);
  }
  public override isEnumeration(): this is DM.EnumerationProperty {
    return true;
  }
  public get enumeration() {
    return createFromOptionalLazyLoaded(
      this._coreProperty.enumeration,
      (coreEnumeration) => new DMEnumerationImpl(coreEnumeration),
    );
  }
  public get extendedTypeName() {
    return this._coreProperty.extendedTypeName;
  }
}

class DMStructPropertyImpl<TCoreProperty extends CoreStructProperty>
  extends DMPropertyImpl<TCoreProperty>
  implements DM.StructProperty
{
  constructor(coreProperty: TCoreProperty, c: DM.Class) {
    super(coreProperty, c);
  }
  public override isStruct(): this is DM.StructProperty {
    return true;
  }
  public get structClass(): DM.StructClass {
    return new DMStructClassImpl(this._coreProperty.structClass);
  }
}

class DMPrimitivesArrayPropertyImpl
  extends DMPrimitivePropertyImpl<CorePrimitiveArrayProperty>
  implements DM.PrimitiveArrayProperty
{
  constructor(coreProperty: CorePrimitiveArrayProperty, c: DM.Class) {
    super(coreProperty, c);
  }
  public override isArray(): this is DM.ArrayProperty {
    return true;
  }
  public get minOccurs() {
    return this._coreProperty.minOccurs;
  }
  public get maxOccurs() {
    return this._coreProperty.maxOccurs;
  }
}

class DMEnumerationArrayPropertyImpl
  extends DMEnumerationPropertyImpl<CoreEnumerationArrayProperty>
  implements DM.EnumerationArrayProperty
{
  constructor(coreProperty: CoreEnumerationArrayProperty, c: DM.Class) {
    super(coreProperty, c);
  }
  public override isArray(): this is DM.ArrayProperty {
    return true;
  }
  public get minOccurs() {
    return this._coreProperty.minOccurs;
  }
  public get maxOccurs() {
    return this._coreProperty.maxOccurs;
  }
}

class DMStructArrayPropertyImpl
  extends DMStructPropertyImpl<CoreStructArrayProperty>
  implements DM.StructArrayProperty
{
  constructor(coreProperty: CoreStructArrayProperty, c: DM.Class) {
    super(coreProperty, c);
  }
  public override isArray(): this is DM.ArrayProperty {
    return true;
  }
  public get minOccurs() {
    return this._coreProperty.minOccurs;
  }
  public get maxOccurs() {
    return this._coreProperty.maxOccurs;
  }
}

async function createFromLazyLoaded<TSource extends CoreSchemaItem, TTarget>(
  source: LazyLoadedSchemaItem<TSource>,
  convert: (source: TSource) => TTarget,
): Promise<TTarget> {
  return source.then(convert);
}

async function createFromOptionalLazyLoaded<TSource extends CoreSchemaItem, TTarget>(
  source: LazyLoadedSchemaItem<TSource> | undefined,
  convert: (source: TSource) => TTarget,
): Promise<TTarget | undefined> {
  if (!source) {
    return undefined;
  }
  return source.then(convert);
}

class DMRelationshipConstraintImpl implements DM.RelationshipConstraint {
  constructor(
    private _coreConstraint: CoreRelationshipConstraint,
    private _schema: DM.Schema,
  ) {}
  public get multiplicity() {
    return this._coreConstraint.multiplicity
      ? {
          lowerLimit: this._coreConstraint.multiplicity.lowerLimit,
          upperLimit: this._coreConstraint.multiplicity.upperLimit,
        }
      : undefined;
  }
  public get polymorphic() {
    return this._coreConstraint.polymorphic ?? false;
  }
  public get abstractConstraint(): Promise<DM.EntityClass | DM.Mixin | DM.RelationshipClass | undefined> {
    return createFromOptionalLazyLoaded(this._coreConstraint.abstractConstraint, (coreConstraint) =>
      createDMClass(coreConstraint, this._schema),
    );
  }
}

class DMKindOfQuantityImpl extends DMSchemaItemImpl<CoreKindOfQuantity> implements DM.KindOfQuantity {
  constructor(coreKindOfQuantity: CoreKindOfQuantity) {
    super(coreKindOfQuantity);
  }
}

class DMEnumerationImpl extends DMSchemaItemImpl<CoreEnumeration> implements DM.Enumeration {
  constructor(coreEnumeration: CoreEnumeration) {
    super(coreEnumeration);
  }
  public get enumerators() {
    return this._coreSchemaItem.enumerators.map((coreEnumerator) => ({ ...coreEnumerator }));
  }
  public get type() {
    switch (this._coreSchemaItem.type) {
      case PrimitiveType.String:
        return "String";
      case PrimitiveType.Integer:
      default:
        return "Number";
    }
  }
  public get isStrict() {
    return this._coreSchemaItem.isStrict;
  }
}
