import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { HouseIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { TooltipProvider } from "@/components/ui/tooltip";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  return (
    <TooltipProvider>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </TooltipProvider>
  );
}

function NotFoundComponent() {
  const { t } = useTranslation();

  return (
    <main className="min-h-svh">
      <Empty className="min-h-svh rounded-none px-6 py-12">
        <EmptyHeader>
          <EmptyMedia>
            <span className="text-7xl font-semibold text-muted-foreground/20 sm:text-8xl">404</span>
          </EmptyMedia>
          <EmptyTitle>{t("notFound.title")}</EmptyTitle>
          <EmptyDescription>{t("notFound.description")}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link to="/" />} nativeButton={false}>
            <HouseIcon data-icon="inline-start" />
            {t("notFound.returnHome")}
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
