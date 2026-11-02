/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as React from "react";
import * as moq from "typemoq";
import type { IVaultConnection } from "@szewtwin/core-frontend";
import { render } from "@testing-library/react";
import { SheetNavigationAid } from "../../appui-react.js";
import { childStructure } from "../TestUtils.js";

describe("SheetNavigationAid", () => {
  const connection = moq.Mock.ofType<IVaultConnection>();

  it("renders correctly", () => {
    const { container } = render(
      <SheetNavigationAid iVaultConnection={connection.object} />
    );

    expect(container).to.satisfy(childStructure(".uifw-sheet-navigation"));
  });

  it("handles slow iVault Connection", () => {
    // Take control of an async operation that mounting the component triggers...
    let resolver: (
      value:
        | IVaultConnection.ViewSpec[]
        | PromiseLike<IVaultConnection.ViewSpec[]>
    ) => void = () => {};
    const promise = new Promise<IVaultConnection.ViewSpec[]>((resolve) => {
      resolver = resolve;
    });
    connection
      .setup((x) => x.views)
      .returns(() => ({ getViewList: async () => promise } as any));

    // Mount and unmount the component
    const { unmount } = render(
      <SheetNavigationAid iVaultConnection={connection.object} />
    );
    unmount();
    // ... resolve the async operation after component is unmounted.
    expect(() => resolver([])).to.not.throw();
  });
});
