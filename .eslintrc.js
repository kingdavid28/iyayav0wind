module.exports = {
  root: true,
  extends: ["@react-native", "eslint:recommended", "plugin:react/recommended"],
  parser: "@babel/eslint-parser",
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  env: {
    node: true,
    browser: true,
    "react-native/react-native": true,
  },
  rules: {
    "react/prop-types": "off",
    "react/display-name": "off",
    "no-console": ["warn", { allow: ["warn", "error"] }],
  },
};
