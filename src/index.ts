import { ESLint } from "eslint";
import { getDependencyCruiserRule } from "./rule";

const configuration: ESLint.Plugin = {
  rules: {
    errors: getDependencyCruiserRule("error"),
    warnings: getDependencyCruiserRule("warn"),
  },
  configs: {
    all: {
      plugins: ["dependency-cruiser"],
      rules: {
        "dependency-cruiser/errors": "error",
        "dependency-cruiser/warnings": "warn",
      },
    },
  },
};

export = configuration;
