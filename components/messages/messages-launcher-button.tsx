'use client';

import { MessageCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function MessagesLauncherButton({
  onClick,
  unreadCount = 0,
  className,
  title = 'Open messages',
}: {
  onClick: () => void;
  unreadCount?: number;
  className?: string;
  title?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      title={title}
      aria-label={unreadCount > 0 ? `${title} (${unreadCount} unread)` : title}
      onClick={onClick}
      className={cn(
        'relative size-10 shrink-0 rounded-md border-border bg-background shadow-sm hover:bg-primary/5 hover:text-primary',
        className,
      )}
    >
      <MessageCircle className="size-5" />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      ) : null}
    </Button>
  );
}
