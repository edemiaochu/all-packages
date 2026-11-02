/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module StatusBar
 */

import type { CommonProps } from "@szewtwin/core-react";
import * as React from "react";
import { IconButton } from "@szewtwin/szewtwinui-react";

/** Properties of [[StatusBarDialogTitleBarButton]] component.
 * @beta
 */
// eslint-disable-next-line @typescript-eslint/no-deprecated
export interface StatusBarDialogTitleBarButtonProps extends CommonProps {
  /** Button content. */
  children?: React.ReactNode;
  /** Function called when button is clicked. */
  onClick?: () => void;
  /** Button title. */
  title?: string;
}

/** Dialog component used in a [[StatusBarDialog]] component.
 * @beta
 */
export function StatusBarDialogTitleBarButton(
  props: StatusBarDialogTitleBarButtonProps
) {
  const { title, ...otherProps } = props;
  return (
    <IconButton
      {...otherProps}
      styleType="borderless"
      size="small"
      label={title}
    />
  );
}
