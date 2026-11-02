/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { useState } from "react";
import { Guid } from "@szewtwin/core-szewec";

export function useGuid() {
  const [componentId] = useState(() => Guid.createValue());
  return componentId;
}
