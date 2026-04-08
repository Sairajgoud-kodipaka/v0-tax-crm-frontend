'use server';

import { sendTicketMessageAction } from '@/app/actions/messages';
import {
  clientDraftResponseAction,
  deleteTicketByAdminAction,
  updateTicketStageAction,
} from '@/app/actions/tickets';
import { markInvoicePaidMvpAction } from '@/app/actions/payments';
import {
  deleteTicketDocumentAction,
  replaceTicketDocumentAction,
  uploadTicketDocumentAction,
} from '@/app/actions/documents';
import type { TicketStage } from '@/lib/types';
import { STAGE_NAVIGATION } from '@/lib/constants';

export async function sendStaffMessageFormAction(formData: FormData) {
  const ticketId = formData.get('ticketId') as string;
  const body = (formData.get('body') as string) ?? '';
  const isInternal = formData.get('internal') === 'on';
  if (!ticketId || !body.trim()) {
    throw new Error('Message required');
  }
  await sendTicketMessageAction(ticketId, body, { isInternal });
}

export async function updateStageFormAction(formData: FormData) {
  const ticketId = formData.get('ticketId') as string;
  const toStage = formData.get('toStage') as TicketStage;
  const note = (formData.get('note') as string) || undefined;
  if (!ticketId || !toStage) throw new Error('Invalid');
  const valid = STAGE_NAVIGATION.some((s) => s.id === toStage);
  if (!valid) throw new Error('Invalid stage');
  await updateTicketStageAction(ticketId, toStage, note);
}

export async function sendClientMessageFormAction(formData: FormData) {
  const ticketId = formData.get('ticketId') as string;
  const body = (formData.get('body') as string) ?? '';
  if (!ticketId || !body.trim()) throw new Error('Message required');
  await sendTicketMessageAction(ticketId, body, { isInternal: false });
}

export async function clientDraftResponseFormAction(formData: FormData) {
  const ticketId = formData.get('ticketId') as string;
  const action = formData.get('action') as string;
  const body = (formData.get('body') as string) ?? '';
  if (!ticketId || (action !== 'approve' && action !== 'request_changes')) throw new Error('Invalid');
  await clientDraftResponseAction(ticketId, action as 'approve' | 'request_changes', {
    threadMessage: body.trim() || undefined,
  });
}

export async function payInvoiceFormAction(formData: FormData) {
  const invoiceId = formData.get('invoiceId') as string;
  const ticketId = formData.get('ticketId') as string;
  if (!invoiceId || !ticketId) throw new Error('Invalid');
  await markInvoicePaidMvpAction(invoiceId, ticketId);
}

export async function clientUploadDocumentFormAction(formData: FormData) {
  const ticketId = formData.get('ticketId') as string;
  if (!ticketId) throw new Error('Invalid');
  await uploadTicketDocumentAction(ticketId, formData, 'client_upload');
}

export async function clientDeleteDocumentFormAction(formData: FormData) {
  const documentId = formData.get('documentId') as string;
  if (!documentId) throw new Error('Invalid');
  await deleteTicketDocumentAction(documentId);
}

export async function deleteTicketDocumentFormAction(formData: FormData) {
  const documentId = formData.get('documentId') as string;
  if (!documentId) throw new Error('Invalid');
  await deleteTicketDocumentAction(documentId);
}

/** Shared by client (own uploads) and staff (any document they can access). */
export async function replaceTicketDocumentFormAction(formData: FormData) {
  await replaceTicketDocumentAction(formData);
}

export async function staffUploadDraftFormAction(formData: FormData) {
  const ticketId = formData.get('ticketId') as string;
  if (!ticketId) throw new Error('Invalid');
  await uploadTicketDocumentAction(ticketId, formData, 'draft');
}

export async function staffUploadInvoiceFileFormAction(formData: FormData) {
  const ticketId = formData.get('ticketId') as string;
  if (!ticketId) throw new Error('Invalid');
  await uploadTicketDocumentAction(ticketId, formData, 'other');
}

export async function staffUploadFinalPackageFormAction(formData: FormData) {
  const ticketId = formData.get('ticketId') as string;
  if (!ticketId) throw new Error('Invalid');
  await uploadTicketDocumentAction(ticketId, formData, 'final');
}

export async function adminDeleteTicketFormAction(formData: FormData) {
  const ticketId = formData.get('ticketId') as string;
  if (!ticketId) throw new Error('Invalid');
  await deleteTicketByAdminAction(ticketId);
}
