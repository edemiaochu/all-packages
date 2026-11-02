/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import "./TreeWidgetUiItemsProvider.scss";

import { useRef } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { StagePanelLocation, StagePanelSection, useTransientState } from "@szewtwin/appui-react";
import { SvgHierarchyTree } from "@szewtwin/szewtwinui-icons-react";
import { SvgError } from "@szewtwin/szewtwinui-illustrations-react";
import { Button, NonIdealState } from "@szewtwin/szewtwinui-react";
import { TreeWidget } from "../TreeWidget.js";
import { SelectableTree } from "./SelectableTree.js";

import type { Ref } from "react";
import type { FallbackProps } from "react-error-boundary";
import type { Widget } from "@szewtwin/appui-react";
import type { SelectableTreeDefinition, SelectableTreeProps } from "./SelectableTree.js";

/**
 * Props for `createWidget`.
 * @public
 */
interface TreeWidgetProps {
  /**
   * Trees to show in the widget.
   * @see ModelsTreeComponent
   * @see CategoriesTreeComponent
   * @see ExternalSourcesTreeComponent
   * @see IVaultContentTreeComponent
   */
  trees: SelectableTreeDefinition[];
  /** Modifies the density of the tree widget. `enlarged` widget contains larger content */
  density?: "enlarged" | "default";
  /** Callback that is invoked when performance of tracked feature is measured. */
  onPerformanceMeasured?: (feature: string, elapsedTime: number) => void;
  /** Callback that is invoked when a tracked feature is used. */
  onFeatureUsed?: (feature: string) => void;
}

/**
 * Creates a tree widget definition that should be returned from `UiItemsProvider.getWidgets()`.
 * @public
 */
export function createTreeWidget(props: TreeWidgetProps): Widget {
  return {
    id: "tree-widget-react:trees",
    label: TreeWidget.translate("widget.label"),
    icon: <SvgHierarchyTree />,
    layouts: {
      standard: {
        section: StagePanelSection.Start,
        location: StagePanelLocation.Right,
      },
    },
    content: (
      <TreeWidgetComponent
        trees={props.trees}
        density={props.density}
        onPerformanceMeasured={props.onPerformanceMeasured}
        onFeatureUsed={props.onFeatureUsed}
      />
    ),
  };
}

/**
 * Tree widget component which allows selecting which tree to render.
 * @public
 */
export function TreeWidgetComponent(props: SelectableTreeProps) {
  const ref = useTreeWidgetTransientState();
  return (
    <div ref={ref} className="tree-widget">
      <ErrorBoundary FallbackComponent={ErrorState}>
        <SelectableTree {...props} />
      </ErrorBoundary>
    </div>
  );
}

function ErrorState({ resetErrorBoundary }: FallbackProps) {
  return (
    <NonIdealState
      svg={<SvgError />}
      heading={TreeWidget.translate("errorState.title")}
      description={TreeWidget.translate("errorState.description")}
      actions={
        <Button styleType={"high-visibility"} onClick={resetErrorBoundary}>
          {TreeWidget.translate("errorState.retryButtonLabel")}
        </Button>
      }
    />
  );
}

function useTreeWidgetTransientState() {
  const { ref, persist, restore } = useTreeStorage();
  useTransientState(persist, restore);
  return ref;
}

interface UseTreeStorageResult {
  ref: Ref<HTMLDivElement>;
  persist: () => void;
  restore: () => void;
}

function useTreeStorage(): UseTreeStorageResult {
  const ref = useRef<HTMLDivElement>(null);
  const scrollTop = useRef<number | undefined>();

  const getContainer = () => {
    return ref.current?.querySelector("#tw-tree-renderer");
  };

  const persist = () => {
    const container = getContainer();
    scrollTop.current = container?.scrollTop;
  };

  const restore = () => {
    setTimeout(() => {
      const container = getContainer();
      if (container && scrollTop.current) {
        container.scrollTop = scrollTop.current;
      }
    });
  };

  return { ref, persist, restore };
}
