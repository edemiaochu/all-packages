const szewTwinPlugin = require("@szewtwin/eslint-plugin");

module.exports = [
  {
    files: ["**/*.{ts,tsx}"],
    ...szewTwinPlugin.configs.szewTwinjsRecommendedConfig,
  },
  {
    files: ["**/*.{ts,tsx}"],
    ...szewTwinPlugin.configs.jsdocConfig,
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-duplicate-imports": "off",
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
];
