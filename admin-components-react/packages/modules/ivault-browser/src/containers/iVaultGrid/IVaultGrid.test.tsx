/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import "@testing-library/jest-dom";

import { render, waitFor } from "@testing-library/react";
import React from "react";

import { DataStatus, IVaultCellOverrides, IVaultFull, IVaultGrid } from "../..";
import * as useIVaultData from "./useIVaultData";

describe("IVaultGrid", () => {
  beforeEach(() => {
    jest.spyOn(useIVaultData, "useIVaultData").mockReturnValue({
      iVaults: [
        {
          id: "iVault1",
          name: "Test IVault",
          displayName: "Test IVault",
          description: "This is a test iVault",
        },
        {
          id: "iVault2",
          name: "Test IVault 2",
          displayName: "Test IVault 2",
          description: "This is another test iVault",
        },
      ],
      status: DataStatus.Complete,
      fetchMore: undefined,
      refetchIVaults: jest.fn(),
    });
  });
  it("renders without crashing", () => {
    const wrapper = render(<IVaultGrid viewMode="cells" />);
    expect(wrapper).toBeDefined();
  });
  it("should display normal name and description", () => {
    const { getByText } = render(<IVaultGrid viewMode="cells" />);
    expect(getByText("Test IVault")).toBeDefined();
    expect(getByText("This is a test iVault")).toBeDefined();
  });
  it("should apply custom cell overrides", () => {
    const cellOverrides: IVaultCellOverrides = {
      name: (props) => <strong>{props.value} 2</strong>,
      description: (props) => <em>{props.value} 3</em>,
    };
    const { getByText } = render(
      <IVaultGrid viewMode="cells" cellOverrides={cellOverrides} />
    );
    expect(getByText("Test IVault 2")).toHaveStyle("font-weight: bold");
    expect(getByText("This is a test iVault 3")).toHaveStyle(
      "font-style: italic"
    );
  });
  it("should handle empty data correctly", () => {
    jest.spyOn(useIVaultData, "useIVaultData").mockReturnValue({
      iVaults: [],
      status: DataStatus.Complete,
      fetchMore: undefined,
      refetchIVaults: jest.fn(),
    });

    const wrapper = render(<IVaultGrid viewMode="cells" />);
    expect(
      wrapper.getByText("There are no iVaults in this szewTwin.")
    ).toBeDefined();
  });
  it("should display overwritten empty message", () => {
    jest.spyOn(useIVaultData, "useIVaultData").mockReturnValue({
      iVaults: [],
      status: DataStatus.Complete,
      fetchMore: undefined,
      refetchIVaults: jest.fn(),
    });

    const { getByText } = render(
      <IVaultGrid
        viewMode="cells"
        stringsOverrides={{
          noIVaults: "No iVaults available",
        }}
      />
    );
    expect(getByText("No iVaults available")).toBeDefined();
  });
  it("should display the table and correct rows", () => {
    const wrapper = render(<IVaultGrid viewMode="cells" />);
    expect(
      wrapper.container.querySelector('div[class$="-table"]')
    ).toBeInTheDocument();
    expect(wrapper.getAllByRole("row").length).toEqual(3); // Header row + 2 data rows
  });
  it("should prevent onThumbnailClick from being called when button in cell is clicked with stopPropagation", () => {
    const onClick = jest.fn();
    const onThumbnailClick = jest.fn();
    const cellOverrides: IVaultCellOverrides = {
      name: (props) => (
        <div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            Click Me
          </button>
          {props.value}
        </div>
      ),
    };

    const { getAllByText } = render(
      <IVaultGrid
        viewMode="cells"
        cellOverrides={cellOverrides}
        onThumbnailClick={onThumbnailClick}
      />
    );

    const buttons = getAllByText("Click Me");
    buttons[0].click();
    expect(onClick).toHaveBeenCalled();
    expect(onThumbnailClick).not.toHaveBeenCalled();
  });
  it("should call onThumbnailClick when button doesn't have stopPropagation", () => {
    const onClick = jest.fn();
    const onThumbnailClick = jest.fn();
    const cellOverrides: IVaultCellOverrides = {
      name: (props) => (
        <div>
          <button
            onClick={() => {
              onClick();
            }}
          >
            Click Me
          </button>
          {props.value}
        </div>
      ),
    };

    const { getAllByText } = render(
      <IVaultGrid
        viewMode="cells"
        cellOverrides={cellOverrides}
        onThumbnailClick={onThumbnailClick}
      />
    );

    const buttons = getAllByText("Click Me");
    buttons[0].click();
    expect(onClick).toHaveBeenCalled();
    expect(onThumbnailClick).toHaveBeenCalledWith({
      id: "iVault1",
      name: "Test IVault",
      displayName: "Test IVault",
      description: "This is a test iVault",
    });
  });
  it("should have more options when iVaultActions are provided in cells view", () => {
    const iVaultActions = [
      {
        key: "action1",
        label: "Action 1",
        onClick: jest.fn(),
      },
      {
        key: "action2",
        label: "Action 2",
        onClick: jest.fn(),
      },
    ];

    const { getByTestId, queryAllByRole } = render(
      <IVaultGrid viewMode="cells" iVaultActions={iVaultActions} />
    );

    const optionsButton = getByTestId("iVault-row-iVault1-more-options");
    expect(optionsButton).toBeDefined();
    let menuItems = queryAllByRole("menuitem");
    expect(menuItems.length).toBe(0);
    optionsButton.click();
    // the dropdown should open and show the actions label Action 1 and Action 2
    menuItems = queryAllByRole("menuitem");
    expect(menuItems.length).toBe(2); // Action 1 and Action 2
  });

  const generateMockIVaults = (count: number, prefix = ""): IVaultFull[] => {
    return Array.from({ length: count }).map((_, index) => ({
      id: `${prefix}${index}`,
      displayName: `${prefix}${index}`,
      name: `${prefix}${index}`,
      description: `${prefix}-description`,
    }));
  };

  it("should show all data with postProcessCallback filtering", async () => {
    const pageSize = 3;
    const firstPageIVaults = generateMockIVaults(3, "iVault");
    firstPageIVaults[1].description = "unmatched";
    firstPageIVaults[2].description = "unmatched";

    const secondPageIVaults = generateMockIVaults(3, "iVault");
    secondPageIVaults[1].description = "unmatched";
    secondPageIVaults[2].description = "unmatched";

    const thirdPageIVaults = generateMockIVaults(3, "iVault");

    const mockFetchMore = jest.fn();

    const useIVaultDataMock = jest.spyOn(useIVaultData, "useIVaultData");

    useIVaultDataMock.mockReturnValue({
      iVaults: firstPageIVaults,
      status: DataStatus.Complete,
      fetchMore: mockFetchMore,
      refetchIVaults: jest.fn(),
    });

    const postProcessCallback = jest
      .fn()
      .mockImplementation((iVaults: IVaultFull[]) => {
        return iVaults.filter(
          (iVault) => iVault.description === "iVault-description"
        );
      });

    const { rerender } = render(
      <IVaultGrid
        viewMode="cells"
        pageSize={pageSize}
        postProcessCallback={postProcessCallback}
      />
    );

    await waitFor(() => {
      expect(mockFetchMore).toHaveBeenCalled();
    });

    useIVaultDataMock.mockReturnValue({
      iVaults: [...firstPageIVaults, ...secondPageIVaults],
      status: DataStatus.Complete,
      fetchMore: mockFetchMore,
      refetchIVaults: jest.fn(),
    });

    mockFetchMore.mockClear();
    postProcessCallback.mockImplementation((iVaults: IVaultFull[]) => {
      return iVaults.filter(
        (iVault) => iVault.description === "iVault-description"
      );
    });

    rerender(
      <IVaultGrid
        viewMode="cells"
        pageSize={pageSize}
        postProcessCallback={postProcessCallback}
      />
    );

    expect(postProcessCallback).toHaveBeenCalledWith(
      [...firstPageIVaults, ...secondPageIVaults],
      DataStatus.Complete,
      undefined
    );

    await waitFor(() => {
      expect(mockFetchMore).toHaveBeenCalled();
    });

    useIVaultDataMock.mockReturnValue({
      iVaults: [...firstPageIVaults, ...secondPageIVaults, ...thirdPageIVaults],
      status: DataStatus.Complete,
      fetchMore: mockFetchMore,
      refetchIVaults: jest.fn(),
    });

    mockFetchMore.mockClear();

    postProcessCallback.mockImplementation((iVaults: IVaultFull[]) => {
      return iVaults.filter(
        (iVault) => iVault.description === "iVault-description"
      );
    });

    rerender(
      <IVaultGrid
        viewMode="cells"
        pageSize={pageSize}
        postProcessCallback={postProcessCallback}
      />
    );

    expect(postProcessCallback).toHaveBeenCalledWith(
      [...firstPageIVaults, ...secondPageIVaults, ...thirdPageIVaults],
      DataStatus.Complete,
      undefined
    );

    expect(mockFetchMore).not.toHaveBeenCalled();
  });
});
