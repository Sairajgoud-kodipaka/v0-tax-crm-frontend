'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const selectClassName = cn(
  'flex h-9 w-full max-w-xl rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none',
  'focus-visible:ring-2 focus-visible:ring-ring',
);

const questions = [
  {
    id: 'add-st-ma',
    label: 'Did you reside in Massachusetts during 2024?',
  },
  {
    id: 'add-st-nj-ca',
    label: 'Did you reside in New Jersey / California during 2024?',
  },
  {
    id: 'add-st-multi',
    label:
      'Did you reside in California, Massachusetts, New Jersey, Minnesota, Wisconsin or Indiana during 2024?',
  },
  {
    id: 'add-st-south',
    label: 'Did you reside in Alabama, Ohio, New York or New Jersey during 2024?',
  },
] as const;

export function AdditionalStateInfoSection() {
  return (
    <div className="space-y-8">
      <h2 className="text-base font-semibold text-foreground">Additional State Info</h2>

      <div className="space-y-6">
        {questions.map((q) => (
          <div key={q.id} className="space-y-2">
            <Label htmlFor={q.id} className="text-sm font-normal leading-snug text-foreground">
              {q.label}
            </Label>
            <select id={q.id} name={q.id} defaultValue="no" className={selectClassName}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
        ))}

        <div className="space-y-2">
          <Label htmlFor="add-st-comments">Comments</Label>
          <Textarea
            id="add-st-comments"
            name="add-st-comments"
            placeholder=""
            className="min-h-[120px] resize-y bg-background sm:max-w-3xl"
          />
        </div>
      </div>
    </div>
  );
}
