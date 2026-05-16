'use client';

import { Send } from 'lucide-react';

import { sendStaffMessageFormAction } from '@/app/actions/forms';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ticketCaseBlackCtaButtonClassName } from '@/lib/ticket-case-tab-styles';
import { cn } from '@/lib/utils';

export function StaffMessageComposer({
  ticketId,
  internalMode,
  onInternalModeChange,
  internalBody,
  onInternalBodyChange,
  mentionOpen,
  mentionIndex,
  filteredMentionCandidates,
  onMentionSelect,
  onMentionIndexChange,
  onMentionClose,
  onTyping,
  onSent,
}: {
  ticketId: string;
  internalMode: boolean;
  onInternalModeChange: (internal: boolean) => void;
  internalBody: string;
  onInternalBodyChange: (value: string) => void;
  mentionOpen: boolean;
  mentionIndex: number;
  filteredMentionCandidates: { id: string; name: string }[];
  onMentionSelect: (name: string) => void;
  onMentionIndexChange: (index: number) => void;
  onMentionClose: () => void;
  onTyping?: () => void;
  onSent?: () => void;
}) {
  return (
    <form
      action={async (formData: FormData) => {
        await sendStaffMessageFormAction(formData);
        onSent?.();
      }}
      className="space-y-2"
    >
      <input type="hidden" name="ticketId" value={ticketId} />
      {internalMode ? <input type="hidden" name="internal" value="on" /> : null}

      <div className="inline-flex rounded-sm border border-border bg-muted/30 p-0.5 text-[11px]">
        <button
          type="button"
          onClick={() => onInternalModeChange(false)}
          className={cn(
            'rounded-sm px-2.5 py-1 font-medium transition-colors',
            !internalMode ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Client
        </button>
        <button
          type="button"
          onClick={() => onInternalModeChange(true)}
          className={cn(
            'rounded-sm px-2.5 py-1 font-medium transition-colors',
            internalMode ? 'bg-orange-100 text-orange-900 dark:bg-orange-950/60 dark:text-orange-100' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Internal
        </button>
      </div>

      <div className="flex items-end gap-2">
        <div className="relative min-w-0 flex-1">
          <Textarea
            name="body"
            value={internalMode ? internalBody : undefined}
            placeholder={internalMode ? '@mention teammate — internal note' : 'Message the client…'}
            className={cn(
              'min-h-[44px] max-h-28 resize-none py-2 text-[13px] leading-snug',
              internalMode
                ? 'border-orange-200/80 bg-orange-50/50 text-orange-950 dark:border-orange-900/50 dark:bg-orange-950/20 dark:text-orange-50'
                : 'bg-background',
            )}
            rows={2}
            required
            onInput={onTyping}
            onChange={internalMode ? (e) => onInternalBodyChange(e.currentTarget.value) : undefined}
            onKeyDown={
              internalMode
                ? (e) => {
                    if (!mentionOpen || filteredMentionCandidates.length === 0) return;
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      onMentionIndexChange((mentionIndex + 1) % filteredMentionCandidates.length);
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      onMentionIndexChange(
                        (mentionIndex - 1 + filteredMentionCandidates.length) % filteredMentionCandidates.length,
                      );
                    } else if (e.key === 'Enter') {
                      e.preventDefault();
                      const candidate = filteredMentionCandidates[mentionIndex];
                      if (candidate) onMentionSelect(candidate.name);
                    } else if (e.key === 'Escape') {
                      onMentionClose();
                    }
                  }
                : undefined
            }
          />
          {internalMode && mentionOpen && filteredMentionCandidates.length > 0 ? (
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
          className={cn(
            'h-9 shrink-0 gap-1.5 px-3',
            internalMode
              ? 'border-orange-300 bg-orange-50 text-orange-900 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-100'
              : ticketCaseBlackCtaButtonClassName,
          )}
          variant={internalMode ? 'outline' : 'default'}
        >
          <Send className="size-3.5" />
          {internalMode ? 'Note' : 'Send'}
        </Button>
      </div>
    </form>
  );
}
