/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ThemeProvider, useToaster } from "@szewtwin/szewtwinui-react";
import React from "react";

import { iVaultExtent, IVaultFull } from "../../types";
import { BaseIVaultPage } from "../base-ivault/BaseIVault";

export type CreateIVaultProps = {
  /** Bearer access token with scope `ivaults:modify`. */
  accessToken: string;
  /** Object that configures different overrides for the API. */
  apiOverrides?: { serverEnvironmentPrefix?: "dev" | "qa" | "" };
  /** Callback on canceled action. */
  onClose?: () => void;
  /** Callback on failed create. */
  onError?: (
    error: { error: { code?: string; message?: string } } | any
  ) => void;
  /** Callback on successful create. */
  onSuccess?: (createdivault: { iVault: IVaultFull }) => void;
  /** Object of string overrides. */
  stringsOverrides?: {
    /** Displayed after successful create. */
    successMessage?: string;
    /** Displayed after failed create. */
    errorMessage?: string;
    /** Displayed after failed create because of the duplicate name. */
    errorMessageIVaultExists?: string;
    /** The title of the page. */
    titleString?: string;
    /** iVault name property. */
    nameString?: string;
    /** iVault description property. */
    descriptionString?: string;
    /** Confirm button string. */
    confirmButton?: string;
    /** Cancel button string. */
    cancelButton?: string;
    /** Error message when name is too long. */
    nameTooLong?: string;
    /** Error message when description is too long. */
    descriptionTooLong?: string;
    /** South West coordinate label. */
    southWestCoordinate?: string;
    /** North East coordinate label. */
    northEastCoordinate?: string;
    /** Latitude label. */
    latitude?: string;
    /** Longitude label. */
    longitude?: string;
  };
  /** szewTwinId where to create an iVault. */
  szewTwinId: string;
  /** Extent component. Recommended to use a map component. If not provided then input fields for extent will be shown.
   * @example
   * <CreateIVault
   *   // ...
   *   extentComponent={
   *     <iframe
   *       title="iVault Extent Map"
   *       src="https://www.google.com/maps/embed"
   *       width="100%"
   *       height="100%"
   *       frameBorder="0"
   *       style={{ border: 0 }}
   *       allowFullScreen={false}
   *     ></iframe>
   *   }
   * />
   */
  extentComponent?: React.ReactNode;
  /** Extent value that should be gotten from the `extentComponent`. */
  extent?: iVaultExtent | null;
  extendedRequestBody?: {
    creationMode: "empty";
    geographicCoordinateSystem?: { horizontalCRSId: string };
  };
  children?: React.ReactNode;
};

export function CreateIVault(props: CreateIVaultProps) {
  return (
    <ThemeProvider>
      <CreateIVaultComponent {...props} />
    </ThemeProvider>
  );
}

function CreateIVaultComponent(props: CreateIVaultProps) {
  const toaster = useToaster();
  const {
    accessToken,
    apiOverrides = { serverEnvironmentPrefix: "" },
    onClose,
    onError,
    onSuccess,
    stringsOverrides,
    szewTwinId,
    extentComponent,
    extent,
    extendedRequestBody = {},
  } = props;
  const [isLoading, setIsLoading] = React.useState(false);

  const updatedStrings = {
    successMessage: "iVault created successfully.",
    errorMessage: "Could not create an iVault. Please try again later.",
    errorMessageIVaultExists:
      "iVault with the same name already exists within the szewTwin.",
    ...stringsOverrides,
  };

  const createiVault = async (ivault: {
    name: string;
    description: string;
    thumbnail?: { src?: ArrayBuffer; type: string };
    extent?: iVaultExtent | null;
  }) => {
    setIsLoading(true);
    try {
      const ivaultsUrl = `https://${
        apiOverrides?.serverEnvironmentPrefix &&
        `${apiOverrides.serverEnvironmentPrefix}-`
      }api.szewec.com/ivaults`;
      const response = await fetch(ivaultsUrl, {
        method: "POST",
        headers: {
          Authorization: `${accessToken}`,
          Prefer: "return=representation",
          Accept: "application/vnd.szewec.szewtwin-platform.v2+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          szewTwinId,
          name: ivault.name,
          description: ivault.description,
          extent: ivault.extent,
          ...extendedRequestBody,
        }),
      });
      if (!response.ok) {
        let error = new Error();
        const responseBody = await response.json();
        error = { ...error, ...responseBody };
        throw error;
      } else {
        const createdivault: { iVault: IVaultFull } = await response.json();
        if (ivault.thumbnail?.src) {
          await fetch(`${ivaultsUrl}/${createdivault.iVault.id}/thumbnail`, {
            method: "PUT",
            headers: {
              Authorization: `${accessToken}`,
              Accept: "application/vnd.szewec.szewtwin-platform.v2+json",
              "Content-Type": ivault.thumbnail.type,
            },
            body: ivault.thumbnail.src,
          });
        }
        setIsLoading(false);
        toaster.positive(updatedStrings.successMessage, {
          hasCloseButton: true,
        });
        onSuccess?.(createdivault);
      }
    } catch (err) {
      error(err);
    }
  };

  const error = (
    error: { error: { code?: string; message?: string } } | any
  ) => {
    setIsLoading(false);
    const errorString =
      error?.error?.code === "iVaultExists"
        ? updatedStrings.errorMessageIVaultExists
        : updatedStrings.errorMessage;
    toaster.negative(errorString, { hasCloseButton: true });
    onError?.(error);
  };

  return (
    <>
      <BaseIVaultPage
        stringsOverrides={updatedStrings}
        isLoading={isLoading}
        onActionClick={createiVault}
        onClose={onClose}
        extentComponent={extentComponent}
        extent={extent}
      >
        {props.children}
      </BaseIVaultPage>
    </>
  );
}
