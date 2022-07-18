/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "not-to-dev-dep",
      severity: "warn",
      comment: "App code can't depend on NPM modules listed in devDependencies",
      from: {
        path: "^(src)",
        pathNot:
          "\\mock.ts$|.d.ts$|.(stories|test|mock)\\.(js|mjs|cjs|tsx|ts)$",
      },
      to: {
        dependencyTypes: ["npm-dev"],
        dependencyTypesNot: ["type-only"],
      },
    },
    {
      name: "no-inter-page",
      comment: "Dependencies between components are not allowed",
      severity: "error",
      from: { path: "^src/components/([^/]+)/.+" },
      to: {
        path: "^src/components/([^/]+)/.+",
        pathNot: "^src/components/$1/.+",
      },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "tsconfig.json",
    },
  },
};
