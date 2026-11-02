/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import type { IVaultConnection, QuantityTypeArg } from "@szewtwin/core-frontend";
import { IVaultApp } from "@szewtwin/core-frontend";
import {
  type FormatterSpec,
  FormatType,
  parseFormatType,
  type ParserSpec,
} from "@szewtwin/core-quantity";
import * as React from "react";
import { useIVaultConnection } from "../../IVaultConnectionContext.js";
import type { KindOfQuantity } from "@szewtwin/dmschema-metadata";

/* v8 ignore start */

interface UseQuantityInfoProps {
  type: QuantityTypeArg | undefined;
}

/**
 * Hook that finds the formatter and parser in `IVaultApp.quantityFormatter` for a given quantity type.
 * @internal
 */
export function useQuantityInfo({ type }: UseQuantityInfoProps) {
  const [{ defaultFormatter, highPrecisionFormatter, parser }, setState] =
    React.useState<{
      defaultFormatter: FormatterSpec | undefined;
      highPrecisionFormatter: FormatterSpec | undefined;
      parser: ParserSpec | undefined;
    }>(() => ({
      defaultFormatter: undefined,
      highPrecisionFormatter: undefined,
      parser: undefined,
    }));

  const ivault = useIVaultConnection();

  React.useEffect(() => {
    if (type === undefined) {
      setState({
        defaultFormatter: undefined,
        highPrecisionFormatter: undefined,
        parser: undefined,
      });
      return;
    }

    let disposed = false;
    const loadFormatterParser = async () => {
      const { defaultFormatterSpec, highPrecisionFormatterSpec, parserSpec } =
        await getFormatterParserSpec({
          ivault,
          type,
        });

      if (!disposed) {
        setState({
          defaultFormatter: defaultFormatterSpec,
          highPrecisionFormatter: highPrecisionFormatterSpec,
          parser: parserSpec,
        });
      }
    };

    void loadFormatterParser();

    const removeListeners = [
      IVaultApp.quantityFormatter.onActiveFormattingUnitSystemChanged.addListener(
        loadFormatterParser
      ),
      IVaultApp.quantityFormatter.onQuantityFormatsChanged.addListener(
        ({ quantityType }) => {
          if (quantityType === type) {
            void loadFormatterParser();
          }
        }
      ),
    ];
    if (IVaultApp.formatsProvider) {
      removeListeners.push(
        IVaultApp.formatsProvider.onFormatsChanged.addListener(async () =>
          loadFormatterParser()
        )
      );
    }

    return () => {
      disposed = true;
      removeListeners.forEach((remove) => {
        remove();
      });
    };
  }, [ivault, type]);

  return { defaultFormatter, highPrecisionFormatter, parser };
}

async function getFormatterParserSpec({
  ivault,
  type,
}: {
  ivault?: IVaultConnection;
  type: QuantityTypeArg;
}) {
  // fallback to IVaultApp.quantityFormatter:
  // - if `szewtwinjs-core` v4 is used
  // - don't have an iVaultConnection to look up KOQ
  // - old quantity type enum is used instead of KOQ name
  if (!IVaultApp.formatsProvider || !ivault || typeof type !== "string") {
    const quantityFormatterSpec =
      IVaultApp.quantityFormatter.findFormatterSpecByQuantityType(type);
    const quantityParserSpec =
      IVaultApp.quantityFormatter.findParserSpecByQuantityType(type);

    return {
      highPrecisionFormatterSpec: quantityFormatterSpec,
      defaultFormatterSpec: quantityFormatterSpec,
      parserSpec: quantityParserSpec,
    };
  }

  const koq = await ivault.schemaContext.getSchemaItem(type);
  if (!koq) {
    return {
      highPrecisionFormatterSpec: undefined,
      defaultFormatterSpec: undefined,
      parser: undefined,
    };
  }

  // TODO: `KindOfQuantity` here is used only as a type because we don't have peerDep on `dmschema-metadata`
  // It should be added when dropping `szewtwinjs-core` v4 support
  const persistenceUnit = await (koq as KindOfQuantity).persistenceUnit;
  const formatProps = await IVaultApp.formatsProvider.getFormat(type);
  if (!persistenceUnit || !formatProps) {
    return {
      highPrecisionFormatterSpec: undefined,
      defaultFormatterSpec: undefined,
      parser: undefined,
    };
  }

  const persistenceUnitName = persistenceUnit.fullName;
  const highPrecisionFormatterSpec =
    await IVaultApp.quantityFormatter.createFormatterSpec({
      formatProps: {
        ...formatProps,
        precision:
          parseFormatType(formatProps.type, "") === FormatType.Decimal
            ? 12
            : formatProps.precision,
      },
      persistenceUnitName,
    });
  const defaultFormatterSpec =
    await IVaultApp.quantityFormatter.createFormatterSpec({
      formatProps,

      persistenceUnitName,
    });
  const parserSpec = await IVaultApp.quantityFormatter.createParserSpec({
    formatProps,
    persistenceUnitName,
  });
  return {
    highPrecisionFormatterSpec,
    defaultFormatterSpec,
    parserSpec,
  };
}

/* v8 ignore stop */
