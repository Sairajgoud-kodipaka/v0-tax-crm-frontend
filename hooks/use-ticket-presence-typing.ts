'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { removeSupabaseChannelByName } from '@/lib/supabase-realtime';
import type { UserRole } from '@/lib/types';

export type TicketPresenceTypingState = {
  onlineOthers: { id: string; name: string }[];
  typingHint: string | null;
  clientCurrentTab: string | null;
  clientOnline: boolean;
  notifyTyping: () => void;
};

type OnlinePeer = { id: string; name: string };

/**
 * Realtime Presence (who is viewing the thread) + Broadcast typing indicators.
 */
export function useTicketPresenceTyping(
  ticketId: string,
  viewerId: string,
  viewerName: string,
  viewerRole?: UserRole,
  currentTab?: string,
  clientUserId?: string,
) {
  const [onlineOthers, setOnlineOthers] = useState<OnlinePeer[]>([]);
  const [typingHint, setTypingHint] = useState<string | null>(null);
  const [clientCurrentTab, setClientCurrentTab] = useState<string | null>(null);
  const [clientOnline, setClientOnline] = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null); // RealtimeChannel
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);
  const currentTabRef = useRef(currentTab);
  currentTabRef.current = currentTab;

  useEffect(() => {
    if (!ticketId || !viewerId) return;

    const supabase = createClient();
    const channelName = `thread-presence:${ticketId}`;
    removeSupabaseChannelByName(supabase, channelName);

    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: viewerId },
        broadcast: { self: true },
      },
    });

    channelRef.current = channel;

    /** Supabase emits `sync` on full state; `join`/`leave` when peers update — all must refresh UI in real time. */
    const applyPresenceState = () => {
      const state = channel.presenceState() as Record<
        string,
        Array<{ user_id?: string; name?: string; role?: UserRole; current_tab?: string; presence_ref?: string }>
      >;
      const peers: OnlinePeer[] = [];
      const seen = new Set<string>();
      let currentClientTab: string | null = null;
      let hasClientOnline = false;
      let latestClientOnlineAt = 0;
      for (const key of Object.keys(state)) {
        const metas = state[key];
        for (const meta of metas ?? []) {
          const uid = meta.user_id ?? key;
          const normalizedRole = `${meta.role ?? ''}`.trim().toLowerCase();
          const isClientPresence = (clientUserId ? uid === clientUserId : false) || normalizedRole === 'client';
          if (isClientPresence) {
            hasClientOnline = true;
          }
          const currentView = ((meta as { current_page?: string }).current_page ?? meta.current_tab) || null;
          if (isClientPresence && currentView) {
            const onlineAtValue = `${(meta as { online_at?: string }).online_at ?? ''}`;
            const onlineAtMs = onlineAtValue ? new Date(onlineAtValue).getTime() : 0;
            if (onlineAtMs >= latestClientOnlineAt) {
              latestClientOnlineAt = onlineAtMs;
              currentClientTab = currentView;
            }
          }
          if (uid === viewerId || seen.has(uid)) continue;
          seen.add(uid);
          peers.push({ id: uid, name: meta.name?.trim() || 'Teammate' });
        }
      }
      setOnlineOthers(peers);
      setClientCurrentTab(currentClientTab);
      setClientOnline(hasClientOnline);
    };

    channel
      .on('presence', { event: 'sync' }, applyPresenceState)
      .on('presence', { event: 'join' }, applyPresenceState)
      .on('presence', { event: 'leave' }, applyPresenceState)
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
          const tab = currentTabRef.current;
          await channel.track({
            user_id: viewerId,
            name: viewerName,
            role: viewerRole,
            current_tab: tab,
            current_page: tab,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // Do not depend on `currentTab` here — tab changes only update via `track()` below.
    // Including it was tearing down the channel on every tab switch and breaking live updates for others.
  }, [ticketId, viewerId, viewerName, viewerRole, clientUserId]);

  useEffect(() => {
    const channel = channelRef.current;
    if (!channel || !viewerId) return;
    const tab = currentTabRef.current;
    void channel.track({
      user_id: viewerId,
      name: viewerName,
      role: viewerRole,
      current_tab: tab,
      current_page: tab,
      online_at: new Date().toISOString(),
    });
  }, [viewerId, viewerName, viewerRole, currentTab]);

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

  return { onlineOthers, typingHint, clientCurrentTab, clientOnline, notifyTyping };
}
