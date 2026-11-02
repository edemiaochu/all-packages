/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { act, renderHook } from "@testing-library/react";
import {
  SyncUiEventDispatcher,
  UiFramework,
  useActiveIVaultConnection,
} from "../../appui-react.js";
import { createBlankConnection } from "../TestUtils.js";

it("useActiveIVaultConnection", () => {
  expect(UiFramework.frameworkState).toBeDefined();

  const { result } = renderHook(() => useActiveIVaultConnection());
  expect(result.current).toBeUndefined();
  expect(UiFramework.getIVaultConnection()).toBeUndefined();
  expect(
    UiFramework.frameworkState?.sessionState.iVaultConnection
  ).toBeUndefined();

  const initEventStub = vi.spyOn(
    SyncUiEventDispatcher,
    "initializeConnectionEvents"
  );
  const clearEventStub = vi.spyOn(
    SyncUiEventDispatcher,
    "clearConnectionEvents"
  );

  const newConnection = createBlankConnection({ name: "new" });

  // should trigger dispatch action
  act(() => {
    UiFramework.setIVaultConnection(newConnection, true);
  });
  expect(result.current?.name).toEqual("new");
  expect(
    UiFramework.frameworkState?.sessionState.iVaultConnection?.name
  ).toEqual("new");
  expect(UiFramework.getIVaultConnection()?.name).toEqual("new");
  expect(initEventStub).toHaveBeenCalled();
  expect(clearEventStub).not.toBeCalled();
  initEventStub.mockReset();

  // already set, so should not trigger dispatch action
  act(() => {
    UiFramework.setIVaultConnection(newConnection, true);
  });
  expect(initEventStub).not.toBeCalled();
  expect(clearEventStub).not.toBeCalled();

  // should trigger clearing action
  act(() => {
    UiFramework.setIVaultConnection(undefined, true);
  });
  expect(result.current).toBeUndefined();
  expect(UiFramework.getIVaultConnection()).toBeUndefined();
  expect(
    UiFramework.frameworkState?.sessionState.iVaultConnection
  ).toBeUndefined();
  expect(clearEventStub).toHaveBeenCalled();
  expect(initEventStub).not.toBeCalled();
});

it("useActiveIVaultConnection w/o redux", () => {
  vi.spyOn(UiFramework, "frameworkState", "get").mockReturnValue(undefined);

  const { result } = renderHook(() => useActiveIVaultConnection());
  expect(result.current).toBeUndefined();
  expect(UiFramework.getIVaultConnection()).toBeUndefined();

  const newConnection = createBlankConnection({ name: "new" });

  act(() => {
    UiFramework.setIVaultConnection(newConnection, true);
  });
  expect(result.current?.name).toEqual("new");
  expect(UiFramework.getIVaultConnection()?.name).toEqual("new");

  act(() => {
    UiFramework.setIVaultConnection(undefined, true);
  });
  expect(result.current).toBeUndefined();
  expect(UiFramework.getIVaultConnection()).toBeUndefined();
});
