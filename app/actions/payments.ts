'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

/** MVP: mark invoice paid without Stripe (replace with webhook later) */
export async function markInvoicePaidMvpAction(invoiceId: string, ticketId: string) {
  const mvpManualPaymentEnabled = process.env.ALLOW_MVP_MANUAL_PAYMENT === 'true';
  if (!mvpManualPaymentEnabled) {
    throw new Error('Manual payment marking is disabled. Use Stripe flow/webhook in production.');
  }

  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase.rpc('pay_invoice_mvp', { p_invoice_id: invoiceId });

  if (error) throw new Error(error.message);

  revalidatePath('/client/cases/' + ticketId);
  revalidatePath('/admin/tickets/' + ticketId);
  revalidatePath('/employee/tickets/' + ticketId);
}
