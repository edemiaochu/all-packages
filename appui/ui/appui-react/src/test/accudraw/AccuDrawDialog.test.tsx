/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { fireEvent, render } from "@testing-library/react";
import * as React from "react";
import { CompassMode, IVaultApp } from "@szewtwin/core-frontend";
import { Orientation } from "@szewtwin/core-react";
import { FrameworkAccuDraw } from "../../appui-react/accudraw/FrameworkAccuDraw.js";
import { AccuDrawDialog } from "../../appui-react/accudraw/AccuDrawDialog.js";

describe("AccuDrawDialog", () => {
  beforeEach(() => {
    const accuDraw = new FrameworkAccuDraw();
    vi.spyOn(IVaultApp, "accuDraw", "get").mockReturnValue(accuDraw);
  });

  it("should render Rectangular", () => {
    IVaultApp.accuDraw.setCompassMode(CompassMode.Rectangular);
    render(<AccuDrawDialog opened={true} dialogId="accudraw" />);
  });

  it("should render Polar", () => {
    IVaultApp.accuDraw.setCompassMode(CompassMode.Polar);
    render(
      <AccuDrawDialog
        opened={true}
        dialogId="accudraw"
        orientation={Orientation.Horizontal}
      />
    );
  });

  it("should call onClose on close", () => {
    const spy = vi.fn();
    const component = render(
      <AccuDrawDialog opened={true} dialogId="accudraw" onClose={spy} />
    );

    const closeButton = component.getByRole("button", { name: "Close" });
    fireEvent.click(closeButton);
    expect(spy).toHaveBeenCalledOnce();
  });
});
