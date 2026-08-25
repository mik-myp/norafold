export function RagWorkspace() {
  return (
    <div className="mx-auto w-full max-w-5xl p-5 md:p-8">
      <header className="border-b pb-5">
        <h1 className="text-2xl font-semibold">本地知识库</h1>
      </header>
      <section className="py-6" aria-labelledby="knowledge-documents">
        <h2 id="knowledge-documents" className="text-sm font-medium">
          文档
        </h2>
        <div className="mt-4 grid min-h-48 place-items-center rounded-md border border-dashed">
          <p className="text-sm text-muted-foreground">暂无文档</p>
        </div>
      </section>
    </div>
  );
}
