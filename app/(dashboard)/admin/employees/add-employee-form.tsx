'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createEmployeeAction } from '@/app/actions/admin-employees';
import { ticketCaseBlackCtaButtonClassName } from '@/lib/ticket-case-tab-styles';

const createEmployeeInitialState = { ok: false as const, message: '' };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="default" className={ticketCaseBlackCtaButtonClassName} disabled={pending}>
      {pending ? 'Adding employee...' : 'Add Employee'}
    </Button>
  );
}

export function AddEmployeeForm() {
  const [state, formAction] = useActionState(createEmployeeAction, createEmployeeInitialState);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" placeholder="Akash Patel" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="employee@company.com" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Temporary password</Label>
        <Input id="password" name="password" type="password" minLength={6} required />
      </div>
      <div className="md:col-span-3 space-y-2">
        <SubmitButton />
        {state.message ? (
          <p className={`text-sm ${state.ok ? 'text-primary' : 'text-destructive'}`}>{state.message}</p>
        ) : null}
      </div>
    </form>
  );
}

