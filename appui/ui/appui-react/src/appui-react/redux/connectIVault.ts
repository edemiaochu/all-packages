/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module State
 */

import { connect } from "react-redux";
import { UiFramework } from "../UiFramework.js";

/* eslint-disable @typescript-eslint/no-deprecated */

/** Private function that will map store's iVaultConnection to the 'iVaultConnection', 'iVault', and 'ivault' properties of props. This
 * is not ideal but it is a result of not having standard prop name for an iVaultConnection.
 */
const iModeMapStateToProps = (mapStateToProps: any) => {
  return (state: any, ownProps: any) => {
    const frameworkState = state[UiFramework.frameworkStateKey]; // since app sets up key, don't hard-code name

    if (!frameworkState) {
      if (mapStateToProps) return mapStateToProps(state, ownProps);
      return {};
    }

    const storeProps = {
      iVaultConnection: frameworkState.sessionState.iVaultConnection,
      ivault: frameworkState.sessionState.iVaultConnection,
      iVault: frameworkState.sessionState.iVaultConnection,
    };

    if (mapStateToProps) {
      return {
        ...storeProps,
        ...mapStateToProps(state, ownProps),
      };
    }

    return storeProps;
  };
};

/** Function that will map store's iVaultConnection and defaultViewState to the props 'iVaultConnection', 'iVault', 'ivault',
 * and 'viewState' property of props
 */
const iVaultAndViewMapStateToProps = (mapStateToProps: any) => {
  return (state: any, ownProps: any) => {
    const frameworkState = state[UiFramework.frameworkStateKey]; // since app sets up key, don't hard-code name

    if (!frameworkState) return {};

    const props = {
      ...ownProps,
      iVaultConnection: frameworkState.sessionState.iVaultConnection, // this prop is required by Unified Selection (TODO: standardize on use)
      iVault: frameworkState.sessionState.iVaultConnection, // this prop is needed by many components
      ivault: frameworkState.sessionState.iVaultConnection, // this prop is needed by ViewportProps
      viewState: frameworkState.sessionState.defaultViewState,
    };
    if (mapStateToProps) return mapStateToProps(state, props);

    return props;
  };
};

/** Function that will connect a component to the IVaultConnection data in the Redux store.
 * @param mapStateToProps optional user function that, if defined, will be executed to provide additional properties from store.
 * @param mapDispatchToProps data passed to Redux connect function.
 * @public
 * @deprecated in 4.15.0. Components should take iVault connection as props.
 */
export const connectIVaultConnection = (
  mapStateToProps?: any,
  mapDispatchToProps?: any
) => {
  return connect(iModeMapStateToProps(mapStateToProps), mapDispatchToProps);
};

/** Function that will connect a component to the IVaultConnection data in the Redux store
 * @param mapStateToProps optional user function that, if defined, will be executed to provide additional properties from store.
 * @param mapDispatchToProps data passed to Redux connect function.
 * @beta
 *
 * @example
 *   // connect component for both getting and setting IvaultConnection data from Redux store.
 *  import { connectIVaultConnection, sessionStateMapDispatchToProps, SessionStateActionsProps } from "@szewtwin/appui-react";
 *
 *  export interface ComponentProps extends SessionStateActionsProps {
 *    myData: string;
 *  }
 *
 *  export const ConnectControl = connectIVaultConnection(null, sessionStateMapDispatchToProps)(ComponentClass);
 *
 *  //  this then allows connected control to update the store using a call like shown below.
 *  this.props.setNumItemsSelected(30);
 * @deprecated in 4.15.0. Components should take iVault connection and view state as props.
 */
export const connectIVaultConnectionAndViewState = (
  mapStateToProps?: any,
  mapDispatchToProps?: any
) => {
  return connect(
    iVaultAndViewMapStateToProps(mapStateToProps),
    mapDispatchToProps
  );
};
