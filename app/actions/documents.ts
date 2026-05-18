'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { updateTicketStageAction } from '@/app/actions/tickets';
import { logTicketActivityAction } from '@/app/actions/activity';
import { createTicketNotificationWithEmail } from '@/lib/email/ticket-notification-email';
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

  // Log activity
  let actionType: 'document_uploaded' | 'draft_sent' | 'final_document_available' = 'document_uploaded';
  let isVisibleToClient = false;
  if (category === 'draft') {
    actionType = 'draft_sent';
    isVisibleToClient = true;
  } else if (category === 'final') {
    actionType = 'final_document_available';
    isVisibleToClient = true;
  }
  await logTicketActivityAction({
    ticketId,
    actionType,
    details: { file_name: filename },
    isVisibleToClient,
    relatedEntityId: null, // Could fetch document id
    relatedEntityType: 'document',
  });

  if (category === 'draft') {
    await advanceToDraftSentOnDraftShareIfNeeded(supabase, ticketId, 'Draft uploaded');
  }

  if (
    category === 'draft' &&
    (role === 'admin' || role === 'employee') &&
    stageBeforeDraftFlow === 'draft-sent'
  ) {
    const res = await createTicketNotificationWithEmail(supabase, {
      p_recipient_id: ticket.client_id,
      p_ticket_id: ticketId,
      p_type: 'document',
      templateId: 'document-draft-ready-client',
      vars: { casePublicRef: String(ticket.public_ref) },
    });
    if (!res.ok) console.error('create_ticket_notification:', res.error);
  }

  if (
    category === 'client_upload' &&
    role === 'client' &&
    ticket.assigned_employee_id
  ) {
    const { data: clientProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();
    const nm = clientProfile?.full_name?.trim() || 'Client';
    const resUpload = await createTicketNotificationWithEmail(supabase, {
      p_recipient_id: ticket.assigned_employee_id,
      p_ticket_id: ticketId,
      p_type: 'document',
      templateId:
        ticket.stage === '8879-sent' ? 'document-client-upload-8879' : 'document-client-upload-employee',
      vars: { clientName: nm, casePublicRef: String(ticket.public_ref) },
    });
    if (!resUpload.ok) console.error('create_ticket_notification:', resUpload.error);
  }

  if (role === 'employee' || role === 'admin') {
    const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
    for (const admin of admins ?? []) {
      if (admin.id === user.id) continue;
      const resAdmin = await createTicketNotificationWithEmail(supabase, {
        p_recipient_id: admin.id,
        p_ticket_id: ticketId,
        p_type: 'document',
        templateId: 'document-updated-admin',
        vars: { casePublicRef: String(ticket.public_ref) },
      });
      if (!resAdmin.ok) console.error('create_ticket_notification:', resAdmin.error);
    }
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

  // Log activity
  await logTicketActivityAction({
    ticketId: doc.ticket_id,
    actionType: 'document_updated',
    details: { file_name: filename },
    isVisibleToClient: doc.category === 'draft', // Only drafts are visible
    relatedEntityId: documentId,
    relatedEntityType: 'document',
  });

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
    const resReplace = await createTicketNotificationWithEmail(supabase, {
      p_recipient_id: ticket.client_id,
      p_ticket_id: doc.ticket_id,
      p_type: 'document',
      templateId: 'document-draft-ready-client',
      vars: { casePublicRef: String(ticket.public_ref) },
    });
    if (!resReplace.ok) console.error('create_ticket_notification:', resReplace.error);
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
}

export async function requestDocumentAction(ticketId: string, documentType: string, note?: string) {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = profile?.role;
  if (role !== 'admin' && role !== 'employee') throw new Error('Forbidden');

  // Log activity
  await logTicketActivityAction({
    ticketId,
    actionType: 'document_requested',
    details: { document_type: documentType, note: note ?? null },
    isVisibleToClient: true,
    relatedEntityId: null,
    relatedEntityType: 'document',
  });

  // Send notification to client
  const { data: ticket } = await supabase.from('tickets').select('client_id, public_ref').eq('id', ticketId).single();
  if (ticket) {
    const resReq = await createTicketNotificationWithEmail(supabase, {
      p_recipient_id: ticket.client_id,
      p_ticket_id: ticketId,
      p_type: 'document',
      templateId: 'document-requested-client',
      vars: {
        documentType,
        note: note ?? '',
        casePublicRef: String(ticket.public_ref),
      },
    });
    if (!resReq.ok) console.error('create_ticket_notification:', resReq.error);
  }

  revalidatePath('/admin/tickets/' + ticketId);
  revalidatePath('/employee/tickets/' + ticketId);
  revalidatePath('/client/cases/' + ticketId);
}
