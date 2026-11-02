/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Inputs
 */

import classnames from "classnames";
import * as React from "react";
import type { QuantityTypeArg } from "@szewtwin/core-frontend";
import { IVaultApp } from "@szewtwin/core-frontend";
import { Parser } from "@szewtwin/core-quantity";
import type { ParseResults } from "@szewtwin/appui-abstract";
import type { CommonProps } from "@szewtwin/core-react";
import { ParsedInput } from "@szewtwin/components-react";
import { useTranslation } from "../useTranslation.js";

/** Props for [[QuantityInput]] control
 * @beta
 */
// eslint-disable-next-line @typescript-eslint/no-deprecated
export interface QuantityProps extends CommonProps {
  /** Initial magnitude in 'persistence' units. See `getPersistenceUnitByQuantityType` in [QuantityFormatter]($core-frontend) */
  initialValue: number;
  /** Type of quantity being input. */
  quantityType: QuantityTypeArg;
  /** Function to call in the quantity value is changed. The value returned will be in 'persistence' units. */
  onQuantityChange: (newQuantityValue: number) => void;
  /** Set to `true` if value is for display only */
  readonly?: boolean;
  /** Provides ability to return reference to HTMLInputElement */
  ref?: React.Ref<HTMLInputElement>;
}

/** Input control that allows users to input a quantity and show the formatted string that represents the value.
 * @beta
 */
export function QuantityInput({
  initialValue,
  quantityType,
  readonly,
  className,
  style,
  onQuantityChange,
  ref,
}: QuantityProps) {
  const { translate } = useTranslation();
  const [formatterSpec, setFormatterSpec] = React.useState(() =>
    IVaultApp.quantityFormatter.findFormatterSpecByQuantityType(quantityType)
  );
  const [parserSpec, setParserSpec] = React.useState(() =>
    IVaultApp.quantityFormatter.findParserSpecByQuantityType(quantityType)
  );

  const formatValue = React.useCallback(
    (value: number) => {
      if (formatterSpec) {
        return formatterSpec.applyFormatting(value);
      }
      return value.toFixed(2);
    },
    [formatterSpec]
  );

  const parseString = React.useCallback(
    (userInput: string): ParseResults => {
      if (parserSpec) {
        const parseResult = IVaultApp.quantityFormatter.parseToQuantityValue(
          userInput,
          parserSpec
        );
        if (Parser.isParsedQuantity(parseResult)) {
          return { value: parseResult.value };
        } else {
          const statusId = Parser.isParseError(parseResult)
            ? parseResult.error.toString()
            : "Unknown";
          return {
            parseError: `${translate(
              "QuantityInput.NoParserDefined"
            )}${statusId}`,
          };
        }
      }
      return {
        parseError: translate("QuantityInput.NoParserDefined"),
      };
    },
    [parserSpec, translate]
  );

  const classNames = classnames(className, "components-quantity-input");

  React.useEffect(() => {
    return IVaultApp.quantityFormatter.onActiveFormattingUnitSystemChanged.addListener(
      () => {
        setFormatterSpec(
          IVaultApp.quantityFormatter.findFormatterSpecByQuantityType(
            quantityType
          )
        );
        setParserSpec(
          IVaultApp.quantityFormatter.findParserSpecByQuantityType(quantityType)
        );
      }
    );
  }, [quantityType]);

  React.useEffect(() => {
    return IVaultApp.quantityFormatter.onQuantityFormatsChanged.addListener(
      (args) => {
        const quantityKey =
          IVaultApp.quantityFormatter.getQuantityTypeKey(quantityType);
        if (args.quantityType === quantityKey) {
          setFormatterSpec(
            IVaultApp.quantityFormatter.findFormatterSpecByQuantityType(
              quantityType
            )
          );
          setParserSpec(
            IVaultApp.quantityFormatter.findParserSpecByQuantityType(
              quantityType
            )
          );
        }
      }
    );
  }, [quantityType]);

  return (
    <ParsedInput
      data-testid="components-quantity-input"
      ref={ref}
      style={style}
      className={classNames}
      onChange={onQuantityChange}
      initialValue={initialValue}
      readonly={readonly}
      formatValue={formatValue}
      parseString={parseString}
    />
  );
}
