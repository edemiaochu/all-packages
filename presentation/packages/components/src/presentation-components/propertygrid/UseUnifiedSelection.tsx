/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module PropertyGrid
 */

import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { from, map, Subject, switchMap, takeLast } from "rxjs";
import { IVaultConnection } from "@szewtwin/core-frontend";
import { KeySet } from "@szewtwin/presentation-common";
import { createIVaultKey } from "@szewtwin/presentation-core-interop";
import { Presentation, SelectionChangeEventArgs, SelectionHandler } from "@szewtwin/presentation-frontend";
import { SelectionStorage } from "@szewtwin/unified-selection";
import { createKeySetFromSelectables, safeDispose } from "../common/Utils.js";
import { IPresentationPropertyDataProvider } from "./DataProvider.js";

const DEFAULT_REQUESTED_CONTENT_INSTANCES_LIMIT = 100;

/**
 * Props for the [[usePropertyDataProviderWithUnifiedSelection]] hook
 * @public
 */
export interface PropertyDataProviderWithUnifiedSelectionProps {
  /** The data provider used by the property grid. */
  dataProvider: IPresentationPropertyDataProvider;

  /**
   * Maximum number of instances to request content for.
   *
   * When the number of selected instances is higher than this value, `dataProvider.keys` is set to an
   * empty [KeySet]($presentation-common) and the result of the hook has `isOverLimit = true`.
   *
   * Defaults to `100`.
   */
  requestedContentInstancesLimit?: number;

  /**
   * Unified selection storage to use for listening and getting active selection.
   *
   * When not specified, the deprecated `SelectionManager` from `@szewtwin/presentation-frontend` package
   * is used.
   */
  selectionStorage?: SelectionStorage;
}

/**
 * [[usePropertyDataProviderWithUnifiedSelection]] return type.
 * @public
 */
export interface UsePropertyDataProviderWithUnifiedSelectionResult {
  /** Whether selected element count is exceeding the limit. */
  isOverLimit: boolean;
  /** Selected element count. */
  numSelectedElements: number;
}

// eslint-disable-next-line @typescript-eslint/no-deprecated
const SelectionHandlerContext = createContext<SelectionHandler | undefined>(undefined);

/** @internal */
export function SelectionHandlerContextProvider({
  selectionHandler,
  children,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
}: PropsWithChildren<{ selectionHandler: SelectionHandler }>) {
  return <SelectionHandlerContext.Provider value={selectionHandler}>{children}</SelectionHandlerContext.Provider>;
}

/** @internal */
export function useSelectionHandlerContext() {
  return useContext(SelectionHandlerContext);
}

/**
 * A React hook that adds unified selection functionality to the provided data provider.
 * @public
 */
export function usePropertyDataProviderWithUnifiedSelection(
  props: PropertyDataProviderWithUnifiedSelectionProps,
): UsePropertyDataProviderWithUnifiedSelectionResult {
  const { dataProvider, selectionStorage } = props;
  const { ivault, rulesetId } = dataProvider;
  const requestedContentInstancesLimit =
    props.requestedContentInstancesLimit ?? DEFAULT_REQUESTED_CONTENT_INSTANCES_LIMIT;
  const [numSelectedElements, setNumSelectedElements] = useState(0);

  const suppliedSelectionHandler = useSelectionHandlerContext();

  useEffect(() => {
    function onSelectionChanged(newSelection: KeySet) {
      setNumSelectedElements(newSelection.size);
      dataProvider.keys = isOverLimit(newSelection.size, requestedContentInstancesLimit) ? new KeySet() : newSelection;
    }
    if (selectionStorage) {
      return initUnifiedSelectionFromStorage({ ivault, selectionStorage, onSelectionChanged });
    }
    return initUnifiedSelectionFromPresentationFrontend({
      ivault,
      rulesetId,
      suppliedSelectionHandler,
      onSelectionChanged,
    });
  }, [dataProvider, ivault, rulesetId, requestedContentInstancesLimit, suppliedSelectionHandler, selectionStorage]);

  return { isOverLimit: isOverLimit(numSelectedElements, requestedContentInstancesLimit), numSelectedElements };
}

function initUnifiedSelectionFromStorage({
  ivault,
  selectionStorage,
  onSelectionChanged,
}: {
  ivault: IVaultConnection;
  selectionStorage: SelectionStorage;
  onSelectionChanged: (newSelection: KeySet) => void;
}) {
  const ivaultKey = createIVaultKey(ivault);
  const update = new Subject<number>();
  const subscription = update
    .pipe(
      map((level) => selectionStorage.getSelection({ ivaultKey, level })),
      switchMap(async (selectables) => createKeySetFromSelectables(selectables)),
    )
    .subscribe({ next: onSelectionChanged });
  const removeSelectionChangesListener = selectionStorage.selectionChangeEvent.addListener((args) => {
    const isMyIVault = args.ivaultKey === ivaultKey;
    isMyIVault && update.next(args.level);
  });

  from(selectionStorage.getSelectionLevels({ ivaultKey }))
    .pipe(takeLast(1))
    .subscribe({ next: (level) => update.next(level) });

  return () => {
    removeSelectionChangesListener();
    subscription.unsubscribe();
  };
}

function initUnifiedSelectionFromPresentationFrontend({
  suppliedSelectionHandler,
  ivault,
  rulesetId,
  onSelectionChanged,
}: {
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  suppliedSelectionHandler?: SelectionHandler;
  ivault: IVaultConnection;
  rulesetId: string;
  onSelectionChanged: (newSelection: KeySet) => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const updateProviderSelection = (selectionHandler: SelectionHandler, selectionLevel?: number) => {
    const selection = getSelectedKeys(selectionHandler, selectionLevel);
    selection && onSelectionChanged(selection);
  };

  /* v8 ignore start -- @preserve */
  const handler =
    suppliedSelectionHandler ??
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    new SelectionHandler({
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      manager: Presentation.selection,
      name: "PropertyGrid",
      ivault,
      rulesetId,
    });
  /* v8 ignore stop -- @preserve */

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  handler.onSelect = (evt: SelectionChangeEventArgs): void => {
    updateProviderSelection(handler, evt.level);
  };

  updateProviderSelection(handler);
  return () => {
    safeDispose(handler);
  };
}

// eslint-disable-next-line @typescript-eslint/no-deprecated
function getSelectedKeys(selectionHandler: SelectionHandler, selectionLevel?: number): KeySet | undefined {
  if (undefined === selectionLevel) {
    const availableLevels = selectionHandler.getSelectionLevels();
    if (0 === availableLevels.length) {
      return undefined;
    }
    selectionLevel = availableLevels[availableLevels.length - 1];
  }

  for (let i = selectionLevel; i >= 0; i--) {
    const selection = selectionHandler.getSelection(i);
    if (!selection.isEmpty) {
      return new KeySet(selection);
    }
  }
  return new KeySet();
}

function isOverLimit(numSelectedElements: number, limit: number): boolean {
  return numSelectedElements > limit;
}
