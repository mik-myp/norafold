import { Link, useMatchRoute } from "@tanstack/react-router";
import { LayoutDashboardIcon, LibraryBigIcon, Settings2Icon } from "lucide-react";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { NavMain } from "@/components/navigation/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import styles from "./app-sidebar.module.less";

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation();
  const matchRoute = useMatchRoute();

  const isSettingActive = Boolean(
    matchRoute({
      to: "/settings",
      fuzzy: false,
    }),
  );

  const navigation = [
    {
      title: t("navigation.home"),
      to: "/" as const,
      icon: LayoutDashboardIcon,
      exact: true,
    },
    {
      title: t("navigation.knowledge"),
      to: "/knowledge" as const,
      icon: LibraryBigIcon,
    },
  ];

  return (
    <Sidebar
      collapsible="icon"
      mobileTitle={t("sidebar.title")}
      mobileDescription={t("sidebar.description")}
      {...props}
    >
      <SidebarHeader className="p-2">
        <SidebarMenu>
          <SidebarMenuItem className={styles.sidebarHead}>
            <div className={styles.sidebarHide}>
              <Link to="/">
                <div className="grid min-w-0 flex-1 text-left leading-tight">
                  {/* i18next-instrument-ignore -- product name */}
                  <span className="truncate text-[15px] font-semibold tracking-[-0.02em]">
                    norafold
                  </span>
                </div>
              </Link>
            </div>
            <div className={styles.sidebarActions}>
              <SidebarTrigger size="icon" aria-label={t("sidebar.toggle")} />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigation} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isSettingActive}
              tooltip={t("navigation.settings")}
              render={<Link to="/settings" />}
            >
              <Settings2Icon />
              <span>{t("navigation.settings")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail aria-label={t("sidebar.toggle")} title={t("sidebar.toggle")} />
    </Sidebar>
  );
}
