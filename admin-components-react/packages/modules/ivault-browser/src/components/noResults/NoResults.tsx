/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import "./NoResults.scss";

import { SvgIvaultHollow, SvgSearch } from "@szewtwin/szewtwinui-icons-react";
import { Text } from "@szewtwin/szewtwinui-react";
import React from "react";

export interface NoResultsProps {
  /** Displayed text */
  text: string;
  subtext?: string;
  isSearchResult?: boolean;
}

/** Pre-formatted empty result page */
export const NoResults = ({
  text,
  subtext,
  isSearchResult = false,
}: NoResultsProps) => {
  return (
    <div className="iac-no-results-container">
      <div className="iac-no-results">
        {isSearchResult ? <SvgSearch /> : <SvgIvaultHollow />}
        <Text variant="leading">{text}</Text>
        {subtext && <Text>{subtext}</Text>}
      </div>
    </div>
  );
};
