import { defineConfig } from "i18next-cli";

export default defineConfig({
  locales: ["zh-CN", "en"],
  extract: {
    input: ["src/**/*.{ts,tsx}"],
    output: "src/i18n/locales/{{language}}/{{namespace}}.json",
    defaultNS: "translation",
    primaryLanguage: "zh-CN",
    secondaryLanguages: ["en"],
    removeUnusedKeys: true,
    sort: true,
  },
  lint: {
    ignore: ["src/components/ui/**", "src/i18n/**"],
  },
  types: {
    input: "src/i18n/locales/zh-CN/*.json",
    basePath: "src/i18n/locales/zh-CN",
    output: "src/i18n/i18next.d.ts",
    resourcesFile: "src/i18n/resources.d.ts",
  },
});
