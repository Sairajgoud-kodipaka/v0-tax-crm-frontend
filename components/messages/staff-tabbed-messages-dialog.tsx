'use client';

import type { ReactNode } from 'react';
import { Lock, MessageCircle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export type StaffMessagesTab = 'client' | 'internal';

export function StaffTabbedMessagesDialog({
  open,
  onOpenChange,
  ticketRef,
  clientName,
  activeTab,
  onTabChange,
  internalNoteCount = 0,
  clientPanel,
  internalPanel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketRef?: string;
  clientName?: string;
  activeTab: StaffMessagesTab;
  onTabChange: (tab: StaffMessagesTab) => void;
  internalNoteCount?: number;
  clientPanel: ReactNode;
  internalPanel: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent
          overlayClassName="bg-slate-950/45 backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/35"
          className="flex max-h-[min(88vh,820px)] w-[calc(100%-1.5rem)] max-w-3xl flex-col gap-0 overflow-hidden rounded-xl border-border/80 p-0 shadow-2xl sm:w-full"
        >
          <Tabs
          value={activeTab}
          onValueChange={(v) => onTabChange(v as StaffMessagesTab)}
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <DialogHeader className="shrink-0 space-y-3 border-b border-border/80 bg-muted/30 px-5 pb-4 pt-4">
            <div className="space-y-1 pr-8">
              <DialogTitle className="text-lg font-semibold">Messages</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {ticketRef ? `Conversation for ticket #${ticketRef}` : 'Ticket conversation'}
                {clientName ? ` · ${clientName}` : ''}
              </DialogDescription>
            </div>
            <TabsList className="grid h-10 w-full grid-cols-2 rounded-md bg-muted/80 p-1">
              <TabsTrigger
                value="client"
                className="gap-1.5 rounded-sm text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <MessageCircle className="size-3.5 shrink-0" />
                Client chat
              </TabsTrigger>
              <TabsTrigger
                value="internal"
                className={cn(
                  'gap-1.5 rounded-sm text-xs sm:text-sm',
                  'data-[state=active]:border data-[state=active]:border-orange-200/80',
                  'data-[state=active]:bg-orange-50 data-[state=active]:text-orange-950 data-[state=active]:shadow-sm',
                  'dark:data-[state=active]:border-orange-800/60 dark:data-[state=active]:bg-orange-950/50 dark:data-[state=active]:text-orange-50',
                )}
              >
                <Lock className="size-3.5 shrink-0" />
                Internal notes
                {internalNoteCount > 0 ? (
                  <span className="ml-0.5 rounded-sm bg-orange-600 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white">
                    {internalNoteCount > 99 ? '99+' : internalNoteCount}
                  </span>
                ) : null}
              </TabsTrigger>
            </TabsList>
          </DialogHeader>

          <TabsContent value="client" className="mt-0 flex min-h-0 flex-1 flex-col">
            {clientPanel}
          </TabsContent>
          <TabsContent value="internal" className="mt-0 flex min-h-0 flex-1 flex-col">
            {internalPanel}
          </TabsContent>
        </Tabs>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
