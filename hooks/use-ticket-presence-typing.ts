'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

type OnlinePeer = { id: string; name: string };

/**
 * Realtime Presence (who is viewing the thread) + Broadcast typing indicators.
 */
export function useTicketPresenceTyping(ticketId: string, viewerId: string, viewerName: string) {
  const [onlineOthers, setOnlineOthers] = useState<OnlinePeer[]>([]);
  const [typingHint, setTypingHint] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null); // RealtimeChannel
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);

  useEffect(() => {
    if (!ticketId || !viewerId) return;

    const supabase = createClient();
    const channel = supabase.channel(`thread-presence:${ticketId}`, {
      config: {
        presence: { key: viewerId },
        broadcast: { self: true },
      },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as Record<
          string,
          Array<{ user_id?: string; name?: string; presence_ref?: string }>
        >;
        const peers: OnlinePeer[] = [];
        const seen = new Set<string>();
        for (const key of Object.keys(state)) {
          const metas = state[key];
          for (const meta of metas ?? []) {
            const uid = meta.user_id ?? key;
            if (uid === viewerId || seen.has(uid)) continue;
            seen.add(uid);
            peers.push({ id: uid, name: meta.name?.trim() || 'Teammate' });
          }
        }
        setOnlineOthers(peers);
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const p = payload as { userId?: string; name?: string } | undefined;
        if (!p || p.userId === viewerId) return;
        if (typingClearRef.current) clearTimeout(typingClearRef.current);
        const label = p.name?.trim() ? `${p.name.trim()} is typing…` : 'Someone is typing…';
        setTypingHint(label);
        typingClearRef.current = setTimeout(() => {
          typingClearRef.current = null;
          setTypingHint(null);
        }, 2800);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: viewerId,
            name: viewerName,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [ticketId, viewerId, viewerName]);

  const notifyTyping = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 900) return;
    lastTypingSentRef.current = now;
    void channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: viewerId, name: viewerName },
    });
  }, [viewerId, viewerName]);

  return { onlineOthers, typingHint, notifyTyping };
}
