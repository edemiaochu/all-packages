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
      rules: {
          "no-duplicate-imports": "error",
          "@typescript-eslint/consistent-type-imports": "error"
        }
    }
  ];