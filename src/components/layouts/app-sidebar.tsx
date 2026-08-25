import { Link } from "@tanstack/react-router";
import { BlocksIcon, LibraryBigIcon, MessagesSquareIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { NavMain } from "@/components/navigation/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const navigation = [
  {
    title: "工作台",
    to: "/" as const,
    icon: MessagesSquareIcon,
    exact: true,
  },
  {
    title: "本地知识库",
    to: "/rag" as const,
    icon: LibraryBigIcon,
  },
];

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Norafold"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              render={<Link to="/" />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <BlocksIcon className="size-4" />
              </div>
              <div className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold">Norafold</span>
                <span className="truncate text-xs text-muted-foreground">Local AI workspace</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigation} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
