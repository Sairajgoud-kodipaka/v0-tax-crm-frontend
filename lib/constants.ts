import { TicketStage, TicketStatus, UserRole, TicketPriority } from './types';

export const TICKET_STAGES: Record<TicketStage, { label: string; color: string; description: string }> = {
  'intake': { label: 'Intake', color: 'bg-blue-100 text-blue-800', description: 'Initial client intake' },
  'document-collection': { label: 'Document Collection', color: 'bg-purple-100 text-purple-800', description: 'Gathering required documents' },
  'review': { label: 'Review', color: 'bg-yellow-100 text-yellow-800', description: 'Reviewing submitted documents' },
  'preparation': { label: 'Preparation', color: 'bg-orange-100 text-orange-800', description: 'Preparing tax return' },
  'filing': { label: 'Filing', color: 'bg-green-100 text-green-800', description: 'Filing the return' },
  'amendment': { label: 'Amendment', color: 'bg-red-100 text-red-800', description: 'Amendment processing' },
  'follow-up': { label: 'Follow-up', color: 'bg-cyan-100 text-cyan-800', description: 'Post-filing follow-up' },
  'closed': { label: 'Closed', color: 'bg-gray-100 text-gray-800', description: 'Case closed' },
  'on-hold': { label: 'On Hold', color: 'bg-gray-200 text-gray-700', description: 'Temporarily on hold' },
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

export const ADMIN_ROUTES = [
  { href: '/admin', label: 'Dashboard', icon: 'grid' },
  { href: '/admin/queues', label: 'Ticket Queues', icon: 'list' },
  { href: '/admin/employees', label: 'Employees', icon: 'users' },
  { href: '/admin/reports', label: 'Reports', icon: 'bar-chart' },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: 'log' },
  { href: '/admin/settings', label: 'Settings', icon: 'settings' },
];

export const EMPLOYEE_ROUTES = [
  { href: '/employee', label: 'Dashboard', icon: 'grid' },
  { href: '/employee/queues', label: 'My Queues', icon: 'list' },
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
