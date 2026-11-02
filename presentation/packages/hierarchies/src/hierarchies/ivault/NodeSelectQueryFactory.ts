/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { assert, Id64String } from "@szewtwin/core-szewec";
import {
  GenericInstanceFilter,
  GenericInstanceFilterRelationshipStep,
  GenericInstanceFilterRule,
  GenericInstanceFilterRuleGroup,
  GenericInstanceFilterRuleGroupOperator,
  GenericInstanceFilterRuleOperator,
  GenericInstanceFilterRuleValue,
} from "@szewtwin/core-common";
import {
  DM,
  DMClassHierarchyInspector,
  DMSchemaProvider,
  DMSql,
  getClass,
  IInstanceLabelSelectClauseFactory,
  parseFullClassName,
  PrimitiveValue,
  Props,
} from "@szewtwin/presentation-shared";
import { HierarchyNodeAutoExpandProp } from "./IVaultHierarchyNode.js";

/**
 * Column names of the SELECT clause created by `NodeSelectClauseFactory`. Order of the names matches the order of columns
 * created by the factory.
 *
 * @public
 */
export enum NodeSelectClauseColumnNames {
  /** Full class name of the instance the node represents. Type: `string` in format `{schema name}:{class name}`. */
  FullClassName = "FullClassName",
  /** DMInstance ID of the instance the node represents. Type: `Id64String`. */
  DMInstanceId = "DMInstanceId",
  /** Display label. Type: `string`. */
  DisplayLabel = "DisplayLabel",
  /**
   * A flag indicating if the node has children. Type: `boolean`. Values:
   * - `false` - node never has children.
   * - `true` - node always has children.
   * - NULL - unknown, needs to be determined by requesting children for the node.
   */
  HasChildren = "HasChildren",
  /** A flag indicating that a node should be hidden if it has no children. Type: `boolean`. */
  HideIfNoChildren = "HideIfNoChildren",
  /** A flag indicating that a node should be hidden and its children should be displayed instead. Type: `boolean`. */
  HideNodeInHierarchy = "HideNodeInHierarchy",
  /** A serialized JSON object for providing grouping information. */
  Grouping = "Grouping",
  /** A serialized JSON object for associating a node with additional data. */
  ExtendedData = "ExtendedData",
  /** A flag indicating the node should be auto-expanded when it's loaded. */
  AutoExpand = "AutoExpand",
  /** A flag indicating the node supports child hierarchy level filtering. */
  SupportsFiltering = "SupportsFiltering",
}

/**
 * A data structure for defining an DMSQL value selector.
 * @public
 */
interface DMSqlValueSelector {
  selector: string;
}

/**
 * Props for `NodeSelectClauseFactory.createSelectClause`.
 * @public
 */
interface NodeSelectClauseProps {
  dmClassId: DMSqlValueSelector;
  dmInstanceId: DMSqlValueSelector;
  nodeLabel: string | DMSqlValueSelector;
  extendedData?: { [key: string]: Id64String | string | number | boolean | DMSqlValueSelector };
  autoExpand?: boolean | DMSqlValueSelector;
  supportsFiltering?: boolean | DMSqlValueSelector;
  hasChildren?: boolean | DMSqlValueSelector;
  hideNodeInHierarchy?: boolean | DMSqlValueSelector;
  hideIfNoChildren?: boolean | DMSqlValueSelector;
  grouping?: DMSqlSelectClauseGroupingParams;
}

/**
 * A data structure for defining nodes' grouping requirements.
 * @public
 */
interface DMSqlSelectClauseGroupingParams {
  byLabel?: DMSqlSelectClauseLabelGroupingParams;
  byClass?: boolean | DMSqlSelectClauseGroupingParamsBase | DMSqlValueSelector;
  byBaseClasses?: DMSqlSelectClauseBaseClassGroupingParams;
  byProperties?: DMSqlSelectClausePropertiesGroupingParams;
}

/**
 * A data structure for defining label grouping params.
 * @public
 */
interface DMSqlSelectClauseLabelGroupingBaseParams {
  /** Label grouping option that determines whether to group nodes or to merge them. Defaults to "group".*/
  action?: "group" | "merge";
  /** Id that needs to match for nodes to be grouped or merged.*/
  groupId?: string | DMSqlValueSelector;
}

/**
 * A data structure for defining label merging.
 * @public
 */
interface DMSqlSelectClauseLabelGroupingMergeParams extends DMSqlSelectClauseLabelGroupingBaseParams {
  action: "merge";
}

/**
 * A data structure for defining label grouping.
 * @public
 */
interface DMSqlSelectClauseLabelGroupingGroupParams
  extends DMSqlSelectClauseLabelGroupingBaseParams, DMSqlSelectClauseGroupingParamsBase {
  action?: "group";
}

/**
 * A data structure for defining possible label grouping types.
 * @public
 */
type DMSqlSelectClauseLabelGroupingParams =
  | boolean
  | DMSqlValueSelector
  | DMSqlSelectClauseLabelGroupingMergeParams
  | DMSqlSelectClauseLabelGroupingGroupParams;

/**
 * A data structure for defining base grouping parameters shared across all types of grouping.
 * @public
 */
interface DMSqlSelectClauseGroupingParamsBase {
  hideIfNoSiblings?: boolean | DMSqlValueSelector;
  hideIfOneGroupedNode?: boolean | DMSqlValueSelector;
  autoExpand?: HierarchyNodeAutoExpandProp | DMSqlValueSelector;
}

/**
 * A data structure for defining properties grouping.
 * @public
 */
interface DMSqlSelectClausePropertiesGroupingParams extends DMSqlSelectClauseGroupingParamsBase {
  /**
   * Full name of a class whose properties are used to group the node. Only has effect if the node
   * represents an instance of that class.
   *
   * Full class name format: `SchemaName.ClassName`.
   */
  propertiesClassName: string;
  /**
   * Property grouping option that determines whether to group nodes whose grouping value is not set or is set to an empty string.
   *
   * Label of the created grouping node will be `Not Specified`.
   */
  createGroupForUnspecifiedValues?: boolean | DMSqlValueSelector;
  /**
   * Property grouping option that determines whether to group nodes whose grouping value doesn't fit within any of the provided
   * ranges, or is not a numeric value.
   *
   * Label of the created grouping node will be `Other`.
   */
  createGroupForOutOfRangeValues?: boolean | DMSqlValueSelector;
  /**
   * Properties of the specified class, by which the nodes should be grouped.
   *
   * Example usage:
   * ```ts
   * propertyGroups: [
   *   {
   *     propertyName: "type",
   *     propertyClassAlias: "this"
   *   },
   *   {
   *     propertyName: "length",
   *     propertyClassAlias: "x",
   *     ranges: [
   *       { fromValue: 1, toValue: 10, rangeLabel: "Small" },
   *       { fromValue: 11, toValue: 20, rangeLabel: "Medium" }
   *     ]
   *   },
   * ]
   * ```
   */
  propertyGroups: DMSqlSelectClausePropertyGroup[];
}

/**
 * A data structure for defining specific properties' grouping params.
 * @public
 */
interface DMSqlSelectClausePropertyGroup {
  /** A string indicating the name of the property to group by. */
  propertyName: string;
  /** Alias to of the class containing the property. Used to select the property value. */
  propertyClassAlias: string;
  /** Ranges are used to group nodes by numeric properties which are within specified bounds. */
  ranges?: DMSqlSelectClausePropertyValueRange[];
}

/**
 * A data structure for defining boundaries for a value.
 * @public
 */
interface DMSqlSelectClausePropertyValueRange {
  /** Defines the lower bound of the range. */
  fromValue: number | DMSqlValueSelector;
  /** Defines the upper bound of the range. */
  toValue: number | DMSqlValueSelector;
  /** Defines the range label. Will be used as grouping node's display label. */
  rangeLabel?: string | DMSqlValueSelector;
}

/**
 * A data structure for defining base class grouping.
 * @public
 */
interface DMSqlSelectClauseBaseClassGroupingParams extends DMSqlSelectClauseGroupingParamsBase {
  fullClassNames: string[] | DMSqlValueSelector[];
}

/**
 * An interface of a factory that knows how to create nodes' select DMSQL query.
 * @public
 */
export interface NodesQueryClauseFactory {
  /** Create a SELECT clause in a format understood by nodes query parser used by `HierarchyProvider`. */
  createSelectClause(props: NodeSelectClauseProps): Promise<string>;

  /**
   * Creates the necessary DMSQL snippets to create an instance filter described by the given `GenericInstanceFilter` argument.
   * - `from` is set to either the `contentClass.fullName` or one of `filter.propertyClassNames`, depending on which is more specific.
   * - `joins` is set to a number of `JOIN` clauses required to join all relationships described by `filter.relatedInstances`.
   * - `where` is set to a `WHERE` clause (without the `WHERE` keyword) that filters instances by classes on
   * `filter.filterClassNames` and by properties as described by `filter.rules`.
   *
   * Special cases:
   * - If `filter` is `undefined`, `joins` and `where` are set to empty strings and `from` is set to `contentClass.fullName`.
   * - If the provided content class doesn't intersect with the property class in provided filter, a special result
   * is returned to make sure the resulting query is valid and doesn't return anything.
   */
  createFilterClauses(props: {
    contentClass: { fullName: string; alias: string };
    filter: GenericInstanceFilter | undefined;
  }): Promise<{ from: string; where: string; joins: string }>;
}

/**
 * Creates an instance of `NodeSelectQueryFactory`.
 * @public
 */
export function createNodesQueryClauseFactory(props: {
  ivaultAccess: DMSchemaProvider & DMClassHierarchyInspector;
  instanceLabelSelectClauseFactory: IInstanceLabelSelectClauseFactory;
}): NodesQueryClauseFactory {
  return new NodeSelectQueryFactory(props);
}

/** A factory for creating a nodes' select DMSQL query. */
class NodeSelectQueryFactory {
  private _ivaultAccess: DMSchemaProvider & DMClassHierarchyInspector;
  private _instanceLabelSelectClauseFactory: IInstanceLabelSelectClauseFactory;

  public constructor(props: {
    ivaultAccess: DMSchemaProvider & DMClassHierarchyInspector;
    instanceLabelSelectClauseFactory: IInstanceLabelSelectClauseFactory;
  }) {
    this._ivaultAccess = props.ivaultAccess;
    this._instanceLabelSelectClauseFactory = props.instanceLabelSelectClauseFactory;
  }

  /** Create a SELECT clause in a format understood by results reader of the library. */
  public async createSelectClause(props: NodeSelectClauseProps) {
    // note: the columns order must match the order in `NodeSelectClauseColumnNames`
    return `
      dm_ClassName(${props.dmClassId.selector}) AS ${NodeSelectClauseColumnNames.FullClassName},
      ${props.dmInstanceId.selector} AS ${NodeSelectClauseColumnNames.DMInstanceId},
      ${createDMSqlValueSelector(props.nodeLabel)} AS ${NodeSelectClauseColumnNames.DisplayLabel},
      CAST(${createDMSqlValueSelector(props.hasChildren)} AS BOOLEAN) AS ${NodeSelectClauseColumnNames.HasChildren},
      CAST(${createDMSqlValueSelector(props.hideIfNoChildren)} AS BOOLEAN) AS ${NodeSelectClauseColumnNames.HideIfNoChildren},
      CAST(${createDMSqlValueSelector(props.hideNodeInHierarchy)} AS BOOLEAN) AS ${NodeSelectClauseColumnNames.HideNodeInHierarchy},
      ${props.grouping ? await createGroupingSelector(props.grouping, this._ivaultAccess, this._instanceLabelSelectClauseFactory) : "CAST(NULL AS TEXT)"} AS ${NodeSelectClauseColumnNames.Grouping},
      ${
        props.extendedData
          ? `json_object(${Object.entries(props.extendedData)
              .map(([key, value]) => `'${key}', ${createDMSqlValueSelector(value)}`)
              .join(", ")})`
          : "CAST(NULL AS TEXT)"
      } AS ${NodeSelectClauseColumnNames.ExtendedData},
      CAST(${createDMSqlValueSelector(props.autoExpand)} AS BOOLEAN) AS ${NodeSelectClauseColumnNames.AutoExpand},
      CAST(${createDMSqlValueSelector(props.supportsFiltering)} AS BOOLEAN) AS ${NodeSelectClauseColumnNames.SupportsFiltering}
    `;
  }

  /**
   * Creates the necessary DMSQL snippets to create an instance filter described by the `filter` argument.
   * - `from` is set to either the `contentClass.fullName` or one of `filter.propertyClassNames`, depending on which is more specific.
   * - `joins` is set to a number of `JOIN` clauses required to join all relationships described by `filter.relatedInstances`.
   * - `where` is set to a `WHERE` clause (without the `WHERE` keyword) that filters instances by classes on
   * `filter.filterClassNames` and by properties as described by `filter.rules`.
   *
   * Special cases:
   * - If `filter` is `undefined`, `joins` and `where` are set to empty strings and `from` is set to `contentClass.fullName`.
   * - If the provided content class doesn't intersect with the property class in provided filter, a special result
   * is returned to make sure the resulting query is valid and doesn't return anything.
   */
  public async createFilterClauses(props: {
    contentClass: { fullName: string; alias: string };
    filter: GenericInstanceFilter | undefined;
  }): Promise<{ from: string; where: string; joins: string }> {
    const { contentClass, filter } = props;
    if (!filter) {
      // undefined filter means we don't want any filtering to be applied
      return { from: contentClass.fullName, joins: "", where: "" };
    }

    const from = await specializeContentClass({
      classHierarchyInspector: this._ivaultAccess,
      contentClassName: contentClass.fullName,
      filterClassNames: filter.propertyClassNames,
    });
    if (!from) {
      // filter class doesn't intersect with content class - make sure the query returns nothing by returning a `FALSE` WHERE clause
      return { from: contentClass.fullName, joins: "", where: "FALSE" };
    }

    /**
     * TODO:
     * There may be similar related instance paths, e.g.:
     * - A -> B -> C,
     * - A -> B -> D.
     * At this moment we're handling each path individually which means A and B would get joined twice. We could look into
     * creating a join tree first, e.g.
     *         C
     *        /
     * A -> B
     *        \
     *         D
     */
    const joins = await Promise.all(
      filter.relatedInstances.map(async (rel, i) =>
        DMSql.createRelationshipPathJoinClause({
          schemaProvider: this._ivaultAccess,
          path: assignRelationshipPathAliases(rel.path, i, contentClass.alias, rel.alias),
        }),
      ),
    );

    const whereConditions = new Array<string>();
    if (filter.filteredClassNames && filter.filteredClassNames.length > 0) {
      whereConditions.push(
        `${DMSql.createRawPropertyValueSelector(contentClass.alias, "DMClassId")} IS (
          ${filter.filteredClassNames
            .map(parseFullClassName)
            .map(({ schemaName, className }) => `[${schemaName}].[${className}]`)
            .join(", ")}
        )`,
      );
    }
    const classAliasMap = new Map<string, string>([[contentClass.alias, from]]);
    filter.relatedInstances.forEach(
      ({ path, alias }) => path.length > 0 && classAliasMap.set(alias, path[path.length - 1].targetClassName),
    );
    const propertiesFilter = await createWhereClause(
      contentClass.alias,
      async (alias) => {
        const aliasClassName = classAliasMap.get(alias);
        return aliasClassName ? getClass(this._ivaultAccess, aliasClassName) : undefined;
      },
      filter.rules,
    );
    if (propertiesFilter) {
      whereConditions.push(propertiesFilter);
    }

    return { from, joins: joins.join("\n"), where: whereConditions.join(" AND ") };
  }
}

function createDMSqlValueSelector(input: undefined | PrimitiveValue | DMSqlValueSelector) {
  if (input === undefined) {
    return "NULL";
  }
  if (isSelector(input)) {
    return input.selector;
  }
  return DMSql.createRawPrimitiveValueSelector(input);
}

function isSelector(x: any): x is DMSqlValueSelector {
  return !!x.selector;
}

async function createGroupingSelector(
  grouping: DMSqlSelectClauseGroupingParams,
  ivaultAccess: DMSchemaProvider & DMClassHierarchyInspector,
  instanceLabelSelectClauseFactory: IInstanceLabelSelectClauseFactory,
): Promise<string> {
  const groupingSelectors = new Array<{ key: string; selector: string }>();

  grouping.byLabel &&
    groupingSelectors.push({
      key: "byLabel",
      selector:
        typeof grouping.byLabel === "boolean" || isSelector(grouping.byLabel)
          ? createDMSqlValueSelector(grouping.byLabel)
          : serializeJsonObject(createLabelGroupingBaseParamsSelectors(grouping.byLabel)),
    });

  grouping.byClass &&
    groupingSelectors.push({
      key: "byClass",
      selector:
        typeof grouping.byClass === "boolean" || isSelector(grouping.byClass)
          ? createDMSqlValueSelector(grouping.byClass)
          : serializeJsonObject(createBaseGroupingParamSelectors(grouping.byClass)),
    });

  grouping.byBaseClasses &&
    groupingSelectors.push({
      key: "byBaseClasses",
      selector: serializeJsonObject([
        {
          key: "fullClassNames",
          selector: `json_array(${grouping.byBaseClasses.fullClassNames.map((className) => createDMSqlValueSelector(className)).join(", ")})`,
        },
        ...createBaseGroupingParamSelectors(grouping.byBaseClasses),
      ]),
    });

  // TODO: MISSING_COVERAGE
  /* v8 ignore else -- @preserve */
  if (grouping.byProperties) {
    const propertyClass = await getClass(ivaultAccess, grouping.byProperties.propertiesClassName);
    groupingSelectors.push({
      key: "byProperties",
      selector: serializeJsonObject([
        {
          key: "propertiesClassName",
          selector: `${createDMSqlValueSelector(grouping.byProperties.propertiesClassName)}`,
        },
        {
          key: "propertyGroups",
          selector: `json_array(${(
            await Promise.all(
              grouping.byProperties.propertyGroups.map(async (propertyGroup) =>
                serializeJsonObject(
                  await createPropertyGroupSelectors(propertyGroup, propertyClass, instanceLabelSelectClauseFactory),
                ),
              ),
            )
          ).join(", ")})`,
        },
        ...(grouping.byProperties.createGroupForOutOfRangeValues !== undefined
          ? [
              {
                key: "createGroupForOutOfRangeValues",
                selector: `CAST(${createDMSqlValueSelector(grouping.byProperties.createGroupForOutOfRangeValues)} AS BOOLEAN)`,
              },
            ]
          : []),
        ...(grouping.byProperties.createGroupForUnspecifiedValues !== undefined
          ? [
              {
                key: "createGroupForUnspecifiedValues",
                selector: `CAST(${createDMSqlValueSelector(grouping.byProperties.createGroupForUnspecifiedValues)} AS BOOLEAN)`,
              },
            ]
          : []),
        ...createBaseGroupingParamSelectors(grouping.byProperties),
      ]),
    });
  }

  return serializeJsonObject(groupingSelectors);
}

function createLabelGroupingBaseParamsSelectors(
  byLabel: DMSqlSelectClauseLabelGroupingMergeParams | DMSqlSelectClauseLabelGroupingGroupParams,
) {
  const selectors = new Array<{ key: string; selector: string }>();
  if (byLabel.action !== undefined) {
    selectors.push({ key: "action", selector: `${createDMSqlValueSelector(byLabel.action)}` });
  }
  if (byLabel.groupId !== undefined) {
    selectors.push({ key: "groupId", selector: createDMSqlValueSelector(byLabel.groupId) });
  }
  if (byLabel.action !== "merge") {
    selectors.push(...createBaseGroupingParamSelectors(byLabel));
  }

  return selectors;
}

async function createPropertyGroupSelectors(
  propertyGroup: DMSqlSelectClausePropertyGroup,
  propertyClass: DM.Class,
  instanceLabelSelectClauseFactory: IInstanceLabelSelectClauseFactory,
) {
  const selectors = new Array<{ key: string; selector: string }>();
  selectors.push({ key: "propertyName", selector: `${createDMSqlValueSelector(propertyGroup.propertyName)}` });

  const property = await propertyClass.getProperty(propertyGroup.propertyName);
  if (!property) {
    throw new Error(`Property "${propertyGroup.propertyName}" not found in DMClass "${propertyClass.fullName}".`);
  }

  if (property.isNavigation()) {
    const relationshipClass = await property.relationshipClass;
    const abstractConstraint =
      property.direction === "Forward"
        ? await relationshipClass.target.abstractConstraint
        : await relationshipClass.source.abstractConstraint;
    // TODO: MISSING_COVERAGE
    /* v8 ignore else -- @preserve */
    if (!abstractConstraint) {
      throw new Error(`Could not determine class name for navigation property with direction "${property.direction}".`);
    }

    const fullName = abstractConstraint.fullName;
    const targetAlias = "target";
    selectors.push({
      key: "propertyValue",
      selector: `(
          SELECT ${await instanceLabelSelectClauseFactory.createSelectClause({ className: fullName, classAlias: targetAlias })}
          FROM ${fullName} AS ${targetAlias}
          WHERE [${targetAlias}].[DMInstanceId] = [${propertyGroup.propertyClassAlias}].[${propertyGroup.propertyName}].[Id]
        )`,
    });
  } else {
    selectors.push({
      key: "propertyValue",
      selector: `[${propertyGroup.propertyClassAlias}].[${propertyGroup.propertyName}]`,
    });
  }

  if (propertyGroup.ranges) {
    selectors.push(createRangeParamSelectors(propertyGroup.ranges));
  }

  return selectors;
}

function createRangeParamSelectors(ranges: DMSqlSelectClausePropertyValueRange[]) {
  return {
    key: "ranges",
    selector: `json_array(${ranges
      .map((range) =>
        serializeJsonObject([
          { key: "fromValue", selector: createDMSqlValueSelector(range.fromValue) },
          { key: "toValue", selector: createDMSqlValueSelector(range.toValue) },
          ...(range.rangeLabel
            ? [{ key: "rangeLabel", selector: `${createDMSqlValueSelector(range.rangeLabel)}` }]
            : []),
        ]),
      )
      .join(", ")})`,
  };
}

function createBaseGroupingParamSelectors(params: DMSqlSelectClauseGroupingParamsBase) {
  const selectors = new Array<{ key: string; selector: string }>();
  if (params.hideIfNoSiblings !== undefined) {
    selectors.push({ key: "hideIfNoSiblings", selector: createDMSqlValueSelector(params.hideIfNoSiblings) });
  }
  if (params.hideIfOneGroupedNode !== undefined) {
    selectors.push({ key: "hideIfOneGroupedNode", selector: createDMSqlValueSelector(params.hideIfOneGroupedNode) });
  }
  if (params.autoExpand !== undefined) {
    selectors.push({ key: "autoExpand", selector: createDMSqlValueSelector(params.autoExpand) });
  }
  return selectors;
}

function serializeJsonObject(selectors: Array<{ key: string; selector: string }>): string {
  return `json_object(${selectors.map(({ key, selector }) => `'${key}', ${selector}`).join(", ")})`;
}

async function createWhereClause(
  contentClassAlias: string,
  classLoader: (alias: string) => Promise<DM.Class | undefined>,
  rule: GenericInstanceFilterRule | GenericInstanceFilterRuleGroup,
): Promise<string | undefined> {
  if (GenericInstanceFilter.isFilterRuleGroup(rule)) {
    const clause = (
      await Promise.all(rule.rules.map(async (r) => createWhereClause(contentClassAlias, classLoader, r)))
    )
      .filter((c) => !!c)
      .join(` ${getDMSqlLogicalOperator(rule.operator)} `);
    return clause ? (rule.operator === "or" ? `(${clause})` : clause) : undefined;
  }
  const sourceAlias = rule.sourceAlias ? rule.sourceAlias : contentClassAlias;
  const propertyValueSelector = DMSql.createRawPropertyValueSelector(sourceAlias, rule.propertyName);
  if (isUnaryRuleOperator(rule.operator)) {
    switch (rule.operator) {
      case "is-true":
        return propertyValueSelector;
      case "is-false":
        return `NOT ${propertyValueSelector}`;
      case "is-null":
        return `${propertyValueSelector} IS NULL`;
      case "is-not-null":
        return `${propertyValueSelector} IS NOT NULL`;
    }
  }
  const ecsqlOperator = getDMSqlComparisonOperator(rule.operator);
  if (rule.value === undefined) {
    throw new Error(`Rule "${rule.propertyName}" ${ecsqlOperator} is missing value.`);
  }

  const value = rule.value.rawValue;

  if (rule.operator === "like" && typeof value === "string") {
    const escapedValue = value.replace(/[%_\\]/g, "\\$&");
    return `${propertyValueSelector} ${ecsqlOperator} '%${escapedValue}%' ESCAPE '\\'`;
  }
  const propertyClass = await classLoader(sourceAlias);
  if (!propertyClass) {
    throw new Error(`Class with alias "${sourceAlias}" not found.`);
  }
  const property = await propertyClass.getProperty(rule.propertyName);
  if (!property) {
    throw new Error(`Property "${rule.propertyName}" not found in DMClass "${propertyClass.fullName}".`);
  }
  if (property.isNavigation()) {
    assert(rule.value !== undefined && GenericInstanceFilterRuleValue.isInstanceKey(value));
    return `${propertyValueSelector}.[Id] ${ecsqlOperator} ${DMSql.createRawPrimitiveValueSelector(value.id)}`;
  }
  if (property.isEnumeration()) {
    assert(rule.value !== undefined && !GenericInstanceFilterRuleValue.isInstanceKey(value));
    return `${propertyValueSelector} ${ecsqlOperator} ${DMSql.createRawPrimitiveValueSelector(value)}`;
  }
  if (property.isPrimitive()) {
    assert(rule.value !== undefined && !GenericInstanceFilterRuleValue.isInstanceKey(value));
    switch (property.primitiveType) {
      case "Point2d": {
        assert(rule.operator === "is-equal" || rule.operator === "is-not-equal");
        assert(PrimitiveValue.isPoint2d(value));
        const condition = `
          ${createFloatingPointEqualityClause(`${propertyValueSelector}.[x]`, "is-equal", value.x)}
          AND ${createFloatingPointEqualityClause(`${propertyValueSelector}.[y]`, "is-equal", value.y)}
        `;
        return rule.operator === "is-equal" ? condition : `NOT (${condition})`;
      }
      case "Point3d": {
        assert(rule.operator === "is-equal" || rule.operator === "is-not-equal");
        assert(PrimitiveValue.isPoint3d(value));
        const condition = `
          ${createFloatingPointEqualityClause(`${propertyValueSelector}.[x]`, "is-equal", value.x)}
          AND ${createFloatingPointEqualityClause(`${propertyValueSelector}.[y]`, "is-equal", value.y)}
          AND ${createFloatingPointEqualityClause(`${propertyValueSelector}.[z]`, "is-equal", value.z)}
        `;
        return rule.operator === "is-equal" ? condition : `NOT (${condition})`;
      }
      case "Double": {
        assert(typeof value === "number");
        if (rule.operator === "is-equal" || rule.operator === "is-not-equal") {
          return `${createFloatingPointEqualityClause(propertyValueSelector, rule.operator, value)}`;
        }
        return `${propertyValueSelector} ${ecsqlOperator} ${DMSql.createRawPrimitiveValueSelector(value)}`;
      }
      default: {
        return `${propertyValueSelector} ${ecsqlOperator} ${DMSql.createRawPrimitiveValueSelector(value)}`;
      }
    }
  }
  throw new Error("Struct and array properties are not supported for filtering");
}

function createFloatingPointEqualityClause(
  valueSelector: string,
  operator: "is-equal" | "is-not-equal",
  value: number,
) {
  const [from, to] = getFloatingPointValueRange(value);
  return `${valueSelector} ${operator === "is-not-equal" ? "NOT " : ""} BETWEEN ${from} AND ${to}`;
}

function getFloatingPointValueRange(value: number): [number, number] {
  return [value - Number.EPSILON, value + Number.EPSILON];
}

function getDMSqlLogicalOperator(op: GenericInstanceFilterRuleGroupOperator) {
  switch (op) {
    case "and":
      return "AND";
    case "or":
      return "OR";
  }
}

function isUnaryRuleOperator(
  op: GenericInstanceFilterRuleOperator,
): op is Extract<GenericInstanceFilterRuleOperator, "is-true" | "is-false" | "is-null" | "is-not-null"> {
  return op === "is-true" || op === "is-false" || op === "is-null" || op === "is-not-null";
}

function getDMSqlComparisonOperator(
  op: Exclude<GenericInstanceFilterRuleOperator, "is-true" | "is-false" | "is-null" | "is-not-null">,
) {
  switch (op) {
    case "is-equal":
      return `=`;
    case "is-not-equal":
      return `<>`;
    case "greater":
      return `>`;
    case "greater-or-equal":
      return `>=`;
    case "less":
      return `<`;
    case "less-or-equal":
      return `<=`;
    case "like":
      return `LIKE`;
  }
}

type JoinRelationshipPath = Props<typeof DMSql.createRelationshipPathJoinClause>["path"];
function assignRelationshipPathAliases(
  path: GenericInstanceFilterRelationshipStep[],
  pathIndex: number,
  sourceAlias: string,
  targetAlias: string,
): JoinRelationshipPath {
  function createAlias(fullClassName: string, index: number) {
    return `rel_${pathIndex}_${fullClassName.replaceAll(/[\.:]/g, "_")}_${index}`;
  }
  const result: JoinRelationshipPath = [];
  path.forEach((step, i) => {
    result.push({
      targetClassName: step.targetClassName,
      relationshipName: step.relationshipClassName,
      sourceClassName: step.sourceClassName,
      relationshipReverse: !step.isForwardRelationship,
      sourceAlias: i === 0 ? sourceAlias : result[i - 1].targetAlias,
      relationshipAlias: createAlias(step.relationshipClassName, i),
      targetAlias: i === path.length - 1 ? targetAlias : createAlias(step.targetClassName, i),
      joinType: "inner",
    });
  });
  return result;
}

interface SpecializeContentClassProps {
  classHierarchyInspector: DMClassHierarchyInspector;
  contentClassName: string;
  filterClassNames: string[];
}
async function specializeContentClass(props: SpecializeContentClassProps): Promise<string | undefined> {
  const filterClass = await getSpecializedPropertyClass(props.classHierarchyInspector, props.filterClassNames);
  if (!filterClass) {
    return props.contentClassName;
  }
  if (await props.classHierarchyInspector.classDerivesFrom(filterClass, props.contentClassName)) {
    return filterClass;
  }
  if (await props.classHierarchyInspector.classDerivesFrom(props.contentClassName, filterClass)) {
    return props.contentClassName;
  }
  return undefined;
}

async function getSpecializedPropertyClass(
  classHierarchyInspector: DMClassHierarchyInspector,
  classes: string[],
): Promise<string | undefined> {
  if (classes.length === 0) {
    return undefined;
  }
  const [currClassName, ...restClasses] = classes;
  let resolvedClassName = currClassName;
  for (const propClassName of restClasses) {
    if (await classHierarchyInspector.classDerivesFrom(propClassName, resolvedClassName)) {
      resolvedClassName = propClassName;
    }
  }
  return resolvedClassName;
}
