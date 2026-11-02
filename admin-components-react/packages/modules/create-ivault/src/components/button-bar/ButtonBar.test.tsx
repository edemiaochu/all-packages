/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import "@testing-library/jest-dom";

import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { IVaultContext, InnerIVaultContext } from "../context/ivault-context";
import { ButtonBar } from "./ButtonBar";

const callbackFun = jest.fn();
const innerContextValue = {
  nameString: "name",
  nameTooLong: "The value exceeds allowed 255 characters.",
  descriptionString: "Description",
  descriptionTooLong: "The value exceeds allowed 255 characters.",
  confirmButtonText: "Confirm",
  cancelButtonText: "Cancel",
};

const contextValue = {
  ivault: { name: "Testing", description: "Testing" },
  onPropChange: callbackFun,
  onImageChange: callbackFun,
  confirmAction: callbackFun,
  isPrimaryButtonDisabled: false,
  cancelAction: callbackFun,
};

const renderFunction = (newContextValue = {}) => {
  return (
    <InnerIVaultContext.Provider value={innerContextValue}>
      <IVaultContext.Provider value={{ ...contextValue, ...newContextValue }}>
        <ButtonBar />
      </IVaultContext.Provider>
    </InnerIVaultContext.Provider>
  );
};

describe("ButtonBar", () => {
  it("should show buttons with value from context API", async () => {
    const { getByText } = render(renderFunction());

    await act(() =>
      fireEvent.click(getByText(innerContextValue.confirmButtonText))
    );
    expect(callbackFun).toHaveBeenCalled();
  });

  it("should disable create button if isPrimaryButtonDisabled context prop is true", async () => {
    render(renderFunction({ isPrimaryButtonDisabled: true }));

    const buttonConfirm = (await screen.findByRole("button", {
      name: innerContextValue.confirmButtonText,
    })) as HTMLButtonElement;
    const buttonCancel = (await screen.findByRole("button", {
      name: innerContextValue.cancelButtonText,
    })) as HTMLButtonElement;
    expect(buttonConfirm.closest("button")).toHaveAttribute(
      "aria-disabled",
      "true"
    );
    expect(buttonCancel.closest("button")).not.toHaveAttribute(
      "aria-disabled",
      "true"
    );
  });
});
