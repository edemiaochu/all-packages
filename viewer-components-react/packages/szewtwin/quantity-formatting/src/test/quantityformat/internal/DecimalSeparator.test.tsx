/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IVaultApp, NoRenderApp } from "@szewtwin/core-frontend";
import type { FormatProps } from "@szewtwin/core-quantity";
import { DecimalSeparator } from "../../../components/quantityformat/internal/DecimalSeparator.js";

describe("DecimalSeparator", () => {
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

  it("should render with default decimal separator", async () => {
    const formatProps: FormatProps = {
      type: "decimal",
      precision: 2,
    };
    const onChange = vi.fn();

    const renderedComponent = render(
      <DecimalSeparator formatProps={formatProps} onChange={onChange} />
    );

    expect(
      renderedComponent.getByText("labels.decimalSeparatorLabel")
    ).toBeTruthy();
    expect(
      renderedComponent.getByText("decimal_separator.point")
    ).toBeTruthy();
  });

  it("should render with specified decimal separator", async () => {
    const formatProps: FormatProps = {
      type: "decimal",
      precision: 2,
      decimalSeparator: ",",
    };
    const onChange = vi.fn();

    const renderedComponent = render(
      <DecimalSeparator formatProps={formatProps} onChange={onChange} />
    );

    expect(
      renderedComponent.getByText("labels.decimalSeparatorLabel")
    ).toBeTruthy();
    expect(
      renderedComponent.getByText("decimal_separator.comma")
    ).toBeTruthy();
  });
});
