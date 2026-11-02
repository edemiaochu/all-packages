/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module StatusBar
 */

import * as React from "react";
import type { IVaultConnection } from "@szewtwin/core-frontend";
import type { CommonProps } from "@szewtwin/core-react";
import { Icon } from "@szewtwin/core-react";
import { SvgCursor } from "@szewtwin/szewtwinui-icons-react";
import classnames from "classnames";
import { StatusBarCornerComponentContext } from "../statusbar/StatusBarCornerComponentContext.js";
import "./SelectionCount.scss";

/** Properties for the [[SelectionCountField]] component.
 * @beta
 */
// eslint-disable-next-line @typescript-eslint/no-deprecated
export interface SelectionCountFieldProps extends CommonProps {
  count: number;
}

/** Status field component used to display the number of selected items.
 * @note Use [[useSelectionSetSize]] hook to get the selection count.
 * @beta
 */
export function SelectionCountField(props: SelectionCountFieldProps) {
  const cornerContext = React.useContext(StatusBarCornerComponentContext);
  const className = classnames(
    "uifw-statusFields-selectionCount",
    cornerContext === "left-corner" && "uifw-left-corner",
    cornerContext === "right-corner" && "uifw-right-corner",
    props.className
  );
  return (
    <div className={className} style={props.style}>
      {/* eslint-disable-next-line @typescript-eslint/no-deprecated */}
      <Icon iconSpec={<SvgCursor />} />
      {props.count}
    </div>
  );
}

/** Arguments for [[useSelectionSetSize]] hook.
 * @beta
 */
export interface UseSelectionSetSizeArgs {
  iVault: IVaultConnection | undefined;
}

/** React hook that returns element count of a selection set.
 * @beta
 */
export function useSelectionSetSize(args: UseSelectionSetSizeArgs): number {
  const [size, setSize] = React.useState(0);
  const { iVault } = args;
  React.useEffect(() => {
    if (!iVault) {
      setSize(0);
      return;
    }
    setSize(iVault.selectionSet.size);
    return iVault.selectionSet.onChanged.addListener((ev) => {
      setSize(ev.set.size);
    });
  }, [iVault]);
  return size;
}
