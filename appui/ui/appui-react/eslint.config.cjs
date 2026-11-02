const eslintBaseConfig = require("../eslint.config.base");
const prettierConfig = require("eslint-config-prettier");
const szewTwinPlugin = require("@szewtwin/eslint-plugin");

module.exports = [
  {
    files: ["**/*.{ts,tsx}"],
    ...szewTwinPlugin.configs.uiConfig,
  },
  {
    files: ["**/*.{ts,tsx}"],
    ...szewTwinPlugin.configs.jsdocConfig,
  },
  ...eslintBaseConfig,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      ...prettierConfig.rules,
    },
  },
  {
    files: ["src/test/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-deprecated": "off",
    },
  },
];
