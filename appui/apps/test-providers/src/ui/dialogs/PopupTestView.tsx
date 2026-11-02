/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import * as React from "react";
import {
  CursorMenuItemProps,
  FloatingViewportContent,
  UiFramework,
  useActiveIVaultConnection,
} from "@szewtwin/appui-react";

import "./PopupTestView.scss";
import ViewDefinitionSelector, {
  getViewDefinitions,
} from "../components/ViewDefinitionSelector.js";
import { Id64String } from "@szewtwin/core-szewec";
import { Button } from "@szewtwin/szewtwinui-react";
import { ScreenViewport } from "@szewtwin/core-frontend";

export function PopupTestView({
  contentId,
  showViewPicker,
}: {
  contentId: string;
  showViewPicker?: boolean;
}) {
  const menuItems: CursorMenuItemProps[] = React.useMemo(() => {
    return [
      {
        id: "Item1",
        label: "Item ~1",
        icon: "icon-placeholder",
        submenu: [
          {
            id: "0",
            item: {
              label: "SubMenu Item ~1",
              icon: "icon-placeholder",
              execute: () => {},
            },
          },
          {
            id: "1",
            item: {
              label: "SubMenu Item ~2",
              icon: "icon-placeholder",
              execute: () => {},
            },
          },
        ],
      },
      {
        id: "Item2",
        item: { label: "Item ~2", icon: "icon-placeholder", execute: () => {} },
      },
      {
        id: "Item3",
        item: { label: "Item ~3", icon: "icon-placeholder", execute: () => {} },
      },
    ];
  }, []);

  const activeIVaultConnection = useActiveIVaultConnection();
  const divRef = React.useRef<HTMLDivElement>(null);
  const [initialViewState, setInitialViewState] = React.useState(
    UiFramework.getDefaultViewState()
  );
  const viewportRef = React.useRef<ScreenViewport>(null);

  React.useEffect(() => {
    async function fetchView() {
      if (undefined === initialViewState && activeIVaultConnection) {
        const definitions = await getViewDefinitions(activeIVaultConnection);
        if (definitions && definitions.length) {
          const viewState = await activeIVaultConnection.views.load(
            definitions[0].id
          );
          setInitialViewState(viewState);
        }
      }
    }
    void fetchView();
  }, [activeIVaultConnection, initialViewState]);

  const onViewDefinitionChanged = React.useCallback(
    async (viewId?: Id64String) => {
      if (activeIVaultConnection && viewId) {
        const viewState = await activeIVaultConnection.views.load(viewId);
        setInitialViewState(viewState);
      }
    },
    [activeIVaultConnection]
  );

  const handleContextMenu = React.useCallback(
    (e: React.MouseEvent): boolean => {
      e.preventDefault();
      UiFramework.openContextMenu(menuItems, { x: e.pageX, y: e.pageY });

      return false;
    },
    [menuItems]
  );

  return (
    <div
      ref={divRef}
      style={{
        display: "grid",
        gridTemplateRows: "auto 1fr",
        height: "100%",
        position: "relative",
        minWidth: "400px",
        minHeight: "300px",
      }}
    >
      {!!showViewPicker && initialViewState && (
        <div>
          <ViewDefinitionSelector
            ivault={initialViewState.iVault}
            selectedViewDefinition={initialViewState.id}
            onViewDefinitionSelected={onViewDefinitionChanged}
          />
        </div>
      )}
      {initialViewState && (
        <div>
          {/* eslint-disable-next-line @typescript-eslint/no-deprecated */}
          <FloatingViewportContent
            contentId={contentId}
            initialViewState={initialViewState}
            onContextMenu={handleContextMenu}
            viewportRef={viewportRef}
          />
        </div>
      )}
      <Button
        onClick={() => {
          viewportRef?.current?.openToolTip("Test tooltip", { x: 100, y: 50 });
        }}
      >
        Open tooltip
      </Button>
    </div>
  );
}
