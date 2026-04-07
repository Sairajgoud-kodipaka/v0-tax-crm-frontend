'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const selectClassName =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring';

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

type BankDetailsSectionValues = Record<string, unknown>;

export function BankDetailsSection({ initialValues = {} }: { initialValues?: BankDetailsSectionValues }) {
  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-foreground">Bank Details</h2>

      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bank-name">
            <Req>Bank name</Req>
          </Label>
          <Input
            id="bank-name"
            name="bank-name"
            autoComplete="organization"
            className="bg-background"
            defaultValue={String(initialValues['bank-name'] ?? '')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bank-holder">
            <Req>Account holder name</Req>
          </Label>
          <Input
            id="bank-holder"
            name="bank-holder"
            autoComplete="name"
            className="bg-background"
            defaultValue={String(initialValues['bank-holder'] ?? '')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bank-account">
            <Req>Account number</Req>
          </Label>
          <Input
            id="bank-account"
            name="bank-account"
            inputMode="numeric"
            autoComplete="off"
            className="bg-background"
            defaultValue={String(initialValues['bank-account'] ?? '')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bank-routing">
            <Req>Routing number</Req>
          </Label>
          <Input
            id="bank-routing"
            name="bank-routing"
            inputMode="numeric"
            autoComplete="off"
            className="bg-background"
            defaultValue={String(initialValues['bank-routing'] ?? '')}
          />
        </div>

        <div className="space-y-2 sm:col-span-2 sm:max-w-md">
          <Label htmlFor="bank-type">
            <Req>Account type</Req>
          </Label>
          <select
            id="bank-type"
            name="bank-type"
            defaultValue={String(initialValues['bank-type'] ?? 'checking')}
            className={selectClassName}
          >
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="bank-comments">Comments</Label>
          <Textarea
            id="bank-comments"
            name="bank-comments"
            className="min-h-[140px] resize-y bg-background"
            placeholder=""
            defaultValue={String(initialValues['bank-comments'] ?? '')}
          />
        </div>
      </div>
    </div>
  );
}
