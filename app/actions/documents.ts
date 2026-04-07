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
