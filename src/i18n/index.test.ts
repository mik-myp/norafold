import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import i18n, {
  getLanguagePreference,
  isLanguagePreference,
  languageStorageKey,
  setLanguagePreference,
  systemLanguage,
} from "@/i18n";

describe("i18n", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh-CN");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("默认使用中文并支持切换到英文", async () => {
    expect(i18n.t("navigation.home")).toBe("主页");

    await i18n.changeLanguage("en");

    expect(i18n.t("navigation.home")).toBe("Home");
    expect(i18n.t("notFound.returnHome")).toBe("Back to home");
  });

  it("支持跟随系统语言偏好", async () => {
    const removeItem = vi.fn<() => void>();
    vi.stubGlobal("window", { localStorage: { removeItem } });

    await setLanguagePreference(systemLanguage);

    expect(getLanguagePreference()).toBe(systemLanguage);
    expect(removeItem).toHaveBeenCalledWith(languageStorageKey);
  });

  it("校验支持的语言偏好", () => {
    expect(isLanguagePreference(systemLanguage)).toBe(true);
    expect(isLanguagePreference("zh-CN")).toBe(true);
    expect(isLanguagePreference("en")).toBe(true);
    expect(isLanguagePreference("fr")).toBe(false);
  });

  it("支持设置显式语言", async () => {
    vi.stubGlobal("document", { documentElement: { lang: "" } });

    await setLanguagePreference("en");

    expect(i18n.language).toBe("en");
    expect(document.documentElement.lang).toBe("en");
  });
});
