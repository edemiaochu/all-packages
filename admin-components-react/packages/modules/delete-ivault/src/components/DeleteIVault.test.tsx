/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { act, render } from "@testing-library/react";
import React from "react";

import { DeleteIVault } from "./DeleteIVault";

jest.mock("@szewtwin/szewtwinui-react", () => ({
  ...jest.requireActual("@szewtwin/szewtwinui-react"),
  useToaster: () => ({
    positive: jest.fn(),
    informational: jest.fn(),
    negative: jest.fn(),
    warning: jest.fn(),
  }),
}));

describe("DeleteIVault", () => {
  const fetchMock = jest.fn(() => Promise.resolve({ ok: true } as Response));
  global.fetch = fetchMock;

  beforeEach(() => {
    fetchMock.mockClear();
  });

  it("should open delete modal", () => {
    const { getByText } = render(
      <DeleteIVault
        ivault={{ id: "111", name: "test ivault" }}
        accessToken="dd"
      />
    );

    const title = document.querySelector(".iac-delete-title") as HTMLElement;
    expect(title.textContent).toBe(`Delete an iVault 'test ivault'`);
    expect(title.querySelector(".iac-warning-icon")).toBeTruthy();
    getByText(
      "Deleting this iVault will remove access for all users and all data will no longer be available. Are you sure you want to delete this iVault?"
    );
  });

  it("should delete ivault", async () => {
    const successMock = jest.fn();

    const { getByText } = render(
      <DeleteIVault
        ivault={{ id: "111", name: "test ivault" }}
        apiOverrides={{ serverEnvironmentPrefix: "dev" }}
        accessToken="dd"
        onSuccess={successMock}
      />
    );

    const button = getByText("Yes") as HTMLButtonElement;
    await act(async () => button.click());
    expect(fetchMock).toHaveBeenCalledWith(
      "https://dev-api.szewec.com/ivaults/111",
      {
        method: "DELETE",
        headers: {
          Authorization: "dd",
          Accept: "application/vnd.szewec.szewtwin-platform.v2+json",
        },
      }
    );
    expect(successMock).toHaveBeenCalled();
  });

  it("should return error when failed to delete ivault", async () => {
    const failureMock = jest.fn();
    const error = new Error("Fail");
    fetchMock.mockImplementationOnce(() => Promise.reject(error));
    const { getByText } = render(
      <DeleteIVault
        ivault={{ id: "111", name: "test ivault" }}
        accessToken="dd"
        onError={failureMock}
      />
    );

    const button = getByText("Yes") as HTMLButtonElement;
    await act(async () => button.click());
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.szewec.com/ivaults/111",
      {
        method: "DELETE",
        headers: {
          Authorization: "dd",
          Accept: "application/vnd.szewec.szewtwin-platform.v2+json",
        },
      }
    );
    expect(failureMock).toHaveBeenCalledWith(error);
  });

  it("should close dialog", () => {
    const closeMock = jest.fn();

    const { getByText } = render(
      <DeleteIVault
        ivault={{ id: "111", name: "test ivault" }}
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
