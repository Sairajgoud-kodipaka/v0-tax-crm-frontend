import { cn } from '@/lib/utils';

/** Level-1 tabs: black bar, black active borders, light text (overrides default TabsTrigger). */
export const ticketCasePrimaryTabsListClassName =
  'h-auto w-full flex-wrap justify-start gap-0 rounded-none border-b border-border bg-black p-0';

/** Filled black CTA — messages Send, Pay, organizer Save, staff actions (client / employee / admin ticket views). */
export const ticketCaseBlackCtaButtonClassName =
  '!bg-black !text-white hover:!bg-black/90 focus-visible:ring-black/30 dark:!bg-black dark:!text-white dark:hover:!bg-black/90';

export function ticketCasePrimaryTabTriggerClassName() {
  return cn(
    '!rounded-none !border !border-black !border-t-4 !border-t-transparent !border-b-2 !border-b-transparent px-4 py-3 text-sm font-medium !bg-black !text-white',
    'data-[state=active]:!border-t-black data-[state=active]:!border-b-black data-[state=active]:!bg-black data-[state=active]:!text-white data-[state=active]:shadow-none',
    'dark:data-[state=active]:!bg-black dark:data-[state=active]:!text-white',
  );
}
