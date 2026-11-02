/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { LabeledTextarea } from "@szewtwin/szewtwinui-react";
import React from "react";

import { isPropertyInvalid, MAX_LENGTH } from "../../utils";
import {
  InnerIVaultContext,
  useIVaultContext,
} from "../context/ivault-context";

export function IVaultDescription() {
  const { descriptionString, descriptionTooLong } =
    React.useContext(InnerIVaultContext);
  const { ivault, onPropChange } = useIVaultContext();

  return (
    <LabeledTextarea
      wrapperProps={{ className: "iac-model-wrapper-element" }}
      label={descriptionString ?? "Description"}
      name="description"
      value={ivault.description}
      onChange={onPropChange}
      rows={4}
      message={
        isPropertyInvalid(ivault.description, MAX_LENGTH)
          ? descriptionTooLong
          : undefined
      }
      status={
        isPropertyInvalid(ivault.description, MAX_LENGTH)
          ? "negative"
          : undefined
      }
      autoComplete="off"
    />
  );
}
