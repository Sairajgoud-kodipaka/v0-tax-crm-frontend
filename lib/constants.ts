import { TicketStage, TicketStatus, UserRole, TicketPriority } from './types';

/** Radix Select cannot use empty string as a value — map to null in server actions. */
export const UNASSIGNED_SELECT_VALUE = '__unassigned__';

export function parseAssignedEmployeeId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === UNASSIGNED_SELECT_VALUE) return null;
  return trimmed;
}

export const TICKET_STAGES: Record<TicketStage, { label: string; color: string; description: string }> = {
  'pending-info': {
    label: 'Pending Info',
    color: 'bg-primary/10 text-primary border border-primary/20',
    description: 'Waiting for client information',
  },
  'under-prep': {
    label: 'Under Prep',
    color: 'bg-secondary/15 text-secondary-foreground border border-secondary/30',
    description: 'Tax return in preparation',
  },
  'draft-sent': {
    label: 'Draft Sent',
    color: 'bg-muted text-foreground border border-border',
    description: 'Draft sent to client',
  },
  'awaiting-approval': {
    label: 'Awaiting Approval',
    color: 'bg-primary/5 text-primary border border-primary/25',
    description: 'Awaiting client approval',
  },
  'payment-received': {
    label: 'Payment Received',
    color: 'bg-secondary/10 text-secondary-foreground border border-secondary/25',
    description: 'Payment received',
  },
  '8879-sent': {
    label: '8879 Sent',
    color: 'bg-muted text-muted-foreground border border-border',
    description: 'Form 8879 sent to client',
  },
  '8879-received': {
    label: '8879 Received',
    color: 'bg-primary/10 text-primary border border-primary/30',
    description: 'Form 8879 received and signed',
  },
  'filing-completed': {
    label: 'Filing Completed',
    color: 'bg-chart-5/15 text-foreground border border-chart-5/35',
    description: 'Return filed with IRS',
  },
  'closed': {
    label: 'Closed',
    color: 'bg-muted/90 text-muted-foreground border border-border',
    description: 'Case closed',
  },
};

export const TICKET_STATUSES: Record<TicketStatus, { label: string; icon: string }> = {
  'open': { label: 'Open', icon: 'circle-open' },
  'in-progress': { label: 'In Progress', icon: 'play-circle' },
  'pending': { label: 'Pending', icon: 'clock' },
  'completed': { label: 'Completed', icon: 'check-circle' },
  'on-hold': { label: 'On Hold', icon: 'pause-circle' },
};

export const PRIORITIES: Record<TicketPriority, { label: string; color: string; value: number }> = {
  'low': { label: 'Low', color: 'text-muted-foreground', value: 1 },
  'medium': { label: 'Medium', color: 'text-foreground', value: 2 },
  'high': { label: 'High', color: 'text-primary', value: 3 },
  'critical': { label: 'Critical', color: 'text-destructive', value: 4 },
};

export const FILING_TYPES = [
  'US Individual Income Tax Filing',
  'US Individual Amended Income Tax Filing',
  'US Individual Income Tax Planning',
  'US FBAR Filing',
  'US Business Tax Filing',
  'US Business Tax Filing - Partnership',
  'US Business Tax Filing - LLC',
  'US Business Tax Filing - S-corp',
  'US Business Tax Filing - C-corp',
  'US Business Incorporation',
  'US Business Accounting/Bookkeeping Services',
  'US FICA Service',
  'US Tax Representation for Audits/Notices',
  'Indian Individual Income Tax Filing',
];

export const ROLES: Record<UserRole, { label: string; description: string }> = {
  'admin': { label: 'Administrator', description: 'Full system access' },
  'employee': { label: 'Employee', description: 'Can manage cases and view reports' },
  'client': { label: 'Client', description: 'Can view own cases and submit documents' },
};

export const TAX_ORGANIZER_SECTIONS = [
  { id: 'personal-info', label: 'Personal Information' },
  { id: 'income', label: 'Income' },
  { id: 'deductions', label: 'Deductions' },
  { id: 'investments', label: 'Investments & Assets' },
  { id: 'business', label: 'Business Information' },
  { id: 'credits', label: 'Tax Credits' },
  { id: 'prior-year', label: 'Prior Year Information' },
];

export const DEPARTMENTS = [
  'Individual Tax',
  'Business Tax',
  'Audit & Assurance',
  'Client Services',
  'Compliance',
  'Administration',
];

// Unified sidebar navigation for both Admin and Employee - shows all stages
export const STAGE_NAVIGATION = [
  { id: 'pending-info', label: 'Pending Info' },
  { id: 'under-prep', label: 'Under Prep' },
  { id: 'draft-sent', label: 'Draft Sent' },
  { id: 'awaiting-approval', label: 'Awaiting Approval' },
  { id: 'payment-received', label: 'Payment Received' },
  { id: '8879-sent', label: '8879 Sent' },
  { id: '8879-received', label: '8879 Received' },
  { id: 'filing-completed', label: 'Filing Completed' },
  { id: 'closed', label: 'Closed' },
];

export const ADMIN_ROUTES = [
  { href: '/admin', label: 'Dashboard', icon: 'grid' },
  { href: '/admin/clients', label: 'Clients', icon: 'contact' },
  { href: '/admin/employees', label: 'Employees', icon: 'users' },
  { href: '/admin/reports', label: 'Reports', icon: 'bar-chart' },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: 'log' },
  { href: '/admin/settings', label: 'Settings', icon: 'settings' },
];

export const EMPLOYEE_ROUTES = [
  { href: '/employee', label: 'Dashboard', icon: 'grid' },
  { href: '/employee/clients', label: 'Clients', icon: 'contact' },
  { href: '/employee/invite', label: 'Invite Client', icon: 'users' },
  { href: '/employee/messages', label: 'Messages', icon: 'mail' },
];

/** Client portal: marketing / help links — not employee workflow stages */
export const CLIENT_ROUTES = [
  { href: '/client', label: 'Home' },
  { href: '/client/videos', label: 'Tax Videos for NRI' },
  { href: '/client/cashback', label: 'Get $10 Cash Back' },
  { href: '/client/feedback', label: 'Provide Feedback' },
  { href: '/client/contact', label: 'Contact Us' },
];

