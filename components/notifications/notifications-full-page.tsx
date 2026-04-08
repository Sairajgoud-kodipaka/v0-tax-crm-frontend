'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { UserRole } from '@/lib/types';
import { formatNotificationTime } from '@/lib/format-notification-time';
import { markNotificationReadAction } from '@/app/actions/notifications';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { NotificationRow } from '@/components/notifications/notification-bell';

function ticketPath(role: UserRole, ticketId: string): string {
  if (role === 'client') return `/client/cases/${ticketId}`;
  if (role === 'admin') return `/admin/tickets/${ticketId}`;
  return `/employee/tickets/${ticketId}`;
}

type FilterTab = 'all' | 'unread' | 'read';

export function NotificationsFullPage({ userId, role }: { userId: string; role: UserRole }) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('notifications')
      .select('id, ticket_id, title, body, is_read, created_at')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(200);
    if (!error && data) setItems(data as NotificationRow[]);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications-page:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as NotificationRow;
          setItems((prev) => {
            if (prev.some((p) => p.id === row.id)) return prev;
            return [row, ...prev];
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const filtered = useMemo(() => {
    if (filter === 'unread') return items.filter((n) => !n.is_read);
    if (filter === 'read') return items.filter((n) => n.is_read);
    return items;
  }, [items, filter]);

  const onRowClick = (n: NotificationRow) => {
    startTransition(async () => {
      if (!n.is_read) {
        await markNotificationReadAction(n.id);
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      }
      if (n.ticket_id) router.push(ticketPath(role, n.ticket_id));
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">All notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">Updates on your cases and account activity.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-3">
        {(['all', 'unread', 'read'] as const).map((key) => (
          <Button
            key={key}
            type="button"
            variant={filter === key ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 rounded-full px-3 text-xs capitalize"
            onClick={() => setFilter(key)}
          >
            {key}
          </Button>
        ))}
      </div>

      <ul className="space-y-0 divide-y rounded-xl border bg-card">
        {filtered.length === 0 ? (
          <li className="px-4 py-12 text-center text-sm text-muted-foreground">No notifications in this view.</li>
        ) : (
          filtered.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() => onRowClick(n)}
                className={cn(
                  'flex w-full gap-3 px-4 py-4 text-left text-sm transition-colors hover:bg-accent/50',
                  !n.is_read ? 'bg-muted/40' : 'bg-card',
                )}
              >
                <span
                  className={cn(
                    'mt-1.5 size-2 shrink-0 rounded-full',
                    n.is_read ? 'bg-transparent' : 'bg-primary',
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="font-medium text-foreground">{n.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {[n.body?.trim(), formatNotificationTime(n.created_at)].filter(Boolean).join(' · ')}
                  </span>
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
