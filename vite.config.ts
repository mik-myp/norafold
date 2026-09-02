import { defineConfig, lazyPlugins } from "vite-plus";
import { createRendererPlugins, rendererAlias } from "./vite.renderer.shared.js";

const generatedRouteTree = "/src/routeTree.gen.ts";

function createStagedCommands(files: readonly string[]) {
  const stagedFiles = files.filter(
    (file) => !file.replaceAll("\\", "/").endsWith(generatedRouteTree),
  );
  const fileArgs = stagedFiles.map((file) => JSON.stringify(file)).join(" ");

  if (!fileArgs) {
    return [];
  }

  const sourceFileArgs = stagedFiles
    .filter((file) => /\.(?:js|jsx|ts|tsx)$/.test(file))
    .map((file) => JSON.stringify(file))
    .join(" ");
  const commands = [`vp fmt --write ${fileArgs}`, `vp fmt --check ${fileArgs}`];

  if (sourceFileArgs) {
    commands.push(`vp check --no-fmt ${sourceFileArgs}`);
  }

  return commands;
}

// https://vite.dev/config/
export default defineConfig({
  fmt: {
    ignorePatterns: [
      "src/routeTree.gen.ts",
      ".vite/**",
      "out/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
    ],
    sortTailwindcss: {
      stylesheet: "./src/index.css",
      functions: ["clsx", "cn"],
      preserveWhitespace: false,
    },
  },
  lint: {
    ignorePatterns: [
      "src/components/ui/**",
      ".vite/**",
      "out/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
    ],
    plugins: ["react", "typescript", "oxc", "import", "jsx-a11y"],
    rules: {
      "react/rules-of-hooks": "error",
      "react/only-export-components": [
        "allow",
        {
          allowConstantExport: true,
        },
      ],
      "vite-plus/prefer-vite-plus-imports": "error",
      "import/no-cycle": "error",
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/heading-has-content": "error",
    },
    overrides: [
      {
        files: ["src/**/*.test.{ts,tsx}", "electron/**/*.test.ts"],
        plugins: ["vitest"],
        rules: {
          "vitest/no-disabled-tests": "error",
          "vitest/no-focused-tests": "error",
        },
      },
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    jsPlugins: [
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin",
      },
    ],
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}", "electron/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/i18n/index.ts",
        "src/lib/utils.ts",
        "src/shared/desktop-api.ts",
        "electron/security.ts",
        "electron/database/**/*.ts",
        "electron/updates.ts",
      ],
      exclude: ["**/*.d.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 75,
      },
    },
  },
  staged: {
    "*.{js,jsx,ts,tsx,json,css,less,md,html,yaml,yml}": createStagedCommands,
  },
  run: {
    cache: {
      scripts: false,
      tasks: true,
    },
    tasks: {
      build: {
        command: ["tsc -b", "vp build"],
        input: [
          { auto: true },
          "!node_modules/.tmp/**/*.tsbuildinfo",
          "!.vite/**",
          "!dist/**",
          "!out/**",
        ],
        output: ["dist/**"],
      },
      ci: {
        command: ["vp check", "vp run i18n:check", "vp test run --coverage", "vp run build"],
      },
    },
  },
  plugins: lazyPlugins(createRendererPlugins),
  resolve: {
    alias: rendererAlias,
  },
});
