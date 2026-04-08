-- In-app notifications: table, RLS, Realtime, RPC, and triggers on key flows.

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES public.tickets (id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_recipient_created
  ON public.notifications (recipient_id, created_at DESC);

CREATE INDEX idx_notifications_recipient_unread
  ON public.notifications (recipient_id)
  WHERE is_read = FALSE;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (recipient_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

ALTER TABLE public.notifications REPLICA IDENTITY FULL;

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END
$migration$;

-- Authenticated callers: validated insert for messages / document follow-ups (SECURITY DEFINER bypasses RLS).
CREATE OR REPLACE FUNCTION public.create_ticket_notification(
  p_recipient_id UUID,
  p_ticket_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t public.tickets%ROWTYPE;
  caller_role public.app_role;
  recipient_ok BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_recipient_id IS NULL OR p_ticket_id IS NULL THEN
    RAISE EXCEPTION 'Invalid arguments';
  END IF;

  IF length(trim(p_title)) < 1 THEN
    RAISE EXCEPTION 'Invalid title';
  END IF;

  SELECT * INTO t FROM public.tickets WHERE id = p_ticket_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;

  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  recipient_ok := FALSE;
  IF caller_role = 'client' THEN
    IF t.client_id = auth.uid() THEN
      recipient_ok :=
        p_recipient_id = t.assigned_employee_id
        OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = p_recipient_id AND pr.role = 'admin');
    END IF;
  ELSIF caller_role IN ('admin', 'employee') THEN
    IF public.can_access_ticket(t) THEN
      recipient_ok :=
        p_recipient_id = t.client_id
        OR p_recipient_id IS NOT DISTINCT FROM t.assigned_employee_id
        OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = p_recipient_id AND pr.role = 'admin');
    END IF;
  END IF;

  IF NOT recipient_ok THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  INSERT INTO public.notifications (recipient_id, ticket_id, type, title, body, is_read)
  VALUES (
    p_recipient_id,
    p_ticket_id,
    COALESCE(NULLIF(trim(p_type), ''), 'general'),
    trim(p_title),
    NULLIF(trim(p_body), ''),
    FALSE
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_ticket_notification(UUID, UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_ticket_notification(UUID, UUID, TEXT, TEXT, TEXT) TO authenticated;

-- Staff-driven stage changes → client (and admins for filing completed).
CREATE OR REPLACE FUNCTION public.trg_notify_on_ticket_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t public.tickets%ROWTYPE;
  actor_role public.app_role;
  client_nm TEXT;
  adm RECORD;
BEGIN
  SELECT * INTO t FROM public.tickets WHERE id = NEW.ticket_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  SELECT role INTO actor_role FROM public.profiles WHERE id = NEW.actor_id;
  IF actor_role = 'client' THEN
    RETURN NEW;
  END IF;
  IF actor_role NOT IN ('admin', 'employee') THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(TRIM(full_name), ''), 'Client') INTO client_nm FROM public.profiles WHERE id = t.client_id;

  IF NEW.to_stage = 'under-prep'::public.ticket_stage THEN
    INSERT INTO public.notifications (recipient_id, ticket_id, type, title, body, is_read)
    VALUES (
      t.client_id,
      t.id,
      'stage_change',
      'Return is being prepared',
      'Your return is now being prepared. We''ll notify you when your draft is ready.',
      FALSE
    );
  ELSIF NEW.to_stage = 'draft-sent'::public.ticket_stage THEN
    INSERT INTO public.notifications (recipient_id, ticket_id, type, title, body, is_read)
    VALUES (
      t.client_id,
      t.id,
      'stage_change',
      'Draft return ready',
      'Your draft return is ready. Please log in to review and approve.',
      FALSE
    );
  ELSIF NEW.to_stage = '8879-sent'::public.ticket_stage THEN
    INSERT INTO public.notifications (recipient_id, ticket_id, type, title, body, is_read)
    VALUES (
      t.client_id,
      t.id,
      'stage_change',
      'Form 8879 ready',
      'Form 8879 is ready for your signature. Please log in to sign and return it.',
      FALSE
    );
  ELSIF NEW.to_stage = 'filing-completed'::public.ticket_stage THEN
    INSERT INTO public.notifications (recipient_id, ticket_id, type, title, body, is_read)
    VALUES (
      t.client_id,
      t.id,
      'stage_change',
      'Return filed',
      'Your tax return has been successfully filed! Log in to download your copy.',
      FALSE
    );
    FOR adm IN SELECT id FROM public.profiles WHERE role = 'admin' LOOP
      INSERT INTO public.notifications (recipient_id, ticket_id, type, title, body, is_read)
      VALUES (
        adm.id,
        t.id,
        'stage_change',
        'Case filed successfully',
        format('Case #%s (%s) has been filed successfully.', t.public_ref, client_nm),
        FALSE
      );
    END LOOP;
  ELSIF NEW.to_stage = 'closed'::public.ticket_stage THEN
    INSERT INTO public.notifications (recipient_id, ticket_id, type, title, body, is_read)
    VALUES (
      t.client_id,
      t.id,
      'stage_change',
      'Case closed',
      'Your case has been closed. All documents are available in your portal.',
      FALSE
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_ticket_history_notifications ON public.ticket_history;
CREATE TRIGGER tr_ticket_history_notifications
  AFTER INSERT ON public.ticket_history
  FOR EACH ROW EXECUTE PROCEDURE public.trg_notify_on_ticket_history();

-- New client profile → notify all admins.
CREATE OR REPLACE FUNCTION public.trg_notify_admins_new_client()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  adm RECORD;
  nm TEXT;
BEGIN
  nm := COALESCE(NULLIF(TRIM(NEW.full_name), ''), 'New client');

  FOR adm IN SELECT id FROM public.profiles WHERE role = 'admin' LOOP
    INSERT INTO public.notifications (recipient_id, ticket_id, type, title, body, is_read)
    VALUES (
      adm.id,
      NULL,
      'signup',
      'New client signup',
      format('%s signed up.', nm),
      FALSE
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_profiles_new_client_admins ON public.profiles;
CREATE TRIGGER tr_profiles_new_client_admins
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role = 'client')
  EXECUTE PROCEDURE public.trg_notify_admins_new_client();

-- Client submitted organizer + documents → assigned employee.
CREATE OR REPLACE FUNCTION public.submit_client_information(p_ticket_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t public.tickets%ROWTYPE;
  client_nm TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO t FROM public.tickets WHERE id = p_ticket_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;

  IF t.client_id <> auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF t.stage::text <> 'pending-info' THEN
    RAISE EXCEPTION 'You can only submit while your case is waiting for your information.';
  END IF;

  IF t.client_info_submitted_at IS NOT NULL THEN
    RETURN;
  END IF;

  UPDATE public.tickets
  SET client_info_submitted_at = now(),
      updated_at = now()
  WHERE id = p_ticket_id;

  INSERT INTO public.messages (ticket_id, sender_id, body, is_internal)
  VALUES (
    p_ticket_id,
    auth.uid(),
    'I have submitted my tax organizer and uploaded my documents for your review.',
    false
  );

  SELECT COALESCE(NULLIF(TRIM(full_name), ''), 'Client') INTO client_nm FROM public.profiles WHERE id = auth.uid();

  IF t.assigned_employee_id IS NOT NULL THEN
    INSERT INTO public.notifications (recipient_id, ticket_id, type, title, body, is_read)
    VALUES (
      t.assigned_employee_id,
      t.id,
      'document',
      'Client submitted information',
      format('%s has submitted their information and documents.', client_nm),
      FALSE
    );
  END IF;
END;
$$;

-- Client draft approve / request changes → assigned employee.
CREATE OR REPLACE FUNCTION public.client_draft_response(
  p_ticket_id UUID,
  p_action TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t public.tickets%ROWTYPE;
  to_stage public.ticket_stage;
  hist_note TEXT;
  client_nm TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'client') THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  SELECT * INTO t FROM public.tickets WHERE id = p_ticket_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;

  IF t.client_id <> auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF t.stage IS DISTINCT FROM 'draft-sent'::public.ticket_stage THEN
    RAISE EXCEPTION 'Invalid stage for this action';
  END IF;

  IF p_action = 'approve' THEN
    to_stage := 'awaiting-approval';
    hist_note := 'Client approved draft';
  ELSIF p_action = 'request_changes' THEN
    to_stage := 'under-prep';
    hist_note := 'Client requested changes';
  ELSE
    RAISE EXCEPTION 'Invalid action';
  END IF;

  IF to_stage = t.stage THEN
    RETURN;
  END IF;

  UPDATE public.tickets
  SET stage = to_stage, updated_at = now()
  WHERE id = p_ticket_id;

  INSERT INTO public.ticket_history (ticket_id, actor_id, from_stage, to_stage, note)
  VALUES (p_ticket_id, auth.uid(), t.stage, to_stage, hist_note);

  SELECT COALESCE(NULLIF(TRIM(full_name), ''), 'Client') INTO client_nm FROM public.profiles WHERE id = auth.uid();

  IF t.assigned_employee_id IS NOT NULL THEN
    IF p_action = 'approve' THEN
      INSERT INTO public.notifications (recipient_id, ticket_id, type, title, body, is_read)
      VALUES (
        t.assigned_employee_id,
        t.id,
        'stage_change',
        'Draft approved',
        format('%s approved their draft return. Ready for payment.', client_nm),
        FALSE
      );
    ELSE
      INSERT INTO public.notifications (recipient_id, ticket_id, type, title, body, is_read)
      VALUES (
        t.assigned_employee_id,
        t.id,
        'stage_change',
        'Changes requested',
        format('%s has requested changes on their draft.', client_nm),
        FALSE
      );
    END IF;
  END IF;
END;
$$;

-- Payment succeeded → assigned employee + admins.
CREATE OR REPLACE FUNCTION public.pay_invoice_mvp(p_invoice_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv public.invoices%ROWTYPE;
  t public.tickets%ROWTYPE;
  client_nm TEXT;
  amt TEXT;
  adm RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO inv FROM public.invoices WHERE id = p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.tickets tk
    WHERE tk.id = inv.ticket_id AND tk.client_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF inv.status = 'paid' THEN
    RETURN;
  END IF;

  UPDATE public.invoices
  SET status = 'paid', paid_at = now()
  WHERE id = p_invoice_id;

  INSERT INTO public.payments (invoice_id, ticket_id, provider, status, amount_cents, receipt_reference)
  VALUES (
    p_invoice_id,
    inv.ticket_id,
    'mvp',
    'succeeded',
    inv.amount_cents,
    'MVP-' || substring(p_invoice_id::text, 1, 8)
  );

  SELECT * INTO t FROM public.tickets WHERE id = inv.ticket_id;
  SELECT COALESCE(NULLIF(TRIM(full_name), ''), 'Client') INTO client_nm FROM public.profiles WHERE id = t.client_id;
  amt := trim(to_char(round(inv.amount_cents::numeric / 100, 2), 'FM999999990.00'));

  IF t.assigned_employee_id IS NOT NULL THEN
    INSERT INTO public.notifications (recipient_id, ticket_id, type, title, body, is_read)
    VALUES (
      t.assigned_employee_id,
      t.id,
      'payment',
      'Payment received',
      format('Payment received from %s for Case #%s.', client_nm, t.public_ref),
      FALSE
    );
  END IF;

  FOR adm IN SELECT id FROM public.profiles WHERE role = 'admin' LOOP
    INSERT INTO public.notifications (recipient_id, ticket_id, type, title, body, is_read)
    VALUES (
      adm.id,
      t.id,
      'payment',
      'Payment received',
      format('Payment received from %s — $%s for Case #%s.', client_nm, amt, t.public_ref),
      FALSE
    );
  END LOOP;
END;
$$;

-- Invite consumed → referring employee.
CREATE OR REPLACE FUNCTION public.consume_invitation(invite_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv public.invitation_links%ROWTYPE;
  emp_role public.app_role;
  caller_role public.app_role;
  client_nm TEXT;
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

  UPDATE public.profiles
  SET referred_by_employee_id = inv.employee_id
  WHERE id = auth.uid()
    AND referred_by_employee_id IS NULL;

  UPDATE public.invitation_links
  SET used_at = now()
  WHERE id = inv.id;

  SELECT COALESCE(NULLIF(TRIM(full_name), ''), 'A new client') INTO client_nm FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.notifications (recipient_id, ticket_id, type, title, body, is_read)
  VALUES (
    inv.employee_id,
    NULL,
    'invite',
    'New client from your invite',
    format('A new client, %s, has joined using your invite link.', client_nm),
    FALSE
  );

  RETURN NULL;
END;
$$;
