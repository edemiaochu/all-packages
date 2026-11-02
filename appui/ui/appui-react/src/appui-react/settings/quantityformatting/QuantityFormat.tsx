/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Settings
 */

import "./QuantityFormat.scss";
import * as React from "react";
import { DeepCompare } from "@szewtwin/core-geometry";
import type { QuantityTypeArg, QuantityTypeKey } from "@szewtwin/core-frontend";
import {
  getQuantityTypeKey,
  IVaultApp,
  QuantityType,
} from "@szewtwin/core-frontend";
import type {
  FormatProps,
  FormatterSpec,
  UnitSystemKey,
} from "@szewtwin/core-quantity";
import {
  FormatSample,
  QuantityFormatPanel,
} from "@szewtwin/ivault-components-react";
import {
  Listbox,
  ListboxItem,
  useSaveBeforeActivatingNewSettingsTab,
  useSaveBeforeClosingSettingsContainer,
} from "@szewtwin/core-react";
import { UiFramework } from "../../UiFramework.js";
import { UnitSystemSelector } from "./UnitSystemSelector.js";
import { Button, Dialog } from "@szewtwin/szewtwinui-react";
import { SvgMeasure } from "@szewtwin/szewtwinui-icons-react";
import { useTranslation } from "../../hooks/useTranslation.js";
import type { SettingsTabEntry } from "../SettingsManager.js";

function formatAreEqual(obj1: FormatProps, obj2: FormatProps) {
  const compare = new DeepCompare();
  return compare.compare(obj1, obj2);
}

/** Options to initialize the settings page that allows users to set Quantity formatting overrides.
 * @beta
 */
export interface QuantityFormatterSettingsOptions {
  initialQuantityType: QuantityTypeArg;
  availableUnitSystems: Set<UnitSystemKey>;
}

/**
 * Return a SettingsTabEntry that can be used to define the available settings that can be set for an application.
 * @param itemPriority - Used to define the order of the entry in the Settings Stage
 * @param opts - Options to initialize the settings page that allows users to set Quantity formatting overrides.
 * @beta
 */
export function getQuantityFormatsSettingsManagerEntry(
  itemPriority: number,
  opts?: Partial<QuantityFormatterSettingsOptions>
): SettingsTabEntry {
  const { availableUnitSystems, initialQuantityType } = { ...opts };
  return {
    itemPriority,
    tabId: "uifw:Quantity",
    label: UiFramework.translate("settings.quantity-formatting.label"),
    subLabel: UiFramework.translate("settings.quantity-formatting.subLabel"),
    page: (
      <QuantityFormatSettingsPage
        initialQuantityType={initialQuantityType ?? QuantityType.Length}
        availableUnitSystems={
          availableUnitSystems ??
          new Set(["metric", "imperial", "usCustomary", "usSurvey"])
        }
      />
    ),
    isDisabled: false,
    icon: <SvgMeasure />,
    tooltip: UiFramework.translate("settings.quantity-formatting.tooltip"),
    pageWillHandleCloseRequest: true,
  };
}

/** UI Component shown in settings page to set the active Presentation Unit System and to set format overrides.
 * @beta
 */
export function QuantityFormatSettingsPage({
  initialQuantityType,
  availableUnitSystems,
}: QuantityFormatterSettingsOptions) {
  const { translate } = useTranslation();
  const [activeUnitSystemKey, setActiveUnitSystemKey] = React.useState(
    IVaultApp.quantityFormatter.activeUnitSystem
  );
  const [activeQuantityType, setActiveQuantityType] = React.useState(
    getQuantityTypeKey(initialQuantityType)
  );
  const [activeFormatterSpec, setActiveFormatterSpec] = React.useState<
    FormatterSpec | undefined
  >(
    IVaultApp.quantityFormatter.findFormatterSpecByQuantityType(
      getQuantityTypeKey(activeQuantityType)
    )
  );
  const [saveEnabled, setSaveEnabled] = React.useState(false);
  const [clearEnabled, setClearEnabled] = React.useState(
    IVaultApp.quantityFormatter.hasActiveOverride(initialQuantityType, true)
  );
  const newQuantityTypeRef = React.useRef<QuantityTypeKey | undefined>(
    undefined
  );

  React.useEffect(() => {
    return IVaultApp.quantityFormatter.onActiveFormattingUnitSystemChanged.addListener(
      () => {
        if (
          activeUnitSystemKey !== IVaultApp.quantityFormatter.activeUnitSystem
        ) {
          setActiveUnitSystemKey(IVaultApp.quantityFormatter.activeUnitSystem);
          setActiveFormatterSpec(
            IVaultApp.quantityFormatter.findFormatterSpecByQuantityType(
              activeQuantityType
            )
          );
          setSaveEnabled(false);
          setClearEnabled(
            IVaultApp.quantityFormatter.hasActiveOverride(
              activeQuantityType,
              true
            )
          );
        }
      }
    );
  }, [activeQuantityType, activeUnitSystemKey]);

  React.useEffect(() => {
    return IVaultApp.quantityFormatter.onQuantityFormatsChanged.addListener(
      (args) => {
        if (!newQuantityTypeRef.current) {
          const quantityKey =
            IVaultApp.quantityFormatter.getQuantityTypeKey(activeQuantityType);
          if (args.quantityType === quantityKey) {
            setActiveFormatterSpec(
              IVaultApp.quantityFormatter.findFormatterSpecByQuantityType(
                activeQuantityType
              )
            );
            setSaveEnabled(false);
            setClearEnabled(
              IVaultApp.quantityFormatter.hasActiveOverride(
                activeQuantityType,
                true
              )
            );
          }
        }
        newQuantityTypeRef.current = undefined;
      }
    );
  }, [activeQuantityType]);

  const saveChanges = React.useCallback(
    (afterSaveFunction: (args: any) => void, args?: any) => {
      if (activeFormatterSpec) {
        const formatProps = activeFormatterSpec.format.toJSON();
        const formatPropsInUse = IVaultApp.quantityFormatter
          .findFormatterSpecByQuantityType(activeQuantityType)!
          .format.toJSON();
        if (
          formatPropsInUse &&
          !formatAreEqual(formatProps, formatPropsInUse)
        ) {
          UiFramework.dialogs.modal.open(
            <SaveFormatModalDialog
              formatProps={formatProps}
              quantityType={activeQuantityType}
              onDialogCloseArgs={args}
              onDialogClose={afterSaveFunction}
            />,
            "saveQuantityFormat"
          );
          return;
        }
      }
      afterSaveFunction(args);
    },
    [activeFormatterSpec, activeQuantityType]
  );

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  useSaveBeforeActivatingNewSettingsTab(
    UiFramework.settingsManager,
    saveChanges
  );
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  useSaveBeforeClosingSettingsContainer(
    UiFramework.settingsManager,
    saveChanges
  );

  const processListboxValueChange = React.useCallback(
    (newQuantityType: QuantityTypeKey) => {
      const volumeFormatterSpec =
        IVaultApp.quantityFormatter.findFormatterSpecByQuantityType(
          newQuantityType
        );
      setActiveFormatterSpec(volumeFormatterSpec);
      setActiveQuantityType(newQuantityType);
      setSaveEnabled(false);
      setClearEnabled(
        IVaultApp.quantityFormatter.hasActiveOverride(newQuantityType, true)
      );
    },
    []
  );

  const onListboxValueChange = React.useCallback(
    (newQuantityType: string) => {
      if (activeFormatterSpec) {
        const formatProps = activeFormatterSpec.format.toJSON();
        const formatPropsInUse = IVaultApp.quantityFormatter
          .findFormatterSpecByQuantityType(activeQuantityType)!
          .format.toJSON();
        if (
          formatPropsInUse &&
          !formatAreEqual(formatProps, formatPropsInUse)
        ) {
          newQuantityTypeRef.current = newQuantityType;
          UiFramework.dialogs.modal.open(
            <SaveFormatModalDialog
              formatProps={formatProps}
              quantityType={activeQuantityType}
              onDialogCloseArgs={newQuantityType}
              onDialogClose={processListboxValueChange}
            />,
            "saveQuantityFormat"
          );
          return;
        }
      }
      processListboxValueChange(newQuantityType);
    },
    [activeFormatterSpec, activeQuantityType, processListboxValueChange]
  );

  const handleOnFormatChanged = React.useCallback(
    async (formatProps: FormatProps) => {
      if (activeFormatterSpec) {
        const newSpec =
          await IVaultApp.quantityFormatter.generateFormatterSpecByType(
            activeQuantityType,
            formatProps
          );
        const formatPropsInUse =
          IVaultApp.quantityFormatter.getFormatPropsByQuantityType(
            activeQuantityType
          );
        if (formatPropsInUse)
          setSaveEnabled(!formatAreEqual(formatProps, formatPropsInUse));
        setActiveFormatterSpec(newSpec);
      }
    },
    [activeFormatterSpec, activeQuantityType]
  );

  const handleOnFormatSave = React.useCallback(async () => {
    if (activeFormatterSpec) {
      const format = activeFormatterSpec.format.toJSON();
      await IVaultApp.quantityFormatter.setOverrideFormat(
        activeQuantityType,
        format
      );
      setClearEnabled(true);
    }
  }, [activeFormatterSpec, activeQuantityType]);

  const handleOnFormatReset = React.useCallback(async () => {
    await IVaultApp.quantityFormatter.clearOverrideFormats(activeQuantityType);
    setClearEnabled(false);
  }, [activeQuantityType]);

  const processNewUnitSystem = React.useCallback(
    async (unitSystem: UnitSystemKey) => {
      await IVaultApp.quantityFormatter.setActiveUnitSystem(unitSystem);
    },
    []
  );

  const handleUnitSystemSelected = React.useCallback(
    async (unitSystem: UnitSystemKey) => {
      if (unitSystem === activeUnitSystemKey) return;
      saveChanges(processNewUnitSystem, unitSystem);
    },
    [activeUnitSystemKey, processNewUnitSystem, saveChanges]
  );

  return (
    <div className="quantity-formatting-container">
      <UnitSystemSelector
        selectedUnitSystemKey={activeUnitSystemKey}
        availableUnitSystems={availableUnitSystems}
        onUnitSystemSelected={handleUnitSystemSelected}
      />
      <span className="uifw-quantity-format-section-label">
        {translate("settings.quantity-formatting.formatSectionLabel")}
      </span>
      <div className="uifw-quantity-types-container">
        <div className="left-panel">
          {/* eslint-disable-next-line @typescript-eslint/no-deprecated */}
          <Listbox
            id="uifw-quantity-types-list"
            className="uifw-quantity-types"
            onListboxValueChange={onListboxValueChange}
            selectedValue={activeQuantityType}
          >
            {[...IVaultApp.quantityFormatter.quantityTypesRegistry.keys()].map(
              (key) => {
                const entry =
                  IVaultApp.quantityFormatter.quantityTypesRegistry.get(key)!;
                const description = entry.description;
                const label = entry.label;
                return (
                  // eslint-disable-next-line @typescript-eslint/no-deprecated
                  <ListboxItem
                    key={entry.key}
                    className="quantity-type-list-entry"
                    value={entry.key}
                  >
                    <span
                      className="map-source-list-entry-name"
                      title={description}
                    >
                      {label}
                    </span>
                  </ListboxItem>
                );
              }
            )}
          </Listbox>
        </div>
        <div className="right-panel">
          {activeFormatterSpec && (
            <>
              <div className="uifw-quantity-types-right-top">
                <div className="uifw-quantity-types-right-top-sample">
                  <FormatSample
                    formatSpec={activeFormatterSpec}
                    initialMagnitude={1234.56}
                    hideLabels
                  />
                </div>
              </div>
              <div className="uifw-quantity-types-formats">
                <QuantityFormatPanel
                  onFormatChange={handleOnFormatChanged}
                  quantityType={activeQuantityType}
                />
              </div>
              <div className="components-button-panel">
                <Button
                  styleType="cta"
                  onClick={handleOnFormatSave}
                  disabled={!saveEnabled}
                >
                  {translate("settings.quantity-formatting.setButtonLabel")}
                </Button>
                <Button
                  styleType="default"
                  onClick={handleOnFormatReset}
                  disabled={!clearEnabled}
                >
                  {translate("settings.quantity-formatting.clearButtonLabel")}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SaveFormatModalDialog({
  formatProps,
  quantityType,
  onDialogCloseArgs,
  onDialogClose,
}: {
  formatProps: FormatProps;
  quantityType: QuantityTypeKey;
  onDialogCloseArgs?: any;
  onDialogClose: (args?: any) => void;
}) {
  const { translate } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(true);

  const handleClose = React.useCallback(() => {
    setIsOpen(false);
    UiFramework.dialogs.modal.close();
    onDialogClose && onDialogClose(onDialogCloseArgs);
  }, [onDialogClose, onDialogCloseArgs]);

  const handleOK = React.useCallback(() => {
    void IVaultApp.quantityFormatter.setOverrideFormat(
      quantityType,
      formatProps
    );
    handleClose();
  }, [formatProps, handleClose, quantityType]);

  const handleCancel = React.useCallback(() => {
    handleClose();
  }, [handleClose]);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleCancel}
      className="uifw-settings-quantityFormatting-saveFormatModalDialog"
      closeOnEsc
      closeOnExternalClick
      preventDocumentScroll
    >
      <Dialog.Backdrop />
      <Dialog.Main
        style={{ minWidth: 200, maxWidth: 400, minHeight: 150, maxHeight: 400 }}
      >
        <Dialog.TitleBar titleText={"Save Format Changes"} />
        <Dialog.Content>
          Do you want to save changes to format before changing to another type?
        </Dialog.Content>
        <Dialog.ButtonBar>
          <Button styleType="high-visibility" onClick={handleOK}>
            {translate("dialog.yes")}
          </Button>
          <Button onClick={handleCancel}>{translate("dialog.no")}</Button>
        </Dialog.ButtonBar>
      </Dialog.Main>
    </Dialog>
  );
}
