/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { useActiveIVaultConnection } from "@szewtwin/appui-react";
import { TreeWidget } from "../../../TreeWidget.js";
import { TelemetryContextProvider } from "../common/UseTelemetryContext.js";
import { IVaultContentTree } from "./IVaultContentTree.js";

import type { IVaultContentTreeProps } from "./IVaultContentTree.js";

/** @beta */
interface IVaultContentTreeComponentProps
  extends Pick<IVaultContentTreeProps, "getSchemaContext" | "selectionStorage" | "density" | "hierarchyConfig" | "hierarchyLevelConfig" | "selectionMode"> {
  onPerformanceMeasured?: (featureId: string, duration: number) => void;
  onFeatureUsed?: (feature: string) => void;
}

/**
 * A component that renders `IVaultContentTree`.
 * @beta
 */
export const IVaultContentTreeComponent = ({ onFeatureUsed, onPerformanceMeasured, ...props }: IVaultContentTreeComponentProps) => {
  const ivault = useActiveIVaultConnection();

  if (!ivault) {
    return null;
  }

  return (
    <TelemetryContextProvider componentIdentifier={IVaultContentTreeComponent.id} onFeatureUsed={onFeatureUsed} onPerformanceMeasured={onPerformanceMeasured}>
      <IVaultContentTree {...props} ivault={ivault} />
    </TelemetryContextProvider>
  );
};

/**
 * Id of the component. May be used when a creating a `TreeDefinition` for `SelectableTree`.
 * @beta
 */
IVaultContentTreeComponent.id = "ivault-content-tree-v2";

/**
 * Label of the component. May be used when a creating a `TreeDefinition` for `SelectableTree`.
 * @beta
 */
IVaultContentTreeComponent.getLabel = () => TreeWidget.translate("ivaultContentTree.label");
