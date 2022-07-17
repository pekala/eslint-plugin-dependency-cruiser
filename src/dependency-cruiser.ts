import fs from "fs";
import path from "path";

import invariant from "ts-invariant";
import json5 from "json5";
import {
  SeverityType,
  IConfiguration,
  ICruiseOptions,
  IBaseRuleType,
} from "dependency-cruiser";
import extractDepcruiseConfig from "dependency-cruiser/config-utl/extract-depcruise-config";
import extractTSConfig from "dependency-cruiser/config-utl/extract-ts-config";
import { IBaselineViolations } from "dependency-cruiser/types/baseline-violations";

let depcruiseConfig: IConfiguration;
let knownViolations: IBaselineViolations | undefined;
let tsConfig: unknown;

/**
 * Loads all configuration files necessary (DC, DC baseline, TS)
 * In order to avoid loading the configuration file every time the rule runs
 * we do it once here for the first run (when we know ESLint settings) and then
 * memoise it for the consecutive runs.
 */
export function getConfigs(settings: unknown) {
  // We only check for DC config, since it's guaranteed to be present after we load it
  // the first time. The other configs are optional.
  if (!depcruiseConfig) {
    depcruiseConfig = loadDependencyCruiserConfig(settings);
    tsConfig = loadTsConfig(depcruiseConfig.options);
    knownViolations = loadKnownViolations(settings);
  }

  return {
    depcruiseConfig,
    tsConfig,
    knownViolations,
  };
}

/**
 * Uses DC's utility function to load user's DC configuration. Since the configuration is where
 * the dependency rules are specified, it doesn't make sense to run this rule if no config can
 * be loaded. We either look for the config in its default location, or in a custom provided by
 * the user via ESLint shared global configuration (`'dependency-cruiser'.config`)
 * @see https://github.com/sverweij/dependency-cruiser/blob/develop/doc/api.md#utility-functions
 */
function loadDependencyCruiserConfig(settings: unknown) {
  let configLocation = dependencyCruiserDefaults.DEFAULT_CONFIG_FILE_NAME;
  if (hasKey("config", settings) && typeof settings.config === "string") {
    configLocation = settings.config;
  }
  const depcruiseConfig: IConfiguration = extractDepcruiseConfig(
    `./${configLocation}`
  );
  invariant(
    !!depcruiseConfig,
    "A dependency-cruiser configuration file is necessary to use this rule."
  );

  return depcruiseConfig;
}

/**
 * Uses DC's utility function to load user's TS configuration if it's specified and available
 * DC doesn't specify any types for this configuration, but we don't access it and can treat
 * as opaque
 */
function loadTsConfig(options?: ICruiseOptions) {
  // DC's types here are inconsistent with documentation and implementation.
  // `tsConfig` field from "options" part of config is used for loading TS config
  // but it's not present on the `ICruiseOptions` interface
  const tsConfigFileName = (options as any)?.tsConfig?.fileName;

  if (tsConfigFileName) {
    try {
      return extractTSConfig(`${tsConfigFileName}`) as unknown;
    } catch (error) {
      return undefined;
    }
  }
}

/**
 * Loads user's DC baseline file which can be used to ignore known violations. We either look for
 * the file in its default location, or in a custom provided by the user via ESLint shared global
 * configuration (`'dependency-cruiser'.knownViolationsFile`).
 * DC has utility function for this but it doesn't yet it. It's very simple though, so we just
 * do it here instead (using json5 package).
 * @see https://github.com/sverweij/dependency-cruiser/blob/develop/doc/cli.md#--ignore-known-ignore-known-violations
 */
function loadKnownViolations(settings: unknown) {
  let baselineLocation = dependencyCruiserDefaults.DEFAULT_BASELINE_FILE_NAME;
  if (
    hasKey("knownViolationsFile", settings) &&
    typeof settings.knownViolationsFile === "string"
  ) {
    baselineLocation = settings.knownViolationsFile;
  }

  const absoluteFilePath = !path.isAbsolute(baselineLocation)
    ? baselineLocation
    : path.join(process.cwd(), `./${baselineLocation}`);

  try {
    return json5.parse(
      fs.readFileSync(absoluteFilePath, "utf-8")
    ) as IBaselineViolations;
  } catch (error) {
    return undefined;
  }
}

/**
 * Filters all rules defined in the local DC configuration, only leaving the ones that
 * match severity of the current rule. ESLint doesn't allow to report issues on different
 * levels of severity, so we need to have one ESLint rule per severity, and filter which
 * dependency-cruiser rules apply for which rule here.
 * Note: for now this plugin only supports "forbidden" rules from the DC config!
 */
export function filterRules(config: IConfiguration, severity: SeverityType) {
  const rules: IConfiguration = {
    forbidden: filterBySeverity(config.forbidden, severity),
    // DC expects the options to be present both here (as `pCruiseOptions.ruleSet.options`
    // passed to the `cruise` method), and directly on the `pCruiseOptions` as well. /shrug
    options: config.options,
  };

  // DC makes an assumption that if a key is defined, it's value won't be undefined
  // so here we need to clean up all fields that end up undefined after severity filtering
  getKeys(rules).forEach((key) => {
    if (rules[key] === undefined) {
      delete rules[key];
    }
  });

  return rules;
}

// These defaults are defined in DC for their CLI, but not exported
const dependencyCruiserDefaults = {
  DEFAULT_BASELINE_FILE_NAME: ".dependency-cruiser-known-violations.json",
  DEFAULT_CONFIG_FILE_NAME: ".dependency-cruiser.js",
};

/**
 * Filters an array of DC rules to only select the ones with a desired severity
 */
function filterBySeverity<TRule extends IBaseRuleType>(
  rules: TRule[] | undefined,
  severity: SeverityType
): TRule[] | undefined {
  return rules?.filter((rule) => rule.severity === severity);
}

/**
 * Get a list of object's keys, but typed as `keyof T` instead of string
 */
function getKeys<T extends Object>(obj: T) {
  return Object.keys(obj) as Array<keyof T>;
}

/**
 * Checks if a passed value is an object with a provided key defined
 * Correctly narrows a type from unknown to allow type-safe value access
 */
function hasKey<Key extends string>(
  key: Key,
  obj: unknown
): obj is { [_ in Key]: unknown } {
  return typeof obj === "object" && obj !== null && key in obj;
}
