'use client';

import { useAppStore } from '@/lib/store';
import { UnreadBadge } from '@/components/ui/unread-badge';

export function TicketUnreadDot({ ticketId }: { ticketId: string }) {
  const unread = useAppStore((s) => s.unreadTickets[ticketId]?.unread ?? false);
  if (!unread) return null;
  return <UnreadBadge count={1} className="h-3 min-w-3 border-0 bg-red-500 p-0" />;
}
