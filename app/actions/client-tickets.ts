'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { logTicketActivityAction } from '@/app/actions/activity';

type CreateClientTicketResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function createClientTicketAction(
  _prevState: CreateClientTicketResult,
  formData: FormData,
): Promise<CreateClientTicketResult> {
  const taxYear = Number(String(formData.get('taxYear') ?? ''));
  const filingType = String(formData.get('filingType') ?? '').trim();

  if (!Number.isInteger(taxYear) || taxYear < 2000 || taxYear > 2100) {
    return { ok: false, message: 'Please select a valid tax year.' };
  }
  if (!filingType) {
    return { ok: false, message: 'Please select a service.' };
  }

  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || profile.role !== 'client') {
    return { ok: false, message: 'Only client users can create tickets from this page.' };
  }

  const { data: clientRow } = await supabase
    .from('clients')
    .select('assigned_employee_id')
    .eq('profile_id', user.id)
    .maybeSingle();
  const primaryEmployeeId = clientRow?.assigned_employee_id ?? null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return {
      ok: false,
      message: 'Missing SUPABASE_SERVICE_ROLE_KEY. Add it to server env to create client tickets.',
    };
  }

  const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: inserted, error: insertError } = await adminClient
    .from('tickets')
    .insert({
      client_id: user.id,
      assigned_employee_id: primaryEmployeeId,
      stage: 'pending-info',
      status: 'open',
      subject: `${filingType} - ${taxYear}`,
      description: 'Client-created ticket',
      filing_type: filingType,
      tax_year: taxYear,
    })
    .select('id, public_ref')
    .single();

  if (insertError || !inserted) {
    return { ok: false, message: insertError?.message ?? 'Failed to create ticket.' };
  }

  await adminClient.from('ticket_history').insert({
    ticket_id: inserted.id,
    actor_id: user.id,
    to_stage: 'pending-info',
    note: 'Ticket created by client',
  });

  // Log activity
  await logTicketActivityAction({
    ticketId: inserted.id,
    actionType: 'ticket_created',
    details: { subject: `${filingType} - ${taxYear}` },
    isVisibleToClient: true,
    relatedEntityId: null,
    relatedEntityType: null,
  });

  const clientName =
    (typeof profile.full_name === 'string' && profile.full_name.trim()) ||
    user.email?.split('@')[0] ||
    'Client';
  const caseLabel = `Case #${inserted.public_ref}`;
  const notifyBody = `${clientName} opened ${caseLabel} (${filingType}, ${taxYear}).`;

  const { data: staffRows } = await adminClient
    .from('profiles')
    .select('id')
    .in('role', ['employee', 'admin']);
  const recipientIds = [...new Set((staffRows ?? []).map((r) => r.id))];
  const staffInserts = recipientIds.map((recipient_id) => ({
    recipient_id,
    ticket_id: inserted.id,
    type: 'ticket',
    title: 'New client case',
    body: notifyBody,
    is_read: false,
  }));
  if (staffInserts.length > 0) {
    const { error: nErr } = await adminClient.from('notifications').insert(staffInserts);
    if (nErr) console.error('notifications insert (new ticket):', nErr.message);
  }

  revalidatePath('/client');
  return { ok: true, message: 'Ticket created successfully.' };
}

