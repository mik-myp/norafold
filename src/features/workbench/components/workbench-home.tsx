import { Link } from "@tanstack/react-router";
import { ArrowRightIcon, HistoryIcon, LibraryBigIcon, Settings2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FoldMark } from "@/components/brand/fold-mark";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function WorkbenchHome() {
  const { t } = useTranslation();

  const destinations = [
    {
      to: "/knowledge" as const,
      icon: LibraryBigIcon,
      title: t("workbench.destinations.knowledge.title"),
      description: t("workbench.destinations.knowledge.description"),
    },
    {
      to: "/settings" as const,
      icon: Settings2Icon,
      title: t("workbench.destinations.settings.title"),
      description: t("workbench.destinations.settings.description"),
    },
  ];

  return (
    <main className="flex min-h-full w-full flex-col px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
      <header className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <FoldMark className="mt-0.5 size-9" />
          <div className="min-w-0">
            <h1 className="text-[22px] leading-7 font-semibold">{t("workbench.title")}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {t("workbench.description")}
            </p>
          </div>
        </div>
        <Button render={<Link to="/knowledge" />} nativeButton={false}>
          <LibraryBigIcon data-icon="inline-start" />
          {t("workbench.openKnowledge")}
        </Button>
      </header>

      <section
        className="flex min-h-0 flex-1 flex-col border-b py-6"
        aria-labelledby="recent-title"
      >
        <div className="flex items-center gap-2">
          <HistoryIcon className="size-4 text-muted-foreground" />
          <h2 id="recent-title" className="text-base font-semibold">
            {t("workbench.recent.title")}
          </h2>
        </div>
        <Empty className="min-h-64 py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HistoryIcon />
            </EmptyMedia>
            <EmptyTitle>{t("workbench.recent.empty.title")}</EmptyTitle>
            <EmptyDescription>{t("workbench.recent.empty.description")}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" render={<Link to="/knowledge" />} nativeButton={false}>
              {t("workbench.recent.empty.action")}
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </EmptyContent>
        </Empty>
      </section>

      <section className="pt-6" aria-labelledby="destinations-title">
        <h2 id="destinations-title" className="mb-3 text-base font-semibold">
          {t("workbench.destinations.title")}
        </h2>
        <nav className="divide-y border-y" aria-label={t("workbench.destinations.title")}>
          {destinations.map((destination) => (
            <Link
              key={destination.to}
              to={destination.to}
              className="group flex min-h-14 items-center gap-3 px-2 py-3 transition-colors duration-150 hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <destination.icon className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{destination.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {destination.description}
                </span>
              </span>
              <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground" />
            </Link>
          ))}
        </nav>
      </section>
    </main>
  );
}
