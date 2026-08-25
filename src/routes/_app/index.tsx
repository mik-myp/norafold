import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/")({
  component: HomeRoute,
});

function HomeRoute() {
  return (
    <div className="mx-auto w-full max-w-5xl p-5 md:p-8">
      <header className="border-b pb-5">
        <h1 className="text-2xl font-semibold">工作台</h1>
      </header>
      <section className="py-6" aria-labelledby="recent-conversations">
        <h2 id="recent-conversations" className="text-sm font-medium">
          最近会话
        </h2>
        <div className="mt-4 grid min-h-48 place-items-center rounded-md border border-dashed">
          <p className="text-sm text-muted-foreground">暂无会话</p>
        </div>
      </section>
    </div>
  );
}
