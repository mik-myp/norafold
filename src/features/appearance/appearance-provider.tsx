import { DirectionProvider } from "@base-ui/react/direction-provider";
import { useEffect, useState } from "react";
import type { PropsWithChildren } from "react";
import { AppearanceContext } from "@/features/appearance/appearance-context";
import {
  appearanceStorageKeys,
  contentLayouts,
  defaultAppearance,
  directions,
  isOneOf,
  resolveThemeFont,
  sidebarCollapsibles,
  sidebarVariants,
  themeFonts,
  themePresets,
  themeRadii,
  themeScales,
} from "@/features/appearance/appearance-options";
import type {
  AppearanceCustomization,
  ContentLayout,
  Direction,
  SidebarCollapsible,
  SidebarVariant,
  ThemeFont,
  ThemePreset,
  ThemeRadius,
  ThemeScale,
} from "@/features/appearance/appearance-options";

function readPreference<T extends string>(key: string, values: readonly T[], fallback: T): T {
  try {
    const storedValue = window.localStorage.getItem(key);
    return isOneOf(storedValue, values) ? storedValue : fallback;
  } catch {
    return fallback;
  }
}

function persistPreference<T extends keyof AppearanceCustomization>(
  key: T,
  value: AppearanceCustomization[T],
) {
  try {
    if (value === defaultAppearance[key]) {
      window.localStorage.removeItem(appearanceStorageKeys[key]);
    } else {
      window.localStorage.setItem(appearanceStorageKeys[key], value);
    }
  } catch {
    // Restricted browser contexts may disable storage; the active session still keeps the setting.
  }
}

function setBodyAttribute(name: string, value: string | null) {
  if (value === null) {
    document.body.removeAttribute(name);
  } else {
    document.body.setAttribute(name, value);
  }
}

export function AppearanceProvider({ children }: PropsWithChildren) {
  const [preset, setPresetState] = useState<ThemePreset>(() =>
    readPreference(
      appearanceStorageKeys.preset,
      themePresets.map(({ value }) => value),
      defaultAppearance.preset,
    ),
  );
  const [font, setFontState] = useState<ThemeFont>(() =>
    readPreference(appearanceStorageKeys.font, themeFonts, defaultAppearance.font),
  );
  const [radius, setRadiusState] = useState<ThemeRadius>(() =>
    readPreference(appearanceStorageKeys.radius, themeRadii, defaultAppearance.radius),
  );
  const [scale, setScaleState] = useState<ThemeScale>(() =>
    readPreference(appearanceStorageKeys.scale, themeScales, defaultAppearance.scale),
  );
  const [sidebarVariant, setSidebarVariantState] = useState<SidebarVariant>(() =>
    readPreference(
      appearanceStorageKeys.sidebarVariant,
      sidebarVariants,
      defaultAppearance.sidebarVariant,
    ),
  );
  const [sidebarCollapsible, setSidebarCollapsibleState] = useState<SidebarCollapsible>(() =>
    readPreference(
      appearanceStorageKeys.sidebarCollapsible,
      sidebarCollapsibles,
      defaultAppearance.sidebarCollapsible,
    ),
  );
  const [contentLayout, setContentLayoutState] = useState<ContentLayout>(() =>
    readPreference(
      appearanceStorageKeys.contentLayout,
      contentLayouts,
      defaultAppearance.contentLayout,
    ),
  );
  const [direction, setDirectionState] = useState<Direction>(() =>
    readPreference(appearanceStorageKeys.direction, directions, defaultAppearance.direction),
  );

  useEffect(() => {
    setBodyAttribute("data-theme-preset", preset === defaultAppearance.preset ? null : preset);
    const resolvedFont = resolveThemeFont(font, preset);
    setBodyAttribute("data-theme-font", resolvedFont === "default" ? null : resolvedFont);
    setBodyAttribute("data-theme-radius", radius === defaultAppearance.radius ? null : radius);
    setBodyAttribute("data-theme-scale", scale === defaultAppearance.scale ? null : scale);
    setBodyAttribute("data-theme-content-layout", contentLayout);
  }, [contentLayout, font, preset, radius, scale]);

  useEffect(() => {
    document.documentElement.setAttribute("dir", direction);
  }, [direction]);

  function setPreset(value: ThemePreset) {
    setPresetState(value);
    persistPreference("preset", value);
  }

  function setFont(value: ThemeFont) {
    setFontState(value);
    persistPreference("font", value);
  }

  function setRadius(value: ThemeRadius) {
    setRadiusState(value);
    persistPreference("radius", value);
  }

  function setScale(value: ThemeScale) {
    setScaleState(value);
    persistPreference("scale", value);
  }

  function setSidebarVariant(value: SidebarVariant) {
    setSidebarVariantState(value);
    persistPreference("sidebarVariant", value);
  }

  function setSidebarCollapsible(value: SidebarCollapsible) {
    setSidebarCollapsibleState(value);
    persistPreference("sidebarCollapsible", value);
  }

  function setContentLayout(value: ContentLayout) {
    setContentLayoutState(value);
    persistPreference("contentLayout", value);
  }

  function setDirection(value: Direction) {
    setDirectionState(value);
    persistPreference("direction", value);
  }

  function resetAppearance() {
    setPreset(defaultAppearance.preset);
    setFont(defaultAppearance.font);
    setRadius(defaultAppearance.radius);
    setScale(defaultAppearance.scale);
    setSidebarVariant(defaultAppearance.sidebarVariant);
    setSidebarCollapsible(defaultAppearance.sidebarCollapsible);
    setContentLayout(defaultAppearance.contentLayout);
    setDirection(defaultAppearance.direction);
  }

  return (
    <AppearanceContext.Provider
      value={{
        appearance: {
          preset,
          font,
          radius,
          scale,
          sidebarVariant,
          sidebarCollapsible,
          contentLayout,
          direction,
        },
        defaults: defaultAppearance,
        setPreset,
        setFont,
        setRadius,
        setScale,
        setSidebarVariant,
        setSidebarCollapsible,
        setContentLayout,
        setDirection,
        resetAppearance,
      }}
    >
      <DirectionProvider direction={direction}>{children}</DirectionProvider>
    </AppearanceContext.Provider>
  );
}
