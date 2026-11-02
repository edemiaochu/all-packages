/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Widget
 */

import "./BackstageAppButton.scss";
import * as React from "react";
import type { IconSpec } from "@szewtwin/core-react";
import { Icon as CoreIcon } from "@szewtwin/core-react";
import { SvgHome } from "@szewtwin/szewtwinui-icons-react";
import { UiFramework } from "../UiFramework.js";
import { useTranslation } from "../hooks/useTranslation.js";
import { Surface } from "../toolbar/new-toolbars/Surface.js";
import { IconButton } from "@szewtwin/szewtwinui-react";

/** Properties of {@link BackstageAppButton} component.
 * @public
 */
export interface BackstageAppButtonProps {
  /** If specified overrides the default icon.
   * @deprecated in 4.16.0. Use {@link BackstageAppButtonProps.iconNode} instead.
   */
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  icon?: IconSpec;
  iconNode?: React.ReactNode;
  /** If specified overrides the default label. */
  label?: string;
  /** If specified overrides the default action that toggles the backstage. */
  execute?: () => void;
}

/** Component shown in the top-left corner of the content manipulation area. It is usually used to toggle the display of a backstage or navigate between frontstages.
 * @public
 */
export function BackstageAppButton({
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  icon: iconSpec,
  iconNode,
  label,
  execute,
}: BackstageAppButtonProps) {
  const { translate } = useTranslation();
  label = label ?? translate("buttons.openBackstageMenu");

  const handleClick = React.useCallback(() => {
    if (execute) {
      execute();
      return;
    }

    UiFramework.backstage.toggle();
  }, [execute]);

  const iconSpecElement = iconSpec ? (
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    <CoreIcon iconSpec={iconSpec} />
  ) : undefined;
  const icon = iconNode ?? iconSpecElement ?? <SvgHome />;
  return (
    <Surface orientation="horizontal">
      <IconButton
        className="uifw-widget-backstageAppButton"
        styleType="borderless"
        onClick={handleClick}
        iconProps={{ className: "uifw-widget-backstageAppButton_icon" }}
        label={label}
        labelProps={{
          placement: "right",
          className: "uifw-widget-backstageAppButton_label",
        }}
      >
        {icon}
        <div className="uifw-widget-backstageAppButton_bars">
          <div className="uifw-bar" />
          <div className="uifw-bar" />
          <div className="uifw-bar" />
        </div>
      </IconButton>
    </Surface>
  );
}
