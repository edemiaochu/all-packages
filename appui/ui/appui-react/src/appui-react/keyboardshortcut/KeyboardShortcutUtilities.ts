/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module KeyboardShortcut
 */

import type { KeyboardShortcutProps } from "./KeyboardShortcutProps.js";
import { IVaultApp, type ToolType } from "@szewtwin/core-frontend";

/** Helper class to create keyboard shortcuts.
 * @beta
 */
export namespace KeyboardShortcutUtilities {
  /** Creates an shortcut from the specified tool type. */
  export function createForTool(
    key: string,
    toolType: ToolType,
    overrides?: Partial<KeyboardShortcutProps>
  ): KeyboardShortcutProps {
    return {
      key,
      icon: toolType.iconSpec,
      label: () => toolType.flyover,
      description: () => toolType.description,
      execute: () => {
        void IVaultApp.tools.run(toolType.toolId);
      },
      ...overrides,
    };
  }
}
