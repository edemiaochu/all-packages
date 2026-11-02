/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import szewTwinPlugin from "@szewtwin/eslint-plugin";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    ...szewTwinPlugin.configs.uiConfig,
    rules: {
      "@szewtwin/no-internal": [
        "warn",
        {
          tag: [
            "internal",
            "alpha",
            "beta",
          ],
        },
      ],
      "@typescript-eslint/unbound-method": "off",
      "no-duplicate-imports": "off",
      "@typescript-eslint/consistent-type-imports": "error",
  },

  },
];
