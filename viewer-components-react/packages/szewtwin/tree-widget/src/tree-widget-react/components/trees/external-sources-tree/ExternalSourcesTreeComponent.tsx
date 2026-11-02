/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { useActiveIVaultConnection } from "@szewtwin/appui-react";
import { TreeWidget } from "../../../TreeWidget.js";
import { TelemetryContextProvider } from "../common/UseTelemetryContext.js";
import { ExternalSourcesTree } from "./ExternalSourcesTree.js";

import type { ExternalSourcesTreeProps } from "./ExternalSourcesTree.js";

/** @beta */
interface ExternalSourcesTreeComponentProps
  extends Pick<ExternalSourcesTreeProps, "getSchemaContext" | "selectionStorage" | "selectionMode" | "density" | "hierarchyLevelConfig" | "selectionMode"> {
  onPerformanceMeasured?: (featureId: string, duration: number) => void;
  onFeatureUsed?: (feature: string) => void;
}

/**
 * A component that renders `ExternalSourcesTree`.
 * @beta
 */
export const ExternalSourcesTreeComponent = ({ onFeatureUsed, onPerformanceMeasured, ...props }: ExternalSourcesTreeComponentProps) => {
  const ivault = useActiveIVaultConnection();

  if (!ivault) {
    return null;
  }

  return (
    <TelemetryContextProvider componentIdentifier={ExternalSourcesTreeComponent.id} onFeatureUsed={onFeatureUsed} onPerformanceMeasured={onPerformanceMeasured}>
      <ExternalSourcesTree {...props} ivault={ivault} />
    </TelemetryContextProvider>
  );
};

/**
 * Id of the component. May be used when a creating a `TreeDefinition` for `SelectableTree`.
 * @beta
 */
ExternalSourcesTreeComponent.id = "external-sources-tree-v2";

/**
 * Label of the component. May be used when a creating a `TreeDefinition` for `SelectableTree`.
 * @beta
 */
ExternalSourcesTreeComponent.getLabel = () => TreeWidget.translate("externalSourcesTree.label");
