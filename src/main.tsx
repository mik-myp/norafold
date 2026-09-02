import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  RouterProvider,
  createBrowserHistory,
  createHashHistory,
  createRouter,
} from "@tanstack/react-router";
import "@/i18n";
import { routeTree } from "./routeTree.gen";
import "./index.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppearanceProvider } from "@/features/appearance/appearance-provider";

const history = window.desktop ? createHashHistory() : createBrowserHistory();

const router = createRouter({
  routeTree,
  history,
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Unable to find the application root element.");
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <AppearanceProvider>
        <RouterProvider router={router} />
      </AppearanceProvider>
    </ThemeProvider>
  </StrictMode>,
);
