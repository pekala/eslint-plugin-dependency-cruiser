import path from "path";
import { Rule } from "eslint";
import invariant from "ts-invariant";
import { cruise } from "dependency-cruiser";
import extractDepcruiseConfig from "dependency-cruiser/config-utl/extract-depcruise-config";
import extractTSConfig from "dependency-cruiser/config-utl/extract-ts-config";

export const dependencyCruiserRule: Rule.RuleModule = {
  create(context) {
    const depcruiseConfig = extractDepcruiseConfig("./.dependency-cruiser.js");
    const tsConfig = extractTSConfig("./tsconfig.json");

    const onDiskFilepath = path.relative(
      process.cwd(),
      context.getPhysicalFilename()
    );

    const cruiseResult = cruise(
      [onDiskFilepath],
      {
        ruleSet: depcruiseConfig,
        ...depcruiseConfig.options,
        maxDepth: 1,
        validate: true,
      },
      undefined,
      tsConfig
    );

    return {
      ImportDeclaration(node) {
        const importSource = node?.source?.value;

        invariant(
          typeof importSource === "string",
          "Only string import sources supported"
        );

        invariant(
          typeof cruiseResult.output !== "string",
          "JSON output format expected"
        );

        const dependency = cruiseResult.output.modules[0].dependencies.find(
          (dep) => dep.module === importSource
        );

        if (!dependency || dependency.valid || !dependency.rules) {
          return;
        }

        for (const brokenRule of dependency.rules) {
          const rule = cruiseResult.output.summary.ruleSetUsed?.forbidden?.find(
            (r) => r.name === brokenRule.name
          );
          context.report({
            node,
            message: rule?.comment ?? "Import violates the import rules",
          });
        }
      },
    };
  },
};
