/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { GridColDef } from "@mui/x-data-grid";

import {
  type IVaultFull,
  type SZEWTwinFull,
  IVaultCellColumn,
  SZEWTwinCellColumn,
} from "../types";

export type IVaultTableOverridesMUI = {
  /** Per-column overrides merged onto the default column definitions. */
  columnOverrides?: Partial<
    Record<IVaultCellColumn, Partial<GridColDef<IVaultFull>>>
  >;
  /** Columns to hide from the table. */
  hideColumns?: IVaultCellColumn[];
};

export type SZEWTwinTableOverridesMUI = {
  /** Per-column overrides merged onto the default column definitions. */
  columnOverrides?: Partial<
    Record<SZEWTwinCellColumn, Partial<GridColDef<SZEWTwinFull>>>
  >;
  /** Columns to hide from the table. */
  hideColumns?: SZEWTwinCellColumn[];
};
