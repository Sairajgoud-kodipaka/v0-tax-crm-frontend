import { cn } from '@/lib/utils';

/** Styled native `<select>` trigger (OS dropdown panel is not themeable). Prefer `FormSelect` when possible. */
export const nativeSelectClassName = cn(
  'flex h-9 w-full min-w-0 rounded-sm border border-border bg-input px-3 py-1 text-sm text-foreground shadow-xs',
  'outline-none transition-[color,box-shadow]',
  'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  'dark:border-border dark:bg-input/30',
);

export const YES_NO_OPTIONS = [
  { value: 'no', label: 'No' },
  { value: 'yes', label: 'Yes' },
] as const;
