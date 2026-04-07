-- Redeeming an invite should no longer auto-create a ticket.
-- Keep validation + one-time consume semantics, return NULL UUID.
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

  UPDATE public.invitation_links
  SET used_at = now()
  WHERE id = inv.id;

  RETURN NULL;
END;
$$;
