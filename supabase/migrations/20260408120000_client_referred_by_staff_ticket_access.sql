-- Link clients to the employee whose invite they used; all staff can access any ticket.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referred_by_employee_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles (referred_by_employee_id)
  WHERE referred_by_employee_id IS NOT NULL;

COMMENT ON COLUMN public.profiles.referred_by_employee_id IS 'Employee who invited this client; used as default ticket assignee.';

-- Any admin or employee may read tickets (not only the assignee).
CREATE OR REPLACE FUNCTION public.can_access_ticket(t public.tickets)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_staff()
    OR (t.client_id = auth.uid());
$$;

DROP POLICY IF EXISTS "tickets_update" ON public.tickets;
CREATE POLICY "tickets_update"
  ON public.tickets FOR UPDATE
  USING (public.is_staff());

-- Redeem invite: record referring employee; no auto-ticket.
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

  RETURN NULL;
END;
$$;

-- Any employee may change stages (same as admin workflow).
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
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'employee')
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
