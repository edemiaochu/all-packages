/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import "./BaseIVault.scss";

import { LabeledInput, ProgressRadial, Text } from "@szewtwin/szewtwinui-react";
import React from "react";

import { BaseIVault, ExtentPoint, iVaultExtent } from "../../types";
import { isPropertyInvalid, MAX_LENGTH } from "../../utils";
import { ButtonBar } from "../button-bar";
import {
  IVaultContext,
  iVaultProps,
  InnerIVaultContext,
} from "../context/ivault-context";
import { IVaultDescription } from "../ivault-description/IVaultDescription";
import { IVaultName } from "../ivault-name/IVaultName";
import { UploadImage } from "../upload-image/UploadImage";

export type BaseIVaultProps = {
  /** Callback on canceled action. */
  onClose?: () => void;
  /** Callback on action. */
  onActionClick?: (ivault: {
    name: string;
    description: string;
    thumbnail?: { src?: ArrayBuffer; type: string };
    extent?: iVaultExtent | null;
  }) => void;
  /** Object of string overrides. */
  stringsOverrides?: {
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
  /** If action is loading. */
  isLoading?: boolean;
  /** Initial iVault state used for update. */
  initialIVault?: BaseIVault;
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
  children?: React.ReactNode;
};

export function BaseIVaultPage(props: BaseIVaultProps) {
  const {
    onClose,
    onActionClick,
    initialIVault,
    isLoading = false,
    stringsOverrides,
    extentComponent,
    extent,
  } = props;

  const [ivault, setIvault] = React.useState<iVaultProps>({
    name: initialIVault?.name ?? "",
    description: initialIVault?.description ?? "",
    thumbnail: { src: initialIVault?.thumbnail, type: "image/png" },
    extent: initialIVault?.extent,
  });
  const [isThumbnailChanged, setIsThumbnailChanged] =
    React.useState<boolean>(false);

  const updatedStrings = {
    titleString: "Create an iVault",
    nameString: "Name",
    descriptionString: "Description",
    confirmButton: "Create",
    cancelButton: "Cancel",
    nameTooLong: `The value exceeds allowed ${MAX_LENGTH} characters.`,
    descriptionTooLong: `The value exceeds allowed ${MAX_LENGTH} characters.`,
    southWestCoordinate: "South West coordinate",
    northEastCoordinate: "North East coordinate",
    latitude: "Latitude",
    longitude: "Longitude",
    ...stringsOverrides,
  };

  React.useEffect(() => {
    if (extent !== undefined) {
      setIvault((prevState) => ({
        ...prevState,
        extent: extent as iVaultExtent,
      }));
    }
  }, [extent]);

  const onPropChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    event.persist();
    setIvault((prevState) => ({
      ...prevState,
      [event.target.name]: event.target.value ?? "",
    }));
  };

  const isDataValid = () => {
    return (
      !!ivault.name.trim().length &&
      !isPropertyInvalid(ivault.name, MAX_LENGTH) &&
      !isPropertyInvalid(ivault.description, MAX_LENGTH) &&
      (!ivault.extent ||
        (isPointValid(ivault.extent.northEast) &&
          isPointValid(ivault.extent.southWest)))
    );
  };

  const isDataChanged = () => {
    return (
      ivault.name !== initialIVault?.name ||
      ivault.description !== initialIVault?.description ||
      isThumbnailChanged ||
      isExtentChanged()
    );
  };

  const onImageChange = (src: ArrayBuffer, type: string) => {
    setIsThumbnailChanged(true);
    setIvault((prevState) => ({
      ...prevState,
      thumbnail: { src, type },
    }));
  };

  const onCoordinateChange = (
    point: keyof iVaultExtent,
    coordinate: keyof ExtentPoint,
    value: string
  ) => {
    setIvault((prevState) => {
      const extent = {
        northEast: { ...prevState.extent?.northEast },
        southWest: { ...prevState.extent?.southWest },
      };
      extent[point][coordinate] = value === "" ? undefined : Number(value);
      return { ...prevState, extent: extent as iVaultExtent };
    });
  };

  const isLatitudeValid = (latitude?: number) => {
    if (!latitude) {
      return true;
    }
    return -90 <= latitude && latitude <= 90;
  };

  const isLongitudeValid = (longitude?: number) => {
    if (!longitude) {
      return true;
    }
    return -180 <= longitude && longitude <= 180;
  };

  const isPointValid = (point: ExtentPoint) => {
    // If both fields empty then it is valid
    if (point.latitude == null && point.longitude == null) {
      return true;
    }
    // If one of the fields not empty then it is invalid
    if (point.latitude == null || point.longitude == null) {
      return false;
    }
    return isLatitudeValid(point.latitude) && isLongitudeValid(point.longitude);
  };

  const isExtentChanged = () => {
    return (
      ivault.extent?.northEast.latitude !==
        initialIVault?.extent?.northEast.latitude ||
      ivault.extent?.northEast.longitude !==
        initialIVault?.extent?.northEast.longitude ||
      ivault.extent?.southWest.latitude !==
        initialIVault?.extent?.southWest.latitude ||
      ivault.extent?.southWest.longitude !==
        initialIVault?.extent?.southWest.longitude
    );
  };

  const PointInput = (label: string, coordinate: keyof iVaultExtent) => {
    return (
      <div className="iui-input-container">
        <div className="iui-label">{label}</div>
        <div className="iac-extent-inputs-container">
          <LabeledInput
            label={updatedStrings.latitude}
            value={ivault.extent?.[coordinate].latitude ?? ""}
            onChange={(e) =>
              onCoordinateChange(coordinate, "latitude", e.target.value)
            }
            displayStyle="inline"
            type="number"
            autoComplete="off"
            status={
              isLatitudeValid(ivault.extent?.[coordinate].latitude)
                ? undefined
                : "negative"
            }
            min={-90}
            max={90}
          />
          <LabeledInput
            label={updatedStrings.longitude}
            value={ivault.extent?.[coordinate]?.longitude ?? ""}
            onChange={(e) =>
              onCoordinateChange(coordinate, "longitude", e.target.value)
            }
            displayStyle="inline"
            type="number"
            autoComplete="off"
            status={
              isLongitudeValid(ivault.extent?.[coordinate].longitude)
                ? undefined
                : "negative"
            }
            min={-180}
            max={180}
          />
        </div>
      </div>
    );
  };

  return (
    <InnerIVaultContext.Provider
      value={{
        nameString: updatedStrings?.nameString,
        nameTooLong: updatedStrings?.nameTooLong,
        descriptionString: updatedStrings?.descriptionString,
        descriptionTooLong: updatedStrings?.descriptionTooLong,
        confirmButtonText: updatedStrings.confirmButton,
        cancelButtonText: updatedStrings.cancelButton,
      }}
    >
      <IVaultContext.Provider
        value={{
          ivault,
          onPropChange,
          onImageChange,
          confirmAction: () =>
            onActionClick?.({
              ...ivault,
              thumbnail: isThumbnailChanged ? ivault.thumbnail : undefined,
              extent: ivault.extent,
            }),
          cancelAction: onClose,
          isPrimaryButtonDisabled:
            !isDataChanged() || !isDataValid() || isLoading,
        }}
      >
        {props.children ?? (
          <div className="iac-ivault-base">
            <div className="iac-content-container">
              <Text variant="title">{updatedStrings.titleString}</Text>
              <div className="iac-ivault-properties-container">
                <div className="iac-inputs-container">
                  <IVaultName />
                  <IVaultDescription />
                  {!extentComponent && (
                    <>
                      {PointInput(
                        updatedStrings.southWestCoordinate,
                        "southWest"
                      )}
                      {PointInput(
                        updatedStrings.northEastCoordinate,
                        "northEast"
                      )}
                    </>
                  )}
                  <UploadImage />
                </div>
                {extentComponent && (
                  <div className="iac-extent-container">{extentComponent}</div>
                )}
              </div>
            </div>
            <ButtonBar />
            {isLoading && <OverlaySpinner />}
          </div>
        )}
      </IVaultContext.Provider>
    </InnerIVaultContext.Provider>
  );
}

function OverlaySpinner() {
  return (
    <div className="iac-overlay-container">
      <ProgressRadial indeterminate />
    </div>
  );
}
