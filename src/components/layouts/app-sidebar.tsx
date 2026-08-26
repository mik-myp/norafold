import { Link } from "@tanstack/react-router";
import {
  LayoutDashboardIcon,
  LibraryBigIcon,
  MoonIcon,
  Search,
  Settings2Icon,
  SunIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { ComponentProps } from "react";
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
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import styles from "./app-sidebar.module.less";

const navigation = [
  {
    title: "主页",
    to: "/" as const,
    icon: LayoutDashboardIcon,
    exact: true,
  },
  {
    title: "知识库",
    to: "/knowledge" as const,
    icon: LibraryBigIcon,
  },
];

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-2">
        <SidebarMenu>
          <SidebarMenuItem className={styles.sidebarHead}>
            <div className={styles.sidebarHide}>
              <Link to="/">
                <div className="grid min-w-0 flex-1 text-left leading-tight">
                  <span className="truncate text-[15px] font-semibold tracking-[-0.02em]">
                    norafold
                  </span>
                </div>
              </Link>
            </div>
            <div className={styles.sidebarActions}>
              <div className={cn(styles.sidebarHide, styles.sidebarSearch)}>
                <Button variant="ghost">
                  <Search />
                  <Kbd>
                    <span>⌘</span>
                    <span>K</span>
                  </Kbd>
                </Button>
              </div>
              <SidebarTrigger size="icon" />
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
            <SidebarMenuButton tooltip="设置" render={<Link to="/settings" />}>
              <Settings2Icon />
              <span>设置</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={isDark ? "浅色模式" : "深色模式"}
              onClick={() => setTheme(isDark ? "light" : "dark")}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
              <span>{isDark ? "浅色模式" : "深色模式"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
