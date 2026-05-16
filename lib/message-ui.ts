import { format, isToday, isYesterday } from 'date-fns';

/** Compact timestamp for chat bubbles. */
export function formatMessageTime(date: Date): string {
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`;
  return format(date, 'MMM d, h:mm a');
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
