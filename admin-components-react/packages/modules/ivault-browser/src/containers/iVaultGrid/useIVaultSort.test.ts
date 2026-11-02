/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { renderHook } from "@testing-library/react-hooks";

import { IVaultFull, IVaultSortOptionsKeys } from "../../types";
import { useIVaultSort } from "./useIVaultSort";

describe("useIVaultSort hook", () => {
  it.each(["name", "createdDateTime"] as IVaultSortOptionsKeys[])(
    "sorts correctly with %s",
    (sortType) => {
      const expectedSortOrder = {
        name: ["3", "4", "1", "2", "5"],
        createdDateTime: ["4", "5", "2", "3", "1"],
      }[sortType];
      const iVaults: IVaultFull[] = [
        {
          id: "1",
          displayName: "d",
          name: "c",
          description: "e",
          state: "initialized",
          createdDateTime: "2020-09-05T12:42:51.593Z",
        },
        {
          id: "2",
          displayName: "a",
          name: "d",
          description: "d",
          state: "initialized",
          createdDateTime: "2020-09-03T12:42:51.593Z",
        },
        {
          id: "3",
          displayName: "e",
          name: "a",
          description: "c",
          state: "notInitialized",
          createdDateTime: "2020-09-04T12:42:51.593Z",
        },
        {
          id: "4",
          displayName: "b",
          name: "b",
          description: "b",
          state: "notInitialized",
          createdDateTime: "2020-09-01T12:42:51.593Z",
        },
        {
          id: "5",
          displayName: "c",
          name: "d",
          description: "a",
          state: "initialized",
          createdDateTime: "2020-09-02T12:42:51.593Z",
        },
      ];
      const { result, rerender } = renderHook(
        (props: { descending: boolean }) =>
          useIVaultSort(iVaults, { sortType, descending: props.descending }),
        { initialProps: { descending: false } }
      );
      expect(result.current.map((iVault) => iVault.id)).toEqual(
        expectedSortOrder
      );

      rerender({ descending: true });
      expect(result.current.map((iVault) => iVault.id)).toEqual(
        expectedSortOrder.reverse()
      );
    }
  );

  it("do not modify input array", () => {
    const expectedSortOrder = ["1", "2", "3", "4", "5"];
    const iVaults: IVaultFull[] = [
      {
        id: "1",
        displayName: "d",
        name: "c",
        description: "e",
        state: "initialized",
        createdDateTime: "2020-09-05T12:42:51.593Z",
      },
      {
        id: "2",
        displayName: "a",
        name: "d",
        description: "d",
        state: "initialized",
        createdDateTime: "2020-09-03T12:42:51.593Z",
      },
      {
        id: "3",
        displayName: "e",
        name: "a",
        description: "c",
        state: "notInitialized",
        createdDateTime: "2020-09-04T12:42:51.593Z",
      },
      {
        id: "4",
        displayName: "b",
        name: "b",
        description: "b",
        state: "notInitialized",
        createdDateTime: "2020-09-01T12:42:51.593Z",
      },
      {
        id: "5",
        displayName: "c",
        name: "d",
        description: "a",
        state: "initialized",
        createdDateTime: "2020-09-02T12:42:51.593Z",
      },
    ];
    const { result } = renderHook(() =>
      useIVaultSort(iVaults, { sortType: "name", descending: false })
    );
    expect(result.current).not.toBe(iVaults);
    expect(iVaults.map((iVault) => iVault.id)).toEqual(expectedSortOrder);
  });

  it("return provided array on undefined options", () => {
    const iVaults: IVaultFull[] = [
      {
        id: "1",
        displayName: "c",
        state: "initialized",
      },
      {
        id: "2",
        displayName: "a",
        state: "initialized",
      },
      {
        id: "3",
        displayName: "e",
        state: "notInitialized",
      },
      {
        id: "4",
        displayName: "d",
        state: "notInitialized",
      },
      {
        id: "5",
        displayName: "b",
        state: "initialized",
      },
    ];
    const { result } = renderHook(() => useIVaultSort(iVaults, undefined));
    expect(result.current).toBe(iVaults);
  });

  it("return provided array on unsupported sortType", () => {
    const iVaults: IVaultFull[] = [
      {
        id: "1",
        displayName: "c",
        state: "initialized",
      },
      {
        id: "2",
        displayName: "a",
        state: "initialized",
      },
      {
        id: "3",
        displayName: "e",
        state: "notInitialized",
      },
      {
        id: "4",
        displayName: "d",
        state: "notInitialized",
      },
      {
        id: "5",
        displayName: "b",
        state: "initialized",
      },
    ];
    const { result } = renderHook(() =>
      useIVaultSort(iVaults, {
        sortType: "thumbnail" as any,
        descending: false,
      })
    );
    expect(result.current).toBe(iVaults);
  });
});
