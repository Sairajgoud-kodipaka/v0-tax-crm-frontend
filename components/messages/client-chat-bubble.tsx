'use client';

import type { Message } from '@/lib/types';
import { formatMessageTime } from '@/lib/message-ui';
import { cn } from '@/lib/utils';

export function ClientChatBubble({
  msg,
  isOutbound,
  isUnread,
  seenByOther,
}: {
  msg: Message;
  isOutbound: boolean;
  isUnread?: boolean;
  seenByOther?: boolean;
}) {
  return (
    <div className={cn('flex w-full', isOutbound ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[min(88%,26rem)] px-3 py-2 shadow-sm',
          isOutbound
            ? 'rounded-2xl rounded-br-md bg-primary text-primary-foreground'
            : 'rounded-2xl rounded-bl-md border border-border/50 bg-card text-foreground',
        )}
      >
        {!isOutbound ? (
          <p className="mb-0.5 truncate text-[11px] font-semibold leading-none text-primary">{msg.senderName}</p>
        ) : null}
        <p className="whitespace-pre-wrap text-[13px] leading-snug">{msg.content}</p>
        <div
          className={cn(
            'mt-1 flex items-center gap-1.5 text-[10px] tabular-nums',
            isOutbound ? 'justify-end text-primary-foreground/70' : 'text-muted-foreground',
          )}
        >
          <time dateTime={msg.createdAt.toISOString()}>{formatMessageTime(msg.createdAt)}</time>
          {isOutbound ? <span>{seenByOther ? '· Read' : '· Sent'}</span> : null}
          {isUnread ? <span className="size-1.5 shrink-0 rounded-full bg-blue-500" aria-label="Unread" /> : null}
        </div>
      </div>
    </div>
  );
}
