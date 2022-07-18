module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:dependency-cruiser/all",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: "latest",
    sourceType: "module",
  },
  settings: {
    "dependency-cruiser": {
      config: ".dependency-cruiser.cjs",
    },
    react: {
      version: "detect",
    },
  },
  plugins: ["react", "@typescript-eslint", "dependency-cruiser"],
  rules: {
    "react/react-in-jsx-scope": "off",
  },
};
