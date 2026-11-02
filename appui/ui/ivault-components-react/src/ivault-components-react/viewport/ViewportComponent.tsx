/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Viewport
 */

import * as React from "react";
import type { Id64String } from "@szewtwin/core-szewec";
import { Logger } from "@szewtwin/core-szewec";
import type { Point3d } from "@szewtwin/core-geometry";
import { Transform } from "@szewtwin/core-geometry";
import { NpcCenter } from "@szewtwin/core-common";
import type {
  IVaultConnection,
  TentativePoint,
  ViewManager,
  ViewState,
} from "@szewtwin/core-frontend";
import {
  IVaultApp,
  ScreenViewport,
  StandardView,
  ToolSettings,
} from "@szewtwin/core-frontend";
import type { CommonProps } from "@szewtwin/core-react";
import type { ListenerType } from "@szewtwin/core-react/internal";
import { ViewportComponentEvents } from "./ViewportComponentEvents.js";

/** Type for a ViewState prop
 * @public
 */
export type ViewStateProp = ViewState | (() => ViewState);

/**
 * Properties for [[ViewportComponent]] component.
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-deprecated
export interface ViewportProps extends CommonProps {
  /** IVault to display */
  ivault: IVaultConnection;
  /** Id of a default view definition to load as a starting point */
  viewDefinitionId?: Id64String;
  /** ViewState to use as a starting point */
  viewState?: ViewStateProp;
  /** Function to get a reference to the ScreenViewport */
  viewportRef?: (v: ScreenViewport) => void;
  /** controlId for this content component @internal */
  controlId?: string;
  /** @internal */
  onContextMenu?: (e: React.MouseEvent) => boolean;
  /** @internal */
  getViewOverlay?: (viewport: ScreenViewport) => React.ReactNode;
  /** @internal used only for testing */
  viewManagerOverride?: ViewManager;
  /** @internal used only for testing */
  screenViewportOverride?: typeof ScreenViewport;
  /** @internal used only for testing */
  tentativePointOverride?: TentativePoint;
}

/** A viewport React component that creates a ScreenViewport.
 * @public
 */
export function ViewportComponent(props: ViewportProps) {
  const {
    viewState,
    ivault,
    viewDefinitionId,
    getViewOverlay,
    viewManagerOverride,
    tentativePointOverride,
    onContextMenu,
    style,
    className,
    screenViewportOverride,
    controlId,
    viewportRef,
  } = props;
  const viewManagerRef = React.useRef(
    viewManagerOverride ?? IVaultApp.viewManager
  );
  const tentativePointOverrideRef = React.useRef(tentativePointOverride);
  const screenViewportCreated = React.useRef(false);
  const viewportDiv = React.useRef<HTMLDivElement>(null);
  const screenViewportRef = React.useRef<ScreenViewport | null>(null);
  const isMounted = React.useRef(false);
  const viewClassFullName = React.useRef("");
  const viewId = React.useRef("0");

  const handleViewChanged: ListenerType<ScreenViewport["onViewChanged"]> = (
    vp
  ) => {
    if (!(vp.iVault.isOpen || vp.iVault.isBlank)) return;
    ViewportComponentEvents.setViewMatrix(vp);
    if (viewClassFullName.current !== vp.view.classFullName) {
      setTimeout(() => {
        ViewportComponentEvents.onViewClassFullNameChangedEvent.emit({
          viewport: vp,
          oldName: viewClassFullName.current,
          newName: vp.view.classFullName,
        });
        viewClassFullName.current = vp.view.classFullName;
      });
    }
    if (viewId.current !== vp.view.id) {
      setTimeout(() => {
        ViewportComponentEvents.onViewIdChangedEvent.emit({
          viewport: vp,
          oldId: viewId.current,
          newId: vp.view.id,
        });
        viewId.current = vp.view.id;
      });
    }
  };

  const handleStandardRotationChangeEvent: ListenerType<
    typeof ViewportComponentEvents.onStandardRotationChangeEvent
  > = (args) => {
    const viewManager = viewManagerRef.current;
    const currentScreenViewport = screenViewportRef.current;
    if (
      currentScreenViewport &&
      viewManager.selectedView === currentScreenViewport
    ) {
      currentScreenViewport.view.setRotationAboutPoint(
        StandardView.getStandardRotation(args.standardRotation)
      );
      currentScreenViewport.synchWithView();
    }
  };

  const handleDrawingViewportChangeEvent: ListenerType<
    typeof ViewportComponentEvents.onDrawingViewportChangeEvent
  > = (args) => {
    const viewManager = viewManagerRef.current;
    const currentScreenViewport = screenViewportRef.current;
    if (
      currentScreenViewport &&
      viewManager.selectedView === currentScreenViewport
    ) {
      currentScreenViewport.view.setOrigin(args.origin);
      currentScreenViewport.view.setRotation(args.rotation);
      currentScreenViewport.synchWithView({
        noSaveInUndo: args.complete !== true,
      });
    }
  };

  const targetPoint = React.useRef<Point3d | null>(null);

  const getRotatePoint = (vp: ScreenViewport): Point3d => {
    const lastTargetPoint = targetPoint.current;
    const tentativePoint =
      tentativePointOverrideRef.current ?? IVaultApp.tentativePoint;
    if (tentativePoint.isActive) return tentativePoint.getPoint();

    if (null !== lastTargetPoint) {
      const testPt = vp.worldToView(lastTargetPoint);
      const viewRect = vp.viewRect.clone();
      viewRect.scaleAboutCenter(0.25, 0.25);
      if (viewRect.containsPoint(testPt)) return lastTargetPoint;
      targetPoint.current = null;
    }

    const visiblePoint = vp.pickNearestVisibleGeometry(
      vp.npcToWorld(NpcCenter),
      vp.pixelsFromInches(ToolSettings.viewToolPickRadiusInches)
    );
    targetPoint.current =
      undefined !== visiblePoint ? visiblePoint : vp.view.getTargetPoint();
    return targetPoint.current ?? vp.view.getCenter();
  };

  const handleCubeRotationChangeEvent: ListenerType<
    typeof ViewportComponentEvents.onCubeRotationChangeEvent
  > = (args) => {
    const viewManager = viewManagerRef.current;
    const currentScreenViewport = screenViewportRef.current;
    if (
      currentScreenViewport &&
      viewManager.selectedView === currentScreenViewport
    ) {
      const rotMatrix = args.rotMatrix;
      if (currentScreenViewport.rotation !== rotMatrix) {
        const inverse = rotMatrix.transpose(); // rotation is from current nav cube state...
        const center = getRotatePoint(currentScreenViewport);
        const targetMatrix = inverse.multiplyMatrixMatrix(
          currentScreenViewport.view.getRotation()
        );
        const worldTransform = Transform.createFixedPointAndMatrix(
          center,
          targetMatrix
        );
        const frustum = currentScreenViewport.getWorldFrustum();
        frustum.multiply(worldTransform);
        currentScreenViewport.view.setupFromFrustum(frustum);
        currentScreenViewport.synchWithView({ noSaveInUndo: !args.complete });
      }
    }
  };

  const handleDisconnectFromViewManager = () => {
    const screenViewport = screenViewportRef.current;
    if (screenViewport) {
      const viewManager = IVaultApp.viewManager;
      screenViewport.onViewChanged.removeListener(handleViewChanged);
      screenViewportRef.current = null;
      screenViewportCreated.current = false;
      ViewportComponentEvents.onDrawingViewportChangeEvent.removeListener(
        handleDrawingViewportChangeEvent
      );
      ViewportComponentEvents.onCubeRotationChangeEvent.removeListener(
        handleCubeRotationChangeEvent
      );
      ViewportComponentEvents.onStandardRotationChangeEvent.removeListener(
        handleStandardRotationChangeEvent
      );
      viewManager.dropViewport(screenViewport, true);
    }
  };

  const handleWindowUnload = () => {
    const parentDiv = viewportDiv.current;
    if (parentDiv) {
      const parentWindow = parentDiv.ownerDocument.defaultView as Window;
      if (parentWindow !== window) {
        handleDisconnectFromViewManager();
      }
    }
  };

  const getScreenViewport = (
    parentDiv: HTMLDivElement,
    inViewState: ViewState
  ) => {
    const screenViewportFactory = screenViewportOverride
      ? screenViewportOverride
      : ScreenViewport;
    const parentWindow = parentDiv.ownerDocument.defaultView as Window;
    parentWindow.addEventListener("unload", handleWindowUnload, {
      once: true,
      capture: true,
    }); // by specifying 'once', listener clears after being called
    ViewportComponentEvents.initialize();
    ViewportComponentEvents.onDrawingViewportChangeEvent.addListener(
      handleDrawingViewportChangeEvent
    );
    ViewportComponentEvents.onCubeRotationChangeEvent.addListener(
      handleCubeRotationChangeEvent
    );
    ViewportComponentEvents.onStandardRotationChangeEvent.addListener(
      handleStandardRotationChangeEvent
    );
    const screenViewport = screenViewportFactory.create(parentDiv, inViewState);
    screenViewportCreated.current = true;
    viewClassFullName.current = screenViewport.view.classFullName;
    viewId.current = screenViewport.view.id;
    screenViewport.onViewChanged.addListener(handleViewChanged);
    return screenViewport;
  };

  React.useEffect(() => {
    isMounted.current = true;
    Logger.logInfo(
      "ViewportComponent",
      `mounting ViewportComponent for controlId=${controlId}`
    );

    return () => {
      isMounted.current = false;
      Logger.logInfo(
        "ViewportComponent",
        `un-mounting ViewportComponent for controlId=${controlId}`
      );
      handleDisconnectFromViewManager();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [initialViewState, setInitialViewState] = React.useState<
    ViewState | undefined
  >(undefined);
  React.useEffect(() => {
    setInitialViewState(undefined);
  }, [viewDefinitionId, viewState]);
  React.useEffect(() => {
    async function fetchInitialViewState() {
      let currentViewState: ViewState | undefined;
      if (viewState) {
        if (typeof viewState === "function") currentViewState = viewState();
        else currentViewState = viewState;
      } else if (viewDefinitionId && ivault) {
        try {
          currentViewState = await ivault.views.load(viewDefinitionId);
          if (!currentViewState) {
            Logger.logError("ViewportComponent", `ViewState failed to load`);
          }
        } catch {
          Logger.logError("ViewportComponent", `ViewState failed to load`);
        }
      } else {
        Logger.logError(
          "ViewportComponent",
          `A ViewState or a viewId and ivault must be provided`
        );
      }
      if (
        isMounted.current &&
        (currentViewState?.iVault.isOpen || currentViewState?.iVault.isBlank)
      ) {
        setInitialViewState(currentViewState?.clone());
      }
    }
    if (undefined === initialViewState) void fetchInitialViewState();
  }, [ivault, initialViewState, viewDefinitionId, viewState]);

  const [viewOverlay, setViewOverlay] = React.useState<React.ReactNode>(null);

  // This useEffect connects to ViewManger as soon as initialViewState is available once component is mounted.
  React.useEffect(() => {
    const applyView = () => {
      const parentDiv = viewportDiv.current;
      const viewManager = viewManagerRef.current;
      if (
        parentDiv &&
        parentDiv.clientWidth > 0 &&
        parentDiv.clientHeight > 0 &&
        initialViewState &&
        (initialViewState?.iVault.isOpen || initialViewState?.iVault.isBlank)
      ) {
        if (!screenViewportCreated.current) {
          const screenViewport = getScreenViewport(parentDiv, initialViewState);
          screenViewportRef.current = screenViewport;

          if (viewportRef) viewportRef(screenViewport);

          Logger.logInfo(
            "ViewportComponent",
            `processing viewManager.addViewport for controlId=${controlId}`
          );
          viewManager.addViewport(screenViewport);

          // overlay component is set up once a ScreenViewport is available. The overlay component must handle any view changes itself.
          setViewOverlay(
            getViewOverlay ? getViewOverlay(screenViewport) : null
          );
        } else {
          screenViewportRef.current?.changeView(initialViewState);
        }
        return true;
      }
      return false;
    };

    let resizeObserver: ResizeObserver | undefined;
    let didApplyView = applyView();

    // instead of allowing an unhandled error to be thrown if we create a viewport when the parent div has width or height of 0.
    // we use a ResizeObserver to wait until the div has been resized to non-zero dimensions.
    if (!didApplyView && viewportDiv.current) {
      resizeObserver = new ResizeObserver(() => {
        if (
          viewportDiv.current &&
          viewportDiv.current.clientWidth > 0 &&
          viewportDiv.current.clientHeight > 0
        ) {
          didApplyView = applyView();
          if (didApplyView) {
            resizeObserver?.disconnect();
          }
        }
      });
      resizeObserver.observe?.(viewportDiv.current);
    }

    return () => {
      resizeObserver?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlId, initialViewState, viewportRef]);

  const handleContextMenu = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (onContextMenu) onContextMenu(e);
    },
    [onContextMenu]
  );

  const parentDivStyle: React.CSSProperties = {
    height: "100%",
    width: "100%",
    position: "relative",
  };

  const viewportDivStyle: React.CSSProperties = {
    ...style,
    height: "100%",
    width: "100%",
  };

  return (
    <div style={parentDivStyle} data-item-id={controlId}>
      <div
        ref={viewportDiv}
        data-testid="viewport-component"
        className={className}
        style={viewportDivStyle}
        onContextMenu={handleContextMenu}
      />
      {viewOverlay}
    </div>
  );
}
