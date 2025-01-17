module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  rules: {
    semi: ["error", "always"],
    quotes: ["error", "single"],
    "no-unused-vars": "warn",
    "no-console": "warn",
  },
};
