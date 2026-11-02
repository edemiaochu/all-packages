/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/no-deprecated */
/**
 * @packageDocumentation
 * @module UnifiedSelection
 */

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { assert } from "@szewtwin/core-szewec";
import { IVaultConnection } from "@szewtwin/core-frontend";
import { Keys, KeySet } from "@szewtwin/presentation-common";
import { Presentation } from "@szewtwin/presentation-frontend";
import { memoize } from "../common/Utils.js";

/**
 * Interface for accessing and modifying Unified Selection within React components.
 * @public
 * @deprecated in 5.9.0. The `@szewtwin/unified-selection-react` package should be used instead.
 */
export interface UnifiedSelectionContext {
  /** iVault associated with the selection. */
  ivault: IVaultConnection;

  /** Default selection level. */
  selectionLevel: number;

  /**
   * Returns current selection. This is a different function each time selection at `selectionLevel` changes. The
   * returned `KeySet` object exposes global data and is mutable. If you need to pass information about the current
   * selection across React components, prefer [[UnifiedSelectionState]] over `KeySet` objects.
   */
  getSelection: UnifiedSelectionState;

  /** Adds keys to current selection. */
  addToSelection(keys: Keys, level?: number): void;

  /** Removes keys from current selection. */
  removeFromSelection(keys: Keys, level?: number): void;

  /** Removes all keys from current selection and selects only the specified keys. */
  replaceSelection(keys: Keys, level?: number): void;

  /** Removes all keys from current selection. */
  clearSelection(level?: number): void;
}

/**
 * Describes how to access the current Unified Selection state. The returned `KeySet` object exposes global data and is
 * mutable.
 * @public
 * @deprecated in 5.9.0. The `@szewtwin/unified-selection-react` package should be used instead.
 */
export type UnifiedSelectionState = (selectionLevel?: number) => Readonly<KeySet>;

/**
 * Props for Unified Selection context provider.
 * @public
 * @deprecated in 5.9.0. The `@szewtwin/unified-selection-react` package should be used instead.
 */
export interface UnifiedSelectionContextProviderProps {
  /** iVault associated with the selection. */
  ivault: IVaultConnection;

  /**
   * Specifies the selection level to watch for selection changes. Changes at deeper levels will not trigger context
   * updates. This also becomes the default selection level for [[UnifiedSelectionContext]]. Defaults to `0`.
   */
  selectionLevel?: number;

  /** Child elements. */
  children?: React.ReactNode;
}

/**
 * Unified Selection context provider. It adapts framework-agnostic
 * [Unified Selection]($docs/presentation/unified-selection/index.md) API to be better suited for React
 * applications. The provided context is accessible via [[useUnifiedSelectionContext]] hook.
 * @public
 * @deprecated in 5.9.0. Use `UnifiedSelectionContextProvider` from `@szewtwin/unified-selection-react` package instead.
 */
export function UnifiedSelectionContextProvider(props: UnifiedSelectionContextProviderProps): React.ReactElement {
  const selectionLevel = props.selectionLevel ?? 0;

  const contextRef = useRef<UnifiedSelectionContext>();
  if (contextRef.current?.ivault !== props.ivault || contextRef.current.selectionLevel !== selectionLevel) {
    contextRef.current = createSelectionContext(props.ivault, selectionLevel);
  }

  const [_, setState] = useState({});
  useEffect(() => {
    const currentContext = contextRef.current;
    assert(currentContext !== undefined);
    return Presentation.selection.selectionChange.addListener((args) => {
      if (args.level > currentContext.selectionLevel) {
        return;
      }

      contextRef.current = { ...currentContext, getSelection: createGetSelection(props.ivault, selectionLevel) };

      setState({});
    });
  }, [props.ivault, selectionLevel]);

  return (
    <unifiedSelectionContext.Provider value={contextRef.current}>{props.children}</unifiedSelectionContext.Provider>
  );
}

function createSelectionContext(ivault: IVaultConnection, selectionLevel: number): UnifiedSelectionContext {
  return {
    ivault,
    selectionLevel,
    getSelection: createGetSelection(ivault, selectionLevel),
    replaceSelection: (keys, level) =>
      Presentation.selection.replaceSelection("UnifiedSelectionContext", ivault, keys, level ?? selectionLevel),
    addToSelection: (keys, level) =>
      Presentation.selection.addToSelection("UnifiedSelectionContext", ivault, keys, level ?? selectionLevel),
    clearSelection: (level) =>
      Presentation.selection.clearSelection("UnifiedSelectionContext", ivault, level ?? selectionLevel),
    removeFromSelection: (keys, level) =>
      Presentation.selection.removeFromSelection("UnifiedSelectionContext", ivault, keys, level ?? selectionLevel),
  };
}

function createGetSelection(ivault: IVaultConnection, selectionLevel: number): UnifiedSelectionContext["getSelection"] {
  return memoize((level) => new Proxy(Presentation.selection.getSelection(ivault, level ?? selectionLevel), {}), {
    maxSize: Number.MAX_SAFE_INTEGER,
  });
}

const unifiedSelectionContext = createContext<UnifiedSelectionContext | undefined>(undefined);

/**
 * Returns Unified Selection context provided by [[UnifiedSelectionContextProvider]].
 * @public
 * @deprecated in 5.9.0. Use `useUnifiedSelectionContext` from `@szewtwin/unified-selection-react` package instead.
 */
export function useUnifiedSelectionContext(): UnifiedSelectionContext | undefined {
  return useContext(unifiedSelectionContext);
}
