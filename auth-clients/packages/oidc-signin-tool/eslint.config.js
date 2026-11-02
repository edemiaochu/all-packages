const szewTwinPlugin = require("@szewtwin/eslint-plugin");

module.exports = [
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/test-integration/**"],
    ...szewTwinPlugin.configs.szewTwinjsRecommendedConfig,
  },
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/test-integration/**"],
    ...szewTwinPlugin.configs.jsdocConfig,
  },
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/test-integration/**"],
    rules: {
      "no-duplicate-imports": "off",
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
];
