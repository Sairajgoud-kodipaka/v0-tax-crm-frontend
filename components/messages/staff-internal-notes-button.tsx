'use client';

import { Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function StaffInternalNotesButton({
  count,
  onOpen,
  className,
}: {
  count: number;
  onOpen: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onOpen}
      className={cn(
        'h-9 shrink-0 gap-1.5 border-orange-200/80 bg-orange-50/80 text-orange-950 hover:bg-orange-100',
        'dark:border-orange-800/60 dark:bg-orange-950/40 dark:text-orange-100 dark:hover:bg-orange-950/60',
        className,
      )}
    >
      <Lock className="size-3.5" />
      Internal
      {count > 0 ? (
        <span className="rounded-sm bg-orange-600 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white">
          {count}
        </span>
      ) : null}
    </Button>
  );
}
