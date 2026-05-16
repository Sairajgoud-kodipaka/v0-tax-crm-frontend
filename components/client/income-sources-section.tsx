'use client';

import { useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { YesNoFormSelect } from '@/components/client/yes-no-form-select';
import { cn } from '@/lib/utils';

const selectClassName = 'w-full max-w-xs';

function Req({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <span className="text-destructive" aria-hidden>
        *
      </span>
    </>
  );
}

const INCOME_TYPE_ITEMS: { id: string; label: string }[] = [
  { id: 'inc-src-w2', label: 'Income from employment Form W2.' },
  { id: 'inc-src-1099nec', label: 'Self-employment/ Independent contractor Form 1099-NEC.' },
  { id: 'inc-src-1099b', label: 'Income/Loss from Stocks Form 1099-B.' },
  { id: 'inc-src-crypto', label: 'Income/Loss from Crypto.' },
  { id: 'inc-src-1099r', label: 'Income from Pension Distributions Form 1099-R.' },
  { id: 'inc-src-1099sa', label: 'Income from HSA Distributions Form 1099-SA.' },
  { id: 'inc-src-1099int', label: 'Income from Interest Form 1099-INT.' },
  { id: 'inc-src-1099div', label: 'Income from Dividend Form 1099-DIV.' },
];

type IncomeSourcesValues = Record<string, unknown>;

export function IncomeSourcesSection({ initialValues = {} }: { initialValues?: IncomeSourcesValues }) {
  const initialChecks = useMemo(
    () =>
      INCOME_TYPE_ITEMS.reduce<Record<string, boolean>>((acc, item) => {
        acc[item.id] = initialValues[item.id] === true;
        return acc;
      }, {}),
    [initialValues],
  );
  const [checks, setChecks] = useState<Record<string, boolean>>(initialChecks);

  return (
    <div className="space-y-10">
      <h2 className="text-base font-semibold text-foreground">Income Sources</h2>

      <div className="space-y-4">
        <ul className="space-y-3">
          {INCOME_TYPE_ITEMS.map((item) => (
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="inc-src-overtime" className="text-sm font-normal leading-snug">
          Did you receive any qualified overtime pay in 2024?
        </Label>
        <YesNoFormSelect
          id="inc-src-overtime"
          name="inc-src-overtime"
          defaultValue={String(initialValues['inc-src-overtime'] ?? 'no')}
          className={selectClassName}
        />
      </div>

      <div className="space-y-4 border-t border-border pt-8">
        <h3 className="text-sm font-semibold text-foreground">FBAR/FATCA</h3>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            You are required to file a FBAR if you have foreign financial assets amounting to $10,000 or more.
          </p>
          <p>
            You are required to file a FATCA if you have foreign financial assets amounting to $50,000 or more
            ($100,000 for married taxpayers for both spouses combined).
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inc-src-tp-fbar">
                <Req>Taxpayer fbar</Req>
              </Label>
              <YesNoFormSelect
                id="inc-src-tp-fbar"
                name="inc-src-tp-fbar"
                defaultValue={String(initialValues['inc-src-tp-fbar'] ?? 'no')}
                className={selectClassName}
              />
              <p className="text-xs text-muted-foreground">
                Select yes if you have foreign financial assets amounting to $10,000 or more.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inc-src-sp-fbar">
                <Req>Spouse fbar</Req>
              </Label>
              <YesNoFormSelect
                id="inc-src-sp-fbar"
                name="inc-src-sp-fbar"
                defaultValue={String(initialValues['inc-src-sp-fbar'] ?? 'no')}
                className={selectClassName}
              />
              <p className="text-xs text-muted-foreground">
                Select yes if your spouse has foreign financial assets amounting to $10,000 or more.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inc-src-tp-fatca">
                <Req>Taxpayer fatca</Req>
              </Label>
              <YesNoFormSelect
                id="inc-src-tp-fatca"
                name="inc-src-tp-fatca"
                defaultValue={String(initialValues['inc-src-tp-fatca'] ?? 'no')}
                className={selectClassName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inc-src-sp-fatca">
                <Req>Spouse fatca</Req>
              </Label>
              <YesNoFormSelect
                id="inc-src-sp-fatca"
                name="inc-src-sp-fatca"
                defaultValue={String(initialValues['inc-src-sp-fatca'] ?? 'no')}
                className={selectClassName}
              />
            </div>
          </div>
        </div>

        <p>
          <a
            href="#"
            className="text-sm font-medium text-primary underline decoration-primary/60 underline-offset-2 hover:text-primary/90"
          >
            Download 2024 FBAR/FATCA Organizer
          </a>
        </p>

        <div className="space-y-2">
          <Label htmlFor="inc-src-mf-india" className="text-sm font-normal leading-snug">
            <Req>Do you hold Mutual Funds or other investments in India or anywhere outside the US?</Req>
          </Label>
          <YesNoFormSelect
            id="inc-src-mf-india"
            name="inc-src-mf-india"
            defaultValue={String(initialValues['inc-src-mf-india'] ?? 'no')}
            className={selectClassName}
          />
        </div>

        <div className="rounded-md border border-border bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          <p className="mb-3">
            Please note: U.S. tax law may require FBAR, FATCA, and PFIC reporting even if you are only holding (and
            not selling) foreign accounts or investments.
          </p>
          <p className="mb-3">
            Failure to file required informational returns can result in significant penalties, even when no additional
            tax is due.
          </p>
          <p>
            We recommend consulting with our Tax Expert to confirm your reporting obligations and ensure full
            compliance.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="inc-src-comments">Comments</Label>
        <Textarea
          id="inc-src-comments"
          name="inc-src-comments"
          placeholder=""
          className="min-h-[120px] resize-y bg-background sm:max-w-3xl"
          defaultValue={String(initialValues['inc-src-comments'] ?? '')}
        />
      </div>
    </div>
  );
}
