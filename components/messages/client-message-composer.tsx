'use client';

import { Send } from 'lucide-react';

import { sendClientMessageFormAction } from '@/app/actions/forms';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ticketCaseBlackCtaButtonClassName } from '@/lib/ticket-case-tab-styles';
import { cn } from '@/lib/utils';

export function ClientMessageComposer({
  ticketId,
  onTyping,
}: {
  ticketId: string;
  onTyping?: () => void;
}) {
  return (
    <form action={sendClientMessageFormAction} className="flex items-end gap-2">
      <input type="hidden" name="ticketId" value={ticketId} />
      <Textarea
        name="body"
        placeholder="Write a message…"
        className="min-h-[44px] max-h-28 flex-1 resize-none bg-background py-2 text-[13px] leading-snug"
        rows={2}
        required
        onInput={onTyping}
      />
      <Button
        type="submit"
        size="sm"
        variant="default"
        className={cn('h-9 shrink-0 gap-1.5 px-3', ticketCaseBlackCtaButtonClassName)}
      >
        <Send className="size-3.5" />
        Send
      </Button>
    </form>
  );
}
