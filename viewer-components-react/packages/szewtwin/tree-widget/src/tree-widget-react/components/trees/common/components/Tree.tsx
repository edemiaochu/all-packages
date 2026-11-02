/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { useCallback, useState } from "react";
import { BeEvent } from "@szewtwin/core-szewec";
import { Flex, ProgressRadial, Text } from "@szewtwin/szewtwinui-react";
import { SchemaMetadataContextProvider } from "@szewtwin/presentation-components";
import { useIVaultUnifiedSelectionTree, useSelectionHandler } from "@szewtwin/presentation-hierarchies-react";
import { TreeWidget } from "../../../../TreeWidget.js";
import { useHierarchiesLocalization } from "../UseHierarchiesLocalization.js";
import { useHierarchyLevelFiltering } from "../UseHierarchyFiltering.js";
import { useIVaultAccess } from "../UseIVaultAccess.js";
import { useIVaultChangeListener } from "../UseIVaultChangeListener.js";
import { useNodeHighlighting } from "../UseNodeHighlighting.js";
import { useReportingAction, useTelemetryContext } from "../UseTelemetryContext.js";
import { Delayed } from "./Delayed.js";
import { ProgressOverlay } from "./ProgressOverlay.js";

import type { ReactNode } from "react";
import type { MarkRequired } from "@szewtwin/core-szewec";
import type { IVaultConnection } from "@szewtwin/core-frontend";
import type { SchemaContext } from "@szewtwin/dmschema-metadata";
import type { PresentationHierarchyNode, SelectionStorage, useIVaultTree } from "@szewtwin/presentation-hierarchies-react";
import type { HighlightInfo } from "../UseNodeHighlighting.js";
import type { FunctionProps } from "../Utils.js";
import type { TreeRendererProps } from "./TreeRenderer.js";

/** @beta */
export type TreeProps = Pick<FunctionProps<typeof useIVaultTree>, "getFilteredPaths" | "getHierarchyDefinition"> &
  Partial<Pick<FunctionProps<typeof useSelectionHandler>, "selectionMode">> & {
    /** iVault connection that should be used to pull data from. */
    ivault: IVaultConnection;
    /** Callback for getting `SchemaContext` for specific iVault. */
    getSchemaContext: (ivault: IVaultConnection) => SchemaContext;
    /** Unique tree component name that will be used as unified selection change event source when selecting node. */
    treeName: string;
    /** Unified selection storage that should be used by tree to handle tree selection changes. */
    selectionStorage: SelectionStorage;
    /**
     * An optional predicate to allow or prohibit selection of a node.
     * When not supplied, all nodes are selectable.
     */
    selectionPredicate?: (node: PresentationHierarchyNode) => boolean;
    /** Tree renderer that should be used to render tree data. */
    treeRenderer: (
      treeProps: Required<
        Pick<
          TreeRendererProps,
          "rootNodes" | "expandNode" | "onNodeClick" | "onNodeKeyDown" | "onFilterClick" | "isNodeSelected" | "getHierarchyLevelDetails" | "size" | "getLabel"
        >
      >,
    ) => ReactNode;
    /** Custom iVault access that is stored outside tree component. If not provided it new iVault access will be created using `ivault` prop. */
    ivaultAccess?: FunctionProps<typeof useIVaultTree>["ivaultAccess"];
    /** Size limit that should be applied on each hierarchy level. Default to `1000`. */
    hierarchyLevelSizeLimit?: number;
    /** Modifies the density of tree nodes. `enlarged` tree nodes have bigger button hit boxes. */
    density?: "default" | "enlarged";
    /** Message that should be renderer if there are no tree nodes. */
    noDataMessage?: ReactNode;
    /** Callback that this invoked when tree reloads. */
    onReload?: () => void;
    /** Options for highlighting node labels. */
    highlight?: HighlightInfo;
  };

/**
 * Default tree component that manages tree state and renders using supplied `treeRenderer`.
 * @beta
 */
export function Tree({ getSchemaContext, hierarchyLevelSizeLimit, selectionStorage, ivaultAccess: providedIVaultAccess, ...props }: TreeProps) {
  const { ivaultAccess, currentHierarchyLevelSizeLimit } = useIVaultAccess({
    ivault: props.ivault,
    ivaultAccess: providedIVaultAccess,
    getSchemaContext,
    hierarchyLevelSizeLimit,
  });
  return (
    <TreeBase
      {...props}
      getSchemaContext={getSchemaContext}
      selectionStorage={selectionStorage}
      ivaultAccess={ivaultAccess}
      currentHierarchyLevelSizeLimit={currentHierarchyLevelSizeLimit}
    />
  );
}

/** @internal */
export function TreeBase({ getSchemaContext, ...props }: MarkRequired<TreeProps, "ivaultAccess"> & { currentHierarchyLevelSizeLimit: number }) {
  return (
    <SchemaMetadataContextProvider ivault={props.ivault} schemaContextProvider={getSchemaContext}>
      <TreeBaseImpl {...props} />
    </SchemaMetadataContextProvider>
  );
}

function TreeBaseImpl({
  ivault,
  ivaultAccess,
  treeName,
  noDataMessage,
  getFilteredPaths,
  currentHierarchyLevelSizeLimit,
  getHierarchyDefinition,
  selectionPredicate,
  selectionMode,
  onReload,
  treeRenderer,
  density,
  highlight,
  selectionStorage,
}: MarkRequired<Omit<TreeProps, "getSchemaContext">, "ivaultAccess"> & { currentHierarchyLevelSizeLimit: number }) {
  const localizedStrings = useHierarchiesLocalization();
  const { onFeatureUsed, onPerformanceMeasured } = useTelemetryContext();
  const [ivaultChanged] = useState(new BeEvent<() => void>());
  const {
    rootNodes,
    getNode,
    isLoading,
    selectNodes: selectNodesAction,
    setFormatter: _setFormatter,
    expandNode,
    ...treeProps
  } = useIVaultUnifiedSelectionTree({
    ivaultAccess,
    ivaultChanged,
    getHierarchyDefinition,
    getFilteredPaths,
    sourceName: treeName,
    localizedStrings,
    selectionStorage,
    onPerformanceMeasured: (action, duration) => {
      if (action === "reload") {
        onReload?.();
      }
      onPerformanceMeasured(action, duration);
    },
    onHierarchyLimitExceeded: () => onFeatureUsed({ featureId: "hierarchy-level-size-limit-hit", reportInteraction: false }),
    onHierarchyLoadError: ({ type, error }) => {
      // eslint-disable-next-line no-console
      console.error(error);
      onFeatureUsed({ featureId: `error-${type}`, reportInteraction: false });
    },
  });
  useIVaultChangeListener({ ivault, action: useCallback(() => ivaultChanged.raiseEvent(), [ivaultChanged]) });

  const selectNodes = useSelectionPredicate({
    action: useReportingAction({ action: selectNodesAction }),
    predicate: selectionPredicate,
    getNode,
  });
  const { onNodeClick, onNodeKeyDown } = useSelectionHandler({ rootNodes, selectNodes, selectionMode: selectionMode ?? "single" });
  const { filteringDialog, onFilterClick } = useHierarchyLevelFiltering({
    ivault,
    defaultHierarchyLevelSizeLimit: currentHierarchyLevelSizeLimit,
  });
  const reportingExpandNode = useReportingAction({ action: expandNode });
  const reportingOnFilterClicked = useReportingAction({ action: onFilterClick });
  const { getLabel } = useNodeHighlighting({ rootNodes, highlight });

  if (rootNodes === undefined) {
    return (
      <Flex alignItems="center" justifyContent="center" flexDirection="column" style={{ width: "100%", height: "100%" }}>
        <Delayed show={true}>
          <ProgressRadial size="large" />
        </Delayed>
      </Flex>
    );
  }

  if (rootNodes.length === 0 && !isLoading) {
    return (
      <Flex alignItems="center" justifyContent="center" flexDirection="column" style={{ width: "100%", height: "100%" }}>
        {noDataMessage ? noDataMessage : <Text>{TreeWidget.translate("baseTree.dataIsNotAvailable")}</Text>}
      </Flex>
    );
  }

  const treeRendererProps: FunctionProps<TreeProps["treeRenderer"]> = {
    ...treeProps,
    rootNodes,
    onNodeClick,
    onNodeKeyDown,
    expandNode: reportingExpandNode,
    onFilterClick: reportingOnFilterClicked,
    getLabel,
    size: density === "enlarged" ? "default" : "small",
  };

  return (
    <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>
      <div id="tw-tree-renderer-container" style={{ height: "100%" }}>
        {treeRenderer(treeRendererProps)}
        {filteringDialog}
      </div>
      <Delayed show={isLoading}>
        <ProgressOverlay />
      </Delayed>
    </div>
  );
}

function useSelectionPredicate({
  action,
  predicate,
  getNode,
}: {
  action: (...args: any[]) => void;
  predicate?: (node: PresentationHierarchyNode) => boolean;
  getNode: (nodeId: string) => PresentationHierarchyNode | undefined;
}): ReturnType<typeof useIVaultUnifiedSelectionTree>["selectNodes"] {
  return useCallback(
    (nodeIds, changeType) =>
      action(
        nodeIds.filter((nodeId) => {
          const node = getNode(nodeId);
          return node && (!predicate || predicate(node));
        }),
        changeType,
      ),
    [action, getNode, predicate],
  );
}
