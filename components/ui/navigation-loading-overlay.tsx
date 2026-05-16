'use client';

import { Loader2 } from 'lucide-react';

export function NavigationLoadingOverlay({
  active,
  message = 'Loading…',
}: {
  active: boolean;
  message?: string;
}) {
  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background/75 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <div className="flex flex-col items-center gap-3 rounded-md border border-border bg-card px-6 py-5 shadow-lg">
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm font-medium text-foreground">{message}</p>
      </div>
    </div>
  );
}
