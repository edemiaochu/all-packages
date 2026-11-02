/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import React from "react";

import {
  IVaultFull,
  IVaultSortOptions,
  IVaultSortOptionsKeys,
} from "../../types";

/** Runtime check that we are not fed invalid sort type */
function isSupportedSortType(
  sortType: string | undefined
): sortType is IVaultSortOptionsKeys {
  return (
    !!sortType &&
    [
      "displayName",
      "name",
      "description",
      "initialized",
      "createdDateTime",
    ].includes(sortType)
  );
}

const sortEitherEmptyValues = (a: any, b: any) => (!a && !b ? 0 : !a ? 1 : -1);
const sortBooleanOrEqualValues = (a: any, b: any) => (a === b ? 0 : a ? -1 : 1);
const sortStringValues = (a: string, b: string) => a.localeCompare(b);

export const useIVaultSort = (
  iVaults: IVaultFull[],
  options?: IVaultSortOptions,
  // needed to account for limitation of react hooks
  enableSort = true
) => {
  const sortType =
    typeof options !== "function" ? options?.sortType : undefined;
  const descending =
    typeof options !== "function" ? options?.descending ?? false : undefined;
  const sortFn = typeof options === "function" ? options : undefined;
  return React.useMemo(() => {
    if (!enableSort) {
      return iVaults;
    }
    if (sortFn) {
      return [...iVaults].sort(sortFn);
    }
    if (!isSupportedSortType(sortType)) {
      return iVaults;
    }
    const sorted = [...iVaults].sort(
      (iVaultA: IVaultFull, iVaultB: IVaultFull) => {
        const a = iVaultA[sortType];
        const b = iVaultB[sortType];
        if (typeof a === "boolean" || typeof b === "boolean" || a === b) {
          return sortBooleanOrEqualValues(a, b);
        }
        if (!a || !b) {
          return sortEitherEmptyValues(a, b);
        }
        // Look this file history on gitHub for dateTimeStringValuesSorting on "createdDateTime"
        return sortStringValues(a, b);
      }
    );
    return descending ? sorted.reverse() : sorted;
  }, [enableSort, sortFn, sortType, iVaults, descending]);
};
