import path from "path";

import { Rule } from "eslint";
import invariant from "ts-invariant";
import { cruise, SeverityType } from "dependency-cruiser";
import { getConfigs, filterRules } from "./dependency-cruiser";

export function getDependencyCruiserRule(
  severity: SeverityType
): Rule.RuleModule {
  return {
    meta: {
      type: "problem",
      docs: {
        description: `Report import rule violations of ${severity} severity, found by Dependency Cruiser`,
        recommended: true,
        url: "https://github.com/pekala/eslint-plugin-dependency-cruiser",
      },
      schema: [],
    },
    create(context) {
      const settings: unknown = context.settings["dependency-cruiser"];

      const { depcruiseConfig, knownViolations, tsConfig } = getConfigs(
        settings
      );
      const ruleSet = filterRules(depcruiseConfig, severity);

      const currentFileLocation = path.relative(
        process.cwd(),
        context.getPhysicalFilename()
      );

      // We run dependency cruiser with the options provided by the user via configuration, with
      // some adjustments:
      // - we run the dependency cruising for a single file, the current file visited by ESLint
      // - only run rules of type forbidden (current limitation of this plugin) for the current
      //   severity of the rule (this code will be ran for error and warn separately)
      // - only scan dependencies one level deep. ESLint runs this rule for each file  so we only
      //   need to know about its dependencies. This is the current approach that e.g. makes the
      //   cyclic dependencies rules not possible to detect, but has an acceptable performance.
      const cruiseResult = cruise(
        [currentFileLocation],
        {
          ruleSet,
          ...ruleSet.options,
          maxDepth: 1,
          validate: true,
          knownViolations,
        },
        // Webpack configuration is not supported currently, contributions welcome!
        undefined,
        tsConfig
      );

      return {
        // This method is ran by ESlint for every import declaration in the current file
        ImportDeclaration(node) {
          // The source of the import, e.g. for "import foo from './bar'" this will be "./bar"
          const importSource = node?.source?.value;

          // We don't attempt to support anything other than strings here, whatever that would be
          if (typeof importSource !== "string") {
            return;
          }

          // For some reason cruiseResult can have a string type too, but we never expect to see it
          invariant(
            typeof cruiseResult.output !== "string",
            "JSON output format expected"
          );

          const cruisedModule = cruiseResult.output.modules[0];
          invariant(
            !!cruisedModule,
            "DC lists the cruising entry point as the first entry in the modules array"
          );

          // Find the currently visited import declaration node in the list of dependencies
          // of the currently visited file found by DC. If for whatever reason it's not in the list
          // we just move on to the next import declaration - we don't have any problems to report.
          const dependency = cruisedModule.dependencies.find(
            (dep) => dep.module === importSource
          );
          if (!dependency || dependency.valid || !dependency.rules) {
            return;
          }

          for (const ruleViolation of dependency.rules) {
            const brokenRule = ruleSet.forbidden?.find(
              (rule) => rule.name === ruleViolation.name
            );

            // If we can't find the rule that was broken, let's bail. This could be an invariant,
            // but I'm not sure if the aren't any legit reasons for this.
            if (!brokenRule) {
              return;
            }

            // Severity of the rule violation reported by DC is different than the severity of the
            // DC dependency rule itself e.g. if the violation is ignored via the baseline file. In
            // that case we bail and don't report anything.
            if (ruleViolation.severity !== brokenRule?.severity) {
              return;
            }

            // Report the rule violation, e.g.
            // "not-to-test (./my-file.test): Don't import test code from app code"
            context.report({
              node,
              message: `${
                ruleViolation.name
              } (${importSource}): ${brokenRule.comment ??
                "Import violates the import rules"}`,
            });
          }
        },
      };
    },
  };
}
