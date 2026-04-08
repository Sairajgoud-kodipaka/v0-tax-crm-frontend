export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: 'admin' | 'employee' | 'client';
          full_name: string | null;
          email: string | null;
          referred_by_employee_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: 'admin' | 'employee' | 'client';
          full_name?: string | null;
          referred_by_employee_id?: string | null;
        };
        Update: {
          full_name?: string | null;
          referred_by_employee_id?: string | null;
        };
      };
      tickets: {
        Row: {
          id: string;
          public_ref: number;
          client_id: string;
          assigned_employee_id: string | null;
          stage: string;
          status: string;
          priority: string;
          subject: string;
          description: string;
          filing_type: string;
          tax_year: number;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      messages: {
        Row: {
          id: string;
          ticket_id: string;
          sender_id: string;
          body: string;
          is_internal: boolean;
          created_at: string;
        };
      };
      documents: {
        Row: {
          id: string;
          ticket_id: string;
          category: 'client_upload' | 'draft' | 'final' | 'other';
          storage_path: string;
          original_filename: string | null;
          mime_type: string | null;
          size_bytes: number | null;
          uploaded_by: string | null;
          shared_at: string | null;
          available_at: string | null;
          created_at: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          ticket_id: string;
          invoice_number: string;
          description: string | null;
          amount_cents: number;
          currency: string;
          status: 'unpaid' | 'paid';
          due_date: string | null;
          paid_at: string | null;
          created_at: string;
        };
      };
      payments: {
        Row: {
          id: string;
          invoice_id: string | null;
          ticket_id: string;
          provider: string;
          provider_ref: string | null;
          status: string;
          amount_cents: number;
          receipt_reference: string | null;
          receipt_url: string | null;
          created_at: string;
        };
      };
      ticket_history: {
        Row: {
          id: string;
          ticket_id: string;
          actor_id: string;
          from_stage: string | null;
          to_stage: string;
          note: string | null;
          created_at: string;
        };
      };
      invitation_links: {
        Row: {
          id: string;
          token: string;
          employee_id: string;
          expires_at: string;
          used_at: string | null;
          created_by: string | null;
          created_at: string;
        };
      };
      tax_organizer_snapshots: {
        Row: {
          id: string;
          ticket_id: string;
          client_id: string;
          answers: Json;
          updated_at: string;
        };
      };
    };
  };
}
