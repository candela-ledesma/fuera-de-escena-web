export function ListadoSkeleton() {
  return (
    <div className="animate-pulse">
      <section className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-6">
          <div className="hidden size-24 shrink-0 rounded-full bg-secondary sm:block" />
          <div className="w-full max-w-md space-y-3">
            <div className="h-4 w-24 rounded bg-secondary" />
            <div className="h-4 w-full rounded bg-secondary" />
            <div className="h-3 w-32 rounded bg-secondary" />
          </div>
        </div>
      </section>

      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-2">
          <div className="h-5 w-28 rounded bg-secondary" />
          <div className="h-5 w-24 rounded bg-secondary" />
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-5 py-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="aspect-square rounded-md bg-secondary" />
          ))}
        </div>
      </main>
    </div>
  );
}
