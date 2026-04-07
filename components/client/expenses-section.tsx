'use client';

import { useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const selectClassName = cn(
  'flex h-9 w-full min-w-[120px] shrink-0 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none sm:w-auto',
  'focus-visible:ring-2 focus-visible:ring-ring',
);

/** First four: full-width amount/description fields per reference UI */
const EXPENSE_TEXT_FIELDS: { id: string; label: string }[] = [
  { id: 'exp-charitable', label: 'Charitable Contributions' },
  { id: 'exp-medical', label: 'Medical expenses' },
  { id: 'exp-prop-tax-us', label: 'Property Taxes Paid in US' },
  { id: 'exp-prop-tax-outside', label: 'Property Taxes Paid outside US' },
];

const EXPENSE_CHECKBOX_ITEMS: { id: string; label: string }[] = [
  { id: 'exp-mortgage-us', label: 'Home Mortgage Paid in US Form' },
  { id: 'exp-mortgage-outside', label: 'Home Mortgage Paid outside US' },
  { id: 'exp-1098e', label: 'Interest paid on Student Loan Form 1098-E' },
  { id: 'exp-1098t', label: 'Higher Education Expenses 1098-T' },
  { id: 'exp-energy-equipment', label: 'Purchased Energy Saving Equipmemt in US' },
  { id: 'exp-energy-improvement', label: 'Energy Efficient Home Improvement Purchased' },
  { id: 'exp-ira-traditional', label: 'Invested in Traditional IRA' },
  { id: 'exp-ira-roth', label: 'Invested in Roth IRA' },
  { id: 'exp-hsa-fsa', label: 'Invested in HSA/FSA' },
  { id: 'exp-esa', label: 'Invested in ESA' },
];

type ExpensesValues = Record<string, unknown>;

export function ExpensesSection({ initialValues = {} }: { initialValues?: ExpensesValues }) {
  const initialChecks = useMemo(
    () =>
      EXPENSE_CHECKBOX_ITEMS.reduce<Record<string, boolean>>((acc, item) => {
        acc[item.id] = initialValues[item.id] === true;
        return acc;
      }, {}),
    [initialValues],
  );
  const [checks, setChecks] = useState<Record<string, boolean>>(initialChecks);

  return (
    <div className="space-y-8">
      <h2 className="text-base font-semibold text-foreground">Expenses</h2>

      <div className="space-y-5">
        {EXPENSE_TEXT_FIELDS.map((item) => (
          <div key={item.id} className="space-y-2">
            <Label htmlFor={item.id} className="text-sm font-normal text-foreground">
              {item.label}
            </Label>
            <Input
              id={item.id}
              name={item.id}
              className="w-full bg-background"
              defaultValue={String(initialValues[item.id] ?? '')}
            />
          </div>
        ))}
      </div>

      <ul className="space-y-3">
        {EXPENSE_CHECKBOX_ITEMS.map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <Checkbox
              id={item.id}
              className="mt-0.5"
              checked={checks[item.id] ?? false}
              onCheckedChange={(checked) =>
                setChecks((prev) => ({ ...prev, [item.id]: checked === true }))
              }
            />
            <input
              type="checkbox"
              name={item.id}
              checked={checks[item.id] ?? false}
              readOnly
              className="hidden"
              tabIndex={-1}
              aria-hidden
            />
            <Label htmlFor={item.id} className="cursor-pointer text-sm font-normal leading-snug text-foreground">
              {item.label}
            </Label>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <Label htmlFor="exp-vehicle-loan" className="text-sm font-normal leading-snug sm:min-w-0 sm:flex-1">
          Did you purchase a personal-use vehicle in 2024 and pay interest on a passenger vehicle loan during the year?
        </Label>
        <select
          id="exp-vehicle-loan"
          name="exp-vehicle-loan"
          defaultValue={String(initialValues['exp-vehicle-loan'] ?? 'no')}
          className={selectClassName}
        >
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="exp-comments">Comments</Label>
        <Textarea
          id="exp-comments"
          name="exp-comments"
          placeholder=""
          className="min-h-[120px] w-full resize-y bg-background"
          defaultValue={String(initialValues['exp-comments'] ?? '')}
        />
      </div>

    </div>
  );
}
