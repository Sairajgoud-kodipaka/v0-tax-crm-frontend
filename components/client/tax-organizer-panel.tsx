'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
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

function TaxpayerDetailsForm() {
  return (
    <div className="space-y-8">
      <h2 className="text-base font-semibold text-foreground">Taxpayer Details</h2>

      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="tp-fn">
            <Req>First name</Req>
          </Label>
          <Input id="tp-fn" autoComplete="given-name" className="bg-background" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tp-mn">Middle name</Label>
          <Input id="tp-mn" autoComplete="additional-name" className="bg-background" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tp-ln">
            <Req>Last name</Req>
          </Label>
          <Input id="tp-ln" autoComplete="family-name" className="bg-background" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tp-phone">
            <Req>Phone</Req>
          </Label>
          <Input id="tp-phone" type="tel" inputMode="tel" autoComplete="tel" className="bg-background" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tp-email">
            <Req>Email</Req>
          </Label>
          <Input id="tp-email" type="email" autoComplete="email" className="bg-background" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tp-ssn">
            <Req>SSN/ITIN</Req>
          </Label>
          <Input id="tp-ssn" autoComplete="off" placeholder="XXX-XX-XXXX" className="bg-background" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tp-dob">
            <Req>Date of birth</Req>
          </Label>
          <div className="relative">
            <Input
              id="tp-dob"
              type="text"
              placeholder="mm/dd/yyyy"
              className="bg-background pr-10"
            />
            <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tp-entry">
            <Req>First Date of Entry Into United States</Req>
          </Label>
          <div className="relative">
            <Input
              id="tp-entry"
              type="text"
              placeholder="mm/dd/yyyy"
              className="bg-background pr-10"
            />
            <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
        <div className="hidden lg:block" aria-hidden />

        <div className="space-y-2">
          <Label htmlFor="tp-occ">Occupation</Label>
          <Input id="tp-occ" className="bg-background" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tp-emp">Employer</Label>
          <Input id="tp-emp" className="bg-background" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tp-des">Designation</Label>
          <Input id="tp-des" className="bg-background" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tp-visa-type">Visa Type at the end of 2024</Label>
          <VisaTypeSelect id="tp-visa-type" className={selectClassName} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tp-visa-issued">Visa issued date</Label>
          <div className="relative">
            <Input
              id="tp-visa-issued"
              type="text"
              placeholder="mm/dd/yyyy"
              className="bg-background pr-10"
            />
            <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
        <div className="hidden lg:block" aria-hidden />

        <div className="space-y-2 sm:col-span-2 lg:col-span-3 lg:max-w-xl">
          <Label htmlFor="tp-visa-change">Was there a change in Visa during 2024?</Label>
          <select id="tp-visa-change" defaultValue="no" className={selectClassName}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tp-reside-2024">
            <Req>Did you reside at least 6 months in US during 2024?</Req>
          </Label>
          <select id="tp-reside-2024" defaultValue="no" className={selectClassName}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tp-reside-2025">
            <Req>Will you reside at least 6 months in US during 2025?</Req>
          </Label>
          <select id="tp-reside-2025" defaultValue="no" className={selectClassName}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
        <div className="hidden lg:block" aria-hidden />

        <div className="space-y-2 sm:col-span-2 lg:col-span-3 lg:max-w-xl">
          <Label htmlFor="tp-marital">
            <Req>Marrital Status at the end of 2024</Req>
          </Label>
          <select id="tp-marital" defaultValue="single" className={selectClassName}>
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
            placeholder=""
            className="min-h-[120px] resize-y bg-background"
          />
        </div>
      </div>
    </div>
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
}: {
  secondary: OrganizerSecondaryId;
  tertiary: string;
}) {
  if (secondary === 'basic' && tertiary === 'taxpayer') {
    return <TaxpayerDetailsForm />;
  }
  if (secondary === 'basic' && tertiary === 'dependents') {
    return <DependentsSection />;
  }
  if (secondary === 'basic' && tertiary === 'address') {
    return <AddressSection />;
  }
  if (secondary === 'basic' && tertiary === 'bank') {
    return <BankDetailsSection />;
  }
  if (secondary === 'residency' && tertiary === 'taxpayer-residency') {
    return <TaxpayerResidencySection />;
  }
  if (secondary === 'residency' && tertiary === 'spouse-residency') {
    return <SpouseResidencySection />;
  }
  if (secondary === 'residency' && tertiary === 'additional-state') {
    return <AdditionalStateInfoSection />;
  }
  if (secondary === 'income' && tertiary === 'income-sources') {
    return <IncomeSourcesSection />;
  }
  if (secondary === 'income' && tertiary === 'additional-incomes') {
    return <AdditionalIncomesSection />;
  }
  if (secondary === 'income' && tertiary === 'rental-income') {
    return <RentalIncomeSection />;
  }
  if (secondary === 'expense' && tertiary === 'expenses') {
    return <ExpensesSection />;
  }
  if (secondary === 'expense' && tertiary === 'electric-hybrid') {
    return <ElectricHybridSection />;
  }
  if (secondary === 'expense' && tertiary === 'daycare') {
    return <DaycareExpensesSection />;
  }
  return <PlaceholderSection title="Section" />;
}

export function TaxOrganizerPanel() {
  const [secondary, setSecondary] = useState<OrganizerSecondaryId>('basic');
  const [tertiary, setTertiary] = useState<string>(() => defaultTertiaryFor('basic'));

  const tertiaryItems = ORGANIZER_TERTIARY[secondary];

  return (
    <div className="flex flex-col border-t border-border bg-muted/30">
      {/* Secondary tabs — light bar */}
      <div className="flex flex-wrap border-b border-border bg-zinc-200/90 dark:bg-zinc-800/80">
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
                  ? 'border-b-amber-500 bg-background text-amber-600 shadow-sm dark:bg-zinc-950 dark:text-amber-400'
                  : 'text-zinc-600 hover:text-foreground dark:text-zinc-400',
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
                  ? 'text-amber-600 underline decoration-amber-500 decoration-2 underline-offset-4 dark:text-amber-400'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Form content */}
      <div className="bg-zinc-50/80 p-4 sm:p-6 dark:bg-zinc-950/40">
        <div className="mx-auto max-w-5xl rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6">
          <OrganizerFormBody secondary={secondary} tertiary={tertiary} />
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
            <Button type="button" className="bg-amber-400 text-zinc-900 hover:bg-amber-500">
              Save
            </Button>
            <Button type="button" className="bg-amber-500 text-amber-950 hover:bg-amber-400">
              Submit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
