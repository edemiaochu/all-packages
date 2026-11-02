/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { renderHook } from "@testing-library/react-hooks";

import { ids } from "../../tests/helpers";
import { SZEWTwinFull } from "../../types";
import { useSZEWTwinFilter } from "./useSZEWTwinFilter";

describe("useSZEWTwinFilter hook", () => {
  it("filter correctly with a string", () => {
    const expected = ["2", "3"];
    const szewTwins: SZEWTwinFull[] = [
      {
        id: "1",
        displayName: "NotFound",
        number: "NotFound",
      },
      {
        id: "2",
        displayName: "StringIsFoundInName",
        number: "NotFound",
      },
      {
        id: "3",
        displayName: "NotFound",
        number: "StringIsFoundInDescription",
      },
      {
        id: "4",
        displayName: "NotHere",
        number: "NorHere",
      },
      {
        id: "5",
        displayName: "c",
        number: "a",
      },
    ];
    const { result } = renderHook(() => useSZEWTwinFilter(szewTwins, "Is"));
    expect(result.current.map(ids)).toEqual(expected);
  });

  it("do not modify input array", () => {
    const expected = ["1", "2", "3", "4", "5"];
    const szewTwins: SZEWTwinFull[] = [
      {
        id: "1",
        displayName: "c",
        status: "Active",
      },
      {
        id: "2",
        displayName: "a",
        status: "Active",
      },
      {
        id: "3",
        displayName: "e",
        status: "Trial",
      },
      {
        id: "4",
        displayName: "d",
        status: "Trial",
      },
      {
        id: "5",
        displayName: "b",
        status: "Inactive",
      },
    ];
    const { result } = renderHook(() => useSZEWTwinFilter(szewTwins, "a"));

    expect(result.current).not.toBe(szewTwins);
    expect(szewTwins.map(ids)).toEqual(expected);
  });

  it("return provided array on undefined options", () => {
    const szewTwins: SZEWTwinFull[] = [
      {
        id: "1",
        displayName: "c",
        status: "Active",
      },
      {
        id: "2",
        displayName: "a",
        status: "Active",
      },
      {
        id: "3",
        displayName: "e",
        status: "Trial",
      },
      {
        id: "4",
        displayName: "d",
        status: "Trial",
      },
      {
        id: "5",
        displayName: "b",
        status: "Inactive",
      },
    ];
    const { result } = renderHook(() => useSZEWTwinFilter(szewTwins, undefined));
    expect(result.current).toBe(szewTwins);
  });
});
