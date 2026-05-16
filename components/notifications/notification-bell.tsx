'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import type { UserRole } from '@/lib/types';
import { formatNotificationTime } from '@/lib/format-notification-time';
import { markAllNotificationsReadAction, markNotificationReadAction } from '@/app/actions/notifications';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NavigationLoadingOverlay } from '@/components/ui/navigation-loading-overlay';
import { useNotificationNavigation } from '@/hooks/use-notification-navigation';
import { cn } from '@/lib/utils';

export type NotificationRow = {
  id: string;
  ticket_id: string | null;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
};

function ticketPath(role: UserRole, ticketId: string): string {
  if (role === 'client') return `/client/cases/${ticketId}`;
  if (role === 'admin') return `/admin/tickets/${ticketId}`;
  return `/employee/tickets/${ticketId}`;
}

function ticketPathForNotification(role: UserRole, notification: NotificationRow): string {
  if (!notification.ticket_id) return notificationsListPath(role);
  const base = ticketPath(role, notification.ticket_id);
  return `${base}?tab=messages`;
}

function notificationsListPath(role: UserRole): string {
  if (role === 'client') return '/client/notifications';
  if (role === 'admin') return '/admin/notifications';
  return '/employee/notifications';
}

export function NotificationBell({ userId, role }: { userId: string; role: UserRole }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [markAllPending, startMarkAllTransition] = useTransition();
  const { isNavigating, navigate } = useNotificationNavigation();
  const listHref = notificationsListPath(role);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('notifications')
      .select('id, ticket_id, title, body, is_read, created_at')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
    if (!error && data) setItems(data as NotificationRow[]);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
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

  const unreadCount = useMemo(() => items.filter((n) => !n.is_read).length, [items]);
  const preview = useMemo(() => items.slice(0, 5), [items]);

  const handleOpenChange = (next: boolean) => {
    if (isNavigating) return;
    setOpen(next);
    if (next) void load();
  };

  const onMarkAllRead = () => {
    startMarkAllTransition(async () => {
      await markAllNotificationsReadAction();
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      router.refresh();
    });
  };

  const onRowClick = (n: NotificationRow) => {
    if (isNavigating || !n.ticket_id) return;
    const href = ticketPathForNotification(role, n);
    setOpen(false);
    void navigate(href, async () => {
      if (!n.is_read) {
        await markNotificationReadAction(n.id);
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      }
    });
  };

  const onViewAll = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isNavigating) return;
    setOpen(false);
    void navigate(listHref);
  };

  return (
    <>
      <NavigationLoadingOverlay active={isNavigating} message="Opening notification…" />
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative size-9 shrink-0 rounded-sm text-muted-foreground hover:text-foreground"
            aria-label="Notifications"
            disabled={isNavigating}
          >
            <Bell className="size-[20px] stroke-[1.75]" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-sm bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[min(100vw-2rem,22rem)] p-0 shadow-lg" sideOffset={8}>
          <div className="flex items-center justify-between border-b px-3 py-2.5">
            <span className="text-sm font-semibold">Notifications</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              disabled={markAllPending || unreadCount === 0 || isNavigating}
              onClick={() => onMarkAllRead()}
            >
              Mark all read
            </Button>
          </div>
          <div className="relative max-h-[min(70vh,24rem)] overflow-y-auto">
            {isNavigating && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
                <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
                <span className="sr-only">Loading</span>
              </div>
            )}
            {preview.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications yet</p>
            ) : (
              <ul className="divide-y">
                {preview.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      disabled={isNavigating}
                      onClick={() => onRowClick(n)}
                      className={cn(
                        'flex w-full gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent/60 disabled:pointer-events-none disabled:opacity-60',
                        !n.is_read ? 'bg-muted/50' : 'bg-background',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-1.5 size-2 shrink-0 rounded-sm',
                          n.is_read ? 'bg-transparent' : 'bg-primary',
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 font-medium leading-snug text-foreground">{n.title}</span>
                        <span className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {[n.body?.trim(), formatNotificationTime(n.created_at)].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t px-2 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-full text-sm"
              disabled={isNavigating}
              onClick={onViewAll}
            >
              View all notifications
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
