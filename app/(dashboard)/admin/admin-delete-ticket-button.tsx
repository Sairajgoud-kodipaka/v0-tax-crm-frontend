'use client';

import { useFormStatus } from 'react-dom';
import { adminDeleteTicketFormAction } from '@/app/actions/forms';
import { Button } from '@/components/ui/button';

function DeleteSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="destructive" disabled={pending}>
      {pending ? 'Deleting...' : 'Delete'}
    </Button>
  );
}

export function AdminDeleteTicketButton({ ticketId }: { ticketId: string }) {
  return (
    <form
      action={adminDeleteTicketFormAction}
      onSubmit={(event) => {
        if (!window.confirm('Delete this ticket? This action cannot be undone.')) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="ticketId" value={ticketId} />
      <DeleteSubmitButton />
    </form>
  );
}
