/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as defaults from "./UiIVaultComponents.json" with { type: "json" };
import * as React from "react";
import { usePackageTranslation } from "@szewtwin/core-react/internal";
import { UiIVaultComponents } from "./UiIVaultComponents.js";

/** Returns a translation function.
 * @internal
 */
export function useTranslation() {
  const fallback = React.useCallback((key: string) => {
    if (!UiIVaultComponents.initialized) {
      return undefined;
    }
    return UiIVaultComponents.translate(key);
  }, []);
  return usePackageTranslation({
    namespace: UiIVaultComponents.localizationNamespace,
    fallback,
    defaults,
  });
}
