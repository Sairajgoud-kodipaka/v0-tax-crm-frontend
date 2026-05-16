'use client';

import { formatChatDayLabel } from '@/lib/message-ui';

export function ChatDateSeparator({ date }: { date: Date }) {
  const label = formatChatDayLabel(date);
  return (
    <div className="flex justify-center py-2" role="separator" aria-label={label}>
      <span className="rounded-md border border-border/50 bg-muted/70 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-[2px]">
        {label}
      </span>
    </div>
  );
}
