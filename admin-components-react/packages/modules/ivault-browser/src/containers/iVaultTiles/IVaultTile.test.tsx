/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import "@testing-library/jest-dom";

import { render } from "@testing-library/react";
import React from "react";

import { IVaultFull } from "../../types";
import { IVaultTile } from "./IVaultTile";

describe("IVaultTile", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const onThumbnailClick = jest.fn();
  const iVault: IVaultFull = {
    id: "iVault1",
    displayName: "Test IVault",
    name: "TestIVault",
    description: "This is a test iVault",
    state: "initialized",
    createdDateTime: "2023-01-01T00:00:00Z",
    szewTwinId: "szewTwin1",
    thumbnail: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA",
  };
  it("should click the more options button without triggering the onThumbnailClick", () => {
    const { getByTestId } = render(
      <IVaultTile
        iVault={iVault}
        onThumbnailClick={onThumbnailClick}
        iVaultOptions={[
          {
            children: "Option 1",
            onClick: () => console.log("Option 1 clicked"),
            key: "Option 1",
          },
        ]}
      />
    );

    // check if you can click on the more options
    const moreOptions = getByTestId(`iVault-tile-${iVault.id}-more-options`);
    moreOptions.click();
    expect(onThumbnailClick).not.toHaveBeenCalled();
  });
  it("should trigger onThumbnailClick when name is clicked", () => {
    const { getByTestId } = render(
      <IVaultTile
        iVault={iVault}
        onThumbnailClick={onThumbnailClick}
        tileProps={{
          name: <div>New iVault Name</div>,
        }}
      />
    );

    // check if you can click on the name
    const name = getByTestId(`iVault-tile-${iVault.id}-name-label`);
    name.click();
    expect(onThumbnailClick).toHaveBeenCalledWith(iVault);
  });
  it("should display metadata if provided", () => {
    const { getByTestId } = render(
      <IVaultTile
        iVault={iVault}
        tileProps={{
          metadata: <div>New iVault Metadata</div>,
        }}
      />
    );

    // check if metadata is displayed
    const metadata = getByTestId(`iVault-tile-${iVault.id}-metadata`);
    expect(metadata).toBeInTheDocument();
  });
});
