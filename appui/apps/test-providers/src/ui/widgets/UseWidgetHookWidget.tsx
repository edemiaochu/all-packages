/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { useWidget, WidgetState } from "@szewtwin/appui-react";
import { Button } from "@szewtwin/szewtwinui-react";

export function UseWidgetHookWidget() {
  const useWidgetHook = useWidget();
  const useWidgetText = JSON.stringify(useWidgetHook);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "8px",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {useWidgetText}
      </div>
      <Button onClick={() => useWidgetHook.setState(WidgetState.Closed)}>
        Set Closed
      </Button>
      <Button onClick={() => useWidgetHook.setState(WidgetState.Open)}>
        Set Open
      </Button>
      <Button onClick={() => useWidgetHook.setState(WidgetState.Hidden)}>
        Set Hidden
      </Button>
      <Button onClick={() => useWidgetHook.setState(WidgetState.Unloaded)}>
        Set Unloaded
      </Button>
    </div>
  );
}
