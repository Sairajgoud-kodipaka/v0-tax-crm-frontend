export default function Loading() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 animate-pulse">
      <div className="h-8 w-24 rounded bg-muted" />
      <div className="h-10 w-full rounded-lg bg-muted" />
      <div className="h-96 rounded-lg bg-muted" />
    </div>
  );
}
