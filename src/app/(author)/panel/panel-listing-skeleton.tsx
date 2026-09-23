export function PanelListingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-9 w-40 rounded-md bg-secondary" />
        <div className="h-9 w-44 rounded-full bg-secondary" />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 rounded-xl border border-border/70 bg-secondary/50" />
        ))}
      </div>

      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-24 rounded-xl border border-border/70 bg-secondary/50" />
        ))}
      </div>
    </div>
  );
}
