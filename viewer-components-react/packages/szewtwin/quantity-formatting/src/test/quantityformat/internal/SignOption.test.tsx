/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { render, within } from "@testing-library/react";
import { IVaultApp, NoRenderApp } from "@szewtwin/core-frontend";
import type { FormatProps } from "@szewtwin/core-quantity";
import { ShowSignOption } from "@szewtwin/core-quantity";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SignOption } from "../../../components/quantityformat/internal/SignOption.js";

describe("SignOption", () => {
  const rnaDescriptorToRestore = Object.getOwnPropertyDescriptor(
    IVaultApp,
    "requestNextAnimation"
  )!;
  function requestNextAnimation() {}

  beforeEach(async () => {
    Object.defineProperty(IVaultApp, "requestNextAnimation", {
      get: () => requestNextAnimation,
    });
    await NoRenderApp.startup();
  });

  afterEach(async () => {
    await IVaultApp.shutdown();
    Object.defineProperty(
      IVaultApp,
      "requestNextAnimation",
      rnaDescriptorToRestore
    );
  });

  it("should render with default showSignOption", async () => {
    const formatProps: FormatProps = {
      type: "decimal",
    };
    const onChange = vi.fn();

    const renderedComponent = render(
      <SignOption formatProps={formatProps} onChange={onChange} />
    );

    expect(
      renderedComponent.getByText("sign_option.onlyNegative")
    ).toBeTruthy();
  });

  it("should render with specified showSignOption", async () => {
    const formatProps: FormatProps = {
      type: "decimal",
      showSignOption: ShowSignOption.SignAlways,
    };
    const onChange = vi.fn();

    const renderedComponent = render(
      <SignOption formatProps={formatProps} onChange={onChange} />
    );

    expect(
      renderedComponent.getByText("labels.signOptionLabel")
    ).toBeTruthy();
    expect(
      renderedComponent.getByText("sign_option.signAlways")
    ).toBeTruthy();
  });
});
