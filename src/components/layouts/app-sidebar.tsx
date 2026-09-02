import { Link, useLocation, useMatchRoute } from "@tanstack/react-router";
import {
  ChevronLeftIcon,
  DownloadIcon,
  LayoutDashboardIcon,
  LibraryBigIcon,
  Settings2Icon,
} from "lucide-react";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { FoldMark } from "@/components/brand/fold-mark";
import { NavMain } from "@/components/navigation/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { resolveSettingsSection } from "@/features/settings/settings-sections";
import styles from "./app-sidebar.module.less";

export function AppSidebar({ collapsible = "icon", ...props }: ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation();
  const matchRoute = useMatchRoute();
  const pathname = useLocation({ select: (location) => location.pathname });
  const locationSearch = useLocation({ select: (location) => location.search });
  const { isMobile, setOpenMobile } = useSidebar();

  const isSettingActive = Boolean(
    matchRoute({
      to: "/settings",
      fuzzy: false,
    }),
  );
  const isSettingsView = pathname === "/settings";
  const settingsSection = resolveSettingsSection(locationSearch);

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
      collapsible={collapsible}
      mobileTitle={t("sidebar.title")}
      mobileDescription={t("sidebar.description")}
      {...props}
    >
      {isSettingsView ? (
        <SidebarHeader className="border-b border-sidebar-border p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={t("settings.backToWorkbench")}
                className="gap-1.5 font-medium text-muted-foreground hover:text-foreground"
                onClick={() => {
                  if (isMobile) {
                    setOpenMobile(false);
                  }
                }}
                render={<Link to="/" />}
              >
                <ChevronLeftIcon />
                <span>{t("settings.backToWorkbench")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
      ) : (
        <SidebarHeader className="p-2">
          <SidebarMenu>
            <SidebarMenuItem className={styles.sidebarHead}>
              <div className={styles.sidebarHide}>
                <Link to="/" className="flex min-w-0 items-center gap-2 px-1">
                  <FoldMark className="size-7" />
                  <div className="grid min-w-0 flex-1 text-left leading-tight">
                    {/* i18next-instrument-ignore -- product name */}
                    <span className="truncate text-[15px] font-semibold">norafold</span>
                  </div>
                </Link>
              </div>
              <div className={styles.sidebarActions}>
                <SidebarTrigger size="icon" aria-label={t("sidebar.toggle")} />
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
      )}

      <SidebarContent className={isSettingsView ? "py-2" : undefined}>
        {isSettingsView ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {[
                  {
                    section: "general" as const,
                    title: t("settings.tabs.general"),
                    icon: Settings2Icon,
                    search: {},
                  },
                  {
                    section: "updates" as const,
                    title: t("settings.tabs.updates"),
                    icon: DownloadIcon,
                    search: { section: "updates" as const },
                  },
                ].map((item) => (
                  <SidebarMenuItem key={item.section}>
                    <SidebarMenuButton
                      isActive={settingsSection === item.section}
                      tooltip={item.title}
                      onClick={() => {
                        if (isMobile) {
                          setOpenMobile(false);
                        }
                      }}
                      render={<Link to="/settings" search={item.search} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <NavMain items={navigation} />
        )}
      </SidebarContent>

      {!isSettingsView && (
        <SidebarFooter>
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isSettingActive}
                tooltip={t("navigation.settings")}
                onClick={() => {
                  if (isMobile) {
                    setOpenMobile(false);
                  }
                }}
                render={<Link to="/settings" search={{}} />}
              >
                <Settings2Icon />
                <span>{t("navigation.settings")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
      <SidebarRail aria-label={t("sidebar.toggle")} title={t("sidebar.toggle")} />
    </Sidebar>
  );
}
