export function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-20 text-center">
      <p className="font-display text-2xl italic text-foreground">{message}</p>
      <p className="mt-2 text-sm text-muted">Volvé pronto.</p>
    </div>
  );
}
