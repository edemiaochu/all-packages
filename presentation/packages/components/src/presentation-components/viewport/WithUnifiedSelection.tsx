/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Viewport
 */

import "../common/DisposePolyfill.js";

import { createContext, memo, PropsWithChildren, useContext, useEffect, useState } from "react";
import { ViewportProps } from "@szewtwin/ivault-components-react";
import { getDisplayName } from "../common/Utils.js";
import { ViewportSelectionHandler } from "./ViewportSelectionHandler.js";

/**
 * Props that are injected to the ViewWithUnifiedSelection HOC component.
 * @public
 * @deprecated in 5.3.x This interface is empty.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ViewWithUnifiedSelectionProps {}

const ViewportSelectionHandlerContext = createContext<ViewportSelectionHandler | undefined>(undefined);

/** @internal */
export function ViewportSelectionHandlerContextProvider({
  selectionHandler,
  children,
}: PropsWithChildren<{ selectionHandler: ViewportSelectionHandler }>) {
  return (
    <ViewportSelectionHandlerContext.Provider value={selectionHandler}>
      {children}
    </ViewportSelectionHandlerContext.Provider>
  );
}

/** @internal */
export function useViewportSelectionHandlerContext() {
  return useContext(ViewportSelectionHandlerContext);
}

/**
 * A HOC component that adds unified selection functionality to the supplied
 * viewport component.
 *
 * @public
 * @deprecated in 5.7. Use `enableUnifiedSelectionSyncWithIVault` from `@szewtwin/unified-selection` package instead.
 */
export function viewWithUnifiedSelection<P extends ViewportProps>(
  ViewportComponent: React.ComponentType<P>,
): React.ComponentType<P> {
  const WithUnifiedSelection = memo<P>((props) => {
    const { ivault } = props;
    const [viewportSelectionHandler, setViewportSelectionHandler] = useState<ViewportSelectionHandler>();
    const selectionHandler = useViewportSelectionHandlerContext();

    // apply currentSelection when 'viewportSelectionHandler' is initialized (set to handler from props or new is created)
    useEffect(() => {
      if (selectionHandler) {
        selectionHandler.applyCurrentSelection();
        setViewportSelectionHandler(selectionHandler);
        return;
      }

      const handler = new ViewportSelectionHandler({ ivault });
      handler.applyCurrentSelection();
      setViewportSelectionHandler(handler);
      return () => {
        handler[Symbol.dispose]();
      };
    }, [selectionHandler, ivault]);

    // set new ivault on 'viewportSelectionHandler' when it changes
    useEffect(() => {
      if (!viewportSelectionHandler) {
        return;
      }
      viewportSelectionHandler.ivault = ivault;
    }, [viewportSelectionHandler, ivault]);

    return <ViewportComponent {...props} />;
  });

  WithUnifiedSelection.displayName = `WithUnifiedSelection(${getDisplayName(ViewportComponent)})`;
  return WithUnifiedSelection;
}
