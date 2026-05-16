'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';

import { ChatMessageThread } from '@/components/messages/chat-message-thread';
import { StaffChatBubble } from '@/components/messages/staff-chat-bubble';
import { StaffClientMessageComposer } from '@/components/messages/staff-client-message-composer';
import { StaffInternalNotesPanel } from '@/components/messages/staff-internal-notes-panel';
import {
  StaffTabbedMessagesDialog,
  type StaffMessagesTab,
} from '@/components/messages/staff-tabbed-messages-dialog';
import { TicketConversationPanel } from '@/components/messages/ticket-conversation-panel';
import {
  hasReadMessage,
  readReceiptLabel,
  type ThreadReadsMap,
} from '@/hooks/use-ticket-read-receipts';
import { displayTicketRef } from '@/lib/client-ui';
import { STAGE_NAVIGATION } from '@/lib/constants';
import type { hydrateTicket } from '@/lib/data/hydrate-ticket';
import type { Message, TicketActivity } from '@/lib/types';

type TicketHydrated = ReturnType<typeof hydrateTicket>;

export function StaffTicketMessaging({
  ticket,
  viewerUserId,
  viewerName,
  viewerRole,
  messagesOpen,
  onMessagesOpenChange,
  messagesTab,
  onMessagesTabChange,
  allMessages,
  historyActivities,
  reads,
  onlineOthers,
  typingHint,
  notifyTyping,
}: {
  ticket: TicketHydrated;
  viewerUserId: string;
  viewerName: string;
  viewerRole: 'admin' | 'employee';
  messagesOpen: boolean;
  onMessagesOpenChange: (open: boolean) => void;
  messagesTab: StaffMessagesTab;
  onMessagesTabChange: (tab: StaffMessagesTab) => void;
  allMessages: Message[];
  historyActivities: TicketActivity[];
  /** Shared with parent — one realtime subscription per ticket. */
  reads: ThreadReadsMap;
  onlineOthers: { id: string; name: string }[];
  typingHint: string | null;
  notifyTyping: () => void;
}) {
  const [internalBody, setInternalBody] = useState('');
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [pendingNoteAction, startPendingNoteAction] = useTransition();

  const ticketRef = displayTicketRef(ticket);
  const clientMessages = useMemo(() => allMessages.filter((m) => !m.isInternal), [allMessages]);
  const internalMessages = useMemo(() => allMessages.filter((m) => m.isInternal), [allMessages]);
  const messagesById = useMemo(() => new Map(allMessages.map((m) => [m.id, m])), [allMessages]);
  const latestSeenByUser = useMemo(() => {
    const map: Record<string, Date> = {};
    for (const m of allMessages) {
      map[m.senderId] = m.createdAt;
    }
    return map;
  }, [allMessages]);

  const preparerMentionCandidates = useMemo(() => {
    const options = new Map<string, { id: string; name: string }>();
    for (const m of internalMessages) {
      if (m.senderRole !== 'admin' && m.senderRole !== 'employee') continue;
      options.set(m.senderId, { id: m.senderId, name: m.senderName });
    }
    options.set(viewerUserId, { id: viewerUserId, name: viewerName });
    return Array.from(options.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [internalMessages, viewerName, viewerUserId]);

  const filteredMentionCandidates = useMemo(() => {
    if (!mentionQuery.trim()) return preparerMentionCandidates;
    const q = mentionQuery.trim().toLowerCase();
    return preparerMentionCandidates.filter((c) => c.name.toLowerCase().includes(q));
  }, [mentionQuery, preparerMentionCandidates]);

  const seenLabel = readReceiptLabel(clientMessages, viewerUserId, true, reads);

  const nextStage = useMemo(() => {
    const idx = STAGE_NAVIGATION.findIndex((s) => s.id === ticket.stage);
    if (idx < 0 || idx >= STAGE_NAVIGATION.length - 1) return null;
    return STAGE_NAVIGATION[idx + 1];
  }, [ticket.stage]);

  const handleInternalBodyChange = useCallback((value: string) => {
    setInternalBody(value);
    const mentionMatch = value.match(/@([a-zA-Z\s]*)$/);
    if (!mentionMatch) {
      setMentionOpen(false);
      setMentionQuery('');
      setMentionIndex(0);
      return;
    }
    setMentionOpen(true);
    setMentionQuery(mentionMatch[1] ?? '');
    setMentionIndex(0);
  }, []);

  const applyMention = useCallback(
    (name: string) => {
      const next = internalBody.replace(/@([a-zA-Z\s]*)$/, `@${name} `);
      setInternalBody(next);
      setMentionOpen(false);
      setMentionQuery('');
    },
    [internalBody],
  );

  const resetInternalComposer = useCallback(() => {
    setInternalBody('');
    setMentionOpen(false);
    setMentionQuery('');
  }, []);

  return (
    <StaffTabbedMessagesDialog
      open={messagesOpen}
      onOpenChange={onMessagesOpenChange}
      ticketRef={ticketRef}
      clientName={ticket.clientName}
      activeTab={messagesTab}
      onTabChange={onMessagesTabChange}
      internalNoteCount={internalMessages.length}
      clientPanel={
        <TicketConversationPanel
          className="border-t-0"
          status={
            <>
              {onlineOthers.length > 0 ? (
                <span>
                  <span className="font-medium text-foreground/85">Online</span> ·{' '}
                  {onlineOthers.map((o) => o.name).join(', ')}
                </span>
              ) : null}
              {typingHint ? <span className="text-foreground">{typingHint}</span> : null}
              {seenLabel ? <span>{seenLabel}</span> : null}
            </>
          }
          composer={<StaffClientMessageComposer ticketId={ticket.id} onTyping={notifyTyping} />}
        >
          <ChatMessageThread
            messages={clientMessages}
            emptyState={
              <p className="py-10 text-center text-[13px] text-muted-foreground">
                No client messages yet. Start the conversation below.
              </p>
            }
            renderMessage={(msg) => {
              const latestSeen = latestSeenByUser[msg.senderId];
              const isUnreadFromClient =
                msg.senderId === ticket.clientId && !hasReadMessage(msg, reads[viewerUserId], messagesById);
              const isOutbound = msg.senderId === viewerUserId;
              const seenByOther =
                isOutbound &&
                Object.keys(reads)
                  .filter((uid) => uid !== viewerUserId)
                  .some((uid) => hasReadMessage(msg, reads[uid], messagesById));
              return (
                <StaffChatBubble
                  msg={msg}
                  ticketId={ticket.id}
                  clientId={ticket.clientId}
                  viewerUserId={viewerUserId}
                  isOutbound={isOutbound}
                  isUnreadFromClient={isUnreadFromClient}
                  seenByOther={seenByOther}
                  latestSeen={latestSeen}
                  isResolved={false}
                  isInternal={false}
                  nextStage={nextStage}
                  pendingNoteAction={pendingNoteAction}
                  startPendingNoteAction={startPendingNoteAction}
                />
              );
            }}
          />
        </TicketConversationPanel>
      }
      internalPanel={
        <StaffInternalNotesPanel
          ticketId={ticket.id}
          clientId={ticket.clientId}
          viewerUserId={viewerUserId}
          internalMessages={internalMessages}
          latestSeenByUser={latestSeenByUser}
          historyActivities={historyActivities}
          nextStage={nextStage}
          pendingNoteAction={pendingNoteAction}
          startPendingNoteAction={startPendingNoteAction}
          internalBody={internalBody}
          onInternalBodyChange={handleInternalBodyChange}
          mentionOpen={mentionOpen}
          mentionIndex={mentionIndex}
          filteredMentionCandidates={filteredMentionCandidates}
          onMentionSelect={applyMention}
          onMentionIndexChange={setMentionIndex}
          onMentionClose={() => setMentionOpen(false)}
          onSent={resetInternalComposer}
        />
      }
    />
  );
}
