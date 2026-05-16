'use client';

import type { Message, TicketActivity, TicketStage } from '@/lib/types';

import { ChatMessageThread } from '@/components/messages/chat-message-thread';
import { StaffChatBubble } from '@/components/messages/staff-chat-bubble';
import { StaffInternalMessageComposer } from '@/components/messages/staff-internal-message-composer';
import { ScrollArea } from '@/components/ui/scroll-area';

export function StaffInternalNotesPanel({
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
    <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-orange-50/30 to-background dark:from-orange-950/20">
      <ScrollArea className="min-h-[min(48vh,420px)] flex-1 px-3 py-3">
        <ChatMessageThread
          messages={internalMessages}
          emptyState={
            <p className="py-14 text-center text-[13px] text-muted-foreground">
              No internal notes yet. @mention teammates or log prep notes below — the client never sees this.
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
      <div className="shrink-0 border-t border-orange-200/60 bg-orange-50/40 px-3 pb-3 pt-2 dark:border-orange-900/50 dark:bg-orange-950/25">
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
    </div>
  );
}
