'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

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
    .select('id, client_id, assigned_employee_id')
    .eq('id', ticketId)
    .maybeSingle();
  if (!ticket) throw new Error('Ticket not found');

  if (category === 'client_upload') {
    if (role === 'client') {
      if (ticket.client_id !== user.id) throw new Error('Forbidden');
    } else if (role !== 'admin' && role !== 'employee') {
      throw new Error('Forbidden');
    }
  } else if (category === 'draft' || category === 'final' || category === 'other') {
    if (role === 'employee') {
      if (ticket.assigned_employee_id !== user.id) throw new Error('Forbidden');
    } else if (role !== 'admin') {
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
  } else if (role === 'employee') {
    if (ticket.assigned_employee_id !== user.id) throw new Error('Forbidden');
  } else if (role !== 'admin') {
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
