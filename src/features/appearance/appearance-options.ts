export const themePresets = [
  {
    value: "default",
    swatches: ["oklch(0.5542 0.2383 266.04)", "oklch(0.5528 0.0997 175.01)"],
  },
  {
    value: "anthropic",
    swatches: ["oklch(0.984 0.005 95)", "oklch(0.685 0.142 38)"],
  },
  { value: "simple-large", swatches: ["oklch(0.15 0 0)", "oklch(0.99 0 0)"] },
  {
    value: "underground",
    swatches: ["oklch(0.5315 0.0694 156.19)", "oklch(0.5748 0.0862 336.52)"],
  },
  {
    value: "rose-garden",
    swatches: ["oklch(0.5827 0.2418 12.23)", "oklch(0.8131 0.1129 5.67)"],
  },
  {
    value: "lake-view",
    swatches: ["oklch(0.765 0.177 163.22)", "oklch(0.551 0.0899 200.52)"],
  },
  {
    value: "sunset-glow",
    swatches: ["oklch(0.5591 0.1882 25.33)", "oklch(0.7938 0.1248 42.42)"],
  },
  {
    value: "forest-whisper",
    swatches: ["oklch(0.5276 0.1072 182.22)", "oklch(0.5236 0.0505 250.18)"],
  },
  {
    value: "ocean-breeze",
    swatches: ["oklch(0.5461 0.2152 262.88)", "oklch(0.5854 0.2041 277.12)"],
  },
  {
    value: "lavender-dream",
    swatches: ["oklch(0.5709 0.1808 306.89)", "oklch(0.811 0.0589 201.14)"],
  },
] as const;

export const themeFonts = ["default", "sans", "serif"] as const;
export const themeRadii = ["default", "none", "sm", "md", "lg", "xl"] as const;
export const themeScales = ["sm", "default", "lg", "xl"] as const;
export const sidebarVariants = ["inset", "floating", "sidebar"] as const;
export const sidebarCollapsibles = ["icon", "offcanvas"] as const;
export const contentLayouts = ["full", "centered"] as const;
export const directions = ["ltr", "rtl"] as const;

export type ThemePreset = (typeof themePresets)[number]["value"];
export type ThemeFont = (typeof themeFonts)[number];
export type ThemeRadius = (typeof themeRadii)[number];
export type ThemeScale = (typeof themeScales)[number];
export type SidebarVariant = (typeof sidebarVariants)[number];
export type SidebarCollapsible = (typeof sidebarCollapsibles)[number];
export type ContentLayout = (typeof contentLayouts)[number];
export type Direction = (typeof directions)[number];

export type AppearanceCustomization = {
  preset: ThemePreset;
  font: ThemeFont;
  radius: ThemeRadius;
  scale: ThemeScale;
  sidebarVariant: SidebarVariant;
  sidebarCollapsible: SidebarCollapsible;
  contentLayout: ContentLayout;
  direction: Direction;
};

export const defaultAppearance: AppearanceCustomization = {
  preset: "default",
  font: "default",
  radius: "default",
  scale: "default",
  sidebarVariant: "inset",
  sidebarCollapsible: "icon",
  contentLayout: "full",
  direction: "ltr",
};

export const appearanceStorageKeys = {
  preset: "norafold.appearance.preset",
  font: "norafold.appearance.font",
  radius: "norafold.appearance.radius",
  scale: "norafold.appearance.scale",
  sidebarVariant: "norafold.appearance.sidebar",
  sidebarCollapsible: "norafold.appearance.layout",
  contentLayout: "norafold.appearance.content-layout",
  direction: "norafold.appearance.direction",
} satisfies Record<keyof AppearanceCustomization, string>;

export function isOneOf<const T extends string>(
  value: string | null,
  options: readonly T[],
): value is T {
  return value !== null && options.some((option) => option === value);
}

export function resolveThemeFont(font: ThemeFont, preset: ThemePreset) {
  if (font !== "default") return font;
  if (preset === "anthropic") return "serif";
  return preset === "default" ? "default" : "sans";
}
