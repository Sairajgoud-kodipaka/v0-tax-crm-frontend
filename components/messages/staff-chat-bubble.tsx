'use client';

import { MoreHorizontal } from 'lucide-react';

import { escalateInternalThreadAction, markInternalThreadResolvedAction } from '@/app/actions/messages';
import { updateTicketStageAction } from '@/app/actions/tickets';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatBubbleTime, relativeSeenLine } from '@/lib/message-ui';
import type { Message, TicketStage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

function MentionContent({ content }: { content: string }) {
  return (
    <>
      {content.split(/(@[a-zA-Z]+(?:\s+[a-zA-Z]+)?)/g).map((part, idx) =>
        part.startsWith('@') ? (
          <span key={idx} className="font-semibold text-orange-700 dark:text-orange-300">
            {part}
          </span>
        ) : (
          <span key={idx}>{part}</span>
        ),
      )}
    </>
  );
}

export function StaffChatBubble({
  msg,
  ticketId,
  clientId,
  viewerUserId,
  isOutbound,
  isUnreadFromClient,
  seenByOther,
  latestSeen,
  isResolved,
  isInternal,
  nextStage,
  pendingNoteAction,
  startPendingNoteAction,
}: {
  msg: Message;
  ticketId: string;
  clientId: string;
  viewerUserId: string;
  isOutbound: boolean;
  isUnreadFromClient: boolean;
  seenByOther: boolean;
  latestSeen?: Date;
  isResolved: boolean;
  isInternal: boolean;
  nextStage: { id: TicketStage; label: string } | null;
  pendingNoteAction: boolean;
  startPendingNoteAction: (fn: () => Promise<void>) => void;
}) {
  const fromClient = !isInternal && msg.senderId === clientId;
  const alignRight = fromClient;

  return (
    <div className={cn('flex w-full', alignRight ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'group relative max-w-[min(92%,30rem)] px-3 py-2',
          isInternal
            ? 'rounded-2xl rounded-bl-md border border-orange-200/80 bg-orange-50/90 dark:border-orange-900/60 dark:bg-orange-950/40'
            : fromClient
              ? 'rounded-2xl rounded-br-md border border-border/50 bg-card text-foreground shadow-sm'
              : isOutbound
                ? 'rounded-2xl rounded-bl-md bg-primary text-primary-foreground'
                : 'rounded-2xl rounded-bl-md border border-border/50 bg-muted/50',
        )}
      >
        <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
          {isInternal ? (
            <span className="rounded-sm bg-orange-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
              Internal
            </span>
          ) : null}
          <span
            className={cn(
              'truncate text-[11px] font-semibold leading-none',
              isInternal
                ? 'text-orange-900 dark:text-orange-100'
                : isOutbound
                  ? 'text-primary-foreground'
                  : 'text-foreground',
            )}
          >
            {msg.senderName}
          </span>
          {!isInternal ? (
            <span
              className={cn(
                'text-[10px] capitalize',
                isOutbound ? 'text-primary-foreground/65' : 'text-muted-foreground',
              )}
            >
              {msg.senderRole}
            </span>
          ) : null}
          {isResolved ? (
            <Badge
              variant="outline"
              className="h-4 border-emerald-300 bg-emerald-50 px-1 text-[9px] text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
            >
              Resolved
            </Badge>
          ) : null}
        </div>

        <p
          className={cn(
            'whitespace-pre-wrap text-[13px] leading-snug',
            isInternal
              ? 'text-orange-950 dark:text-orange-50'
              : isOutbound
                ? 'text-primary-foreground'
                : 'text-foreground',
          )}
        >
          {isInternal ? <MentionContent content={msg.content} /> : msg.content}
        </p>

        <div
          className={cn(
            'mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] tabular-nums',
            isInternal
              ? 'text-orange-800/80 dark:text-orange-200/70'
              : isOutbound
                ? 'justify-end text-primary-foreground/70'
                : 'text-muted-foreground',
          )}
        >
          {latestSeen && !isOutbound ? <span>{relativeSeenLine(latestSeen)}</span> : null}
          <time dateTime={msg.createdAt.toISOString()} title={msg.createdAt.toLocaleString()}>
            {formatBubbleTime(msg.createdAt)}
          </time>
          {isOutbound && !isInternal ? <span>{seenByOther ? '· Read' : '· Sent'}</span> : null}
          {isUnreadFromClient ? (
            <span className="size-1.5 rounded-full bg-blue-500" aria-label="Unread message" />
          ) : null}
          {isInternal ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-auto h-6 w-6 opacity-70 hover:bg-orange-100 group-hover:opacity-100 dark:hover:bg-orange-900/40"
                >
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    startPendingNoteAction(async () => {
                      await escalateInternalThreadAction(ticketId, msg.id);
                      toast({ title: 'Issue escalated and supervisor notified.' });
                    })
                  }
                  disabled={pendingNoteAction}
                >
                  Escalate issue
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    startPendingNoteAction(async () => {
                      if (!nextStage) {
                        toast({ title: 'Ticket is already at final stage.' });
                        return;
                      }
                      if (!window.confirm(`Move ticket to ${nextStage.label}?`)) return;
                      await updateTicketStageAction(ticketId, nextStage.id, 'Moved from Preparer Notes');
                      toast({ title: `Moved to ${nextStage.label}` });
                    })
                  }
                  disabled={pendingNoteAction}
                >
                  Move to next stage
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    startPendingNoteAction(async () => {
                      await markInternalThreadResolvedAction(ticketId, msg.id);
                      toast({ title: 'Marked as resolved.' });
                    })
                  }
                  disabled={pendingNoteAction || isResolved}
                >
                  Mark as resolved
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    </div>
  );
}
