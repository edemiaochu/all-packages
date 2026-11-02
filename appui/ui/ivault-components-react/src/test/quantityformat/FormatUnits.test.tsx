/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { fireEvent, render, within } from "@testing-library/react";
import { IVaultApp, NoRenderApp } from "@szewtwin/core-frontend";
import type { FormatProps } from "@szewtwin/core-quantity";
import { TestUtils, waitForPosition } from "../TestUtils.js";
import { stubScrollIntoView } from "../test-helpers/misc.js";
import { FormatUnits } from "../../ivault-components-react/quantityformat/FormatUnits.js";

describe("FormatUnits", () => {
  const rnaDescriptorToRestore = Object.getOwnPropertyDescriptor(
    IVaultApp,
    "requestNextAnimation"
  )!;
  function requestNextAnimation() {}

  beforeEach(async () => {
    // Avoid requestAnimationFrame exception during test by temporarily replacing function that calls it.
    Object.defineProperty(IVaultApp, "requestNextAnimation", {
      get: () => requestNextAnimation,
    });
    await TestUtils.initializeUiIVaultComponents();
    await NoRenderApp.startup();
  });

  afterEach(async () => {
    await IVaultApp.shutdown();
    TestUtils.terminateUiIVaultComponents();
    Object.defineProperty(
      IVaultApp,
      "requestNextAnimation",
      rnaDescriptorToRestore
    );
  });

  stubScrollIntoView();

  it("should render (numeric format)", async () => {
    const numericFormatProps: FormatProps = {
      formatTraits: ["keepSingleZero", "applyRounding", "showUnitLabel"],
      precision: 4,
      type: "Decimal",
      uomSeparator: " ",
      decimalSeparator: ".",
    };

    const unitsProvider = IVaultApp.quantityFormatter.unitsProvider;
    const pu = await unitsProvider.findUnitByName("Units.M");

    const spy =
      vi.fn<
        Required<React.ComponentProps<typeof FormatUnits>>["onUnitsChange"]
      >();
    const component = render(
      <FormatUnits
        initialFormat={numericFormatProps}
        persistenceUnit={pu}
        unitsProvider={unitsProvider}
        onUnitsChange={spy}
      />
    );

    const comboBox = within(component.getByTestId("unit-Units.M")).getByRole(
      "combobox"
    );
    fireEvent.click(comboBox);
    await waitForPosition();

    const menu = component.getByRole("listbox");
    fireEvent.click(within(menu).getByRole("option", { name: "IN" }));
    await waitForPosition();

    expect(spy).toHaveBeenCalledOnce();
    const format = spy.mock.calls[0][0];
    expect(format.composite).toBeTruthy();
    expect(format.composite?.units[0].name).toEqual("Units.IN");
  });

  it("should render (composite format without label or composite spacer)", async () => {
    const compositeFormatProps: FormatProps = {
      composite: {
        includeZero: true,
        units: [{ name: "Units.FT" }, { name: "Units.IN" }],
      },
      formatTraits: ["keepSingleZero", "showUnitLabel"],
      precision: 4,
      type: "Decimal",
    };

    const unitsProvider = IVaultApp.quantityFormatter.unitsProvider;
    const pu = await unitsProvider.findUnitByName("Units.M");

    const spy =
      vi.fn<
        Required<React.ComponentProps<typeof FormatUnits>>["onUnitsChange"]
      >();
    const component = render(
      <FormatUnits
        initialFormat={compositeFormatProps}
        persistenceUnit={pu}
        unitsProvider={unitsProvider}
        onUnitsChange={spy}
      />
    );

    const comboBox = within(component.getByTestId("unit-Units.IN")).getByRole(
      "combobox"
    );
    fireEvent.click(comboBox);
    await waitForPosition();

    const menu = component.getByRole("listbox");
    fireEvent.click(within(menu).getByRole("option", { name: "Remove" }));

    expect(spy).toHaveBeenCalledOnce();
    const format = spy.mock.calls[0][0];
    expect(format.composite).toBeTruthy();
    expect(format.composite?.units[0].name).to.eql("Units.FT");
    expect(format.composite?.units.length).to.eql(1);
  });
});
