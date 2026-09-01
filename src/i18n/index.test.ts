import { beforeEach, describe, expect, it } from "vite-plus/test";

import i18n, { getLanguagePreference, setLanguagePreference, systemLanguage } from "@/i18n";

describe("i18n", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh-CN");
  });

  it("默认使用中文并支持切换到英文", async () => {
    expect(i18n.t("navigation.home")).toBe("主页");

    await i18n.changeLanguage("en");

    expect(i18n.t("navigation.home")).toBe("Home");
    expect(i18n.t("notFound.returnHome")).toBe("Back to home");
  });

  it("支持跟随系统语言偏好", async () => {
    await setLanguagePreference(systemLanguage);

    expect(getLanguagePreference()).toBe(systemLanguage);
  });
});
