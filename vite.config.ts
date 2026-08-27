import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig, lazyPlugins } from "vite-plus";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

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
    ignorePatterns: ["src/routeTree.gen.ts"],
    sortTailwindcss: {
      stylesheet: "./src/index.css",
      functions: ["clsx", "cn"],
      preserveWhitespace: false,
    },
  },
  lint: {
    plugins: ["react", "typescript", "oxc"],
    rules: {
      "react/rules-of-hooks": "error",
      "react/only-export-components": [
        "allow",
        {
          allowConstantExport: true,
        },
      ],
      "vite-plus/prefer-vite-plus-imports": "error",
    },
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
    include: ["src/**/*.test.{ts,tsx}"],
  },
  staged: {
    "*.{js,jsx,ts,tsx,json,css,less,md,html,yaml,yml}": createStagedCommands,
  },
  run: {
    cache: {
      scripts: true,
      tasks: true,
    },
    tasks: {
      build: {
        command: ["tsc -b", "vp build"],
        input: [{ auto: true }, "!node_modules/.tmp/**/*.tsbuildinfo", "!dist/**"],
        output: ["dist/**"],
      },
      ci: {
        command: ["vp check", "vp run i18n:check", "vp test", "vp run build"],
      },
    },
  },
  plugins: lazyPlugins(() => [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      quoteStyle: "double",
      semicolons: true,
    }),
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] }),
  ]),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
