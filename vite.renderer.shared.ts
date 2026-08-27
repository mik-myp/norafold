import path from "node:path";
import { fileURLToPath } from "node:url";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import type { PluginOption } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const productionConnectPolicy = "connect-src 'self'";

function developmentCspPlugin(): PluginOption {
  return {
    name: "norafold-development-csp",
    apply: "serve",
    transformIndexHtml(html) {
      return html.replace(productionConnectPolicy, `${productionConnectPolicy} http: ws:`);
    },
  };
}

export const rendererAlias = {
  "@": path.resolve(rootDir, "./src"),
};

export function createRendererPlugins(): PluginOption[] {
  return [
    developmentCspPlugin(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      quoteStyle: "double",
      semicolons: true,
    }),
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] }),
  ];
}
