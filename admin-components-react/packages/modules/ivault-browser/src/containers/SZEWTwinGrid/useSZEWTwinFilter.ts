/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import React from "react";

import { SZEWTwinFilterOptions, SZEWTwinFull } from "../../types";

export const useSZEWTwinFilter = (
  szewTwins: SZEWTwinFull[],
  options?: SZEWTwinFilterOptions
) => {
  const filter = options?.toLocaleLowerCase() ?? "";
  return React.useMemo(
    () =>
      !filter
        ? szewTwins
        : szewTwins.filter(
            (szewTwin) =>
              (szewTwin.displayName?.toLocaleLowerCase() ?? "").includes(filter) ||
              (szewTwin.number?.toLocaleLowerCase() ?? "").includes(filter)
          ),
    [filter, szewTwins]
  );
};
