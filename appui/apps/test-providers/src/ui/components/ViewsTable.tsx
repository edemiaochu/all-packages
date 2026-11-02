/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import * as React from "react";
import { Table } from "@szewtwin/szewtwinui-react";
import { useActiveIVaultConnection } from "@szewtwin/appui-react";
import { getViewDefinitions } from "./ViewDefinitionSelector.js";
import type { Column } from "@szewtwin/szewtwinui-react/react-table";

interface ViewDataItem {
  id: string;
  class: string;
  label: string;
}

export function ViewsTable() {
  const activeIVaultConnection = useActiveIVaultConnection();
  const [iVaultViews, setIVaultViews] = React.useState<ViewDataItem[]>([]);

  React.useEffect(() => {
    if (activeIVaultConnection) {
      void getViewDefinitions(activeIVaultConnection).then((result) => {
        setIVaultViews(result);
      });
    }
  }, [activeIVaultConnection]);

  const viewData = React.useMemo(() => {
    return iVaultViews.map((spec) => ({
      id: spec.id,
      class: spec.class,
      label: spec.label,
    }));
  }, [iVaultViews]);

  const columns = React.useMemo(
    (): Column<Record<string, unknown>>[] => [
      {
        Header: "View Id",
        accessor: "id",
      },
      {
        Header: "Class Name",
        accessor: "class",
      },
      {
        Header: "Label",
        accessor: "label",
      },
    ],
    []
  );

  return (
    <Table
      columns={columns}
      data={viewData}
      emptyTableContent="No views to display."
    />
  );
}
