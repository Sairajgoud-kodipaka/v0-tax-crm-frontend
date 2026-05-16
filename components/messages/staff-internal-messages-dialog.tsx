'use client';

import type { Message, TicketStage, TicketActivity } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessageThread } from '@/components/messages/chat-message-thread';
import { StaffChatBubble } from '@/components/messages/staff-chat-bubble';
import { StaffInternalMessageComposer } from '@/components/messages/staff-internal-message-composer';

export function StaffInternalMessagesDialog({
  open,
  onOpenChange,
  ticketId,
  clientId,
  viewerUserId,
  internalMessages,
  latestSeenByUser,
  historyActivities,
  nextStage,
  pendingNoteAction,
  startPendingNoteAction,
  internalBody,
  onInternalBodyChange,
  mentionOpen,
  mentionIndex,
  filteredMentionCandidates,
  onMentionSelect,
  onMentionIndexChange,
  onMentionClose,
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  clientId: string;
  viewerUserId: string;
  internalMessages: Message[];
  latestSeenByUser: Record<string, Date>;
  historyActivities: TicketActivity[];
  nextStage: { id: TicketStage; label: string } | null;
  pendingNoteAction: boolean;
  startPendingNoteAction: (fn: () => Promise<void>) => void;
  internalBody: string;
  onInternalBodyChange: (value: string) => void;
  mentionOpen: boolean;
  mentionIndex: number;
  filteredMentionCandidates: { id: string; name: string }[];
  onMentionSelect: (name: string) => void;
  onMentionIndexChange: (index: number) => void;
  onMentionClose: () => void;
  onSent?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-slate-950/45 backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/35"
        className="flex max-h-[min(88vh,820px)] w-[calc(100%-1.5rem)] max-w-3xl flex-col gap-0 overflow-hidden rounded-xl border-orange-200/40 p-0 shadow-2xl sm:w-full"
      >
        <DialogHeader className="shrink-0 border-b border-orange-200/60 bg-gradient-to-r from-orange-50/95 via-orange-50/80 to-amber-50/90 px-5 py-4 dark:border-orange-900/50 dark:from-orange-950/60 dark:via-orange-950/40 dark:to-amber-950/30">
          <DialogTitle className="text-lg font-semibold text-orange-950 dark:text-orange-50">
            Internal team notes
          </DialogTitle>
          <DialogDescription className="text-sm text-orange-900/75 dark:text-orange-200/75">
            Private to staff — the client never sees this conversation.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-[min(52vh,480px)] flex-1 px-4 py-4">
          <ChatMessageThread
            messages={internalMessages}
            emptyState={
              <p className="py-16 text-center text-sm text-muted-foreground">
                No internal notes yet. Use the box below to @mention teammates or log prep notes.
              </p>
            }
            renderMessage={(msg) => {
              const latestSeen = latestSeenByUser[msg.senderId];
              const isOutbound = msg.senderId === viewerUserId;
              const isResolved = historyActivities.some(
                (activity) =>
                  activity.actionDetails?.resolved === true &&
                  `${activity.actionDetails?.resolved_message_id ?? ''}` === msg.id,
              );
              return (
                <StaffChatBubble
                  msg={msg}
                  ticketId={ticketId}
                  clientId={clientId}
                  viewerUserId={viewerUserId}
                  isOutbound={isOutbound}
                  isUnreadFromClient={false}
                  seenByOther={false}
                  latestSeen={latestSeen}
                  isResolved={isResolved}
                  isInternal
                  nextStage={nextStage}
                  pendingNoteAction={pendingNoteAction}
                  startPendingNoteAction={startPendingNoteAction}
                />
              );
            }}
          />
        </ScrollArea>

        <div className="shrink-0 border-t border-orange-200/50 bg-orange-50/20 px-4 pb-4 pt-2 dark:border-orange-900/40 dark:bg-orange-950/15">
          <StaffInternalMessageComposer
            ticketId={ticketId}
            internalBody={internalBody}
            onInternalBodyChange={onInternalBodyChange}
            mentionOpen={mentionOpen}
            mentionIndex={mentionIndex}
            filteredMentionCandidates={filteredMentionCandidates}
            onMentionSelect={onMentionSelect}
            onMentionIndexChange={onMentionIndexChange}
            onMentionClose={onMentionClose}
            onSent={onSent}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
