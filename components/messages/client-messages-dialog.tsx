'use client';

import type { ReactNode } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function ClientMessagesDialog({
  open,
  onOpenChange,
  ticketRef,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketRef?: string;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent
          overlayClassName="bg-slate-950/45 backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/35"
          className="flex max-h-[min(88vh,820px)] w-[calc(100%-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-xl border-border/80 p-0 shadow-2xl sm:w-full"
        >
          <DialogHeader className="shrink-0 border-b border-border/80 bg-muted/30 px-5 py-4">
            <DialogTitle className="text-lg font-semibold">Messages</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {ticketRef ? `Conversation for ticket #${ticketRef}` : 'Chat with your tax team'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
