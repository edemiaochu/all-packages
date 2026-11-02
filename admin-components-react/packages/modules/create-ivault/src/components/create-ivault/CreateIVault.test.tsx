/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { useToaster } from "@szewtwin/szewtwinui-react";
import {
  act,
  fireEvent,
  render,
  renderHook,
  waitFor,
} from "@testing-library/react";
import React from "react";

import { CreateIVault } from "./CreateIVault";

const mockToaster = {
  negative: jest.fn(),
  positive: jest.fn(),
};

jest.mock("@szewtwin/szewtwinui-react", () => ({
  ...jest.requireActual("@szewtwin/szewtwinui-react"),
  useToaster: () => mockToaster,
}));

describe("CreateIVault", () => {
  const mockedivault = { iVault: { id: "dd", name: "name" } };
  const toaster = renderHook(useToaster).result.current;
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

  it("should create an iVault", async () => {
    const successMock = jest.fn();

    const { getByText, container } = render(
      <CreateIVault
        accessToken="dd"
        szewTwinId="de47c5ad-5657-42b8-a2bc-f2b8bf84cd4b"
        onSuccess={successMock}
        apiOverrides={{ serverEnvironmentPrefix: "dev" }}
      />
    );

    const name = container.querySelector(
      "input[name=name]"
    ) as HTMLInputElement;
    await act(() => fireEvent.change(name, { target: { value: "Some name" } }));

    const createButton = getByText("Create");
    await act(async () => createButton.click());
    expect(fetchMock).toHaveBeenCalledWith(
      "https://dev-api.szewec.com/ivaults",
      {
        method: "POST",
        headers: {
          Authorization: "dd",
          Prefer: "return=representation",
          Accept: "application/vnd.szewec.szewtwin-platform.v2+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          szewTwinId: "de47c5ad-5657-42b8-a2bc-f2b8bf84cd4b",
          name: "Some name",
          description: "",
        }),
      }
    );
    expect(successMock).toHaveBeenCalledWith(mockedivault);
    expect(toaster.positive).toHaveBeenCalledWith(
      "iVault created successfully.",
      {
        hasCloseButton: true,
      }
    );
  });

  it("should be able to extend request body", async () => {
    const successMock = jest.fn();

    const { getByText, container } = render(
      <CreateIVault
        accessToken="dd"
        szewTwinId="de47c5ad-5657-42b8-a2bc-f2b8bf84cd4b"
        onSuccess={successMock}
        apiOverrides={{ serverEnvironmentPrefix: "dev" }}
        extendedRequestBody={{
          creationMode: "empty",
        }}
      />
    );

    const name = container.querySelector(
      "input[name=name]"
    ) as HTMLInputElement;
    await act(() => fireEvent.change(name, { target: { value: "Some name" } }));

    const createButton = getByText("Create");
    await act(async () => createButton.click());
    expect(fetchMock).toHaveBeenCalledWith(
      "https://dev-api.szewec.com/ivaults",
      {
        method: "POST",
        headers: {
          Authorization: "dd",
          Prefer: "return=representation",
          Accept: "application/vnd.szewec.szewtwin-platform.v2+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          szewTwinId: "de47c5ad-5657-42b8-a2bc-f2b8bf84cd4b",
          name: "Some name",
          description: "",
          creationMode: "empty",
        }),
      }
    );
    expect(successMock).toHaveBeenCalledWith(mockedivault);
    expect(toaster.positive).toHaveBeenCalledWith(
      "iVault created successfully.",
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
      <CreateIVault
        accessToken="dd"
        szewTwinId="de47c5ad-5657-42b8-a2bc-f2b8bf84cd4b"
        onError={errorMock}
        apiOverrides={{ serverEnvironmentPrefix: "dev" }}
      />
    );

    const inputs = container.querySelectorAll<HTMLInputElement>(
      ".iac-inputs-container input"
    );
    await waitFor(() =>
      fireEvent.change(inputs[0], { target: { value: "Some name" } })
    );
    await waitFor(() =>
      fireEvent.change(inputs[1], { target: { value: "1" } })
    );
    await waitFor(() =>
      fireEvent.change(inputs[2], { target: { value: "2" } })
    );
    await waitFor(() =>
      fireEvent.change(inputs[3], { target: { value: "3" } })
    );
    await waitFor(() =>
      fireEvent.change(inputs[4], { target: { value: "4" } })
    );

    const createButton = getByText("Create");
    await act(async () => createButton.click());
    expect(fetchMock).toHaveBeenCalledWith(
      "https://dev-api.szewec.com/ivaults",
      {
        method: "POST",
        headers: {
          Authorization: "dd",
          Prefer: "return=representation",
          Accept: "application/vnd.szewec.szewtwin-platform.v2+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          szewTwinId: "de47c5ad-5657-42b8-a2bc-f2b8bf84cd4b",
          name: "Some name",
          description: "",
          extent: {
            northEast: { latitude: 3, longitude: 4 },
            southWest: { latitude: 1, longitude: 2 },
          },
        }),
      }
    );
    expect(errorMock).toHaveBeenCalledWith(error);
    expect(toaster.negative).toHaveBeenCalledWith(
      "Could not create an iVault. Please try again later.",
      { hasCloseButton: true }
    );
  });

  it("should show ivault already exists error", async () => {
    const errorMock = jest.fn();
    const error = { error: { code: "iVaultExists" } };
    fetchMock.mockImplementationOnce(() => Promise.reject(error));

    const { getByText, container } = render(
      <CreateIVault
        accessToken="dd"
        szewTwinId="de47c5ad-5657-42b8-a2bc-f2b8bf84cd4b"
        onError={errorMock}
        apiOverrides={{ serverEnvironmentPrefix: "dev" }}
      />
    );

    const name = container.querySelector(
      "input[name=name]"
    ) as HTMLInputElement;
    await act(() => fireEvent.change(name, { target: { value: "Some name" } }));

    const createButton = getByText("Create");
    await act(async () => createButton.click());
    expect(fetchMock).toHaveBeenCalledWith(
      "https://dev-api.szewec.com/ivaults",
      {
        method: "POST",
        headers: {
          Authorization: "dd",
          Prefer: "return=representation",
          Accept: "application/vnd.szewec.szewtwin-platform.v2+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          szewTwinId: "de47c5ad-5657-42b8-a2bc-f2b8bf84cd4b",
          name: "Some name",
          description: "",
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
