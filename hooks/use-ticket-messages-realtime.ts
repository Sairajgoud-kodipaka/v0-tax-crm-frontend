'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { mapMessageRow } from '@/lib/data/map-ticket';
import type { Message } from '@/lib/types';

function messageListSignature(messages: Message[]): string {
  return [...messages]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((m) => m.id)
    .join(',');
}

/**
 * Solution 1 — merge new rows from Realtime INSERT into local state (no full-page refresh for the thread).
 * Uses `sender_display_name` / `sender_role` from DB (trigger) so clients never need to read staff profiles.
 */
export function useTicketMessagesRealtime(
  ticketId: string,
  initial: Message[],
  options: { hideInternal: boolean },
): Message[] {
  const { hideInternal } = options;
  const [messages, setMessages] = useState<Message[]>(initial);
  const sig = useMemo(() => messageListSignature(initial), [initial]);

  useEffect(() => {
    setMessages(initial);
  }, [ticketId, sig, initial]);

  useEffect(() => {
    if (!ticketId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`ticket-messages-merge:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          const raw = payload.new as {
            id: string;
            ticket_id: string;
            sender_id: string;
            body: string;
            is_internal: boolean;
            created_at: string;
            sender_display_name?: string | null;
            sender_role?: string | null;
          };
          if (hideInternal && raw.is_internal) return;

          const msg = mapMessageRow({
            id: raw.id,
            ticket_id: raw.ticket_id,
            sender_id: raw.sender_id,
            body: raw.body,
            is_internal: raw.is_internal,
            created_at: raw.created_at,
            sender_display_name: raw.sender_display_name ?? null,
            sender_role: raw.sender_role ?? null,
          });

          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [ticketId, hideInternal]);

  return messages;
}
