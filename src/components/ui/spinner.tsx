export function Spinner({ className }: { className?: string }) {
  return (
    <span role="status" className={className}>
      Loading…
    </span>
  );
}
