/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import szewTwinPlugin from "@szewtwin/eslint-plugin";

export default [
  {
    files: ["src/**/*.{ts,tsx}"],
    ...szewTwinPlugin.configs.szewTwinjsRecommendedConfig,
  },
  // Only apply JSDoc rules to non-test files
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["**/*.test.ts", "src/test/**/*"],
    ...szewTwinPlugin.configs.jsdocConfig,
  },
  // Rules for all source files
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-duplicate-imports": "off", // Allow separate type/value imports
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "src/test/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "id-denylist": "off",
    },
  },
  {
    ignores: ["node_modules/**", "lib/**"],
  },
];
