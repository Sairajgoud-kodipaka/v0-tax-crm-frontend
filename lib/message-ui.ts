import { format, isSameWeek, isSameYear, isToday, isYesterday } from 'date-fns';

/** Stable key for grouping messages by calendar day. */
export function getChatDayKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** WhatsApp-style day pill between message groups. */
export function formatChatDayLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isSameWeek(date, new Date(), { weekStartsOn: 0 })) return format(date, 'EEEE');
  if (isSameYear(date, new Date())) return format(date, 'MMMM d');
  return format(date, 'MMMM d, yyyy');
}

/** Time only on each bubble (WhatsApp-style). */
export function formatBubbleTime(date: Date): string {
  return format(date, 'h:mm a');
}

/** @deprecated Use formatBubbleTime for bubbles and formatChatDayLabel for day separators. */
export function formatMessageTime(date: Date): string {
  return formatBubbleTime(date);
}

export function relativeSeenLine(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const min = 60_000;
  const hr = 60 * min;
  if (diffMs < min) return 'Active just now';
  if (diffMs < hr) return `Active ${Math.max(1, Math.round(diffMs / min))}m ago`;
  if (diffMs < 24 * hr) return `Active ${Math.max(1, Math.round(diffMs / hr))}h ago`;
  return `Active ${format(date, 'MMM d')}`;
}
