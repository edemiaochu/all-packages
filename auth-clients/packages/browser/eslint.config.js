const szewTwinPlugin = require("@szewtwin/eslint-plugin");

module.exports = [
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/integration-tests/**"],
    ...szewTwinPlugin.configs.szewTwinjsRecommendedConfig,
  },
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/integration-tests/**"],
    ...szewTwinPlugin.configs.jsdocConfig,
  },
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/integration-tests/**"],
    rules: {
      "no-duplicate-imports": "off",
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
];
