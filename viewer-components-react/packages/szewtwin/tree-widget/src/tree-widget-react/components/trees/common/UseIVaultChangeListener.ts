/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { useEffect } from "react";
import { registerTxnListeners } from "@szewtwin/presentation-core-interop";

import type { IVaultConnection } from "@szewtwin/core-frontend";

interface UseIVaultChangeListenerProps {
  ivault: IVaultConnection;
  action: () => void;
}

export function useIVaultChangeListener({ ivault, action }: UseIVaultChangeListenerProps) {
  useEffect(() => {
    if (!ivault.isBriefcaseConnection()) {
      return;
    }
    return registerTxnListeners(ivault.txns, action);
  }, [ivault, action]);
}
