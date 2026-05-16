'use client';

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
      {mapped.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-muted-foreground">
          No messages yet. Start the conversation.
        </p>
      ) : (
        mapped.map((msg) => (
          <ClientChatBubble key={msg.id} msg={msg} isOutbound={msg.senderId === viewerUserId} />
        ))
      )}
    </TicketConversationPanel>
  );
}
