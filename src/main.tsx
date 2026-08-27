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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
);
