export function Skeleton({ className }: { className?: string }) {
  return (
    <div role="status" aria-label="Loading" className={`animate-pulse bg-muted ${className ?? ""}`}>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
