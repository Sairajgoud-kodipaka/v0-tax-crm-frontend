'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { markTicketThreadReadAction } from '@/app/actions/thread-reads';
import type { Message } from '@/lib/types';

export type ThreadReadsMap = Record<string, string | null>;

function messageMap(messages: Message[]): Map<string, Message> {
  return new Map(messages.map((m) => [m.id, m]));
}

/** True if reader's cursor includes `msg` (by time order in thread). */
export function hasReadMessage(
  msg: Message,
  readerLastReadMessageId: string | null | undefined,
  byId: Map<string, Message>,
): boolean {
  if (!readerLastReadMessageId) return false;
  const cursor = byId.get(readerLastReadMessageId);
  if (!cursor) return false;
  return cursor.createdAt.getTime() >= msg.createdAt.getTime();
}

/** Last message from viewer meant for the other party (no internal notes for cross-party read). */
export function lastOutboundForReadReceipt(
  messages: Message[],
  viewerId: string,
  viewerIsStaff: boolean,
): Message | undefined {
  const filtered = messages.filter((m) => {
    if (m.senderId !== viewerId) return false;
    if (viewerIsStaff && m.isInternal) return false;
    return true;
  });
  if (filtered.length === 0) return undefined;
  return filtered.reduce((a, b) => (a.createdAt.getTime() >= b.createdAt.getTime() ? a : b));
}

export function useTicketReadReceipts(
  ticketId: string,
  messages: Message[],
  viewerId: string,
): ThreadReadsMap {
  const [reads, setReads] = useState<ThreadReadsMap>({});

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    void supabase
      .from('ticket_thread_reads')
      .select('user_id, last_read_message_id')
      .eq('ticket_id', ticketId)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const next: ThreadReadsMap = {};
        for (const row of data as { user_id: string; last_read_message_id: string | null }[]) {
          next[row.user_id] = row.last_read_message_id;
        }
        setReads(next);
      });

    const channel = supabase
      .channel(`ticket-thread-reads:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_thread_reads',
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          const row = payload.new as { user_id?: string; last_read_message_id?: string | null } | undefined;
          if (!row?.user_id) return;
          setReads((prev) => ({
            ...prev,
            [row.user_id!]: row.last_read_message_id ?? null,
          }));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [ticketId]);

  const sig = useMemo(() => messages.map((m) => m.id).join(','), [messages]);

  useEffect(() => {
    if (!ticketId || !messages.length) return;
    void markTicketThreadReadAction(ticketId);
  }, [ticketId, sig, viewerId]);

  return reads;
}

export function readReceiptLabel(
  messages: Message[],
  viewerId: string,
  viewerIsStaff: boolean,
  reads: ThreadReadsMap,
): string | null {
  const outbound = lastOutboundForReadReceipt(messages, viewerId, viewerIsStaff);
  if (!outbound) return null;
  const byId = messageMap(messages);
  const otherUserIds = Object.keys(reads).filter((uid) => uid !== viewerId);
  const seenBy: string[] = [];
  for (const uid of otherUserIds) {
    if (hasReadMessage(outbound, reads[uid], byId)) {
      const nameFromThread =
        messages.find((m) => m.senderId === uid)?.senderName?.trim() || 'Someone';
      if (!seenBy.includes(nameFromThread)) seenBy.push(nameFromThread);
    }
  }
  if (seenBy.length === 0) return null;
  return `Seen · ${seenBy.join(', ')}`;
}
