'use client';

import type { ReactNode } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function ConversationStatusBar({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 border-b border-border/70 bg-muted/25 px-3 py-1.5 text-[11px] leading-snug text-muted-foreground">
      {children}
    </div>
  );
}

export function TicketConversationPanel({
  status,
  children,
  composer,
  beforeComposer,
  className,
}: {
  status?: ReactNode;
  children: ReactNode;
  composer: ReactNode;
  beforeComposer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col border-t border-border bg-background', className)}>
      {status ? <ConversationStatusBar>{status}</ConversationStatusBar> : null}
      <ScrollArea className="h-[min(440px,56vh)] min-h-[240px]">
        <div className="flex flex-col gap-1.5 px-3 py-3">{children}</div>
      </ScrollArea>
      {beforeComposer}
      <div className="border-t border-border/80 bg-card/40 px-3 py-2">{composer}</div>
    </div>
  );
}
