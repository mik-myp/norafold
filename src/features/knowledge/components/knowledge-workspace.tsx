import { BookOpenTextIcon, LibraryBigIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FoldMark } from "@/components/brand/fold-mark";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function KnowledgeWorkspace() {
  const { t } = useTranslation();

  return (
    <main className="grid min-h-full w-full grid-rows-[auto_minmax(20rem,1fr)] bg-surface-raised md:grid-cols-[12.5rem_minmax(0,1fr)] md:grid-rows-1">
      <aside className="border-b bg-surface-raised p-3 md:border-r md:border-b-0 md:p-2">
        <div className="flex items-start gap-2 px-2 py-2 md:flex-col md:gap-4 md:py-1">
          <div className="flex min-w-0 items-center gap-2">
            <FoldMark className="size-7" />
            <h1 className="truncate text-lg font-semibold">{t("knowledge.title")}</h1>
          </div>
        </div>

        <div className="mt-2 md:mt-5">
          <div
            className="flex h-8 items-center gap-2 rounded-md bg-muted/80 px-2 text-[13px] font-medium text-foreground"
            aria-current="page"
          >
            <BookOpenTextIcon className="size-4 text-muted-foreground" />
            <h2>{t("knowledge.sources.title")}</h2>
          </div>
          <p className="mt-2 px-2 text-xs leading-5 text-muted-foreground">
            {t("knowledge.sources.empty")}
          </p>
        </div>
      </aside>

      <section className="flex min-h-80 flex-col" aria-labelledby="knowledge-content-title">
        <header className="border-b px-5 py-4 sm:px-6">
          <h2 id="knowledge-content-title" className="text-lg font-semibold">
            {t("knowledge.sources.title")}
          </h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{t("knowledge.description")}</p>
        </header>
        <div className="min-h-0 flex-1 bg-surface-raised">
          <Empty className="h-full min-h-80 py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LibraryBigIcon />
              </EmptyMedia>
              <EmptyTitle>{t("knowledge.empty.title")}</EmptyTitle>
              <EmptyDescription>{t("knowledge.empty.description")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </section>
    </main>
  );
}
