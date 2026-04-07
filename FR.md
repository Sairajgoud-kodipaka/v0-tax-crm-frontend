# Functional Requirements — Tax CRM

Use checkboxes to track implementation or sign-off. IDs are stable for traceability (tests, tickets).

---

## 1. Identity, access, and security

- [ ] **FRS-AUTH-01** Authenticate users with email and password via managed auth.
- [ ] **FRS-AUTH-02** Support roles: client, employee, admin; role stored on user profile.
- [ ] **FRS-AUTH-03** Restrict routes and UI by role; redirect cross-role access attempts.
- [ ] **FRS-AUTH-04** Enforce data access: client sees own tickets; employee sees assigned tickets; admin per product rules.
- [ ] **FRS-AUTH-05** Secure sessions (refresh where needed) and sign-out.
- [ ] **FRS-AUTH-06** Allow admin (or server-only flows) to provision employee accounts without exposing privileged keys to the browser.

---

## 2. User and profile management

- [ ] **FRS-PROF-01** Maintain a profile per user (name, email, role, etc.).
- [ ] **FRS-PROF-02** Link each ticket to a client and optionally an assigned employee.
- [ ] **FRS-PROF-03** Staff can view profile data needed for queues, assignment, and ticket headers.

---

## 3. Client acquisition and invitations

- [ ] **FRS-INV-01** Employees can create invitation links associated with themselves.
- [ ] **FRS-INV-02** Admins can create invitations for a chosen employee.
- [ ] **FRS-INV-03** Signup with a valid invite token consumes the invitation and associates the user correctly.
- [ ] **FRS-INV-04** Support validating an invite before signup (peek / validate flow).

---

## 4. Tickets (cases) and workflow

- [ ] **FRS-TKT-01** Clients can create and view their tax tickets (filing type, year, subject, etc.).
- [ ] **FRS-TKT-02** Tickets have a stage from the defined pipeline (e.g. Pending Info through Closed).
- [ ] **FRS-TKT-03** Tickets support priority and status where modeled.
- [ ] **FRS-TKT-04** Staff can update ticket stage with optional notes; stage changes are auditable (history).
- [ ] **FRS-TKT-05** Queues list tickets by stage; employee queues respect assignment; admin queues per rules.
- [ ] **FRS-TKT-06** Client and staff ticket detail expose agreed areas: messages, organizer, documents, drafts, invoices, final documents.
- [ ] **FRS-TKT-07** Display a stable public reference (e.g. ticket #) for support and UI.

---

## 5. Messaging

- [ ] **FRS-MSG-01** Clients can post ticket messages visible to the firm (non-internal).
- [ ] **FRS-MSG-02** Staff can post ticket messages and mark internal notes hidden from the client UI.
- [ ] **FRS-MSG-03** Persist sender identity and timestamps; list messages in chronological order.
- [ ] **FRS-MSG-04** Optional: aggregate Messages views across tickets for client and employee portals.

---

## 6. Tax organizer

- [ ] **FRS-ORG-01** Store a tax organizer snapshot (structured data) per ticket.
- [ ] **FRS-ORG-02** Multi-level organizer UI (sections → subsections → forms) for client and staff on the same ticket.
- [ ] **FRS-ORG-03** Client can save organizer progress; server persists per ticket.
- [ ] **FRS-ORG-04** Load existing organizer answers when opening a case.

---

## 7. Documents and files

- [ ] **FRS-DOC-01** Upload documents for a ticket to object storage with database metadata.
- [ ] **FRS-DOC-02** Categorize documents (e.g. client upload, draft, final); filter visibility for client vs staff.
- [ ] **FRS-DOC-03** Authorized users download via time-limited signed URLs.
- [ ] **FRS-DOC-04** Client documents hub across tickets where applicable.

---

## 8. Invoicing and payments

- [ ] **FRS-BIL-01** Maintain invoices per ticket (amount, status, due date, etc.).
- [ ] **FRS-BIL-02** Clients can complete payment through a server-controlled path (e.g. RPC), including MVP/manual payment if configured.
- [ ] **FRS-BIL-03** Payment updates invoice and payment records per database rules.

---

## 9. Admin and operations

- [ ] **FRS-ADM-01** Admins manage employees (create, deactivate, or equivalent per policy).
- [ ] **FRS-ADM-02** Admins access operational reports (tickets, payments, aggregates).
- [ ] **FRS-ADM-03** Admins access audit or activity views (e.g. ticket history–based).
- [ ] **FRS-ADM-04** Admins access settings or configuration per product definition.

---

## 10. Client portal (engagement)

- [ ] **FRS-CLT-01** Client home/dashboard after login.
- [ ] **FRS-CLT-02** Engagement pages as scoped: tax videos, cashback, feedback, contact.
- [ ] **FRS-CLT-03** Navigation to cases, messages, documents, and organizer from the client shell.

---

## 11. Employee portal

- [ ] **FRS-EMP-01** Employee dashboard or stats aligned to workload.
- [ ] **FRS-EMP-02** Employee invite flow, queues, and assigned ticket detail.
- [ ] **FRS-EMP-03** Case work within permissions: messages, stage updates, organizer, documents.

---

## 12. Cross-cutting

- [ ] **FRS-X-01** Single source of truth in the database; row-level security aligned with ticket access rules.
- [ ] **FRS-X-02** Sensitive mutations run server-side with authorization checks.
- [ ] **FRS-X-03** Filing types and departments available where UI or reporting needs them.
- [ ] **FRS-X-04** Optional: email notifications, realtime messaging, external payment provider—add explicit FRs when in scope.

---

## Notes

- Rename or split IDs if your team uses a different numbering scheme.
- Mark items `[x]` when implemented and verified; link PRs or test cases in your tracker if needed.
