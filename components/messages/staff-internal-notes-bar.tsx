'use client';

import { ChevronRight, Lock } from 'lucide-react';

import { cn } from '@/lib/utils';

export function StaffInternalNotesBar({
  count,
  latestPreview,
  onOpen,
}: {
  count: number;
  latestPreview?: string;
  onOpen: () => void;
}) {
  const preview =
    latestPreview?.trim().replace(/\s+/g, ' ').slice(0, 72) ||
    (count > 0 ? `${count} team note${count === 1 ? '' : 's'}` : 'Private notes for your team');

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'group relative flex w-full items-center gap-3 border-t border-orange-200/70 px-3 py-2.5 text-left transition-all',
        'bg-gradient-to-r from-orange-50/95 via-orange-50/80 to-amber-50/90',
        'hover:from-orange-100/95 hover:via-orange-50 hover:to-amber-50 hover:shadow-[0_-4px_20px_-4px_rgb(234_88_12/0.2)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:ring-offset-2',
        'dark:border-orange-900/50 dark:from-orange-950/50 dark:via-orange-950/40 dark:to-amber-950/30',
        'dark:hover:from-orange-950/70 dark:hover:via-orange-950/50',
      )}
    >
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-md border border-orange-200/80 bg-white/80 shadow-sm',
          'group-hover:border-orange-300 group-hover:bg-white',
          'dark:border-orange-800/60 dark:bg-orange-950/40 dark:group-hover:bg-orange-950/60',
        )}
      >
        <Lock className="size-4 text-orange-700 dark:text-orange-300" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold text-orange-950 dark:text-orange-50">Internal notes</span>
          {count > 0 ? (
            <span className="rounded-sm bg-orange-600 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white">
              {count}
            </span>
          ) : (
            <span className="text-[10px] font-medium uppercase tracking-wide text-orange-700/80 dark:text-orange-300/80">
              Staff only
            </span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-[12px] text-orange-900/75 dark:text-orange-200/70">{preview}</span>
      </span>

      <span className="flex shrink-0 items-center gap-0.5 text-[12px] font-medium text-orange-800/90 dark:text-orange-200/90">
        Open
        <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}
