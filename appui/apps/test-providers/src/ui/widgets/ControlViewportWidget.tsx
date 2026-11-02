/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as React from "react";
import {
  FloatingViewportContent,
  UiFramework,
  useActiveIVaultConnection,
  useSpecificWidgetDef,
  WidgetState,
} from "@szewtwin/appui-react";
import { Id64, Id64String } from "@szewtwin/core-szewec";
import ViewDefinitionSelector from "../components/ViewDefinitionSelector.js";

/** Uses deprecated content control APIs. */
export function ControlViewportWidget() {
  const activeIVaultConnection = useActiveIVaultConnection();
  const [viewState, setViewState] = React.useState(
    UiFramework.getDefaultViewState()
  );
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [contentId, setContentId] = React.useState(
    "appui-test-provider:viewport-widget-content"
  );

  const widgetDef = useSpecificWidgetDef("appui-test-providers:ViewportWidget");
  React.useEffect(() => {
    // using setTimeout to give time for frontstage to load before calling setWidgetState
    setTimeout(() => widgetDef?.setWidgetState(WidgetState.Floating));
  }, [widgetDef]);

  React.useEffect(() => {
    async function setupView() {
      if (undefined === viewState && activeIVaultConnection) {
        const defaultViewId =
          // eslint-disable-next-line @typescript-eslint/no-deprecated
          await activeIVaultConnection?.views?.queryDefaultViewId();
        if (defaultViewId && Id64.isValidId64(defaultViewId)) {
          const newViewState = await activeIVaultConnection?.views.load(
            defaultViewId
          );
          newViewState && setViewState(newViewState.clone());
        }
      }
    }
    void setupView();
  }, [activeIVaultConnection, viewState]);

  React.useEffect(() => {
    const vs = viewState;
    if (!vs || typeof vs === "function") {
      setIsLoaded(true);
      return;
    }

    void (async () => {
      await vs.load();
      setIsLoaded(true);
    })();
  }, [viewState]);

  const onViewDefinitionChanged = React.useCallback(
    async (viewId?: Id64String) => {
      if (activeIVaultConnection && viewId) {
        const newViewState = await activeIVaultConnection.views.load(viewId);
        setViewState(newViewState);
        // the content control only gets updated in the ContentViewManager when the contentId changes, so change it when the viewstate changes
        const newContentId = `appui-test-provider:viewport-widget-content${viewId}`;
        setContentId(newContentId);
      }
    },
    [activeIVaultConnection]
  );

  if (!activeIVaultConnection || !isLoaded || !viewState)
    return <div>Empty View</div>;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "auto 1fr",
        height: "100%",
        position: "relative",
        minWidth: "400px",
        minHeight: "300px",
      }}
    >
      <div>
        <ViewDefinitionSelector
          ivault={viewState.iVault}
          selectedViewDefinition={viewState.id}
          onViewDefinitionSelected={onViewDefinitionChanged}
        />
      </div>
      <div>
        {/* eslint-disable-next-line @typescript-eslint/no-deprecated */}
        <FloatingViewportContent
          contentId={contentId}
          initialViewState={viewState}
        />
      </div>
    </div>
  );
}
