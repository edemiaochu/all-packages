/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Picker
 */

import * as React from "react";
import { UiEvent } from "@szewtwin/appui-abstract";
import type { Id64String } from "@szewtwin/core-szewec";
import { assert, BeUiEvent, Logger } from "@szewtwin/core-szewec";
import type { IVaultConnection, ViewState } from "@szewtwin/core-frontend";
import { FuzzySearch, IVaultApp } from "@szewtwin/core-frontend";
import type { SupportsViewSelectorChange } from "../content/ContentControl.js";
import { UiFramework } from "../UiFramework.js";
import { ViewUtilities } from "../utils/ViewUtilities.js";
import type { ListItem } from "./ListPicker.js";
import { ListItemType, ListPicker } from "./ListPicker.js";
import debounce from "lodash/debounce.js";
import { SvgSavedView } from "../icons/SvgSavedView.js";
import { useReduxFrameworkState } from "../uistate/useReduxFrameworkState.js";
import type { ListenerType } from "@szewtwin/core-react/internal";
import { Icon } from "@szewtwin/core-react";

/** [[ViewSelectorChangedEvent]] Args interface.
 * @beta
 * @deprecated in 4.13.0. Event args are inferred from a listener. If explicit type is needed use a type helper.
 */
export interface ViewSelectorChangedEventArgs {
  iVaultConnection: IVaultConnection;
  viewDefinitionId: Id64String;
  viewState: ViewState;
  name: string;
}

/** ViewSelector Changed Event class.
 * @beta
 * @deprecated in 4.13.0. This class should not be used by applications to instantiate objects.
 */
// eslint-disable-next-line @typescript-eslint/no-deprecated
export class ViewSelectorChangedEvent extends UiEvent<ViewSelectorChangedEventArgs> {}

/** Properties for the [[ViewSelector]] component
 * @beta
 */
export interface ViewSelectorProps {
  ivault?: IVaultConnection;
  listenForShowUpdates?: boolean;
  onViewSelected?: (args: {
    iVaultConnection: IVaultConnection;
    viewDefinitionId: Id64String;
    viewState: ViewState;
    name: string;
  }) => void;

  showSpatials: boolean;
  showDrawings: boolean;
  showSheets: boolean;
  showUnknown: boolean;
  searchBox?: boolean;
  panelOnly?: boolean;
}

/** State for the [[ViewSelector]] component
 * @beta
 */
interface ViewSelectorState {
  items: ListItem[];
  title: string;
  initialized: boolean;
  showSpatials: boolean;
  showDrawings: boolean;
  showSheets: boolean;
  showUnknown: boolean;
  searchBox: boolean;
  panelOnly: boolean;
  expand: boolean;
}

/** Default properties of [[ViewSelector]] component.
 * @beta
 */
export type ViewSelectorDefaultProps = Pick<
  ViewSelectorProps,
  "showSpatials" | "showDrawings" | "showSheets" | "showUnknown"
>;

/** View Selector React component
 * @beta
 */
export class ViewSelector extends React.Component<
  ViewSelectorProps,
  ViewSelectorState
> {
  private static readonly _onViewSelectorShowUpdateEvent = new BeUiEvent<{
    showSpatials: boolean;
    showDrawings: boolean;
    showSheets: boolean;
    showUnknown: boolean;
  }>();
  private _removeShowUpdateListener?: () => void;
  private _isMounted = false;
  private _searchInput = "";

  public static readonly defaultProps: ViewSelectorDefaultProps = {
    showSpatials: true,
    showDrawings: true,
    showSheets: true,
    showUnknown: true,
  };

  /** Gets the [[ViewSelectorChangedEvent]].
   * @deprecated in 4.16.0. Use {@link ViewSelectorProps.onViewSelected} prop instead.
   */
  public static readonly onViewSelectorChangedEvent =
    new ViewSelectorChangedEvent(); // eslint-disable-line @typescript-eslint/no-deprecated

  /** Updates the ViewSelector show settings.
   */
  public static updateShowSettings(
    showSpatials: boolean,
    showDrawings: boolean,
    showSheets: boolean,
    showUnknown: boolean
  ): void {
    ViewSelector._onViewSelectorShowUpdateEvent.emit({
      showSpatials,
      showDrawings,
      showSheets,
      showUnknown,
    });
  }

  /** Creates a ViewSelector */
  constructor(props: ViewSelectorProps) {
    super(props);

    this.state = {
      items: new Array<ListItem>(),
      title: UiFramework.translate("viewTypes.views"),
      initialized: false,
      showSpatials: props.showSpatials,
      showDrawings: props.showDrawings,
      showSheets: props.showSheets,
      showUnknown: props.showUnknown,
      searchBox: props.searchBox ? props.searchBox : true,
      panelOnly: props.panelOnly ? props.panelOnly : false,
      expand: false,
    };
  }

  public override async componentDidMount() {
    this._isMounted = true;
    if (this.props.listenForShowUpdates)
      this._removeShowUpdateListener =
        ViewSelector._onViewSelectorShowUpdateEvent.addListener(
          this._handleViewSelectorShowUpdateEvent
        );

    await this.loadViews();
  }

  /** @internal */
  public override async componentDidUpdate(prevProps: ViewSelectorProps) {
    if (this.props.ivault !== prevProps.ivault) {
      await this.loadViews();
    }
  }

  public override componentWillUnmount() {
    this._isMounted = false;
    if (this._removeShowUpdateListener) this._removeShowUpdateListener();
  }

  private _handleViewSelectorShowUpdateEvent: ListenerType<
    typeof ViewSelector._onViewSelectorShowUpdateEvent
  > = (args): void => {
    if (!this._isMounted) return;

    this.setState(args, async () => this.loadViews());
  };

  private setStateContainers(
    views3d: ListItem[],
    views2d: ListItem[],
    sheets: ListItem[],
    unknown?: ListItem[],
    views3dFiltered?: ListItem[],
    views2dFiltered?: ListItem[],
    sheetsFiltered?: ListItem[],
    unknownFiltered?: ListItem[]
  ) {
    const views3dContainer: ListItem = {
      key: "views3dContainer",
      name: UiFramework.translate("viewTypes.spatialViews"),
      enabled: false,
      type: ListItemType.Container,
      children: views3dFiltered ? views3dFiltered : views3d,
    };

    const views2dContainer: ListItem = {
      key: "views2dContainer",
      name: UiFramework.translate("viewTypes.drawings"),
      enabled: false,
      type: ListItemType.Container,
      children: views2dFiltered ? views2dFiltered : views2d,
    };

    const sheetContainer: ListItem = {
      key: "sheetContainer",
      name: UiFramework.translate("viewTypes.sheets"),
      enabled: false,
      type: ListItemType.Container,
      children: sheetsFiltered ? sheetsFiltered : sheets,
    };

    const containers = [views3dContainer, views2dContainer, sheetContainer];

    if (unknown && unknown.length > 0) {
      // This should never show, but just in case we missed a type of view state
      const unknownContainer: ListItem = {
        key: "unknownContainer",
        name: UiFramework.translate("viewTypes.others"),
        enabled: false,
        type: ListItemType.Container,
        children: unknownFiltered ? unknownFiltered : unknown,
      };

      if (unknown.length !== 0) containers.push(unknownContainer);
    }

    if (!this._isMounted) return;

    this.setState({
      items: containers,
      title: UiFramework.translate("viewTypes.views"),
      initialized: true,
    });
  }
  /**
   * Query the views and set the initial state with the iVault's views.
   */
  public async loadViews(): Promise<void> {
    // Query views and add them to state
    const views3d: ListItem[] = [];
    const views2d: ListItem[] = [];
    const sheets: ListItem[] = [];
    const unknown: ListItem[] = [];
    let views3dFiltered: ListItem[] | undefined;
    let views2dFiltered: ListItem[] | undefined;
    let sheetsFiltered: ListItem[] | undefined;
    let unknownFiltered: ListItem[] | undefined;
    const fuzzy = new FuzzySearch<ListItem>();

    if (this.props.ivault && this.props.ivault.views.getViewList) {
      const query = { wantPrivate: false };
      const specs = await this.props.ivault.views.getViewList(query);

      specs.forEach((spec: IVaultConnection.ViewSpec) => {
        const viewItem: ListItem = {
          key: spec.id,
          name: spec.name,
          enabled:
            spec.id === IVaultApp.viewManager.selectedView?.view.id
              ? true
              : false,
          type: ListItemType.Item,
        };

        const className = ViewUtilities.getBisBaseClass(spec.class);

        if (ViewUtilities.isSpatial(className) && this.state.showSpatials)
          views3d.push(viewItem);
        else if (ViewUtilities.isDrawing(className) && this.state.showDrawings)
          views2d.push(viewItem);
        else if (ViewUtilities.isSheet(className) && this.state.showSheets)
          sheets.push(viewItem);
        else if (this.state.showUnknown) unknown.push(viewItem);
      });

      if (this._searchInput.length > 0) {
        const views3dFuzzySearchResults = fuzzy.search(
          views3d,
          ["name"],
          this._searchInput
        ).results as ListItem[];
        const views2dFuzzySearchResults = fuzzy.search(
          views2d,
          ["name"],
          this._searchInput
        ).results as ListItem[];
        const sheetsFuzzySearchResults = fuzzy.search(
          sheets,
          ["name"],
          this._searchInput
        ).results as ListItem[];
        const unknownFuzzySearchResults = fuzzy.search(
          unknown,
          ["name"],
          this._searchInput
        ).results as ListItem[];
        views3dFiltered = [];
        views2dFiltered = [];
        sheetsFiltered = [];
        unknownFiltered = [];
        views3dFuzzySearchResults.forEach(function (result) {
          views3dFiltered?.push(result.item);
        });
        views2dFuzzySearchResults.forEach(function (result) {
          views2dFiltered?.push(result.item);
        });
        sheetsFuzzySearchResults.forEach(function (result) {
          sheetsFiltered?.push(result.item);
        });
        unknownFuzzySearchResults.forEach(function (result) {
          unknownFiltered?.push(result.item);
        });
      }
    }

    this.setStateContainers(
      views3d,
      views2d,
      sheets,
      unknown,
      views3dFiltered,
      views2dFiltered,
      sheetsFiltered,
      unknownFiltered
    );
  }

  /**
   * Update state of the entries in the widget.
   * @param viewId Identifier for the relevant view
   */
  public async updateState(viewId?: any): Promise<void> {
    // Wait for initialization finished
    if (!this.state.initialized) return;

    // Query views and add them to state
    const views3d: ListItem[] = this.state.items[0].children!;
    const views2d: ListItem[] = this.state.items[1].children!;
    const sheets: ListItem[] = this.state.items[2].children!;
    const unknown: ListItem[] =
      this.state.items.length > 3 ? this.state.items[3].children! : [];

    const updateChildren = (item: ListItem) => {
      if (item.key === viewId) return { ...item, enabled: true };
      else return { ...item, enabled: false };
    };

    this.setStateContainers(
      views3d.map(updateChildren),
      views2d.map(updateChildren),
      sheets.map(updateChildren),
      unknown.map(updateChildren)
    );
  }

  // enable/disable the models
  private _setEnabled = async (item: ListItem, _enabled: boolean) => {
    const activeContentControl = // eslint-disable-next-line @typescript-eslint/no-deprecated
      UiFramework.content.getActiveContentControl() as unknown as  // eslint-disable-next-line @typescript-eslint/no-deprecated
        | SupportsViewSelectorChange
        | undefined;
    if (
      !this.props.onViewSelected &&
      (!activeContentControl ||
        !activeContentControl.supportsViewSelectorChange)
    ) {
      Logger.logError(
        UiFramework.loggerCategory("ViewSelector"),
        `No active ContentControl for ViewSelector change`
      );
      return;
    }

    // Enable the item temporarily to let user see that their click was registered
    // while we query for view state and change the current view which may take a bit
    if (_enabled && item.type !== ListItemType.Container) {
      // This itemMapper simply looks through all the list items and their nested children and enables the one
      // that we have registered to enable
      // Also disable all other items
      const itemMapper: (tempItem: ListItem) => ListItem = (
        tempItem: ListItem
      ) => {
        if (tempItem.type === ListItemType.Container) {
          return { ...tempItem, children: tempItem.children!.map(itemMapper) };
        } else if (tempItem.key === item.key) {
          return { ...tempItem, enabled: true };
        } else {
          return { ...tempItem, enabled: false };
        }
      };

      // Create the new array with the current item enabled
      const itemsWithEnabled = this.state.items.map(itemMapper);

      if (!this._isMounted) return;

      // Update the state so that we show the user it was enabled while we work in the background
      this.setState({ items: itemsWithEnabled });
    }

    assert(!!this.props.ivault);
    assert(!!item.name);

    // Load the view state using the viewSpec's ID
    const viewState = await this.props.ivault.views.load(item.key);

    if (this.props.onViewSelected) {
      this.props.onViewSelected({
        iVaultConnection: this.props.ivault,
        viewDefinitionId: item.key,
        viewState,
        name: item.name,
      });
    } else if (activeContentControl) {
      // Let activeContentControl process the ViewSelector change
      await activeContentControl.processViewSelectorChange(
        this.props.ivault,
        item.key,
        viewState,
        item.name
      );

      // Emit a change event
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      ViewSelector.onViewSelectorChangedEvent.emit({
        iVaultConnection: this.props.ivault,
        viewDefinitionId: item.key,
        viewState,
        name: item.name,
      });
    }

    // Set state to show enabled the view that got selected
    void this.updateState(item.key);
  };

  // Hook on the category selector being expanded so that we may initialize if needed
  private _onExpanded = (expand: boolean) => {
    if (expand)
      void this.updateState(
        IVaultApp.viewManager.selectedView
          ? IVaultApp.viewManager.selectedView.view.id
          : undefined
      );
  };

  /**
   *  Renders ViewSelector component
   */
  public override render() {
    const { ivault, ...props } = this.props;

    return (
      <ListPicker
        {...props}
        title={this.state.title}
        setEnabled={this._setEnabled}
        items={this.state.items}
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        icon={<Icon iconSpec={<SvgSavedView />} />}
        onExpanded={this._onExpanded}
        searchBox={this.state.searchBox}
        onSearchValueChange={debounce((search: string) => {
          this._searchInput = search;
          if (
            this._isMounted &&
            this.state.expand === false &&
            this._searchInput.length > 0
          )
            this.setState({ expand: true });
          void this.loadViews();
        }, 300)}
        panelOnly={this.state.panelOnly}
        expanded={this.state.expand}
      />
    );
  }
}

type IVaultConnectedViewSelectorProps = Omit<
  ViewSelectorProps,
  "ivault" | keyof ViewSelectorDefaultProps
> &
  Partial<ViewSelectorDefaultProps>;

/** ViewSelector that is connected to the IVaultConnection property in the Redux store. The application must set up the Redux store and include the FrameworkReducer.
 * @note Requires redux provider.
 * @beta
 * @deprecated in 4.15.0. Use {@link ViewSelector} instead.
 */
export function IVaultConnectedViewSelector(
  props: IVaultConnectedViewSelectorProps
) {
  const iVault = useReduxFrameworkState(
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    (state) => state?.sessionState.iVaultConnection
  );
  return <ViewSelector ivault={iVault} {...props} />;
}
