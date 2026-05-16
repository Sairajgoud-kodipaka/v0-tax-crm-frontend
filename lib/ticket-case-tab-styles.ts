import { cn } from '@/lib/utils';

/** Level-1 case tabs — muted bar with primary active indicator. */
export const ticketCasePrimaryTabsListClassName =
  'h-auto w-full flex-wrap justify-start gap-0 rounded-none border-b border-border bg-muted/40 p-0';

/** Primary CTA — messages Send, Pay, organizer Save, staff actions (client / employee / admin ticket views). */
export const ticketCaseBlackCtaButtonClassName =
  '!bg-primary !text-primary-foreground hover:!bg-primary/90 focus-visible:ring-primary/30';

export function ticketCasePrimaryTabTriggerClassName() {
  return cn(
    '!rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium !bg-transparent text-muted-foreground shadow-none',
    'hover:bg-background/60 hover:text-foreground',
    'data-[state=active]:!border-b-primary data-[state=active]:!bg-background data-[state=active]:!text-primary data-[state=active]:font-semibold',
  );
}
