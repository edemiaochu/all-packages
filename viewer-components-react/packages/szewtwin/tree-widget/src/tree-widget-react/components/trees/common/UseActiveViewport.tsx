/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";
import { IVaultApp } from "@szewtwin/core-frontend";

import type { ScreenViewport } from "@szewtwin/core-frontend";

/**
 * A copy of `useActiveViewport` from `@szewtwin/appui-react` package until X is fixed.
 * @internal
 */
export function useActiveViewport(): ScreenViewport | undefined {
  const [activeViewport, setActiveViewport] = useState(IVaultApp.viewManager.selectedView);
  useEffect(() => {
    setActiveViewport(IVaultApp.viewManager.selectedView);
    return IVaultApp.viewManager.onSelectedViewportChanged.addListener((args) => {
      setActiveViewport(args.current);
    });
  }, []);

  return activeViewport;
}
