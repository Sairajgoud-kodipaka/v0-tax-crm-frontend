export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-pulse">
      <div className="h-8 w-44 rounded-sm bg-muted" />
      <div className="h-9 w-56 rounded-sm bg-muted" />
      <div className="space-y-0 rounded-md border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 border-b border-border bg-muted/30 last:border-b-0" />
        ))}
      </div>
    </div>
  );
}
