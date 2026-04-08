import { format, formatDistanceToNow, isAfter, isToday, isYesterday, subDays } from 'date-fns';

/** Relative copy for notification UI: today → "2 minutes ago", yesterday → "Yesterday", within 7 days → relative, else full date. */
export function formatNotificationTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  if (isYesterday(d)) return 'Yesterday';
  if (isToday(d)) return formatDistanceToNow(d, { addSuffix: true });
  const weekAgo = subDays(new Date(), 7);
  if (isAfter(d, weekAgo)) return formatDistanceToNow(d, { addSuffix: true });
  return format(d, 'MMMM d, yyyy · h:mm a');
}
