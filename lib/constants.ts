import { TicketStage, TicketStatus, UserRole, TicketPriority } from './types';

export const TICKET_STAGES: Record<TicketStage, { label: string; color: string; description: string }> = {
  'pending-info': { label: 'Pending Info', color: 'bg-blue-100 text-blue-800', description: 'Waiting for client information' },
  'under-prep': { label: 'Under Prep', color: 'bg-purple-100 text-purple-800', description: 'Tax return in preparation' },
  'draft-sent': { label: 'Draft Sent', color: 'bg-yellow-100 text-yellow-800', description: 'Draft sent to client' },
  'awaiting-approval': { label: 'Awaiting Approval', color: 'bg-orange-100 text-orange-800', description: 'Awaiting client approval' },
  'payment-received': { label: 'Payment Received', color: 'bg-teal-100 text-teal-800', description: 'Payment received' },
  '8879-sent': { label: '8879 Sent', color: 'bg-cyan-100 text-cyan-800', description: 'Form 8879 sent to client' },
  '8879-received': { label: '8879 Received', color: 'bg-green-100 text-green-800', description: 'Form 8879 received and signed' },
  'filing-completed': { label: 'Filing Completed', color: 'bg-emerald-100 text-emerald-800', description: 'Return filed with IRS' },
  'closed': { label: 'Closed', color: 'bg-gray-100 text-gray-800', description: 'Case closed' },
};

export const TICKET_STATUSES: Record<TicketStatus, { label: string; icon: string }> = {
  'open': { label: 'Open', icon: 'circle-open' },
  'in-progress': { label: 'In Progress', icon: 'play-circle' },
  'pending': { label: 'Pending', icon: 'clock' },
  'completed': { label: 'Completed', icon: 'check-circle' },
  'on-hold': { label: 'On Hold', icon: 'pause-circle' },
};

export const PRIORITIES: Record<TicketPriority, { label: string; color: string; value: number }> = {
  'low': { label: 'Low', color: 'text-blue-600', value: 1 },
  'medium': { label: 'Medium', color: 'text-yellow-600', value: 2 },
  'high': { label: 'High', color: 'text-orange-600', value: 3 },
  'critical': { label: 'Critical', color: 'text-red-600', value: 4 },
};

export const FILING_TYPES = [
  'Individual 1040',
  'C-Corporation 1120',
  'S-Corporation 1120-S',
  'Partnership 1065',
  'LLC Pass-Through',
  'Non-Profit 990',
  'Estate 1041',
  'Trust 1041',
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
  { href: '/admin/employees', label: 'Employees', icon: 'users' },
  { href: '/admin/reports', label: 'Reports', icon: 'bar-chart' },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: 'log' },
  { href: '/admin/settings', label: 'Settings', icon: 'settings' },
];

export const EMPLOYEE_ROUTES = [
  { href: '/employee', label: 'Dashboard', icon: 'grid' },
  { href: '/employee/messages', label: 'Messages', icon: 'mail' },
];

export const CLIENT_ROUTES = [
  { href: '/client', label: 'My Cases', icon: 'briefcase' },
  { href: '/client/documents', label: 'Documents', icon: 'file' },
  { href: '/client/messages', label: 'Messages', icon: 'mail' },
  { href: '/client/tax-organizer', label: 'Tax Organizer', icon: 'form' },
];

export const DEMO_CREDENTIALS = [
  {
    email: 'admin@taxcrm.com',
    password: 'admin123',
    role: 'admin' as UserRole,
    name: 'Admin User',
  },
  {
    email: 'employee@taxcrm.com',
    password: 'employee123',
    role: 'employee' as UserRole,
    name: 'Employee User',
  },
  {
    email: 'client@taxcrm.com',
    password: 'client123',
    role: 'client' as UserRole,
    name: 'Client User',
  },
];
