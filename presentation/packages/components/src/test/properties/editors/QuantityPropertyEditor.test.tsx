/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { beforeEach, describe, expect, it, vi } from "vitest";
import { StandardTypeNames } from "@szewtwin/appui-abstract";
import { BeUiEvent } from "@szewtwin/core-szewec";
import { FormattingUnitSystemChangedArgs, IVaultApp, IVaultConnection, QuantityFormatter } from "@szewtwin/core-frontend";
import { Format, FormatterSpec, ParserSpec } from "@szewtwin/core-quantity";
import { SchemaContext } from "@szewtwin/dmschema-metadata";
import { KoqPropertyValueFormatter } from "@szewtwin/presentation-common";
import { SchemaMetadataContextProvider } from "../../../presentation-components/common/SchemaMetadataContext.js";
import {
  QuantityEditorName,
  QuantityPropertyEditor,
} from "../../../presentation-components/properties/editors/QuantityPropertyEditor.js";
import { createTestPropertyRecord } from "../../_helpers/UiComponents.js";
import { render, waitFor } from "../../TestUtils.js";

const createRecord = ({
  initialValue,
  kindOfQuantityName,
  quantityType,
}: {
  initialValue?: number;
  kindOfQuantityName?: string;
  quantityType?: string;
}) => {
  return createTestPropertyRecord(
    { value: initialValue, displayValue: undefined },
    { typename: StandardTypeNames.Double, kindOfQuantityName, quantityType, editor: { name: QuantityEditorName } },
  );
};

describe("<QuantityPropertyEditor />", () => {
  beforeEach(() => {
    const format = new Format("test format");
    const formatterSpec = {
      applyFormatting: (raw: number) => `${raw} unit`,
      unitConversions: [{ name: "test unit", label: "unit" }],
      format,
    };
    const parserSpec = {
      parseToQuantityValue: (value: string) => ({ ok: true, value: Number(value.substring(0, value.length - 4)) }),
      format,
    };

    vi.spyOn(KoqPropertyValueFormatter.prototype, "getFormatterSpec").mockResolvedValue(
      formatterSpec as unknown as FormatterSpec,
    );
    vi.spyOn(KoqPropertyValueFormatter.prototype, "getParserSpec").mockResolvedValue(
      parserSpec as unknown as ParserSpec,
    );

    vi.spyOn(IVaultApp, "quantityFormatter", "get").mockReturnValue({
      onActiveFormattingUnitSystemChanged: new BeUiEvent<FormattingUnitSystemChangedArgs>(),
    } as unknown as QuantityFormatter);
  });

  it("renders nothing if property record is not provided", async () => {
    const { container } = render(<QuantityPropertyEditor />);
    expect(container.childElementCount).toBe(0);
  });

  it("renders numeric input if schema context is not available", async () => {
    const record = createRecord({ initialValue: 10 });
    const { getByDisplayValue } = render(<QuantityPropertyEditor propertyRecord={record} />);

    expect(getByDisplayValue("10")).not.toBeNull();
  });

  it("renders quantity input if schema context is available and kindOfQuantityName is provided", async () => {
    const record = createRecord({ initialValue: 10, kindOfQuantityName: "TestKOQ" });
    const { getByDisplayValue } = render(
      <SchemaMetadataContextProvider
        ivault={{} as IVaultConnection}
        schemaContextProvider={() => ({}) as SchemaContext}
      >
        <QuantityPropertyEditor propertyRecord={record} />
      </SchemaMetadataContextProvider>,
    );

    await waitFor(() => {
      expect(getByDisplayValue("10 unit")).not.toBeNull();
    });
  });

  it("renders quantity input if schema context is available and quantityType is provided", async () => {
    const record = createRecord({ initialValue: 10, quantityType: "TestKOQ" });
    const { getByDisplayValue } = render(
      <SchemaMetadataContextProvider
        ivault={{} as IVaultConnection}
        schemaContextProvider={() => ({}) as SchemaContext}
      >
        <QuantityPropertyEditor propertyRecord={record} />
      </SchemaMetadataContextProvider>,
    );

    await waitFor(() => {
      expect(getByDisplayValue("10 unit")).not.toBeNull();
    });
  });
});
