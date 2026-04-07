-- Tax CRM: initial schema, RLS, storage bucket
-- Run via Supabase CLI or SQL editor after linking project.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums (match v0-tax-crm-frontend/lib/types.ts)
CREATE TYPE public.app_role AS ENUM ('admin', 'employee', 'client');

CREATE TYPE public.ticket_stage AS ENUM (
  'pending-info',
  'under-prep',
  'draft-sent',
  'awaiting-approval',
  'payment-received',
  '8879-sent',
  '8879-received',
  'filing-completed',
  'closed'
);

CREATE TYPE public.ticket_status AS ENUM (
  'open',
  'in-progress',
  'pending',
  'completed',
  'on-hold'
);

CREATE TYPE public.ticket_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE public.document_category AS ENUM (
  'client_upload',
  'draft',
  'final',
  'other'
);

CREATE TYPE public.invoice_status AS ENUM ('unpaid', 'paid');

CREATE TYPE public.payment_status AS ENUM (
  'pending',
  'succeeded',
  'failed',
  'refunded'
);

-- Profiles (1:1 with auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'client',
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role ON public.profiles (role);

-- Invitations (employee-generated)
CREATE TABLE public.invitation_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  employee_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tickets
CREATE SEQUENCE public.ticket_public_ref_seq START WITH 10000;

CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_ref INTEGER NOT NULL DEFAULT nextval('public.ticket_public_ref_seq') UNIQUE,
  client_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  assigned_employee_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  stage public.ticket_stage NOT NULL DEFAULT 'pending-info',
  status public.ticket_status NOT NULL DEFAULT 'open',
  priority public.ticket_priority NOT NULL DEFAULT 'medium',
  subject TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  filing_type TEXT NOT NULL DEFAULT 'Individual 1040',
  tax_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_stage ON public.tickets (stage);
CREATE INDEX idx_tickets_client ON public.tickets (client_id);
CREATE INDEX idx_tickets_assigned ON public.tickets (assigned_employee_id);

-- Ticket history / audit
CREATE TABLE public.ticket_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets (id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE SET NULL,
  from_stage public.ticket_stage,
  to_stage public.ticket_stage NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticket_history_ticket ON public.ticket_history (ticket_id, created_at DESC);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets (id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_ticket ON public.messages (ticket_id, created_at);

-- Documents (metadata; files in Storage)
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets (id) ON DELETE CASCADE,
  category public.document_category NOT NULL DEFAULT 'other',
  storage_path TEXT NOT NULL,
  original_filename TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  uploaded_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  shared_at TIMESTAMPTZ,
  available_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_ticket ON public.documents (ticket_id);

-- Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets (id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  description TEXT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status public.invoice_status NOT NULL DEFAULT 'unpaid',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_ticket ON public.invoices (ticket_id);

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices (id) ON DELETE SET NULL,
  ticket_id UUID NOT NULL REFERENCES public.tickets (id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_ref TEXT,
  status public.payment_status NOT NULL DEFAULT 'pending',
  amount_cents INTEGER NOT NULL,
  receipt_reference TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_ticket ON public.payments (ticket_id);

-- Tax organizer (JSON blob per ticket)
CREATE TABLE public.tax_organizer_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL UNIQUE REFERENCES public.tickets (id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helper: role checks (SECURITY DEFINER for use in policies)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'employee')
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_ticket(t public.tickets)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_admin()
    OR (t.assigned_employee_id IS NOT NULL AND t.assigned_employee_id = auth.uid())
    OR (t.client_id = auth.uid());
$$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER tr_tickets_updated
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- New user: create profile (role from raw_user_meta_data.role if valid, else client)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Public signups are always clients; create admin/employee via SQL or dashboard + metadata override in controlled environments only.
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    NEW.id,
    'client',
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_organizer_snapshots ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Staff can list profiles for assignment display (employees list)
CREATE POLICY "profiles_select_staff"
  ON public.profiles FOR SELECT
  USING (public.is_staff());

-- invitation_links: employees create for self; admins can create for any employee
CREATE POLICY "invitation_insert_employee_self"
  ON public.invitation_links FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'employee')
    AND employee_id = auth.uid()
  );

CREATE POLICY "invitation_insert_admin"
  ON public.invitation_links FOR INSERT
  WITH CHECK (
    public.is_admin()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = employee_id AND p.role = 'employee')
  );

CREATE POLICY "invitation_select_staff"
  ON public.invitation_links FOR SELECT
  USING (public.is_staff());

CREATE POLICY "invitation_update_own_or_admin"
  ON public.invitation_links FOR UPDATE
  USING (public.is_admin() OR employee_id = auth.uid());

-- tickets
CREATE POLICY "tickets_select_access"
  ON public.tickets FOR SELECT
  USING (public.can_access_ticket(tickets.*));

CREATE POLICY "tickets_insert_staff"
  ON public.tickets FOR INSERT
  WITH CHECK (public.is_staff());

CREATE POLICY "tickets_update"
  ON public.tickets FOR UPDATE
  USING (
    public.is_admin()
    OR (assigned_employee_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'employee'))
  );

-- ticket_history
CREATE POLICY "ticket_history_select_access"
  ON public.ticket_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_history.ticket_id AND public.can_access_ticket(t)
    )
  );

CREATE POLICY "ticket_history_insert_staff"
  ON public.ticket_history FOR INSERT
  WITH CHECK (
    public.is_staff()
    AND EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id AND public.can_access_ticket(t)
    )
    AND actor_id = auth.uid()
  );

-- messages
CREATE POLICY "messages_select_access"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = messages.ticket_id AND public.can_access_ticket(t)
    )
    AND (
      NOT messages.is_internal
      OR public.is_staff()
    )
  );

CREATE POLICY "messages_insert_access"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id AND public.can_access_ticket(t)
    )
    AND (
      NOT is_internal
      OR (public.is_staff() AND is_internal)
    )
  );

-- documents
CREATE POLICY "documents_select_access"
  ON public.documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = documents.ticket_id AND public.can_access_ticket(t)
    )
    AND (
      public.is_staff()
      OR category IN ('client_upload', 'final')
      OR (category = 'draft' AND EXISTS (SELECT 1 FROM public.tickets t2 WHERE t2.id = ticket_id AND t2.stage::text IN ('draft-sent', 'awaiting-approval', 'payment-received', '8879-sent', '8879-received', 'filing-completed', 'closed')))
    )
  );

CREATE POLICY "documents_insert_access"
  ON public.documents FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id AND public.can_access_ticket(t)
    )
  );

CREATE POLICY "documents_update_staff"
  ON public.documents FOR UPDATE
  USING (public.is_staff());

CREATE POLICY "documents_delete_staff_or_uploader"
  ON public.documents FOR DELETE
  USING (public.is_staff() OR uploaded_by = auth.uid());

-- invoices & payments: staff + client read on own ticket
CREATE POLICY "invoices_select_access"
  ON public.invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = invoices.ticket_id AND public.can_access_ticket(t)
    )
  );

CREATE POLICY "invoices_write_staff"
  ON public.invoices FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "payments_select_access"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = payments.ticket_id AND public.can_access_ticket(t)
    )
  );

CREATE POLICY "payments_write_staff"
  ON public.payments FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- tax organizer
CREATE POLICY "organizer_select_access"
  ON public.tax_organizer_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = tax_organizer_snapshots.ticket_id AND public.can_access_ticket(t)
    )
  );

CREATE POLICY "organizer_write_client_own"
  ON public.tax_organizer_snapshots FOR INSERT
  WITH CHECK (
    client_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.client_id = auth.uid())
  );

CREATE POLICY "organizer_update_client_or_staff"
  ON public.tax_organizer_snapshots FOR UPDATE
  USING (
    (client_id = auth.uid())
    OR public.is_staff()
  );

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('tax-documents', 'tax-documents', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: path = {ticket_id}/{...}
CREATE POLICY "storage_tax_documents_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'tax-documents'
    AND EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id::text = split_part(name, '/', 1)
        AND public.can_access_ticket(t)
    )
  );

CREATE POLICY "storage_tax_documents_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'tax-documents'
    AND EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id::text = split_part(name, '/', 1)
        AND public.can_access_ticket(t)
    )
  );

CREATE POLICY "storage_tax_documents_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'tax-documents'
    AND EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id::text = split_part(name, '/', 1)
        AND public.can_access_ticket(t)
    )
  );

CREATE POLICY "storage_tax_documents_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'tax-documents'
    AND (
      public.is_staff()
      OR EXISTS (
        SELECT 1 FROM public.tickets t
        WHERE t.id::text = split_part(name, '/', 1)
          AND t.client_id = auth.uid()
      )
    )
  );

-- RPC: consume invitation after signup (creates ticket, marks invite used)
CREATE OR REPLACE FUNCTION public.consume_invitation(invite_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv public.invitation_links%ROWTYPE;
  new_ticket_id UUID;
  emp_role public.app_role;
  caller_role public.app_role;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role != 'client' THEN
    RAISE EXCEPTION 'Only client accounts can redeem invitations';
  END IF;

  SELECT * INTO inv FROM public.invitation_links
  WHERE token = invite_token AND used_at IS NULL AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  SELECT role INTO emp_role FROM public.profiles WHERE id = inv.employee_id;
  IF emp_role IS NULL OR emp_role != 'employee' THEN
    RAISE EXCEPTION 'Invalid invitation';
  END IF;

  INSERT INTO public.tickets (
    client_id,
    assigned_employee_id,
    stage,
    status,
    subject,
    description,
    filing_type,
    tax_year
  )
  VALUES (
    auth.uid(),
    inv.employee_id,
    'pending-info',
    'open',
    'New tax case',
    'Created from invitation.',
    'Individual 1040',
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
  )
  RETURNING id INTO new_ticket_id;

  UPDATE public.invitation_links SET used_at = now() WHERE id = inv.id;

  INSERT INTO public.ticket_history (ticket_id, actor_id, from_stage, to_stage, note)
  VALUES (new_ticket_id, auth.uid(), NULL, 'pending-info', 'Ticket created from invitation');

  RETURN new_ticket_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_invitation(TEXT) TO authenticated;

-- Atomic stage change + audit row (bypasses RLS via SECURITY DEFINER; permission checks inside)
CREATE OR REPLACE FUNCTION public.update_ticket_stage(
  p_ticket_id UUID,
  p_to_stage public.ticket_stage,
  p_note TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t public.tickets%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO t FROM public.tickets WHERE id = p_ticket_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;

  IF NOT (
    public.is_admin()
    OR (
      t.assigned_employee_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'employee')
    )
  ) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  IF t.stage = p_to_stage THEN
    RETURN;
  END IF;

  UPDATE public.tickets
  SET stage = p_to_stage, updated_at = now()
  WHERE id = p_ticket_id;

  INSERT INTO public.ticket_history (ticket_id, actor_id, from_stage, to_stage, note)
  VALUES (p_ticket_id, auth.uid(), t.stage, p_to_stage, p_note);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_ticket_stage(UUID, public.ticket_stage, TEXT) TO authenticated;

-- Public preview for signup page (does not expose other rows)
CREATE OR REPLACE FUNCTION public.peek_invitation(invite_token TEXT)
RETURNS TABLE (valid BOOLEAN, employee_name TEXT, expires_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn TEXT;
  exp TIMESTAMPTZ;
BEGIN
  SELECT p.full_name, inv.expires_at INTO fn, exp
  FROM public.invitation_links inv
  JOIN public.profiles p ON p.id = inv.employee_id
  WHERE inv.token = invite_token
    AND inv.used_at IS NULL
    AND inv.expires_at > now()
  LIMIT 1;
  IF FOUND THEN
    RETURN QUERY SELECT TRUE, fn, exp;
  ELSE
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TIMESTAMPTZ;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.peek_invitation(TEXT) TO anon, authenticated;
