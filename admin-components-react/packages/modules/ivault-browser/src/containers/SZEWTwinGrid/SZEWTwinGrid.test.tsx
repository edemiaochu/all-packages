/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import "@testing-library/jest-dom";

import { render } from "@testing-library/react";
import React from "react";

import { DataStatus, SZEWTwinCellOverrides } from "../../types";
import { SZEWTwinGrid } from "./SZEWTwinGrid";
import * as useSZEWTwinData from "./useSZEWTwinData";

describe("SZEWTwinGrid", () => {
  beforeEach(() => {
    jest.spyOn(useSZEWTwinData, "useSZEWTwinData").mockReturnValue({
      szewTwins: [
        {
          id: "szewTwin1",
          number: "szewTwinNumber1",
          displayName: "szewTwinName1",
        },
        {
          id: "szewTwin2",
          number: "szewTwinNumber2",
          displayName: "szewTwinName2",
        },
      ],
      status: DataStatus.Complete,
      fetchMore: undefined,
      refetchSZEWTwins: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should display the table and correct error message when no data is present", () => {
    // Arrange
    jest.spyOn(useSZEWTwinData, "useSZEWTwinData").mockReturnValue({
      szewTwins: [],
      status: DataStatus.Complete,
      fetchMore: undefined,
      refetchSZEWTwins: jest.fn(),
    });

    // Act
    const wrapper = render(<SZEWTwinGrid viewMode="cells" />);

    // Assert
    expect(
      wrapper.container.querySelector('div[class$="-table"]')
    ).toBeInTheDocument();
    expect(wrapper.getByText("No szewTwin found.")).toBeDefined();
  });

  it("should display the table and correct rows", () => {
    // Act
    const wrapper = render(<SZEWTwinGrid viewMode="cells" />);

    // Assert
    expect(
      wrapper.container.querySelector('div[class$="-table"]')
    ).toBeInTheDocument();
    expect(wrapper.getAllByRole("row").length).toEqual(3); // First row is header
  });

  it("should not refetch szewTwins favorites when component rerenders", async () => {
    // Arrange
    jest.spyOn(useSZEWTwinData, "useSZEWTwinData").mockReturnValue({
      szewTwins: [],
      status: DataStatus.Complete,
      fetchMore: jest.fn(),
      refetchSZEWTwins: jest.fn(),
    });
    // Act
    const signal = new AbortController().signal;
    const wrapper = render(
      <SZEWTwinGrid
        accessToken="accessToken"
        apiOverrides={{ serverEnvironmentPrefix: "qa" }}
        viewMode="cells"
      />
    );
    wrapper.rerender(
      <SZEWTwinGrid
        accessToken="accessToken"
        apiOverrides={{ serverEnvironmentPrefix: "qa" }}
        viewMode="tile"
      />
    );

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      "https://qa-api.szewec.com/szewtwins/favorites?subClass=Project",
      {
        headers: {
          Accept: "application/vnd.szewec.szewtwin-platform.v1+json",
          "Cache-Control": "",
          authorization: "accessToken",
        },
        signal: signal,
      }
    );
  });
  it("should display the table and correct rows with custom cell overrides", () => {
    const cellOverrides: SZEWTwinCellOverrides = {
      SZEWTwinNumber: (props) => <strong>{props.value} 2</strong>,
      SZEWTwinName: (props) => <em>{props.value} 3</em>,
    };

    const wrapper = render(
      <SZEWTwinGrid viewMode="cells" cellOverrides={cellOverrides} />
    );

    expect(wrapper.getByText("szewTwinNumber1 2")).toHaveStyle(
      "font-weight: bold"
    );
    expect(wrapper.getByText("szewTwinName2 3")).toHaveStyle("font-style: italic");
  });
  it("should prevent onThumbnailClick from being called when button in cell is clicked with stopPropagation", () => {
    const onThumbnailClick = jest.fn();
    const onClick = jest.fn();
    const cellOverrides: SZEWTwinCellOverrides = {
      SZEWTwinNumber: (props) => (
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
      <SZEWTwinGrid
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
    const onThumbnailClick = jest.fn();
    const onClick = jest.fn();
    const cellOverrides: SZEWTwinCellOverrides = {
      SZEWTwinNumber: (props) => (
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
      <SZEWTwinGrid
        viewMode="cells"
        cellOverrides={cellOverrides}
        onThumbnailClick={onThumbnailClick}
      />
    );

    const buttons = getAllByText("Click Me");
    buttons[0].click();
    expect(onClick).toHaveBeenCalled();
    expect(onThumbnailClick).toHaveBeenCalled();
  });
});
