'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { saveTaxOrganizerAction } from '@/app/actions/organizer';
import {
  ORGANIZER_SECONDARY,
  ORGANIZER_TERTIARY,
  defaultTertiaryFor,
  type OrganizerSecondaryId,
} from '@/lib/tax-organizer-structure';
import { Button } from '@/components/ui/button';
import { AddressSection } from '@/components/client/address-section';
import { BankDetailsSection } from '@/components/client/bank-details-section';
import { DependentsSection } from '@/components/client/dependents-section';
import { TaxpayerResidencySection } from '@/components/client/taxpayer-residency-section';
import { SpouseResidencySection } from '@/components/client/spouse-residency-section';
import { AdditionalStateInfoSection } from '@/components/client/additional-state-info-section';
import { IncomeSourcesSection } from '@/components/client/income-sources-section';
import { AdditionalIncomesSection } from '@/components/client/additional-incomes-section';
import { RentalIncomeSection } from '@/components/client/rental-income-section';
import { ExpensesSection } from '@/components/client/expenses-section';
import { ElectricHybridSection } from '@/components/client/electric-hybrid-section';
import { DaycareExpensesSection } from '@/components/client/daycare-expenses-section';
import { VisaTypeSelect } from '@/components/client/visa-type-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import {
  coerceTaxpayerSnapshot,
  TAXPAYER_ORGANIZER_FORM_ID,
  type TaxpayerOrganizerSnapshot,
} from '@/lib/tax-organizer-taxpayer';
import { ticketCaseBlackCtaButtonClassName } from '@/lib/ticket-case-tab-styles';
import { cn } from '@/lib/utils';

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

const selectClassName =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring';

export type TaxOrganizerPanelProps = {
  /** When set, Save persists JSON to Supabase for this ticket */
  ticketId?: string;
  /** Loaded from `tax_organizer_snapshots.answers` (server) */
  initialAnswers?: Record<string, unknown>;
};

function TaxpayerDetailsForm({ defaultValues }: { defaultValues: TaxpayerOrganizerSnapshot }) {
  const v = defaultValues;
  return (
    <form
      id={TAXPAYER_ORGANIZER_FORM_ID}
      className="space-y-8"
      onSubmit={(e) => e.preventDefault()}
    >
      <h2 className="text-base font-semibold text-foreground">Taxpayer Details</h2>

      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="tp-fn">
            <Req>First name</Req>
          </Label>
          <Input
            id="tp-fn"
            name="tp-fn"
            autoComplete="given-name"
            className="bg-background"
            defaultValue={v['tp-fn'] ?? ''}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tp-mn">Middle name</Label>
          <Input
            id="tp-mn"
            name="tp-mn"
            autoComplete="additional-name"
            className="bg-background"
            defaultValue={v['tp-mn'] ?? ''}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tp-ln">
            <Req>Last name</Req>
          </Label>
          <Input
            id="tp-ln"
            name="tp-ln"
            autoComplete="family-name"
            className="bg-background"
            defaultValue={v['tp-ln'] ?? ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tp-phone">
            <Req>Phone</Req>
          </Label>
          <Input
            id="tp-phone"
            name="tp-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className="bg-background"
            defaultValue={v['tp-phone'] ?? ''}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tp-email">
            <Req>Email</Req>
          </Label>
          <Input
            id="tp-email"
            name="tp-email"
            type="email"
            autoComplete="email"
            className="bg-background"
            defaultValue={v['tp-email'] ?? ''}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tp-ssn">
            <Req>SSN/ITIN</Req>
          </Label>
          <Input
            id="tp-ssn"
            name="tp-ssn"
            autoComplete="off"
            placeholder="XXX-XX-XXXX"
            className="bg-background"
            defaultValue={v['tp-ssn'] ?? ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tp-dob">
            <Req>Date of birth</Req>
          </Label>
          <DatePicker
            id="tp-dob"
            name="tp-dob"
            className="bg-background"
            defaultValue={v['tp-dob']}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tp-entry">
            <Req>First Date of Entry Into United States</Req>
          </Label>
          <DatePicker
            id="tp-entry"
            name="tp-entry"
            className="bg-background"
            defaultValue={v['tp-entry']}
          />
        </div>
        <div className="hidden lg:block" aria-hidden />

        <div className="space-y-2">
          <Label htmlFor="tp-occ">Occupation</Label>
          <Input id="tp-occ" name="tp-occ" className="bg-background" defaultValue={v['tp-occ'] ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tp-emp">Employer</Label>
          <Input id="tp-emp" name="tp-emp" className="bg-background" defaultValue={v['tp-emp'] ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tp-des">Designation</Label>
          <Input id="tp-des" name="tp-des" className="bg-background" defaultValue={v['tp-des'] ?? ''} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tp-visa-type">Visa Type at the end of 2024</Label>
          <VisaTypeSelect
            id="tp-visa-type"
            name="tp-visa-type"
            className={selectClassName}
            defaultValue={v['tp-visa-type'] ?? ''}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tp-visa-issued">Visa issued date</Label>
          <DatePicker
            id="tp-visa-issued"
            name="tp-visa-issued"
            className="bg-background"
            defaultValue={v['tp-visa-issued']}
          />
        </div>
        <div className="hidden lg:block" aria-hidden />

        <div className="space-y-2 sm:col-span-2 lg:col-span-3 lg:max-w-xl">
          <Label htmlFor="tp-visa-change">Was there a change in Visa during 2024?</Label>
          <select
            id="tp-visa-change"
            name="tp-visa-change"
            defaultValue={v['tp-visa-change'] ?? 'no'}
            className={selectClassName}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tp-reside-2024">
            <Req>Did you reside at least 6 months in US during 2024?</Req>
          </Label>
          <select
            id="tp-reside-2024"
            name="tp-reside-2024"
            defaultValue={v['tp-reside-2024'] ?? 'no'}
            className={selectClassName}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tp-reside-2025">
            <Req>Will you reside at least 6 months in US during 2025?</Req>
          </Label>
          <select
            id="tp-reside-2025"
            name="tp-reside-2025"
            defaultValue={v['tp-reside-2025'] ?? 'no'}
            className={selectClassName}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
        <div className="hidden lg:block" aria-hidden />

        <div className="space-y-2 sm:col-span-2 lg:col-span-3 lg:max-w-xl">
          <Label htmlFor="tp-marital">
            <Req>Marrital Status at the end of 2024</Req>
          </Label>
          <select
            id="tp-marital"
            name="tp-marital"
            defaultValue={v['tp-marital'] ?? 'single'}
            className={selectClassName}
          >
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="legally-seperated">Legally Seperated</option>
            <option value="widow-widower">Widow/Widower</option>
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2 lg:col-span-3">
          <Label htmlFor="tp-comments">Comments</Label>
          <Textarea
            id="tp-comments"
            name="tp-comments"
            placeholder=""
            className="min-h-[120px] resize-y bg-background"
            defaultValue={v['tp-comments'] ?? ''}
          />
        </div>
      </div>
    </form>
  );
}

function PlaceholderSection({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2 sm:col-span-2 lg:col-span-3">
          <Label>Notes</Label>
          <Textarea placeholder="Enter details…" className="min-h-[120px] bg-background" />
        </div>
      </div>
    </div>
  );
}

function OrganizerFormBody({
  secondary,
  tertiary,
  taxpayerDefaultValues,
  sectionAnswers,
}: {
  secondary: OrganizerSecondaryId;
  tertiary: string;
  taxpayerDefaultValues: TaxpayerOrganizerSnapshot;
  sectionAnswers: Record<string, unknown>;
}) {
  const sectionRows = (() => {
    const section = sectionAnswers[tertiary];
    if (!section || typeof section !== 'object') return [];
    const rowsValue = (section as { rows?: unknown }).rows;
    if (typeof rowsValue !== 'string') return [];
    try {
      const parsed = JSON.parse(rowsValue);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  if (secondary === 'basic' && tertiary === 'taxpayer') {
    return <TaxpayerDetailsForm defaultValues={taxpayerDefaultValues} />;
  }
  if (secondary === 'basic' && tertiary === 'dependents') {
    return <DependentsSection initialRows={sectionRows} />;
  }
  if (secondary === 'basic' && tertiary === 'address') {
    return <AddressSection initialValues={(sectionAnswers.address as Record<string, unknown>) ?? {}} />;
  }
  if (secondary === 'basic' && tertiary === 'bank') {
    return <BankDetailsSection initialValues={(sectionAnswers.bank as Record<string, unknown>) ?? {}} />;
  }
  if (secondary === 'residency' && tertiary === 'taxpayer-residency') {
    return <TaxpayerResidencySection initialRows={sectionRows} />;
  }
  if (secondary === 'residency' && tertiary === 'spouse-residency') {
    return <SpouseResidencySection initialRows={sectionRows} />;
  }
  if (secondary === 'residency' && tertiary === 'additional-state') {
    return <AdditionalStateInfoSection />;
  }
  if (secondary === 'income' && tertiary === 'income-sources') {
    return <IncomeSourcesSection initialValues={(sectionAnswers['income-sources'] as Record<string, unknown>) ?? {}} />;
  }
  if (secondary === 'income' && tertiary === 'additional-incomes') {
    return <AdditionalIncomesSection initialRows={sectionRows} />;
  }
  if (secondary === 'income' && tertiary === 'rental-income') {
    return <RentalIncomeSection initialRows={sectionRows} />;
  }
  if (secondary === 'expense' && tertiary === 'expenses') {
    return <ExpensesSection initialValues={(sectionAnswers.expenses as Record<string, unknown>) ?? {}} />;
  }
  if (secondary === 'expense' && tertiary === 'electric-hybrid') {
    return <ElectricHybridSection initialRows={sectionRows} />;
  }
  if (secondary === 'expense' && tertiary === 'daycare') {
    return <DaycareExpensesSection initialRows={sectionRows} />;
  }
  return <PlaceholderSection title="Section" />;
}

function serializeSectionControls(root: HTMLElement): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const controls = root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    'input[name], textarea[name], select[name]',
  );

  controls.forEach((el) => {
    const key = el.name;
    if (!key) return;

    if (el instanceof HTMLInputElement) {
      if (el.type === 'checkbox') {
        out[key] = el.checked;
        return;
      }
      if (el.type === 'radio') {
        if (el.checked) out[key] = el.value;
        return;
      }
      out[key] = el.value;
      return;
    }

    out[key] = el.value;
  });

  return out;
}

export function TaxOrganizerPanel(props: TaxOrganizerPanelProps = {}) {
  const { ticketId, initialAnswers = {} } = props;
  const [answers, setAnswers] = useState<Record<string, unknown>>(() => ({ ...initialAnswers }));
  const [secondary, setSecondary] = useState<OrganizerSecondaryId>('basic');
  const [tertiary, setTertiary] = useState<string>(() => defaultTertiaryFor('basic'));
  const [pending, startTransition] = useTransition();
  const sectionRef = useRef<HTMLDivElement | null>(null);

  const taxpayerDefaultValues = useMemo(() => coerceTaxpayerSnapshot(answers.taxpayer), [answers]);

  const tertiaryItems = ORGANIZER_TERTIARY[secondary];

  function buildPayload(): Record<string, unknown> {
    let payload: Record<string, unknown> = {
      ...answers,
      savedAt: new Date().toISOString(),
      note: 'Organizer snapshot',
    };

    if (sectionRef.current) {
      payload = {
        ...payload,
        [tertiary]: serializeSectionControls(sectionRef.current),
      };
    }

    // Backward-compatible key used by current Taxpayer default loader.
    if (tertiary === 'taxpayer') {
      const taxpayer = payload.taxpayer;
      if (!taxpayer || typeof taxpayer !== 'object') {
        payload = {
          ...payload,
          taxpayer: payload[tertiary],
        };
      }
    }
    return payload;
  }

  async function saveCurrentSection(): Promise<boolean> {
    if (!ticketId) return false;
    const payload = buildPayload();
    await saveTaxOrganizerAction(ticketId, payload);
    setAnswers(payload);
    return true;
  }

  function goToNextSection() {
    const currentTertiaryItems = ORGANIZER_TERTIARY[secondary];
    const tertiaryIndex = currentTertiaryItems.findIndex((item) => item.id === tertiary);
    const nextTertiary = currentTertiaryItems[tertiaryIndex + 1];
    if (nextTertiary) {
      setTertiary(nextTertiary.id);
      return;
    }

    const secondaryIndex = ORGANIZER_SECONDARY.findIndex((item) => item.id === secondary);
    const nextSecondary = ORGANIZER_SECONDARY[secondaryIndex + 1];
    if (nextSecondary) {
      setSecondary(nextSecondary.id);
      setTertiary(defaultTertiaryFor(nextSecondary.id));
    }
  }

  return (
    <div className="flex flex-col border-t border-border bg-muted/30">
      {/* Secondary tabs — light bar */}
      <div className="flex flex-wrap border-b border-border bg-muted/70">
        {ORGANIZER_SECONDARY.map((sec) => {
          const active = secondary === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => {
                setSecondary(sec.id);
                setTertiary(defaultTertiaryFor(sec.id));
              }}
              className={cn(
                'border-b-2 border-transparent px-5 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'border-b-primary bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {sec.label}
            </button>
          );
        })}
      </div>

      {/* Tertiary — text links */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-border bg-background px-4 py-3 sm:px-6">
        {tertiaryItems.map((item) => {
          const active = tertiary === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTertiary(item.id)}
              className={cn(
                'text-sm font-medium transition-colors',
                active
                  ? 'text-foreground underline decoration-primary decoration-2 underline-offset-4'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Form content */}
      <div className="bg-muted/30 p-4 sm:p-6">
        <div className="mx-auto max-w-5xl rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6">
          <div ref={sectionRef}>
            <OrganizerFormBody
              secondary={secondary}
              tertiary={tertiary}
              taxpayerDefaultValues={taxpayerDefaultValues}
              sectionAnswers={answers}
            />
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
            <Button
              type="button"
              variant="default"
              className={ticketCaseBlackCtaButtonClassName}
              disabled={!ticketId || pending}
              onClick={() => {
                startTransition(async () => {
                  await saveCurrentSection();
                });
              }}
            >
              {pending ? 'Saving…' : 'Save'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              disabled={!ticketId || pending}
              onClick={() => {
                startTransition(async () => {
                  const saved = await saveCurrentSection();
                  if (!saved) return;
                  goToNextSection();
                });
              }}
            >
              {pending ? 'Saving…' : 'Save & Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
