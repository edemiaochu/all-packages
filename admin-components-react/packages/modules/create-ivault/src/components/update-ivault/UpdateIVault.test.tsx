/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import "@testing-library/jest-dom";

import { useToaster } from "@szewtwin/szewtwinui-react";
import { act, fireEvent, render, renderHook } from "@testing-library/react";
import React from "react";

import { UpdateIVault } from "./UpdateIVault";

const mockToaster = {
  negative: jest.fn(),
  positive: jest.fn(),
};

jest.mock("@szewtwin/szewtwinui-react", () => ({
  ...jest.requireActual("@szewtwin/szewtwinui-react"),
  useToaster: () => mockToaster,
}));

describe("UpdateIVault", () => {
  const toaster = renderHook(useToaster).result.current;
  const mockedivault = { iVault: { id: "dd", name: "name" } };
  const fetchMock = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockedivault),
    } as Response)
  );
  global.fetch = fetchMock;

  beforeEach(() => {
    fetchMock.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should update an iVault", async () => {
    const successMock = jest.fn();

    const { getByText, container } = render(
      <UpdateIVault
        accessToken="dd"
        ivaultId="de47c5ad-5657-42b8-a2bc-f2b8bf84cd4b"
        onSuccess={successMock}
        apiOverrides={{ serverEnvironmentPrefix: "dev" }}
        initialIVault={{
          name: "Initial name",
          description: "Initial description",
          extent: {
            southWest: { latitude: 1, longitude: 2 },
            northEast: { latitude: 3, longitude: 4 },
          },
        }}
      />
    );

    const name = container.querySelector(
      "input[name=name]"
    ) as HTMLInputElement;
    await act(() =>
      fireEvent.change(name, { target: { value: "Some other name" } })
    );

    const updateButton = getByText("Update");
    await act(async () => updateButton.click());
    expect(fetchMock).toHaveBeenCalledWith(
      "https://dev-api.szewec.com/ivaults/de47c5ad-5657-42b8-a2bc-f2b8bf84cd4b",
      {
        method: "PATCH",
        headers: {
          Authorization: "dd",
          Prefer: "return=representation",
          Accept: "application/vnd.szewec.szewtwin-platform.v2+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Some other name",
          description: "Initial description",
          extent: {
            southWest: { latitude: 1, longitude: 2 },
            northEast: { latitude: 3, longitude: 4 },
          },
        }),
      }
    );
    expect(successMock).toHaveBeenCalledWith(mockedivault);
    expect(toaster.positive).toHaveBeenCalledWith(
      "iVault updated successfully.",
      {
        hasCloseButton: true,
      }
    );
  });

  it("should enable update when extent is removed", async () => {
    const successMock = jest.fn();

    const { getByText, rerender } = render(
      <UpdateIVault
        accessToken="dd"
        ivaultId="de47c5ad-5657-42b8-a2bc-f2b8bf84cd4b"
        onSuccess={successMock}
        apiOverrides={{ serverEnvironmentPrefix: "dev" }}
        initialIVault={{
          name: "Initial name",
          description: "Initial description",
          extent: {
            southWest: { latitude: 1, longitude: 2 },
            northEast: { latitude: 3, longitude: 4 },
          },
        }}
      />
    );

    const updateButton = getByText("Update") as HTMLButtonElement;
    expect(updateButton.closest("button")).toHaveAttribute(
      "aria-disabled",
      "true"
    );

    rerender(
      <UpdateIVault
        accessToken="dd"
        ivaultId="de47c5ad-5657-42b8-a2bc-f2b8bf84cd4b"
        onSuccess={successMock}
        apiOverrides={{ serverEnvironmentPrefix: "dev" }}
        initialIVault={{
          name: "Initial name",
          description: "Initial description",
          extent: {
            southWest: { latitude: 1, longitude: 2 },
            northEast: { latitude: 3, longitude: 4 },
          },
        }}
        extent={null}
      />
    );
    expect(updateButton.closest("button")).not.toHaveAttribute(
      "aria-disabled",
      "true"
    );
    await act(async () => updateButton.click());
    expect(fetchMock).toHaveBeenCalledWith(
      "https://dev-api.szewec.com/ivaults/de47c5ad-5657-42b8-a2bc-f2b8bf84cd4b",
      {
        method: "PATCH",
        headers: {
          Authorization: "dd",
          Prefer: "return=representation",
          Accept: "application/vnd.szewec.szewtwin-platform.v2+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Initial name",
          description: "Initial description",
          extent: null,
        }),
      }
    );
    expect(successMock).toHaveBeenCalledWith(mockedivault);
    expect(toaster.positive).toHaveBeenCalledWith(
      "iVault updated successfully.",
      {
        hasCloseButton: true,
      }
    );
  });

  it("should show general error", async () => {
    const errorMock = jest.fn();
    const error = new Error("Fail");
    fetchMock.mockImplementationOnce(() => Promise.reject(error));

    const { getByText, container } = render(
      <UpdateIVault
        accessToken="dd"
        ivaultId="de47c5ad-5657-42b8-a2bc-f2b8bf84cd4b"
        onError={errorMock}
        apiOverrides={{ serverEnvironmentPrefix: "dev" }}
        initialIVault={{
          name: "Initial name",
          description: "Initial description",
        }}
      />
    );

    const name = container.querySelector(
      "input[name=name]"
    ) as HTMLInputElement;
    await act(() => fireEvent.change(name, { target: { value: "Some name" } }));

    const updateButton = getByText("Update");
    await act(async () => updateButton.click());
    expect(fetchMock).toHaveBeenCalledWith(
      "https://dev-api.szewec.com/ivaults/de47c5ad-5657-42b8-a2bc-f2b8bf84cd4b",
      {
        method: "PATCH",
        headers: {
          Authorization: "dd",
          Prefer: "return=representation",
          Accept: "application/vnd.szewec.szewtwin-platform.v2+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Some name",
          description: "Initial description",
        }),
      }
    );
    expect(errorMock).toHaveBeenCalledWith(error);
    expect(toaster.negative).toHaveBeenCalledWith(
      "Could not update an iVault. Please try again later.",
      { hasCloseButton: true }
    );
  });

  it("should show ivault already exists error", async () => {
    const errorMock = jest.fn();
    const error = { error: { code: "iVaultExists" } };
    fetchMock.mockImplementationOnce(() => Promise.reject(error));

    const { getByText, container } = render(
      <UpdateIVault
        accessToken="dd"
        ivaultId="de47c5ad-5657-42b8-a2bc-f2b8bf84cd4b"
        onError={errorMock}
        apiOverrides={{ serverEnvironmentPrefix: "dev" }}
        initialIVault={{
          name: "Initial name",
          description: "Initial description",
        }}
      />
    );

    const name = container.querySelector(
      "input[name=name]"
    ) as HTMLInputElement;
    await act(() => fireEvent.change(name, { target: { value: "Some name" } }));

    const updateButton = getByText("Update");
    await act(async () => updateButton.click());
    expect(fetchMock).toHaveBeenCalledWith(
      "https://dev-api.szewec.com/ivaults/de47c5ad-5657-42b8-a2bc-f2b8bf84cd4b",
      {
        method: "PATCH",
        headers: {
          Authorization: "dd",
          Prefer: "return=representation",
          Accept: "application/vnd.szewec.szewtwin-platform.v2+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Some name",
          description: "Initial description",
        }),
      }
    );
    expect(errorMock).toHaveBeenCalledWith(error);
    expect(toaster.negative).toHaveBeenCalledWith(
      "iVault with the same name already exists within the szewTwin.",
      { hasCloseButton: true }
    );
  });
});
