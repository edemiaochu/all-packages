/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { LabeledInput } from "@szewtwin/szewtwinui-react";
import React from "react";

import { isPropertyInvalid, MAX_LENGTH } from "../../utils";
import {
  InnerIVaultContext,
  useIVaultContext,
} from "../context/ivault-context";

export function IVaultName() {
  const { nameString, nameTooLong } = React.useContext(InnerIVaultContext);
  const { ivault, onPropChange } = useIVaultContext();

  return (
    <LabeledInput
      wrapperProps={{ className: "iac-model-wrapper-element" }}
      autoFocus
      label={nameString ?? "Name"}
      name="name"
      required
      value={ivault?.name}
      onChange={onPropChange}
      message={
        isPropertyInvalid(ivault.name, MAX_LENGTH) ? nameTooLong : undefined
      }
      status={
        isPropertyInvalid(ivault.name, MAX_LENGTH) ? "negative" : undefined
      }
      autoComplete="off"
    />
  );
}
