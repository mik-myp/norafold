import { Outlet } from "@tanstack/react-router";
import { PanelLeftIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { useAppearance } from "@/features/appearance/appearance-context";

export function AppShell() {
  const { appearance } = useAppearance();

  return (
    <SidebarProvider>
      <AppSidebar variant={appearance.sidebarVariant} collapsible={appearance.sidebarCollapsible} />
      <AppContent />
    </SidebarProvider>
  );
}

function AppContent() {
  const { appearance } = useAppearance();
  const { isMobile, state, toggleSidebar } = useSidebar();
  const { t } = useTranslation();
  const showSidebarTrigger =
    isMobile || (appearance.sidebarCollapsible === "offcanvas" && state === "collapsed");

  return (
    <SidebarInset className="min-w-0 overflow-hidden">
      <header className="h-12 w-full shrink-0 bg-transparent">
        <div className="flex h-full items-center gap-1.5 px-2 sm:gap-2 sm:px-3">
          {showSidebarTrigger && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("sidebar.toggle")}
              onClick={toggleSidebar}
            >
              <PanelLeftIcon />
            </Button>
          )}
        </div>
      </header>
      <div data-slot="content-container" className="min-h-0 w-full flex-1 overflow-auto">
        <Outlet />
      </div>
    </SidebarInset>
  );
}
