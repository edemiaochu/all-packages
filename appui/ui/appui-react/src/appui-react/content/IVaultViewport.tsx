/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module ContentView
 */

import * as React from "react";
import type { Id64String } from "@szewtwin/core-szewec";
import type {
  IVaultConnection,
  ScreenViewport,
  ViewState,
} from "@szewtwin/core-frontend";
import type {
  ViewportProps,
  ViewStateProp,
} from "@szewtwin/ivault-components-react";
import { ViewportComponent } from "@szewtwin/ivault-components-react";
import { FillCentered } from "@szewtwin/core-react";

import type { ConfigurableCreateInfo } from "../configurableui/ConfigurableUiControl.js";
import { UiFramework } from "../UiFramework.js";
import { DefaultViewOverlay } from "./DefaultViewOverlay.js";
import { ViewportContentControl } from "./ViewportContentControl.js";
import { StandardRotationNavigationAidControl } from "../navigationaids/StandardRotationNavigationAid.js";
import { UiError } from "@szewtwin/appui-abstract";
import { useReduxFrameworkState } from "../uistate/useReduxFrameworkState.js";
import { ConfigurableUiContext } from "../configurableui/ConfigurableUiContent.js";

/* eslint-disable @typescript-eslint/no-deprecated */

/** Viewport that is connected to the IVaultConnection property in the Redux store. The application must set up the Redux store and include the FrameworkReducer.
 * @note Requires redux provider.
 * @public
 * @deprecated in 4.15.0. Use {@link @szewtwin/ivault-components-react#ViewportComponent} instead.
 */
export function IVaultConnectedViewport(
  props: Omit<ViewportProps, "ivault" | "viewState">
) {
  const iVault = useReduxFrameworkState(
    (state) => state?.sessionState.iVaultConnection
  );
  const viewState = useReduxFrameworkState(
    (state) => state?.sessionState.defaultViewState
  );
  if (!iVault) return null;
  return <ViewportComponent ivault={iVault} viewState={viewState} {...props} />;
}

/** [[IVaultViewportControl]] options. These options are set in the applicationData property of the [[ContentProps]].
 * @public
 * @deprecated in 4.16.0. Used in a deprecated class {@link IVaultViewportControl}.
 */
export interface IVaultViewportControlOptions {
  /** ViewState or a function to return a ViewState */
  viewState?: ViewStateProp;
  /** IVaultConnection of data in Viewport */
  iVaultConnection?: IVaultConnection | (() => IVaultConnection);
  /** Map of options that can be used to enable/disable features within the view */
  featureOptions?: { [key: string]: any };
  /** Optional background color which may be used if viewState and iVaultConnection are undefined */
  bgColor?: string;
  /** Optional property to always use the supplied `viewState` property instead of using viewport.view when set */
  alwaysUseSuppliedViewState?: boolean;
  /** Optional property to supply custom view overlay. Uses when caller want to supply custom overlay component. */
  supplyViewOverlay?: (_viewport: ScreenViewport) => React.ReactNode;
  /** Optional property to defer reactNode initialization until first reactNode property is needed. Useful when subClassing the `IVaultViewportControl`. */
  deferNodeInitialization?: boolean;
}

interface ViewOverlayHostProps {
  viewport: ScreenViewport;
  featureOptions?: { [key: string]: any };
  userSuppliedOverlay?: (_viewport: ScreenViewport) => React.ReactNode;
}

/** @internal */
export function ViewOverlayHost({
  viewport,
  featureOptions,
  userSuppliedOverlay,
}: ViewOverlayHostProps) {
  const reduxDisplayViewOverlay = useReduxFrameworkState(
    (state) => state?.configurableUiState.viewOverlayDisplay
  );
  const configurableUi = React.useContext(ConfigurableUiContext);
  const displayViewOverlay =
    configurableUi?.viewOverlay ?? reduxDisplayViewOverlay ?? true;
  if (!displayViewOverlay) return null;
  return userSuppliedOverlay ? (
    <React.Fragment>{userSuppliedOverlay(viewport)}</React.Fragment>
  ) : (
    <DefaultViewOverlay viewport={viewport} featureOptions={featureOptions} />
  );
}

/** iVault Viewport Control
 * @public
 * @deprecated in 4.16.0. Use {@link @szewtwin/ivault-components-react#ViewportComponent} component instead.
 */
export class IVaultViewportControl extends ViewportContentControl {
  public static get id() {
    return "UiFramework.IVaultViewportControl";
  }
  protected _featureOptions: { [key: string]: boolean | string } = {};
  protected _viewState: ViewStateProp | undefined;
  protected _iVaultConnection: IVaultConnection | undefined;
  protected _alwaysUseSuppliedViewState: boolean;
  private _userSuppliedViewOverlay?: (
    _viewport: ScreenViewport
  ) => React.ReactNode;

  constructor(
    info: ConfigurableCreateInfo,
    protected _options: IVaultViewportControlOptions
  ) {
    _options = _options ?? {};
    super(info, _options);
    this._options = _options;

    if (_options.featureOptions) this._featureOptions = _options.featureOptions;
    this._alwaysUseSuppliedViewState =
      _options.alwaysUseSuppliedViewState ?? false;
    this._userSuppliedViewOverlay = _options.supplyViewOverlay;

    if (!_options.deferNodeInitialization) this.initializeReactNode();
  }

  protected initializeReactNode() {
    const options = this._options;

    if (options.viewState) this._viewState = options.viewState;

    const iVaultConnection =
      typeof options.iVaultConnection === "function"
        ? options.iVaultConnection()
        : options.iVaultConnection;

    if (this._viewState && iVaultConnection) {
      /** Passing _determineViewState as a function reference; it is not called here. */
      this._reactNode = this.getIvaultViewportReactElement(
        iVaultConnection,
        this._determineViewState
      );
    } else {
      if (
        UiFramework.getIVaultConnection() &&
        UiFramework.getDefaultViewState()
      ) {
        this._reactNode = this.getIvaultConnectedViewportReactElement();
      } else {
        this._reactNode = this.getNoContentReactElement(options);
        this.setIsReady();
      }
    }
  }

  protected override getReactNode(): React.ReactNode {
    if (
      !React.isValidElement(this._reactNode) &&
      this._options.deferNodeInitialization
    )
      this.initializeReactNode();

    return this.getKeyedReactNode();
  }

  /**
   * This is passed as a function to the ViewportComponent as the `viewState` prop in getIvaultViewportReactElement().
   * It is called by ViewportComponent on a mount to resolve the viewState.
   */
  private _determineViewState = (): ViewState => {
    let viewState: ViewState;

    if (this.viewport && !this._alwaysUseSuppliedViewState)
      viewState = this.viewport.view;
    else if (this._viewState) {
      if (typeof this._viewState === "function") viewState = this._viewState();
      else viewState = this._viewState;
    } else
      throw new UiError(
        UiFramework.loggerCategory("IVaultViewport"),
        "No ViewState could be determined"
      );

    return viewState!;
  };

  /** Get the React component that will contain the Viewport */
  protected getIvaultConnectedViewportReactElement(): React.ReactNode {
    return (
      <IVaultConnectedViewport
        viewportRef={(v) => {
          this.viewport = v;
          // for convenience, if window defined bind viewport to window
          if (undefined !== window) (window as any).viewport = v;
          if (!UiFramework.frontstages.isLoading)
            UiFramework.frontstages.activeFrontstageDef?.setActiveViewFromViewport(
              v
            );
        }}
        getViewOverlay={this._getViewOverlay}
      />
    );
  }

  /** Get the React component that will contain the Viewport */
  protected getIvaultViewportReactElement(
    iVaultConnection: IVaultConnection,
    viewState: ViewStateProp
  ): React.ReactNode {
    return (
      <ViewportComponent
        viewState={viewState}
        ivault={iVaultConnection}
        controlId={this.controlId}
        viewportRef={(v) => {
          this.viewport = v;
          // for convenience, if window defined bind viewport to window
          if (undefined !== window) (window as any).viewport = v;
          if (!UiFramework.frontstages.isLoading)
            UiFramework.frontstages.activeFrontstageDef?.setActiveViewFromViewport(
              v
            );
        }}
        getViewOverlay={this._getViewOverlay}
      />
    );
  }

  /** Get the React component that will be shown when no iVault data is available */
  protected getNoContentReactElement(
    _options: IVaultViewportControlOptions
  ): React.ReactNode {
    return (
      <FillCentered>{UiFramework.translate("general.no-content")}</FillCentered>
    );
  }

  /** Get the React.Element for a ViewSelector change. */
  public override getReactElementForViewSelectorChange(
    iVaultConnection: IVaultConnection,
    _unusedViewDefinitionId: Id64String,
    viewState: ViewState,
    _name: string
  ): React.ReactNode {
    return this.getIvaultViewportReactElement(iVaultConnection, viewState);
  }

  /** Get the default ViewOverlay unless parameter is set to not use it. May be override in an application specific sub-class  */
  protected _getViewOverlay = (vp: ScreenViewport): React.ReactNode => {
    return (
      <ViewOverlayHost
        viewport={vp}
        featureOptions={this._featureOptions}
        userSuppliedOverlay={this._userSuppliedViewOverlay}
        data-testid="ViewOverlay"
      />
    );
  };

  /** Get the NavigationAidControl associated with this ContentControl */
  public override get navigationAidControl(): string {
    if (this.viewport) return super.navigationAidControl;
    else return StandardRotationNavigationAidControl.navigationAidId;
  }
}
