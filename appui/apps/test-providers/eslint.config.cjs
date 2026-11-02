const szewTwinPlugin = require("@szewtwin/eslint-plugin");
const prettierConfig = require("eslint-config-prettier");

module.exports = [
  {
    files: ["**/*.{ts,tsx}"],
    ...szewTwinPlugin.configs.uiConfig,
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      ...prettierConfig.rules,
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/unbound-method": "off",
    },
  },
];
