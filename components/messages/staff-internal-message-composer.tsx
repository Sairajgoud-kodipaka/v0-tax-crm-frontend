'use client';

import { Send } from 'lucide-react';

import { sendStaffMessageFormAction } from '@/app/actions/forms';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export function StaffInternalMessageComposer({
  ticketId,
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
    <form
      action={async (formData: FormData) => {
        await sendStaffMessageFormAction(formData);
        onSent?.();
      }}
      className="flex items-end gap-2 border-t border-orange-200/60 bg-orange-50/30 px-1 pt-3 dark:border-orange-900/50 dark:bg-orange-950/20"
    >
      <input type="hidden" name="ticketId" value={ticketId} />
      <input type="hidden" name="internal" value="on" />

      <div className="relative min-w-0 flex-1">
        <Textarea
          name="body"
          value={internalBody}
          placeholder="@mention teammate — internal note"
          className="min-h-[44px] max-h-28 resize-none border-orange-200/80 bg-orange-50/50 py-2 text-[13px] leading-snug text-orange-950 dark:border-orange-900/50 dark:bg-orange-950/20 dark:text-orange-50"
          rows={2}
          required
          onChange={(e) => onInternalBodyChange(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (!mentionOpen || filteredMentionCandidates.length === 0) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              onMentionIndexChange((mentionIndex + 1) % filteredMentionCandidates.length);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              onMentionIndexChange(
                (mentionIndex - 1 + filteredMentionCandidates.length) % filteredMentionCandidates.length,
              );
            } else if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              const candidate = filteredMentionCandidates[mentionIndex];
              if (candidate) onMentionSelect(candidate.name);
            } else if (e.key === 'Escape') {
              onMentionClose();
            }
          }}
        />
        {mentionOpen && filteredMentionCandidates.length > 0 ? (
          <div className="absolute bottom-[calc(100%+4px)] left-0 z-20 max-h-36 w-full overflow-y-auto rounded-sm border border-border bg-popover p-1 shadow-lg">
            {filteredMentionCandidates.slice(0, 6).map((candidate, index) => (
              <button
                key={candidate.id}
                type="button"
                className={cn(
                  'w-full rounded-sm px-2 py-1.5 text-left text-xs hover:bg-accent',
                  index === mentionIndex && 'bg-accent',
                )}
                onClick={() => onMentionSelect(candidate.name)}
              >
                {candidate.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <Button
        type="submit"
        size="sm"
        variant="outline"
        className="h-9 shrink-0 gap-1.5 border-orange-300 bg-orange-50 px-3 text-orange-900 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-100"
      >
        <Send className="size-3.5" />
        Note
      </Button>
    </form>
  );
}
