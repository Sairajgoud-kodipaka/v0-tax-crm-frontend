'use client';

import { YesNoFormSelect } from '@/components/client/yes-no-form-select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const selectClassName = 'w-full max-w-xl';

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
            <YesNoFormSelect id={q.id} name={q.id} defaultValue="no" className={selectClassName} />
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
