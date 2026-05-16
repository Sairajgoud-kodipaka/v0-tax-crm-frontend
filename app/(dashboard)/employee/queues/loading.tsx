export default function EmployeeQueuesLoading() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 animate-pulse">
      <div>
        <div className="h-8 w-48 rounded bg-muted mb-2" />
        <div className="h-4 w-72 rounded bg-muted" />
      </div>
      <div className="rounded-md border border-border bg-card p-4">
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
