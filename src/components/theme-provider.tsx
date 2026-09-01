import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { PropsWithChildren } from "react";

export function ThemeProvider({ children }: PropsWithChildren) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="norafold.theme"
      // The Vite renderer is client-only; keep next-themes' SSR bootstrap inert under strict CSP.
      scriptProps={{ "aria-hidden": true, hidden: true, type: "application/json" }}
    >
      {children}
    </NextThemesProvider>
  );
}
