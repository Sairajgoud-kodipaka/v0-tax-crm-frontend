export default function ClientLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 w-48 rounded bg-muted" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6">
            <div className="h-4 w-32 rounded bg-muted mb-3" />
            <div className="h-6 w-24 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
