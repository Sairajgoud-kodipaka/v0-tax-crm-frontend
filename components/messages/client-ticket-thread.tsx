'use client';

import { ChatMessageThread } from '@/components/messages/chat-message-thread';
import { ClientChatBubble } from '@/components/messages/client-chat-bubble';
import { ClientMessageComposer } from '@/components/messages/client-message-composer';
import { TicketConversationPanel } from '@/components/messages/ticket-conversation-panel';
import type { Message, UserRole } from '@/lib/types';

export type ClientThreadMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  body: string;
  createdAt: string;
};

export function ClientTicketThread({
  ticketId,
  viewerUserId,
  messages,
}: {
  ticketId: string;
  viewerUserId: string;
  messages: ClientThreadMessage[];
}) {
  const mapped: Message[] = messages.map((m) => ({
    id: m.id,
    ticketId,
    senderId: m.senderId,
    senderName: m.senderName,
    senderRole: m.senderRole,
    content: m.body,
    createdAt: new Date(m.createdAt),
    isInternal: false,
  }));

  return (
    <TicketConversationPanel composer={<ClientMessageComposer ticketId={ticketId} />}>
      <ChatMessageThread
        messages={mapped}
        emptyState={
          <p className="py-10 text-center text-[13px] text-muted-foreground">
            No messages yet. Start the conversation.
          </p>
        }
        renderMessage={(msg) => (
          <ClientChatBubble msg={msg} isOutbound={msg.senderId === viewerUserId} />
        )}
      />
    </TicketConversationPanel>
  );
}
