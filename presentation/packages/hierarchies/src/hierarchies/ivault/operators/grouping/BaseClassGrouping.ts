/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import {
  createMainThreadReleaseOnTimePassedHandler,
  DM,
  DMClassHierarchyInspector,
  DMSchemaProvider,
  getClass,
} from "@szewtwin/presentation-shared";
import { HierarchyNode, ParentHierarchyNode } from "../../../HierarchyNode.js";
import { ClassGroupingNodeKey } from "../../../HierarchyNodeKey.js";
import { ProcessedInstanceHierarchyNode } from "../../IVaultHierarchyNode.js";
import { GroupingHandler, GroupingHandlerResult } from "../Grouping.js";

/** @internal */
export async function getBaseClassGroupingDMClasses(
  schemaProvider: DMSchemaProvider,
  parentNode: ParentHierarchyNode | undefined,
  nodes: ProcessedInstanceHierarchyNode[],
): Promise<DM.Class[]> {
  // Get all base class names that are provided in the grouping information
  const baseClassesFullClassNames = await getGroupingBaseClassNames(nodes);
  if (baseClassesFullClassNames.size === 0) {
    return [];
  }

  const releaseMainThread = createMainThreadReleaseOnTimePassedHandler();
  const baseClasses = [];
  for (const fullName of baseClassesFullClassNames) {
    await releaseMainThread();
    baseClasses.push(await getClass(schemaProvider, fullName));
  }
  const sortedClasses = await sortByBaseClass(
    baseClasses.filter((baseClass) => baseClass.isRelationshipClass() || baseClass.isEntityClass()),
  );

  if (parentNode && HierarchyNode.isClassGroupingNode(parentNode)) {
    // if we have a class grouping node, we can cut the front of sortedClasses up to a point where our grouping class is
    const cutPosition = sortedClasses.findIndex((c) => c.fullName === parentNode.key.className);
    if (cutPosition >= 0) {
      return sortedClasses.slice(cutPosition + 1);
    }
    return [];
  }

  return sortedClasses;
}

/** @internal */
export async function createBaseClassGroupsForSingleBaseClass(
  nodes: ProcessedInstanceHierarchyNode[],
  baseDMClass: DM.Class,
  classHierarchyInspector: DMClassHierarchyInspector,
): Promise<GroupingHandlerResult> {
  const releaseMainThread = createMainThreadReleaseOnTimePassedHandler();
  const groupedNodes = new Array<ProcessedInstanceHierarchyNode>();
  const ungroupedNodes = new Array<ProcessedInstanceHierarchyNode>();
  const baseClassFullName = baseDMClass.fullName;
  for (const node of nodes) {
    await releaseMainThread();
    if (
      !node.processingParams?.grouping?.byBaseClasses ||
      !node.processingParams.grouping.byBaseClasses.fullClassNames.some((className) => className === baseClassFullName)
    ) {
      ungroupedNodes.push(node);
      continue;
    }
    const fullCurrentNodeClassName = node.key.instanceKeys[0].className;

    const baseCheckerResult = classHierarchyInspector.classDerivesFrom(fullCurrentNodeClassName, baseClassFullName);

    const isCurrentNodeClassOfBase =
      baseCheckerResult instanceof Promise ? await baseCheckerResult : /* v8 ignore next */ baseCheckerResult;

    if (isCurrentNodeClassOfBase) {
      groupedNodes.push(node);
    } else {
      ungroupedNodes.push(node);
    }
  }

  const result: GroupingHandlerResult = { grouped: [], ungrouped: ungroupedNodes, groupingType: "base-class" };
  if (groupedNodes.length > 0) {
    const groupingNodeKey: ClassGroupingNodeKey = { type: "class-grouping", className: baseClassFullName };
    result.grouped.push({
      label: baseDMClass.label ?? baseDMClass.name,
      key: groupingNodeKey,
      parentKeys: [...groupedNodes[0].parentKeys],
      groupedInstanceKeys: groupedNodes.flatMap((groupedInstanceNode) => groupedInstanceNode.key.instanceKeys),
      children: groupedNodes.map((gn) => Object.assign(gn, { parentKeys: [...gn.parentKeys, groupingNodeKey] })),
    });
  }
  return result;
}

async function getGroupingBaseClassNames(nodes: ProcessedInstanceHierarchyNode[]) {
  const releaseMainThread = createMainThreadReleaseOnTimePassedHandler();
  const baseClasses = new Set<string>();
  for (const node of nodes) {
    await releaseMainThread();
    if (node.processingParams?.grouping?.byBaseClasses) {
      for (const className of node.processingParams.grouping.byBaseClasses.fullClassNames) {
        baseClasses.add(className);
      }
    }
  }
  return baseClasses;
}

async function sortByBaseClass(classes: DM.Class[]): Promise<DM.Class[]> {
  if (classes.length === 0) {
    return classes;
  }
  const output: DM.Class[] = [classes[0]];
  for (let inputIndex = 1; inputIndex < classes.length; ++inputIndex) {
    let wasAdded = false;
    for (let outputIndex = output.length - 1; outputIndex >= 0; --outputIndex) {
      if (await classes[inputIndex].is(output[outputIndex])) {
        output.splice(outputIndex + 1, 0, classes[inputIndex]);
        wasAdded = true;
        break;
      }
    }
    if (!wasAdded) {
      output.splice(0, 0, classes[inputIndex]);
    }
  }

  return output;
}

/** @internal */
export async function createBaseClassGroupingHandlers(
  ivaultAccess: DMSchemaProvider & DMClassHierarchyInspector,
  parentNode: ParentHierarchyNode | undefined,
  nodes: ProcessedInstanceHierarchyNode[],
): Promise<GroupingHandler[]> {
  const baseClassGroupingDMClasses = await getBaseClassGroupingDMClasses(ivaultAccess, parentNode, nodes);
  return baseClassGroupingDMClasses.map(
    (baseDMClass) => async (allNodes) => createBaseClassGroupsForSingleBaseClass(allNodes, baseDMClass, ivaultAccess),
  );
}
