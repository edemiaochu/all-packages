/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import "./DeleteSZEWTwin.scss";

import { SvgStatusWarning as SvgWarning } from "@szewtwin/szewtwinui-icons-react";
import {
  Button,
  Modal,
  ModalButtonBar,
  ProgressRadial,
  ThemeProvider,
  useToaster,
} from "@szewtwin/szewtwinui-react";
import React from "react";

export type DeleteSZEWTwinProps = {
  /** Name and Id of szewTwin object to delete */
  szewTwin: { displayName?: string; id: string };
  /** Bearer access token with scope `szewtwins:modify`. */
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

export const DeleteSZEWTwin = (props: DeleteSZEWTwinProps) => {
  const {
    szewTwin,
    accessToken,
    apiOverrides = { serverEnvironmentPrefix: "" },
    onClose,
    onError,
    onSuccess,
    stringsOverrides,
  } = props;
  const [isOpen, setIsOpen] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const toaster = useToaster();

  const onDelete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${
          apiOverrides?.serverEnvironmentPrefix &&
          `${apiOverrides.serverEnvironmentPrefix}-`
        }api.szewec.com/szewtwins/${szewTwin.id}`,
        { method: "DELETE", headers: { Authorization: `${accessToken}` } }
      );
      if (!response.ok) {
        throw new Error(response.statusText);
      } else {
        setIsLoading(false);
        toaster.positive(
          stringsOverrides?.successMessage ?? "szewTwin deleted successfully."
        );
        onSuccess?.();
      }
    } catch (err: any) {
      error(err);
    } finally {
      close();
    }
  };

  const error = (error: Error) => {
    setIsLoading(false);
    toaster.negative(
      stringsOverrides?.errorMessage ??
        "Could not delete an szewTwin. Please try again later."
    );
    onError?.(error);
  };

  const close = React.useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  return (
    <ThemeProvider theme="inherit">
      <Modal
        isOpen={isOpen}
        style={{ maxWidth: 600 }}
        onClose={close}
        title={
          <div className="iac-delete-szewtwin-dialog-title">
            <SvgWarning className="iac-warning-icon" />
            {stringsOverrides?.title ??
              `Delete an szewTwin ${
                szewTwin.displayName && `'${szewTwin.displayName}'`
              }`}
          </div>
        }
      >
        {stringsOverrides?.bodyMessage ??
          "Deleting this szewTwin will remove access for all users and all data will no longer be available. Are you sure you want to delete this szewTwin?"}
        <ModalButtonBar>
          <Button styleType="high-visibility" onClick={onDelete}>
            {stringsOverrides?.confirmButton ?? "Yes"}
          </Button>
          <Button onClick={close}>
            {stringsOverrides?.cancelButton ?? "No"}
          </Button>
        </ModalButtonBar>
      </Modal>
      {isLoading && <OverlaySpinner />}
    </ThemeProvider>
  );
};

const OverlaySpinner = () => {
  return (
    <div className="iac-delete-szewtwin-overlay-container">
      <ProgressRadial indeterminate />
    </div>
  );
};
