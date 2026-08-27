import { defineConfig } from "vite";
import { createRendererPlugins, rendererAlias } from "./vite.renderer.shared.js";

export default defineConfig({
  base: "./",

  resolve: {
    alias: rendererAlias,
  },

  plugins: createRendererPlugins(),
});
