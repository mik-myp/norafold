import { Link, useMatchRoute } from "@tanstack/react-router";
import {
  LanguagesIcon,
  LayoutDashboardIcon,
  LibraryBigIcon,
  MonitorIcon,
  MoonIcon,
  PaletteIcon,
  Settings2Icon,
  SunIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { ComponentProps } from "react";
import { useState } from "react";
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
import {
  getLanguagePreference,
  isLanguagePreference,
  setLanguagePreference,
  systemLanguage,
} from "@/i18n";
import styles from "./app-sidebar.module.less";

const themePreferences = ["system", "light", "dark"] as const;
type ThemePreference = (typeof themePreferences)[number];

function isThemePreference(theme: string): theme is ThemePreference {
  return themePreferences.some((themePreference) => themePreference === theme);
}

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  const { theme, setTheme } = useTheme();
  const { isMobile } = useSidebar();
  const { t } = useTranslation();
  const [languagePreference, setLanguagePreferenceState] = useState(getLanguagePreference);
  const matchRoute = useMatchRoute();

  const isSettingActive = Boolean(
    matchRoute({
      to: "/settings",
      fuzzy: false,
    }),
  );

  const currentTheme = theme ?? "";
  const themePreference = isThemePreference(currentTheme) ? currentTheme : "system";
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
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    tooltip={t("language.label")}
                    aria-label={t("language.label")}
                  />
                }
              >
                <LanguagesIcon />
                <span>{t("language.label")}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-44" side={isMobile ? "top" : "right"} align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{t("language.label")}</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={languagePreference}
                    onValueChange={(language) => {
                      const nextLanguage = String(language);
                      if (isLanguagePreference(nextLanguage)) {
                        setLanguagePreferenceState(nextLanguage);
                        void setLanguagePreference(nextLanguage);
                      }
                    }}
                  >
                    <DropdownMenuRadioItem value={systemLanguage} closeOnClick>
                      {t("language.system")}
                    </DropdownMenuRadioItem>
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
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton tooltip={t("theme.label")} aria-label={t("theme.label")} />
                }
              >
                <PaletteIcon />
                <span>{t("theme.label")}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-44" side={isMobile ? "top" : "right"} align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{t("theme.label")}</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={themePreference}
                    onValueChange={(nextTheme) => {
                      const nextThemeValue = String(nextTheme);
                      if (isThemePreference(nextThemeValue)) {
                        setTheme(nextThemeValue);
                      }
                    }}
                  >
                    <DropdownMenuRadioItem value="system" closeOnClick>
                      <MonitorIcon />
                      {t("theme.system")}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="light" closeOnClick>
                      <SunIcon />
                      {t("theme.light")}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark" closeOnClick>
                      <MoonIcon />
                      {t("theme.dark")}
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail aria-label={t("sidebar.toggle")} title={t("sidebar.toggle")} />
    </Sidebar>
  );
}
