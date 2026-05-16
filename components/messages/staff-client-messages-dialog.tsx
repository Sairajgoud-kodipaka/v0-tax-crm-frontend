'use client';

import type { ReactNode } from 'react';

import { StaffInternalNotesButton } from '@/components/messages/staff-internal-notes-button';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function StaffClientMessagesDialog({
  open,
  onOpenChange,
  ticketRef,
  clientName,
  internalNoteCount = 0,
  onOpenInternalNotes,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketRef?: string;
  clientName?: string;
  internalNoteCount?: number;
  onOpenInternalNotes?: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-slate-950/45 backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/35"
        className="flex max-h-[min(88vh,820px)] w-[calc(100%-1.5rem)] max-w-3xl flex-col gap-0 overflow-hidden rounded-xl border-border/80 p-0 shadow-2xl sm:w-full"
      >
        <DialogHeader className="shrink-0 space-y-0 border-b border-border/80 bg-muted/30 px-5 py-4">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="min-w-0 space-y-1">
              <DialogTitle className="text-lg font-semibold">Client messages</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {clientName ? `Thread with ${clientName}` : 'Client conversation'}
                {ticketRef ? ` · Ticket #${ticketRef}` : ''}
              </DialogDescription>
            </div>
            {onOpenInternalNotes ? (
              <StaffInternalNotesButton count={internalNoteCount} onOpen={onOpenInternalNotes} />
            ) : null}
          </div>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
