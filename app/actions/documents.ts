'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { updateTicketStageAction } from '@/app/actions/tickets';
import type { TicketStage } from '@/lib/types';

const DRAFT_SENT: TicketStage = 'draft-sent';

/** Stages before draft-sent where uploading a draft should advance the ticket to Draft Sent (Stages 2–3). */
const STAGES_BEFORE_DRAFT_SENT: TicketStage[] = ['pending-info', 'under-prep'];

/** When staff shares a draft PDF while the case is still in Pending Info or Under Prep, move to Draft Sent. */
async function advanceToDraftSentOnDraftShareIfNeeded(
  supabase: ReturnType<typeof createClient>,
  ticketId: string,
  note: string,
) {
  const { data: row } = await supabase.from('tickets').select('stage').eq('id', ticketId).maybeSingle();
  const stage = row?.stage as TicketStage | undefined;
  if (!stage || !STAGES_BEFORE_DRAFT_SENT.includes(stage)) return;
  await updateTicketStageAction(ticketId, DRAFT_SENT, note);
}

export type DocumentCategory = 'client_upload' | 'draft' | 'final' | 'other';

export async function uploadTicketDocumentAction(
  ticketId: string,
  formData: FormData,
  category: DocumentCategory = 'client_upload',
) {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = profile?.role;

  const { data: ticket } = await supabase
    .from('tickets')
    .select('id, client_id, assigned_employee_id, stage, public_ref')
    .eq('id', ticketId)
    .maybeSingle();
  if (!ticket) throw new Error('Ticket not found');

  const stageBeforeDraftFlow = ticket.stage;

  if (category === 'client_upload') {
    if (role === 'client') {
      if (ticket.client_id !== user.id) throw new Error('Forbidden');
    } else if (role !== 'admin' && role !== 'employee') {
      throw new Error('Forbidden');
    }
  } else if (category === 'draft' || category === 'final' || category === 'other') {
    if (role !== 'admin' && role !== 'employee') {
      throw new Error('Forbidden');
    }
  }

  const file = formData.get('file');
  if (!file || !(file instanceof Blob)) {
    throw new Error('No file uploaded');
  }

  const filename =
    typeof (file as File).name === 'string' ? (file as File).name : 'upload.bin';
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${ticketId}/${Date.now()}-${safeName}`;

  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage.from('tax-documents').upload(path, buf, {
    contentType: (file as File).type || 'application/octet-stream',
    upsert: false,
  });

  if (upErr) throw new Error(upErr.message);

  const { error: insErr } = await supabase.from('documents').insert({
    ticket_id: ticketId,
    category,
    storage_path: path,
    original_filename: filename,
    mime_type: (file as File).type || null,
    size_bytes: buf.length,
    uploaded_by: user.id,
    shared_at: category === 'draft' ? new Date().toISOString() : null,
    available_at: category === 'final' ? new Date().toISOString() : null,
  });

  if (insErr) throw new Error(insErr.message);

  if (category === 'draft') {
    await advanceToDraftSentOnDraftShareIfNeeded(supabase, ticketId, 'Draft uploaded');
  }

  if (
    category === 'draft' &&
    (role === 'admin' || role === 'employee') &&
    stageBeforeDraftFlow === 'draft-sent'
  ) {
    const { error: nErr } = await supabase.rpc('create_ticket_notification', {
      p_recipient_id: ticket.client_id,
      p_ticket_id: ticketId,
      p_type: 'document',
      p_title: 'Draft return ready',
      p_body: `Your draft return is ready. Please log in to review and approve. Case #${ticket.public_ref}.`,
    });
    if (nErr) console.error('create_ticket_notification:', nErr.message);
  }

  if (
    category === 'client_upload' &&
    role === 'client' &&
    ticket.stage === '8879-sent' &&
    ticket.assigned_employee_id
  ) {
    const { data: clientProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();
    const nm = clientProfile?.full_name?.trim() || 'Client';
    const { error: n8879 } = await supabase.rpc('create_ticket_notification', {
      p_recipient_id: ticket.assigned_employee_id,
      p_ticket_id: ticketId,
      p_type: 'document',
      p_title: 'Signed Form 8879 uploaded',
      p_body: `${nm} uploaded signed Form 8879. Ready to file. Case #${ticket.public_ref}.`,
    });
    if (n8879) console.error('create_ticket_notification:', n8879.message);
  }

  revalidatePath('/admin/tickets/' + ticketId);
  revalidatePath('/employee/tickets/' + ticketId);
  revalidatePath('/client/cases/' + ticketId);
}

/** Swap file bytes in place: same document id, new storage object. Client: own `client_upload` only; staff: any doc on an accessible ticket. */
export async function replaceTicketDocumentAction(formData: FormData) {
  const documentId = formData.get('documentId') as string;
  if (!documentId) throw new Error('Invalid');

  const file = formData.get('file');
  if (!file || !(file instanceof Blob)) {
    throw new Error('No file uploaded');
  }

  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: doc } = await supabase
    .from('documents')
    .select(
      'id, ticket_id, storage_path, category, shared_at, available_at, uploaded_by',
    )
    .eq('id', documentId)
    .maybeSingle();
  if (!doc) throw new Error('Document not found');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = profile?.role;

  const { data: ticket } = await supabase
    .from('tickets')
    .select('id, client_id, stage, public_ref')
    .eq('id', doc.ticket_id)
    .maybeSingle();
  if (!ticket) throw new Error('Ticket not found');

  const stageBeforeReplaceDraft = doc.category === 'draft' ? ticket.stage : null;

  if (role === 'client') {
    if (ticket.client_id !== user.id) throw new Error('Forbidden');
    if (doc.uploaded_by !== user.id) throw new Error('Forbidden');
    if (doc.category !== 'client_upload') throw new Error('Forbidden');
  } else if (role !== 'admin' && role !== 'employee') {
    throw new Error('Forbidden');
  }

  const filename =
    typeof (file as File).name === 'string' ? (file as File).name : 'upload.bin';
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const newPath = `${doc.ticket_id}/${Date.now()}-${safeName}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage.from('tax-documents').upload(newPath, buf, {
    contentType: (file as File).type || 'application/octet-stream',
    upsert: false,
  });
  if (upErr) throw new Error(upErr.message);

  const { error: updErr } = await supabase
    .from('documents')
    .update({
      storage_path: newPath,
      original_filename: filename,
      mime_type: (file as File).type || null,
      size_bytes: buf.length,
      uploaded_by: user.id,
      shared_at: doc.shared_at,
      available_at: doc.available_at,
    })
    .eq('id', documentId);

  if (updErr) {
    await supabase.storage.from('tax-documents').remove([newPath]);
    throw new Error(updErr.message);
  }

  const { error: rmErr } = await supabase.storage.from('tax-documents').remove([doc.storage_path]);
  if (rmErr) {
    console.error('replaceTicketDocumentAction: failed to remove old storage object', rmErr.message);
  }

  if (doc.category === 'draft') {
    await advanceToDraftSentOnDraftShareIfNeeded(supabase, doc.ticket_id, 'Draft updated');
  }

  if (
    doc.category === 'draft' &&
    (role === 'admin' || role === 'employee') &&
    stageBeforeReplaceDraft === 'draft-sent'
  ) {
    const { error: nErr } = await supabase.rpc('create_ticket_notification', {
      p_recipient_id: ticket.client_id,
      p_ticket_id: doc.ticket_id,
      p_type: 'document',
      p_title: 'Draft return ready',
      p_body: `Your draft return is ready. Please log in to review and approve. Case #${ticket.public_ref}.`,
    });
    if (nErr) console.error('create_ticket_notification:', nErr.message);
  }

  const ticketId = doc.ticket_id;
  revalidatePath('/admin/tickets/' + ticketId);
  revalidatePath('/employee/tickets/' + ticketId);
  revalidatePath('/client/cases/' + ticketId);
}

export async function deleteTicketDocumentAction(documentId: string) {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: doc } = await supabase
    .from('documents')
    .select('id, ticket_id, storage_path')
    .eq('id', documentId)
    .maybeSingle();
  if (!doc) throw new Error('Document not found');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = profile?.role;

  const { data: ticket } = await supabase
    .from('tickets')
    .select('id, client_id, assigned_employee_id')
    .eq('id', doc.ticket_id)
    .maybeSingle();
  if (!ticket) throw new Error('Ticket not found');

  if (role === 'client') {
    if (ticket.client_id !== user.id) throw new Error('Forbidden');
  } else if (role !== 'admin' && role !== 'employee') {
    throw new Error('Forbidden');
  }

  const { error: storageError } = await supabase.storage.from('tax-documents').remove([doc.storage_path]);
  if (storageError) throw new Error(storageError.message);

  const { error: deleteError } = await supabase.from('documents').delete().eq('id', documentId);
  if (deleteError) throw new Error(deleteError.message);

  revalidatePath('/admin/tickets/' + doc.ticket_id);
  revalidatePath('/employee/tickets/' + doc.ticket_id);
  revalidatePath('/client/cases/' + doc.ticket_id);
}
