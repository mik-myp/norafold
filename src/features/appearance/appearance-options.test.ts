import { describe, expect, it } from "vite-plus/test";
import {
  defaultAppearance,
  isOneOf,
  resolveThemeFont,
  themeFonts,
  themePresets,
} from "@/features/appearance/appearance-options";

describe("appearance options", () => {
  it("keeps the Norafold theme as the default preset", () => {
    expect(themePresets[0]?.value).toBe("default");
    expect(themePresets).toHaveLength(10);
  });

  it("uses the new-api layout defaults", () => {
    expect(defaultAppearance.sidebarVariant).toBe("inset");
    expect(defaultAppearance.sidebarCollapsible).toBe("icon");
    expect(defaultAppearance.contentLayout).toBe("full");
  });

  it("validates persisted values against their supported options", () => {
    expect(isOneOf("serif", themeFonts)).toBe(true);
    expect(isOneOf("unsupported", themeFonts)).toBe(false);
    expect(isOneOf(null, themeFonts)).toBe(false);
  });

  it("resolves automatic fonts from the selected preset", () => {
    expect(resolveThemeFont("default", "default")).toBe("default");
    expect(resolveThemeFont("default", "anthropic")).toBe("serif");
    expect(resolveThemeFont("default", "lake-view")).toBe("sans");
    expect(resolveThemeFont("sans", "anthropic")).toBe("sans");
  });
});
