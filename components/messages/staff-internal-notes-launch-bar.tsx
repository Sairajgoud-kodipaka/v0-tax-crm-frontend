'use client';

import { ChevronRight, Lock } from 'lucide-react';

import { cn } from '@/lib/utils';

/** Full-width control above the composer — opens the internal notes modal. */
export function StaffInternalNotesLaunchBar({
  count,
  onOpen,
}: {
  count: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex w-full items-center gap-3 border-t border-orange-200/70 px-3 py-2.5 text-left transition-colors',
        'bg-gradient-to-r from-orange-50/95 via-orange-50/80 to-amber-50/90',
        'hover:from-orange-100/95 hover:via-orange-50 hover:to-amber-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:ring-inset',
        'dark:border-orange-900/50 dark:from-orange-950/50 dark:via-orange-950/40 dark:to-amber-950/30',
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-orange-200/80 bg-white/90 dark:border-orange-800/60 dark:bg-orange-950/50">
        <Lock className="size-4 text-orange-700 dark:text-orange-300" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-orange-950 dark:text-orange-50">
          Internal team notes
          {count > 0 ? (
            <span className="rounded-sm bg-orange-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{count}</span>
          ) : null}
        </span>
        <span className="text-[11px] text-orange-900/75 dark:text-orange-200/70">
          Staff only — tap to open private notes
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-0.5 text-[12px] font-medium text-orange-800 dark:text-orange-200">
        Open
        <ChevronRight className="size-4" />
      </span>
    </button>
  );
}
