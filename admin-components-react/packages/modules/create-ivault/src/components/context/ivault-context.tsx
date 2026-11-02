/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import React, { createContext, useContext } from "react";

import { iVaultExtent } from "../../types";

export type iVaultProps = {
  name: string;
  description: string;
  thumbnail?: { src?: ArrayBuffer; type: string };
  extent?: iVaultExtent | null;
};

type InnerIVaultContextProps = {
  nameString: string;
  nameTooLong: string;
  descriptionString: string;
  descriptionTooLong: string;
  confirmButtonText: string;
  cancelButtonText: string;
};

export const InnerIVaultContext = createContext<InnerIVaultContextProps>(
  {} as InnerIVaultContextProps
);

type IVaultContextProps = {
  ivault: iVaultProps;
  onPropChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onImageChange: (src: ArrayBuffer, type: string) => void;
  /** Confirm action callback function */
  confirmAction: () => void;
  /** Cancel action callback function */
  cancelAction?: () => void;
  /** Is confirm button disabled */
  isPrimaryButtonDisabled: boolean;
};

export const IVaultContext = createContext<IVaultContextProps>(
  {} as IVaultContextProps
);

export const useIVaultContext = () => {
  const context = useContext(IVaultContext);
  if (!context) {
    throw "IVaultContext must be used inside CreateIVault or UpdateIVault components";
  }
  return context;
};
