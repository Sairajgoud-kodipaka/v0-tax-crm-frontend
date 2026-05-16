'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormSelect } from '@/components/ui/form-select';
import { Label } from '@/components/ui/label';
import { FILING_TYPES } from '@/lib/constants';
import { createClientTicketAction } from '@/app/actions/client-tickets';

const initialState = { ok: false as const, message: '' };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create Ticket'}
    </Button>
  );
}

export function CreateTicketForm() {
  const [state, formAction] = useActionState(createClientTicketAction, initialState);
  const currentYear = new Date().getFullYear();

  return (
    <form action={formAction} className="grid gap-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="yr">Tax year</Label>
        <Input id="yr" name="taxYear" type="number" placeholder={String(currentYear)} defaultValue={currentYear} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="svc">Service</Label>
        <FormSelect
          id="svc"
          name="filingType"
          required
          placeholder="Select a service"
          defaultValue={FILING_TYPES[0]}
          options={FILING_TYPES.map((service) => ({ value: service, label: service }))}
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <SubmitButton />
      </div>
      {state.message ? (
        <p className={`text-sm ${state.ok ? 'text-primary' : 'text-destructive'}`}>{state.message}</p>
      ) : null}
    </form>
  );
}

