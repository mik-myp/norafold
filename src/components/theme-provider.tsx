import { useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { ThemeContext, type ResolvedTheme, type Theme } from "@/components/theme-context";

const storageKey = "norafold.theme";
const darkModeQuery = "(prefers-color-scheme: dark)";

function readTheme(): Theme {
  const storedTheme = window.localStorage.getItem(storageKey);
  return storedTheme === "dark" || storedTheme === "light" ? storedTheme : "system";
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme !== "system") {
    return theme;
  }

  return window.matchMedia(darkModeQuery).matches ? "dark" : "light";
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<Theme>(readTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(theme));

  useEffect(() => {
    const mediaQuery = window.matchMedia(darkModeQuery);
    const applyTheme = () => {
      const nextTheme = resolveTheme(theme);
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
      document.documentElement.style.colorScheme = nextTheme;
      setResolvedTheme(nextTheme);
    };

    applyTheme();
    mediaQuery.addEventListener("change", applyTheme);
    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [theme]);

  const value = useMemo(
    () => ({
      resolvedTheme,
      theme,
      setTheme(nextTheme: Theme) {
        if (nextTheme === "system") {
          window.localStorage.removeItem(storageKey);
        } else {
          window.localStorage.setItem(storageKey, nextTheme);
        }
        setThemeState(nextTheme);
      },
    }),
    [resolvedTheme, theme],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}
