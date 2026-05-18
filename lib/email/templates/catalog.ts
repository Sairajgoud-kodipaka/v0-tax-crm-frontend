/**
 * Transactional email + in-app notification copy (single source of truth).
 *
 * ---------------------------------------------------------------------------
 * APPROVAL INDEX — edit `buildTemplate` cases below to change wording.
 * Each row: who receives it and when it fires.
 * ---------------------------------------------------------------------------
 * | id                              | Recipient   | When |
 * |---------------------------------|------------|------|
 * | client-stage-under-prep         | Client     | Staff moves case to Under Prep |
 * | client-stage-draft-sent         | Client     | Staff moves case to Draft Sent |
 * | client-stage-8879-sent          | Client     | Staff moves case to 8879 Sent |
 * | client-stage-filing-completed   | Client     | Staff moves case to Filing Completed |
 * | client-stage-closed             | Client     | Staff moves case to Closed |
 * | staff-stage-move-assignee       | Assignee   | Another user moved the case (not self) |
 * | staff-stage-move-admin          | Each admin | Same move (excludes actor) |
 * | message-client-to-assignee      | Assignee   | Client posts non-internal message |
 * | message-preparer-to-client      | Client     | Employee posts client-visible message |
 * | message-admin-to-client         | Client     | Admin posts client-visible message |
 * | message-admin-note-to-assignee  | Assignee   | Admin posts internal note (assignee) |
 * | message-mention-internal        | Staff      | @mention in internal thread |
 * | escalation-to-admin             | Admins     | Staff escalates internal thread |
 * | document-draft-ready-client     | Client     | Staff replaces/shares draft while case in Draft Sent |
 * | document-client-upload-employee | Assignee | Client uploads docs (normal) |
 * | document-client-upload-8879     | Assignee | Client uploads signed 8879 |
 * | document-updated-admin          | Admins     | Staff changed ticket documents |
 * | document-requested-client       | Client     | Staff requests a document |
 * | staff-draft-review-assignee     | Assignee   | Another staffer approves/rejects draft |
 * | employee-client-info-submitted  | Assignee   | Client submitted organizer + docs |
 * | employee-client-draft-approved  | Assignee   | Client approved draft (no extra thread msg) |
 * | payment-assignee                | Assignee   | Client paid invoice (MVP) |
 * | payment-admin                   | Each admin | Same payment (amount in body) |
 * | staff-new-client-case           | Each staff | Client opened a new case |
 * ---------------------------------------------------------------------------
 */

import type { TicketStage } from '@/lib/types';

export type EmailTemplateId =
  | 'client-stage-under-prep'
  | 'client-stage-draft-sent'
  | 'client-stage-8879-sent'
  | 'client-stage-filing-completed'
  | 'client-stage-closed'
  | 'staff-stage-move-assignee'
  | 'staff-stage-move-admin'
  | 'message-client-to-assignee'
  | 'message-preparer-to-client'
  | 'message-admin-to-client'
  | 'message-admin-note-to-assignee'
  | 'message-mention-internal'
  | 'escalation-to-admin'
  | 'document-draft-ready-client'
  | 'document-client-upload-employee'
  | 'document-client-upload-8879'
  | 'document-updated-admin'
  | 'document-requested-client'
  | 'staff-draft-review-approved-assignee'
  | 'staff-draft-review-rejected-assignee'
  | 'employee-client-info-submitted'
  | 'employee-client-draft-approved'
  | 'payment-assignee'
  | 'payment-admin'
  | 'staff-new-client-case';

/** Plain string vars only — each template documents required keys in `buildTemplate`. */
export type TemplateVars = Record<string, string>;

export type BuiltNotificationEmail = {
  /** Shown as in-app notification title + email subject */
  notificationTitle: string;
  /** Shown as in-app notification body + email main text */
  notificationBody: string;
};

function v(vars: TemplateVars, key: string): string {
  const x = vars[key];
  return x ?? '';
}

export function templateIdForClientStage(stage: TicketStage): EmailTemplateId | null {
  switch (stage) {
    case 'under-prep':
      return 'client-stage-under-prep';
    case 'draft-sent':
      return 'client-stage-draft-sent';
    case '8879-sent':
      return 'client-stage-8879-sent';
    case 'filing-completed':
      return 'client-stage-filing-completed';
    case 'closed':
      return 'client-stage-closed';
    default:
      return null;
  }
}

/**
 * Build title + body for both Supabase `create_ticket_notification` and SMTP.
 * Keep wording aligned with DB trigger `trg_notify_on_ticket_history` for stage templates.
 */
export function buildTemplate(id: EmailTemplateId, vars: TemplateVars): BuiltNotificationEmail {
  switch (id) {
    case 'client-stage-under-prep':
      return {
        notificationTitle: 'Return is being prepared',
        notificationBody:
          "Your return is now being prepared. We'll notify you when your draft is ready.",
      };
    case 'client-stage-draft-sent':
      return {
        notificationTitle: 'Draft return ready',
        notificationBody: 'Your draft return is ready. Please log in to review and approve.',
      };
    case 'client-stage-8879-sent':
      return {
        notificationTitle: 'Form 8879 ready',
        notificationBody: 'Form 8879 is ready for your signature. Please log in to sign and return it.',
      };
    case 'client-stage-filing-completed':
      return {
        notificationTitle: 'Return filed',
        notificationBody:
          'Your tax return has been successfully filed! Log in to download your copy.',
      };
    case 'client-stage-closed':
      return {
        notificationTitle: 'Case closed',
        notificationBody: 'Your case has been closed. All documents are available in your portal.',
      };

    case 'staff-stage-move-assignee':
    case 'staff-stage-move-admin': {
      const ref = v(vars, 'casePublicRef');
      const stage = v(vars, 'toStage');
      const actor = v(vars, 'actorName');
      return {
        notificationTitle: 'Stage move needed',
        notificationBody: `Case #${ref} moved to ${stage} by ${actor}.`,
      };
    }

    case 'message-client-to-assignee':
      return {
        notificationTitle: `${v(vars, 'clientName')} sent you a message`,
        notificationBody: v(vars, 'caseLabel'),
      };

    case 'message-preparer-to-client':
      return {
        notificationTitle: 'Your preparer sent you a message',
        notificationBody: v(vars, 'caseLabel'),
      };

    case 'message-admin-to-client':
      return {
        notificationTitle: 'Staff sent you a message',
        notificationBody: v(vars, 'caseLabel'),
      };

    case 'message-admin-note-to-assignee':
      return {
        notificationTitle: 'Admin left a note',
        notificationBody: `Admin left a note on ${v(vars, 'caseLabel')}.`,
      };

    case 'message-mention-internal':
      return {
        notificationTitle: '@Mention in Preparer Notes',
        notificationBody: `${v(vars, 'staffName')} mentioned you in ${v(vars, 'caseLabel')}.`,
      };

    case 'escalation-to-admin':
      return {
        notificationTitle: 'Escalation',
        notificationBody: `${v(vars, 'staffName')} escalated an issue in Case #${v(vars, 'casePublicRef')}.`,
      };

    case 'document-draft-ready-client': {
      const ref = v(vars, 'casePublicRef');
      return {
        notificationTitle: 'Draft return ready',
        notificationBody: `Your draft return is ready. Please log in to review and approve. Case #${ref}.`,
      };
    }

    case 'document-client-upload-employee': {
      const nm = v(vars, 'clientName');
      const ref = v(vars, 'casePublicRef');
      return {
        notificationTitle: 'Client uploaded documents',
        notificationBody: `${nm} uploaded new documents on Case #${ref}.`,
      };
    }

    case 'document-client-upload-8879': {
      const nm = v(vars, 'clientName');
      const ref = v(vars, 'casePublicRef');
      return {
        notificationTitle: 'Signed Form 8879 uploaded',
        notificationBody: `${nm} uploaded signed Form 8879. Ready to file. Case #${ref}.`,
      };
    }

    case 'document-updated-admin': {
      const ref = v(vars, 'casePublicRef');
      return {
        notificationTitle: 'Ticket documents updated',
        notificationBody: `Documents were updated in Case #${ref}.`,
      };
    }

    case 'document-requested-client': {
      const doc = v(vars, 'documentType');
      const note = v(vars, 'note');
      const ref = v(vars, 'casePublicRef');
      const notePart = note ? ` - ${note}` : '';
      return {
        notificationTitle: 'Document Requested',
        notificationBody: `Please upload the requested document: ${doc}${notePart}. Case #${ref}.`,
      };
    }

    case 'staff-draft-review-approved-assignee': {
      const actor = v(vars, 'actorName');
      const ref = v(vars, 'casePublicRef');
      return {
        notificationTitle: 'Draft Approved',
        notificationBody: `Draft for #${ref} was approved by ${actor}.`,
      };
    }

    case 'staff-draft-review-rejected-assignee': {
      const actor = v(vars, 'actorName');
      const ref = v(vars, 'casePublicRef');
      return {
        notificationTitle: 'Draft Rejected',
        notificationBody: `Draft for #${ref} was rejected by ${actor}.`,
      };
    }

    case 'employee-client-info-submitted':
      return {
        notificationTitle: 'Client submitted information',
        notificationBody: `${v(vars, 'clientName')} has submitted their information and documents.`,
      };

    case 'employee-client-draft-approved':
      return {
        notificationTitle: 'Draft approved',
        notificationBody: `${v(vars, 'clientName')} approved their draft return. Ready for payment.`,
      };

    case 'payment-assignee':
      return {
        notificationTitle: 'Payment received',
        notificationBody: `Payment received from ${v(vars, 'clientName')} for Case #${v(vars, 'casePublicRef')}.`,
      };

    case 'payment-admin':
      return {
        notificationTitle: 'Payment received',
        notificationBody: `Payment received from ${v(vars, 'clientName')} — $${v(vars, 'amount')} for Case #${v(vars, 'casePublicRef')}.`,
      };

    case 'staff-new-client-case':
      return {
        notificationTitle: 'New client case',
        notificationBody: v(vars, 'summaryLine'),
      };
  }
}
