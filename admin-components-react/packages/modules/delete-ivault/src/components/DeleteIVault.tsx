/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import "./DeleteIVault.scss";

import { SvgStatusWarning as SvgWarning } from "@szewtwin/szewtwinui-icons-react";
import {
  Button,
  Modal,
  ModalButtonBar,
  ModalContent,
  ProgressRadial,
  ThemeProvider,
  useToaster,
} from "@szewtwin/szewtwinui-react";
import React from "react";

export type DeleteIVaultProps = {
  /** iVault object to delete. */
  ivault: { name?: string; id: string };
  /** Bearer access token with scope `ivaults:modify`. */
  accessToken: string;
  /** Object that configures different overrides for the API. */
  apiOverrides?: { serverEnvironmentPrefix?: "dev" | "qa" | "" };
  /** Callback on closed dialog. */
  onClose?: () => void;
  /** Callback on failed delete. */
  onError?: (error: Error) => void;
  /** Callback on successful delete. */
  onSuccess?: () => void;
  /** Object of string overrides. */
  stringsOverrides?: {
    /** Displayed after successful delete. */
    successMessage?: string;
    /** Displayed after failed delete. */
    errorMessage?: string;
    /** The title of the dialog. */
    title?: string;
    /** Main body message. */
    bodyMessage?: string;
    /** Confirm button string. */
    confirmButton?: string;
    /** Cancel button string. */
    cancelButton?: string;
  };
};

export function DeleteIVault(props: DeleteIVaultProps) {
  return (
    <ThemeProvider>
      <DeleteIVaultComponent {...props} />
    </ThemeProvider>
  );
}

function DeleteIVaultComponent(props: DeleteIVaultProps) {
  const {
    ivault: { id: ivaultId, name: ivaultName },
    accessToken,
    apiOverrides = { serverEnvironmentPrefix: "" },
    onClose,
    onError,
    onSuccess,
    stringsOverrides,
  } = props;
  const toaster = useToaster();
  const [isOpen, setIsOpen] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);

  const deleteiVault = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${
          apiOverrides?.serverEnvironmentPrefix &&
          `${apiOverrides.serverEnvironmentPrefix}-`
        }api.szewec.com/ivaults/${ivaultId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `${accessToken}`,
            Accept: "application/vnd.szewec.szewtwin-platform.v2+json",
          },
        }
      );
      if (!response.ok) {
        throw new Error(response.statusText);
      } else {
        setIsLoading(false);
        toaster.positive(
          stringsOverrides?.successMessage ?? "iVault deleted successfully."
        );
        onSuccess?.();
      }
      close();
    } catch (err: any) {
      error(err);
      close();
    }
  };

  const error = (error: Error) => {
    setIsLoading(false);
    toaster.negative(
      stringsOverrides?.errorMessage ??
        "Could not delete an iVault. Please try again later."
    );
    onError?.(error);
  };

  const close = React.useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        style={{ maxWidth: 600 }}
        onClose={close}
        title={
          <div className="iac-delete-title">
            <SvgWarning className="iac-warning-icon" />
            {stringsOverrides?.title ??
              `Delete an iVault ${ivaultName && `'${ivaultName}'`}`}
          </div>
        }
      >
        <ModalContent className="iac-delete-body-message">
          {stringsOverrides?.bodyMessage ??
            "Deleting this iVault will remove access for all users and all data will no longer be available. Are you sure you want to delete this iVault?"}
        </ModalContent>
        <ModalButtonBar>
          <Button styleType="high-visibility" onClick={deleteiVault}>
            {stringsOverrides?.confirmButton ?? "Yes"}
          </Button>
          <Button onClick={close}>
            {stringsOverrides?.cancelButton ?? "No"}
          </Button>
        </ModalButtonBar>
      </Modal>
      {isLoading && <OverlaySpinner />}
    </>
  );
}

function OverlaySpinner() {
  return (
    <div className="iac-overlay-container">
      <ProgressRadial indeterminate />
    </div>
  );
}
