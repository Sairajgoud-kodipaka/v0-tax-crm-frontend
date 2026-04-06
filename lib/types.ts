// User and Authentication Types
export type UserRole = 'admin' | 'employee' | 'client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

// Ticket/Case Types
export type TicketStage = 
  | 'intake'
  | 'document-collection'
  | 'review'
  | 'preparation'
  | 'filing'
  | 'amendment'
  | 'follow-up'
  | 'closed'
  | 'on-hold';

export type TicketStatus = 'open' | 'in-progress' | 'pending' | 'completed' | 'on-hold';

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Ticket {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  subject: string;
  description: string;
  stage: TicketStage;
  status: TicketStatus;
  priority: TicketPriority;
  assignedToId?: string;
  assignedToName?: string;
  taxYear: number;
  filingType: string; // Individual, Corporate, Partnership, etc.
  documents: Document[];
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
}

export interface Document {
  id: string;
  ticketId: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface Message {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  attachments?: string[];
  createdAt: Date;
  isInternal: boolean;
}

// Tax Organizer Types
export interface TaxOrganizerResponse {
  id: string;
  clientId: string;
  ticketId: string;
  section: string;
  questions: TaxQuestion[];
  completedAt?: Date;
}

export interface TaxQuestion {
  id: string;
  question: string;
  type: 'text' | 'number' | 'select' | 'date' | 'checkbox' | 'textarea';
  required: boolean;
  options?: string[];
  answer?: string | number | boolean | string[];
}

// Admin Types
export interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  department: string;
  status: 'active' | 'inactive';
  hireDate: Date;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  timestamp: Date;
  details?: Record<string, any>;
}

// Dashboard Stats
export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  completedThisMonth: number;
  overdueTasks: number;
  stageBreakdown: Record<TicketStage, number>;
}

// Queue Data
export interface QueueItem {
  id: string;
  ticketId: string;
  clientName: string;
  stage: TicketStage;
  priority: TicketPriority;
  daysInQueue: number;
  assignedTo?: string;
}

// Report Types
export interface Report {
  id: string;
  title: string;
  type: 'performance' | 'queue-analysis' | 'revenue' | 'compliance';
  generatedAt: Date;
  data: Record<string, any>;
}

// Settings Types
export interface CompanySettings {
  companyName: string;
  email: string;
  phone: string;
  address: string;
  taxSeasonStart: number;
  taxSeasonEnd: number;
  workingDays: number[];
}
