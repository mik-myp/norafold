import { describe, expect, it } from "vite-plus/test";

import { isDesktopPlatform } from "@/shared/desktop-api";

describe("isDesktopPlatform", () => {
  it("识别 Electron 支持的桌面平台", () => {
    expect(isDesktopPlatform("darwin")).toBe(true);
    expect(isDesktopPlatform("win32")).toBe(true);
    expect(isDesktopPlatform("android")).toBe(false);
  });
});
