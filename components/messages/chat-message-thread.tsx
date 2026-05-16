'use client';

import { Fragment, type ReactNode } from 'react';

import { ChatDateSeparator } from '@/components/messages/chat-date-separator';
import { getChatDayKey } from '@/lib/message-ui';

type DatedMessage = { id: string; createdAt: Date };

export function ChatMessageThread<T extends DatedMessage>({
  messages,
  renderMessage,
  emptyState,
}: {
  messages: T[];
  renderMessage: (message: T) => ReactNode;
  emptyState?: ReactNode;
}) {
  if (messages.length === 0) return emptyState ?? null;

  let lastDayKey: string | null = null;

  return messages.map((msg) => {
    const dayKey = getChatDayKey(msg.createdAt);
    const showDay = dayKey !== lastDayKey;
    lastDayKey = dayKey;

    return (
      <Fragment key={msg.id}>
        {showDay ? <ChatDateSeparator date={msg.createdAt} /> : null}
        {renderMessage(msg)}
      </Fragment>
    );
  });
}
