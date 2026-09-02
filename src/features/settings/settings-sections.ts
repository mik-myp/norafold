export const settingsSections = ["general", "updates"] as const;

export type SettingsSection = (typeof settingsSections)[number];

export function resolveSettingsSection(search: unknown): SettingsSection {
  if (typeof search !== "object" || search === null || !("section" in search)) {
    return "general";
  }

  return search.section === "updates" ? "updates" : "general";
}

export function validateSettingsSearch(search: Record<string, unknown>): {
  section?: SettingsSection;
} {
  return search.section === "updates" ? { section: "updates" } : {};
}
