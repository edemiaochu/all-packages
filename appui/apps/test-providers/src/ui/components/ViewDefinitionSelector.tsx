/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import * as React from "react";
import { Id64String } from "@szewtwin/core-szewec";
import { IVaultConnection } from "@szewtwin/core-frontend";
import { ViewQueryParams } from "@szewtwin/core-common";
import { Select, SelectOption } from "@szewtwin/szewtwinui-react";

export async function getViewDefinitions(
  ivault: IVaultConnection
): Promise<{ id: string; class: string; label: string }[]> {
  const viewQueryParams: ViewQueryParams = { wantPrivate: false };
  const viewSpecs = await ivault.views.queryProps(viewQueryParams);
  return viewSpecs
    .filter((spec) => !spec.isPrivate)
    .map((spec) => ({
      id: spec.id!,
      class: spec.classFullName,
      label: spec.userLabel ?? spec.code.value!,
    }));
}

export interface ViewDefinitionSelectorProps {
  ivault: IVaultConnection;
  selectedViewDefinition?: Id64String;
  onViewDefinitionSelected?: (id?: Id64String) => void;
}
export interface RulesetSelectorState {
  availableViewDefinitions?: string[];
}
export default function ViewDefinitionSelector(
  props: ViewDefinitionSelectorProps
) {
  const [selectOptions, setSelectOptions] = React.useState<
    SelectOption<string>[]
  >([]);
  React.useEffect(() => {
    void getViewDefinitions(props.ivault).then((result) => {
      const options = result.map((definition) => ({
        value: definition.id,
        label: definition.label,
      }));
      setSelectOptions(options);
    });
  }, [props.ivault]);
  return (
    <div>
      <Select
        onChange={props.onViewDefinitionSelected}
        value={props.selectedViewDefinition}
        options={selectOptions}
        size="small"
      />
    </div>
  );
}
