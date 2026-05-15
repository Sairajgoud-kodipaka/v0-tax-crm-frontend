'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { logTicketActivityAction } from '@/app/actions/activity';

export async function saveTaxOrganizerAction(ticketId: string, answers: Record<string, unknown>) {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = profile?.role;

  const { data: ticket } = await supabase.from('tickets').select('client_id').eq('id', ticketId).single();
  if (!ticket) throw new Error('Not found');

  let clientIdForRow = ticket.client_id as string;

  if (role === 'client') {
    if (ticket.client_id !== user.id) throw new Error('Forbidden');
  } else if (role === 'admin' || role === 'employee') {
    clientIdForRow = ticket.client_id as string;
  } else {
    throw new Error('Forbidden');
  }

  const { error } = await supabase.from('tax_organizer_snapshots').upsert(
    {
      ticket_id: ticketId,
      client_id: clientIdForRow,
      answers: answers as never,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'ticket_id' },
  );

  if (error) throw new Error(error.message);

  // Log activity
  await logTicketActivityAction({
    ticketId,
    actionType: 'organizer_updated',
    details: { sections_updated: Object.keys(answers) },
    isVisibleToClient: false, // Internal update
    relatedEntityId: null,
    relatedEntityType: 'organizer',
  });

  revalidatePath('/client/cases/' + ticketId);
  revalidatePath('/admin/tickets/' + ticketId);
  revalidatePath('/employee/tickets/' + ticketId);
}

export async function getTaxOrganizerAnswersAction(ticketId: string): Promise<Record<string, unknown>> {
  const supabase = createClient(await cookies());
  const { data } = await supabase.from('tax_organizer_snapshots').select('answers').eq('ticket_id', ticketId).maybeSingle();
  return (data?.answers as Record<string, unknown>) ?? {};
}

export async function generateTaxOrganizerPDFAction(ticketId: string) {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = profile?.role;

  // Only allow staff to generate PDFs
  if (role !== 'admin' && role !== 'employee') {
    throw new Error('Only staff can generate tax organizer PDFs');
  }

  const { data: ticket } = await supabase
    .from('tickets')
    .select('client_id, public_ref, profiles!tickets_client_id_fkey(full_name, email)')
    .eq('id', ticketId)
    .single();
  if (!ticket) throw new Error('Ticket not found');

  const { data: organizerData } = await supabase
    .from('tax_organizer_snapshots')
    .select('answers')
    .eq('ticket_id', ticketId)
    .maybeSingle();

  if (!organizerData?.answers) {
    throw new Error('No tax organizer data found for this ticket');
  }

  // Return the data needed to generate PDF on client side
  return {
    ticketId,
    clientName: (ticket.profiles as any)?.full_name || (ticket.profiles as any)?.email || 'Client',
    ticketRef: ticket.public_ref,
    answers: organizerData.answers as Record<string, unknown>,
  };
}

export async function saveTaxOrganizerPDFAction(
  ticketId: string,
  pdfBlob: Blob,
  filename: string
): Promise<{ success: boolean; documentId?: string }> {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin' && profile?.role !== 'employee') {
    throw new Error('Only staff can save tax organizer PDFs');
  }

  try {
    // Convert blob to base64 for storage
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`tax-organizers/${ticketId}/${filename}`, pdfBlob, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(uploadData.path);

    // Save document record
    const { data: documentData, error: docError } = await supabase
      .from('documents')
      .insert({
        ticket_id: ticketId,
        name: filename,
        url: publicUrl,
        category: 'staff_generated',
        uploaded_by: user.id,
        is_staff_only: true, // Hide from client
      })
      .select('id')
      .single();

    if (docError) {
      throw new Error(`Document save failed: ${docError.message}`);
    }

    // Log activity
    await logTicketActivityAction({
      ticketId,
      actionType: 'document_generated',
      details: { 
        document_type: 'tax_organizer_pdf',
        filename,
        generated_by: user.id 
      },
      isVisibleToClient: false,
      relatedEntityId: documentData.id,
      relatedEntityType: 'document',
    });

    revalidatePath('/admin/tickets/' + ticketId);
    revalidatePath('/employee/tickets/' + ticketId);

    return { success: true, documentId: documentData.id };
  } catch (error) {
    console.error('Error saving PDF:', error);
    return { success: false };
  }
}
