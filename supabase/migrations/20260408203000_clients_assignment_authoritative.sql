-- Enforce assignment consistency: clients.assigned_employee_id is authoritative.
-- Prevent drift between clients.assigned_employee_id and profiles.referred_by_employee_id.

-- Invite redemption now writes authoritative assignment in public.clients.
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

  INSERT INTO public.clients (profile_id, assigned_employee_id)
  VALUES (auth.uid(), inv.employee_id)
  ON CONFLICT (profile_id) DO UPDATE
  SET assigned_employee_id = COALESCE(public.clients.assigned_employee_id, EXCLUDED.assigned_employee_id),
      updated_at = now();

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

-- Deferred constraint trigger: profile/client assignment must match at commit.
CREATE OR REPLACE FUNCTION public.assert_client_assignment_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id UUID;
  p_role public.app_role;
  p_assigned UUID;
  c_assigned UUID;
BEGIN
  target_id := COALESCE(NEW.profile_id, NEW.id, OLD.profile_id, OLD.id);
  IF target_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT role, referred_by_employee_id
  INTO p_role, p_assigned
  FROM public.profiles
  WHERE id = target_id;

  IF p_role IS DISTINCT FROM 'client'::public.app_role THEN
    RETURN NULL;
  END IF;

  SELECT assigned_employee_id
  INTO c_assigned
  FROM public.clients
  WHERE profile_id = target_id;

  IF p_assigned IS DISTINCT FROM c_assigned THEN
    RAISE EXCEPTION
      'Assignment mismatch for client %: profiles.referred_by_employee_id=% clients.assigned_employee_id=%',
      target_id, p_assigned, c_assigned;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS tr_assert_client_assignment_sync_profiles ON public.profiles;
CREATE CONSTRAINT TRIGGER tr_assert_client_assignment_sync_profiles
  AFTER INSERT OR UPDATE OF role, referred_by_employee_id
  ON public.profiles
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE PROCEDURE public.assert_client_assignment_sync();

DROP TRIGGER IF EXISTS tr_assert_client_assignment_sync_clients ON public.clients;
CREATE CONSTRAINT TRIGGER tr_assert_client_assignment_sync_clients
  AFTER INSERT OR UPDATE OF assigned_employee_id
  ON public.clients
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE PROCEDURE public.assert_client_assignment_sync();
