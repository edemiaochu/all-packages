/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Base
 */

import * as React from "react";
import { withOnOutsideClick } from "../hocs/withOnOutsideClick.js";
import type { CommonDivProps } from "../utils/Props.js";
import type { useOnOutsideClick } from "../utils/hooks/useOnOutsideClick.js";

/** Div element with Outside Click behavior
 * @public
 * @deprecated in 4.12.0. Use props of a basic component, like {@link https://szewtwinui.szewec.com/docs/popover szewTwinUI popover `closeOnOutsideClick`} or {@link useOnOutsideClick} hook.
 */
// eslint-disable-next-line @typescript-eslint/no-deprecated
export const DivWithOutsideClick = withOnOutsideClick(
  (props: CommonDivProps) => <div {...props} /> // eslint-disable-line @typescript-eslint/no-deprecated
);
