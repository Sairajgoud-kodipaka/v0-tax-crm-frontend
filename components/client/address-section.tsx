'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormSelect } from '@/components/ui/form-select';
import { US_STATE_OPTIONS } from '@/lib/us-states';

const selectClassName = 'w-full';

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

type AddressSectionValues = Record<string, unknown>;

export function AddressSection({ initialValues = {} }: { initialValues?: AddressSectionValues }) {
  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-foreground">Address</h2>

      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="addr-line1">
            <Req>Address line 1</Req>
          </Label>
          <Input
            id="addr-line1"
            name="addr-line1"
            autoComplete="address-line1"
            className="bg-background"
            defaultValue={String(initialValues['addr-line1'] ?? '')}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="addr-line2">Address line 2</Label>
          <Input
            id="addr-line2"
            name="addr-line2"
            autoComplete="address-line2"
            className="bg-background"
            defaultValue={String(initialValues['addr-line2'] ?? '')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="addr-city">
            <Req>City</Req>
          </Label>
          <Input
            id="addr-city"
            name="addr-city"
            autoComplete="address-level2"
            className="bg-background"
            defaultValue={String(initialValues['addr-city'] ?? '')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="addr-state">
            <Req>State</Req>
          </Label>
          <FormSelect
            id="addr-state"
            name="addr-state"
            defaultValue={String(initialValues['addr-state'] ?? '')}
            className={selectClassName}
            placeholder="Select state"
            options={US_STATE_OPTIONS.filter((o) => o.value !== '')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="addr-zip">
            <Req>Zipcode</Req>
          </Label>
          <Input
            id="addr-zip"
            name="addr-zip"
            autoComplete="postal-code"
            className="bg-background"
            defaultValue={String(initialValues['addr-zip'] ?? '')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="addr-country">
            <Req>Country</Req>
          </Label>
          <Input
            id="addr-country"
            name="addr-country"
            autoComplete="country-name"
            className="bg-background"
            defaultValue={String(initialValues['addr-country'] ?? '')}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="addr-comments">Comments</Label>
          <Textarea
            id="addr-comments"
            name="addr-comments"
            className="min-h-[140px] resize-y bg-background"
            placeholder=""
            defaultValue={String(initialValues['addr-comments'] ?? '')}
          />
        </div>
      </div>
    </div>
  );
}
