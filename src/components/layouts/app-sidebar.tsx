import { Link } from "@tanstack/react-router";
import {
  LanguagesIcon,
  LayoutDashboardIcon,
  LibraryBigIcon,
  MoonIcon,
  Search,
  Settings2Icon,
  SunIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { NavMain } from "@/components/navigation/nav-main";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import styles from "./app-sidebar.module.less";

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  const { resolvedTheme, setTheme } = useTheme();
  const { isMobile } = useSidebar();
  const { t, i18n } = useTranslation();
  const isDark = resolvedTheme === "dark";
  const currentLanguage = i18n.resolvedLanguage === "en" ? "en" : "zh-CN";
  const currentLanguageLabel = currentLanguage === "zh-CN" ? t("language.zhCN") : t("language.en");
  const themeLabel = isDark ? t("theme.light") : t("theme.dark");
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
              <div className={cn(styles.sidebarHide, styles.sidebarSearch)}>
                <Button variant="ghost" aria-label={t("sidebar.search")}>
                  <Search />
                  <Kbd>
                    <span>⌘</span>
                    <span>K</span>
                  </Kbd>
                </Button>
              </div>
              <SidebarTrigger size="icon" aria-label={t("sidebar.toggle")} />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigation} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t("navigation.settings")} render={<Link to="/settings" />}>
              <Settings2Icon />
              <span>{t("navigation.settings")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    tooltip={t("language.change")}
                    aria-label={t("language.change")}
                  />
                }
              >
                <LanguagesIcon />
                <span>{currentLanguageLabel}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-44" side={isMobile ? "top" : "right"} align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{t("language.label")}</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={currentLanguage}
                    onValueChange={(language) => {
                      void i18n.changeLanguage(String(language));
                    }}
                  >
                    <DropdownMenuRadioItem value="zh-CN" closeOnClick>
                      {t("language.zhCN")}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="en" closeOnClick>
                      {t("language.en")}
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={themeLabel}
              onClick={() => setTheme(isDark ? "light" : "dark")}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
              <span>{themeLabel}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail aria-label={t("sidebar.toggle")} title={t("sidebar.toggle")} />
    </Sidebar>
  );
}
