-- Fix trigger runtime error on clients updates:
-- "record 'new' has no field 'id'".
-- The shared trigger function must resolve target id differently per table.

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
  IF TG_TABLE_NAME = 'clients' THEN
    target_id := COALESCE(NEW.profile_id, OLD.profile_id);
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    target_id := COALESCE(NEW.id, OLD.id);
  ELSE
    RETURN NULL;
  END IF;

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

