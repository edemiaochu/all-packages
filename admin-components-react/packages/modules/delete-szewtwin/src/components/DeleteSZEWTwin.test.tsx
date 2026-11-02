/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { act, render } from "@testing-library/react";
import React from "react";

import { DeleteSZEWTwin } from "./DeleteSZEWTwin";

describe("DeleteSZEWTwin", () => {
  const fetchMock = jest.fn(() => Promise.resolve({ ok: true } as Response));
  global.fetch = fetchMock;

  beforeEach(() => {
    fetchMock.mockClear();
  });

  it("should open delete szewTwin", () => {
    const { getByText } = render(
      <DeleteSZEWTwin
        szewTwin={{ id: "111", displayName: "test szewTwin" }}
        accessToken="dd"
      />
    );

    const title = document.querySelector(
      ".iac-delete-szewtwin-dialog-title"
    ) as HTMLElement;
    expect(title.textContent).toBe(`Delete an szewTwin 'test szewTwin'`);
    expect(title.querySelector(".iac-warning-icon")).toBeTruthy();
    getByText(
      "Deleting this szewTwin will remove access for all users and all data will no longer be available. Are you sure you want to delete this szewTwin?"
    );
  });

  it("should delete szewTwin", async () => {
    const successMock = jest.fn();

    const { getByText } = render(
      <DeleteSZEWTwin
        szewTwin={{ id: "111", displayName: "test szewTwin" }}
        apiOverrides={{ serverEnvironmentPrefix: "dev" }}
        accessToken="dd"
        onSuccess={successMock}
      />
    );

    const button = getByText("Yes") as HTMLButtonElement;
    await act(async () => button.click());
    expect(fetchMock).toHaveBeenCalledWith(
      "https://dev-api.szewec.com/szewtwins/111",
      {
        method: "DELETE",
        headers: { Authorization: "dd" },
      }
    );
    expect(successMock).toHaveBeenCalled();
  });

  it("should return error when failed to delete szewTwin", async () => {
    const failureMock = jest.fn();
    const error = new Error("Fail");
    fetchMock.mockImplementationOnce(() => Promise.reject(error));
    const { getByText } = render(
      <DeleteSZEWTwin
        szewTwin={{ id: "111", displayName: "test szewTwin" }}
        accessToken="dd"
        onError={failureMock}
      />
    );

    const button = getByText("Yes") as HTMLButtonElement;
    await act(async () => button.click());
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.szewec.com/szewtwins/111",
      {
        method: "DELETE",
        headers: { Authorization: "dd" },
      }
    );
    expect(failureMock).toHaveBeenCalledWith(error);
  });

  it("should close dialog", () => {
    const closeMock = jest.fn();

    const { getByText } = render(
      <DeleteSZEWTwin
        szewTwin={{ id: "111", displayName: "test szewTwin" }}
        accessToken="dd"
        onClose={closeMock}
      />
    );

    const button = getByText("No") as HTMLButtonElement;
    act(() => button.click());
    expect(fetchMock).not.toHaveBeenCalled();
    expect(closeMock).toHaveBeenCalled();
  });
});
