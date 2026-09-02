import { describe, expect, it } from "vite-plus/test";
import {
  resolveSettingsSection,
  validateSettingsSearch,
} from "@/features/settings/settings-sections";

describe("settings sections", () => {
  it("uses the general section for missing or unsupported search values", () => {
    expect(resolveSettingsSection(undefined)).toBe("general");
    expect(resolveSettingsSection({})).toBe("general");
    expect(resolveSettingsSection({ section: "unknown" })).toBe("general");
    expect(validateSettingsSearch({ section: "unknown" })).toEqual({});
  });

  it("keeps the updates section in validated search state", () => {
    expect(resolveSettingsSection({ section: "updates" })).toBe("updates");
    expect(validateSettingsSearch({ section: "updates" })).toEqual({ section: "updates" });
  });
});
