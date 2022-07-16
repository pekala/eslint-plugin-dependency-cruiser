import { ESLint } from "eslint";
import { dependencyCruiserRule } from "./rule";

const configuration: ESLint.Plugin = {
  rules: {
    "dependency-cruiser": dependencyCruiserRule,
  },
  configs: {
    recommended: {
      plugins: ["dependency-cruiser"],
      rules: {
        "dependency-cruiser/dependency-cruiser": "error",
      },
    },
  },
};

export = configuration;
