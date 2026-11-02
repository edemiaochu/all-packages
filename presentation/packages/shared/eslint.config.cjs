/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
const szewTwinPlugin = require("@szewtwin/eslint-plugin");
const eslintBaseConfig = require("../../eslint.base.config");

module.exports = [
  {
    files: ["**/*.ts"],
    ...szewTwinPlugin.configs.szewTwinjsRecommendedConfig,
  },
  ...eslintBaseConfig,
];
