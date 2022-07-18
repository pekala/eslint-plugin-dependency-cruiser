# eslint-plugin-dependency-cruiser

Runs [Dependency Cruiser](https://github.com/sverweij/dependency-cruiser) as an
[ESLint](https://eslint.org) rule and reports import rule violations.

<img width="500" alt="ESLint Dependency Cruiser displaying an error in VSCode" src="https://user-images.githubusercontent.com/4643658/179498433-8c691601-9e47-4fe2-a85c-ef56693903f1.png">

## Installation

```console
npm install --save-dev eslint-plugin
```

or

```console
yarn add --dev eslint-plugin-dependency-cruiser
```

`eslint-plugin-dependency-cruiser` does not install Dependency Cruiser or ESLint
for you. You must install these yourself.

Then, in your `.eslintrc.js` or `.eslintrc.json`:

```json
{
  "plugins": ["dependency-cruiser"],
  "extends": ["plugin:dependency-cruiser/all"]
}
```

## Configuration

By default the plugin looks for the Dependency Cruiser configuration and the
baseline file in the default locations (`.dependency-cruiser.js` and
`.dependency-cruiser-known-violations.json`). You can configure that using
ESLint's settings, specifying `dependency-cruiser` key with a value of an object
with `config` and `knownViolations`. Paths are relative to the project's root.
For example:

```json
{
  "plugins": ["dependency-cruiser"],
  "extends": ["plugin:dependency-cruiser/all"],
  "settings": {
    "dependency-cruiser": {
      "knownViolations": ".dependency-cruiser-baseline.json",
      "config": ".dependency-cruiser.cjs"
    }
  }
}
```

## Limitations

The plugin is not exposing all validation features or configuration options of
Dependency Cruiser's. Some things missing:

- Support for loading webpack configuration
- Support for detecting violations that require cruising the whole dependency
  tree, e.g. circular dependencies
- Support for rule types other than `forbidden` (i.e. `allowed` and `required`)

## Performance

In the current iteration, this plugin is fairly slow. It runs Dependency Cruiser to analyse 
dependencies of each file. This makes it perform OK in development when ran by the editor on 
a single file, but adds up quickly if running a full ESLint check for a large codebase.
