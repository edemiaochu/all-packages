/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module StatusBar
 */

import "./TileLoadingIndicator.scss";
import classnames from "classnames";
import * as React from "react";
import { Logger } from "@szewtwin/core-szewec";
import type { ScreenViewport, Viewport } from "@szewtwin/core-frontend";
import { IVaultApp } from "@szewtwin/core-frontend";
import { ProgressLinear } from "@szewtwin/szewtwinui-react";
import { UiFramework } from "../../UiFramework.js";
import type { CommonProps } from "@szewtwin/core-react";
import type { ListenerType } from "@szewtwin/core-react/internal";

/** State for the [[TileLoadingIndicator]] component
 * @internal
 */
interface TileLoadingIndicatorState {
  label: string;
  progress: number;
  enabled: boolean;
  finished: boolean;
}

/** TileLoadingIndicator React component
 * @public
 */
export class TileLoadingIndicator extends React.PureComponent<
  CommonProps, // eslint-disable-line @typescript-eslint/no-deprecated
  TileLoadingIndicatorState
> {
  private _removeViewOpenListener?: () => void;
  private _removeOnRenderListener?: () => void;

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  constructor(props: CommonProps) {
    super(props);
    this.state = { label: "", progress: 0, enabled: false, finished: true };
  }

  private _refreshState = (vp: Viewport) => {
    const requested = vp.numRequestedTiles;
    const ready = vp.numReadyTiles;
    const total = ready + requested;
    const pctComplete = total > 0 ? (ready / total) * 100 : 100;
    let enabled = this.state.enabled;
    let finished = this.state.finished;

    if (!enabled && total !== 0 && pctComplete !== 100) enabled = true;

    if (enabled && (total === 0 || pctComplete === 100)) enabled = false;

    if (pctComplete === 100 && !finished) {
      finished = true;
      Logger.logTrace(
        UiFramework.loggerCategory("TileLoadingIndicator"),
        `Tiles Finished Loading`
      );
      Logger.logTrace(
        UiFramework.loggerCategory("TileLoadingIndicator"),
        `Tiles Load Report (tiles finished / tiles requested):  ${ready} / ${total}`
      );
    }

    if (pctComplete !== 100 && finished) finished = false;

    this.setState({
      label: `${ready} / ${total}`,
      progress: pctComplete,
      enabled,
      finished,
    });
  };

  private _handleRender: ListenerType<ScreenViewport["onRender"]> = (vp) => {
    // set progress animation before the next repaint.
    setTimeout(() => this._refreshState(vp));
  };

  private _onViewOpen: ListenerType<typeof IVaultApp.viewManager.onViewOpen> = (
    vp
  ) => {
    this._removeOnRenderListener && this._removeOnRenderListener();
    this._removeOnRenderListener = vp.onRender.addListener(this._handleRender);
  };

  public override componentDidMount() {
    if (!IVaultApp.viewManager) return;

    // get selected viewport
    const vp = IVaultApp.viewManager.selectedView;

    // if view exists bind update routine to onRender loop, otherwise do so once the onViewOpen event runs
    if (vp) {
      this._onViewOpen(vp);
    } else {
      this._removeViewOpenListener =
        IVaultApp.viewManager.onViewOpen.addListener(this._onViewOpen);
    }
  }

  public override componentWillUnmount() {
    if (!IVaultApp.viewManager) return;

    if (this._removeViewOpenListener) this._removeViewOpenListener();

    if (this._removeOnRenderListener) this._removeOnRenderListener();
  }

  /** Renders TileLoadingIndicator */
  public override render() {
    const classes = classnames(
      "uifw-tile-loading-bar",
      this.state.enabled && "uifw-tile-loading-bar-visible",
      this.props.className
    );
    return (
      <div className={classes} style={this.props.style}>
        <span>{this.state.label}</span>
        <ProgressLinear
          className="uifw-progress-indicator"
          value={this.state.progress}
        />
      </div>
    );
  }
}
