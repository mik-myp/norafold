import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
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
  return (
    <main className="grid min-h-svh place-items-center p-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">404</p>
        <h1 className="mt-2 text-xl font-medium">页面不存在</h1>
      </div>
    </main>
  );
}
