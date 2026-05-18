'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { logTicketActivityAction } from '@/app/actions/activity';
import { sendTicketNotificationEmail } from '@/lib/email/ticket-notification-email';

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

  const { data: inv } = await supabase
    .from('invoices')
    .select('ticket_id, amount_cents')
    .eq('id', invoiceId)
    .maybeSingle();
  const tid = inv?.ticket_id ?? ticketId;
  const { data: tPay } = await supabase
    .from('tickets')
    .select('client_id, assigned_employee_id, public_ref')
    .eq('id', tid)
    .maybeSingle();
  if (tPay) {
    const { data: clientProf } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', tPay.client_id)
      .maybeSingle();
    const clientNm = clientProf?.full_name?.trim() || 'Client';
    const amt = inv?.amount_cents != null ? (inv.amount_cents / 100).toFixed(2) : '?';
    const ref = tPay.public_ref ?? tid;
    if (tPay.assigned_employee_id) {
      void sendTicketNotificationEmail({
        recipientUserId: tPay.assigned_employee_id,
        ticketId: tid,
        templateId: 'payment-assignee',
        vars: { clientName: clientNm, casePublicRef: String(ref) },
      }).catch((e) => console.error('[ticket email]', e));
    }
    const { data: adminRows } = await supabase.from('profiles').select('id').eq('role', 'admin');
    for (const adm of adminRows ?? []) {
      void sendTicketNotificationEmail({
        recipientUserId: adm.id,
        ticketId: tid,
        templateId: 'payment-admin',
        vars: { clientName: clientNm, casePublicRef: String(ref), amount: amt },
      }).catch((e) => console.error('[ticket email]', e));
    }
  }

  // Log activity
  await logTicketActivityAction({
    ticketId,
    actionType: 'payment_processed',
    details: { invoice_id: invoiceId },
    isVisibleToClient: true,
    relatedEntityId: invoiceId,
    relatedEntityType: null, // Invoices are not a related entity type in our enum
  });

  revalidatePath('/client/cases/' + ticketId);
  revalidatePath('/admin/tickets/' + ticketId);
  revalidatePath('/employee/tickets/' + ticketId);
}

export async function createInvoiceAction(
  ticketId: string,
  invoiceNumber: string,
  description: string,
  amountCents: number,
  dueDate?: string,
) {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = profile?.role;
  if (role !== 'admin' && role !== 'employee') throw new Error('Forbidden');

  const { error } = await supabase.from('invoices').insert({
    ticket_id: ticketId,
    invoice_number: invoiceNumber,
    description,
    amount_cents: amountCents,
    due_date: dueDate ? new Date(dueDate).toISOString() : null,
  });

  if (error) throw new Error(error.message);

  // Log activity
  await logTicketActivityAction({
    ticketId,
    actionType: 'invoice_created',
    details: { invoice_number: invoiceNumber, amount_cents: amountCents, description },
    isVisibleToClient: true,
    relatedEntityId: null, // Could fetch invoice id
    relatedEntityType: null,
  });

  revalidatePath('/admin/tickets/' + ticketId);
  revalidatePath('/employee/tickets/' + ticketId);
  revalidatePath('/client/cases/' + ticketId);
}
