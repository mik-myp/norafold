import { Outlet } from "@tanstack/react-router";
import { PanelLeftIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar";

export function AppShell() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <AppContent />
    </SidebarProvider>
  );
}

function AppContent() {
  const { isMobile, toggleSidebar } = useSidebar();
  const { t } = useTranslation();

  return (
    <SidebarInset className="min-w-0 overflow-hidden">
      {isMobile && (
        <div className="flex h-12 shrink-0 items-center border-b px-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("sidebar.toggle")}
            onClick={toggleSidebar}
          >
            <PanelLeftIcon />
          </Button>
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-auto">
        <Outlet />
      </div>
    </SidebarInset>
  );
}
