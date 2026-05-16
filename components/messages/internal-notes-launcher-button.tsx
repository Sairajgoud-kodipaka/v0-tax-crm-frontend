'use client';

import { Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function InternalNotesLauncherButton({
  onClick,
  count = 0,
  className,
  title = 'Open internal team notes',
}: {
  onClick: () => void;
  count?: number;
  className?: string;
  title?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      title={title}
      aria-label={count > 0 ? `${title} (${count} notes)` : title}
      onClick={onClick}
      className={cn(
        'relative size-10 shrink-0 rounded-md border-orange-200/80 bg-orange-50/90 shadow-sm',
        'hover:bg-orange-100 hover:text-orange-950 dark:border-orange-800/60 dark:bg-orange-950/40 dark:hover:bg-orange-950/60',
        className,
      )}
    >
      <Lock className="size-5 text-orange-700 dark:text-orange-300" />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-bold text-white">
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Button>
  );
}
