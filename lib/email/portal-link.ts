import type { UserRole } from '@/lib/types';

export function buildNotificationEmailPortalUrl(ticketId: string | null, role: UserRole): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  if (!ticketId) {
    if (role === 'client') return `${base}/client/notifications`;
    if (role === 'admin') return `${base}/admin/notifications`;
    return `${base}/employee/notifications`;
  }
  if (role === 'client') return `${base}/client/cases/${ticketId}`;
  if (role === 'admin') return `${base}/admin/tickets/${ticketId}`;
  return `${base}/employee/tickets/${ticketId}`;
}
