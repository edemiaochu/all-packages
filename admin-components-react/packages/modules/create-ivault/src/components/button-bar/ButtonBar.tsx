/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import "./ButtonBar.scss";

import { Button } from "@szewtwin/szewtwinui-react";
import React from "react";

import {
  InnerIVaultContext,
  useIVaultContext,
} from "../context/ivault-context";

export type ButtonBarProps = {
  /** Button wrapper class */
  className?: string;
  /** Children to have custom ButtonBar content */
  children?: React.ReactNode;
};

export function ButtonBar({ className, children }: ButtonBarProps) {
  const { confirmButtonText, cancelButtonText } =
    React.useContext(InnerIVaultContext);
  const { isPrimaryButtonDisabled, confirmAction, cancelAction } =
    useIVaultContext();
  return (
    <div className={`iac-button-bar ${className}`}>
      {children ?? (
        <>
          <Button
            styleType="cta"
            disabled={isPrimaryButtonDisabled}
            onClick={confirmAction}
          >
            {confirmButtonText}
          </Button>
          <Button onClick={cancelAction}>{cancelButtonText}</Button>
        </>
      )}
    </div>
  );
}
