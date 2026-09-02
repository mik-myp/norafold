import { createContext, useContext } from "react";
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

export type AppearanceContextValue = {
  appearance: AppearanceCustomization;
  defaults: AppearanceCustomization;
  setPreset: (value: ThemePreset) => void;
  setFont: (value: ThemeFont) => void;
  setRadius: (value: ThemeRadius) => void;
  setScale: (value: ThemeScale) => void;
  setSidebarVariant: (value: SidebarVariant) => void;
  setSidebarCollapsible: (value: SidebarCollapsible) => void;
  setContentLayout: (value: ContentLayout) => void;
  setDirection: (value: Direction) => void;
  resetAppearance: () => void;
};

export const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function useAppearance() {
  const context = useContext(AppearanceContext);

  if (!context) {
    throw new Error("useAppearance must be used within AppearanceProvider.");
  }

  return context;
}
