import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import en from "@/i18n/locales/en/translation.json";
import zhCN from "@/i18n/locales/zh-CN/translation.json";

export const supportedLanguages = ["zh-CN", "en"] as const;
export const systemLanguage = "system" as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];
export type LanguagePreference = SupportedLanguage | typeof systemLanguage;

export const languageStorageKey = "norafold.language";

const languageDetector = new LanguageDetector();

function isSupportedLanguage(language: string | undefined): language is SupportedLanguage {
  return supportedLanguages.some((supportedLanguage) => supportedLanguage === language);
}

function getFirstDetectedLanguage(detectedLanguage: string | string[] | undefined) {
  return Array.isArray(detectedLanguage) ? detectedLanguage[0] : detectedLanguage;
}

export function getLanguagePreference(): LanguagePreference {
  const cachedLanguage = getFirstDetectedLanguage(languageDetector.detect(["localStorage"]));
  return isSupportedLanguage(cachedLanguage) ? cachedLanguage : systemLanguage;
}

export function isLanguagePreference(language: string): language is LanguagePreference {
  return language === systemLanguage || isSupportedLanguage(language);
}

function syncDocumentLanguage(language: string) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = language;
  }
}

const i18n = i18next.createInstance();

i18n.on("languageChanged", syncDocumentLanguage);

void i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      "zh-CN": {
        translation: zhCN,
      },
      en: {
        translation: en,
      },
    },
    fallbackLng: "zh-CN",
    supportedLngs: supportedLanguages,
    load: "currentOnly",
    initAsync: false,
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: languageStorageKey,
      // Explicit choices are cached through setLanguagePreference. System detection must stay uncached.
      caches: [],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export async function setLanguagePreference(language: LanguagePreference) {
  languageDetector.cacheUserLanguage(language, ["localStorage"]);
  await i18n.changeLanguage(language === systemLanguage ? undefined : language);
}

export default i18n;
