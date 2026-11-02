/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { DefaultViewOverlay, UiFramework } from "@szewtwin/appui-react";
import { IVaultApp, ScreenViewport, ViewState } from "@szewtwin/core-frontend";
import { ViewportComponent } from "@szewtwin/ivault-components-react";

type ViewportComponentProps = React.ComponentProps<typeof ViewportComponent>;

interface ViewportContentProps extends Partial<ViewportComponentProps> {
  contentId?: string;
  viewState?: ViewState;
  renderViewOverlay?: (viewport: ScreenViewport) => React.ReactNode;
}

export function ViewportContent({
  contentId,
  ivault,
  viewState,
  renderViewOverlay,
}: ViewportContentProps) {
  let [iVault] = React.useState(UiFramework.getIVaultConnection());
  const [defaultViewState] = React.useState(UiFramework.getDefaultViewState());
  const [viewport, setViewport] = React.useState<ScreenViewport | undefined>(
    undefined
  );
  const viewportRef = React.useRef<ScreenViewport | undefined>(undefined);

  React.useEffect(() => {
    // Maintain the selected view if the content is active.
    return IVaultApp.viewManager.onSelectedViewportChanged.addListener(
      (selectedViewport) => {
        if (!viewportRef.current) return;
        if (selectedViewport.current === viewportRef.current) return;

        const activeContentId = UiFramework.content.getActiveId();
        if (activeContentId !== contentId) return;

        void IVaultApp.viewManager.setSelectedView(viewportRef.current);
      }
    );
  }, [contentId, viewport]);

  iVault = ivault ?? iVault;
  viewState = viewState ?? defaultViewState;
  if (!iVault) return null;

  return (
    <>
      <ViewportComponent
        viewState={viewState}
        ivault={iVault}
        viewportRef={(v) => {
          viewportRef.current = v;
          setViewport(v);
        }}
      />
      <ViewOverlayRenderer
        viewport={viewport}
        renderViewOverlay={renderViewOverlay}
      />
    </>
  );
}

interface ViewOverlayRendererProps
  extends Pick<ViewportContentProps, "renderViewOverlay"> {
  viewport: ScreenViewport | undefined;
}

function ViewOverlayRenderer({
  viewport,
  renderViewOverlay,
}: ViewOverlayRendererProps): React.ReactNode {
  if (!viewport) return null;

  if (renderViewOverlay) {
    return renderViewOverlay(viewport);
  }

  return (
    <DefaultViewOverlay
      viewport={viewport}
      analysisTimeline={true}
      solarTimeline={true}
      scheduleAnimation={true}
    />
  );
}
