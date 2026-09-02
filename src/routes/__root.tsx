import { Link, Outlet, createRootRoute, type ErrorComponentProps } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { HouseIcon, RotateCcwIcon } from "lucide-react";
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
  errorComponent: RouteErrorComponent,
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

function RouteErrorComponent({ reset }: ErrorComponentProps) {
  const { t } = useTranslation();

  return (
    <main className="min-h-svh">
      <Empty className="min-h-svh rounded-none px-6 py-12">
        <EmptyHeader>
          <EmptyMedia>
            <span className="text-7xl font-semibold text-muted-foreground/20 sm:text-8xl">!</span>
          </EmptyMedia>
          <EmptyTitle>{t("error.title")}</EmptyTitle>
          <EmptyDescription>{t("error.description")}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={reset}>
              <RotateCcwIcon data-icon="inline-start" />
              {t("error.retry")}
            </Button>
            <Button render={<Link to="/" />} nativeButton={false}>
              <HouseIcon data-icon="inline-start" />
              {t("notFound.returnHome")}
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </main>
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
