-- CRM clients registry: one row per client profile, primary preparer, notes, status.
-- Stays in sync with profiles.referred_by_employee_id (invite flow) both ways.

CREATE TABLE public.clients (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  assigned_employee_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_assigned_employee ON public.clients (assigned_employee_id);
CREATE INDEX idx_clients_status ON public.clients (status);
CREATE INDEX idx_clients_created ON public.clients (created_at DESC);

COMMENT ON TABLE public.clients IS 'Client accounts (1:1 with profiles where role=client); use for search, filters, and primary preparer assignment.';

CREATE TRIGGER tr_clients_updated
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_select_staff_or_self"
  ON public.clients FOR SELECT
  USING (
    public.is_staff()
    OR profile_id = auth.uid()
  );

CREATE POLICY "clients_update_staff"
  ON public.clients FOR UPDATE
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "clients_insert_staff"
  ON public.clients FOR INSERT
  WITH CHECK (
    public.is_staff()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.role = 'client')
  );

-- New client profile → clients row
CREATE OR REPLACE FUNCTION public.tr_profiles_clients_ai()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'client'::public.app_role THEN
    INSERT INTO public.clients (profile_id, assigned_employee_id)
    VALUES (NEW.id, NEW.referred_by_employee_id)
    ON CONFLICT (profile_id) DO UPDATE
    SET assigned_employee_id = EXCLUDED.assigned_employee_id,
        updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_profiles_clients_ai ON public.profiles;
CREATE TRIGGER tr_profiles_clients_ai
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role = 'client')
  EXECUTE PROCEDURE public.tr_profiles_clients_ai();

-- Profile changes (invite, role) → clients
CREATE OR REPLACE FUNCTION public.tr_profiles_clients_au()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role = 'client'::public.app_role AND NEW.role IS DISTINCT FROM 'client'::public.app_role THEN
    DELETE FROM public.clients WHERE profile_id = NEW.id;
    RETURN NEW;
  END IF;

  IF NEW.role = 'client'::public.app_role AND OLD.role IS DISTINCT FROM 'client'::public.app_role THEN
    INSERT INTO public.clients (profile_id, assigned_employee_id)
    VALUES (NEW.id, NEW.referred_by_employee_id)
    ON CONFLICT (profile_id) DO UPDATE
    SET assigned_employee_id = EXCLUDED.assigned_employee_id,
        updated_at = now();
    RETURN NEW;
  END IF;

  IF NEW.role = 'client'::public.app_role
     AND NEW.referred_by_employee_id IS DISTINCT FROM OLD.referred_by_employee_id THEN
    UPDATE public.clients
    SET assigned_employee_id = NEW.referred_by_employee_id,
        updated_at = now()
    WHERE profile_id = NEW.id;
    IF NOT FOUND THEN
      INSERT INTO public.clients (profile_id, assigned_employee_id)
      VALUES (NEW.id, NEW.referred_by_employee_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_profiles_clients_au ON public.profiles;
CREATE TRIGGER tr_profiles_clients_au
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.tr_profiles_clients_au();

-- Staff edits clients.assigned_employee_id → profiles.referred_by_employee_id (tickets default assignee)
CREATE OR REPLACE FUNCTION public.tr_clients_sync_profile_au()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.assigned_employee_id IS DISTINCT FROM OLD.assigned_employee_id THEN
    UPDATE public.profiles
    SET referred_by_employee_id = NEW.assigned_employee_id
    WHERE id = NEW.profile_id
      AND role = 'client'::public.app_role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_clients_sync_profile_au ON public.clients;
CREATE TRIGGER tr_clients_sync_profile_au
  AFTER UPDATE OF assigned_employee_id ON public.clients
  FOR EACH ROW EXECUTE PROCEDURE public.tr_clients_sync_profile_au();

-- Backfill existing client profiles
INSERT INTO public.clients (profile_id, assigned_employee_id)
SELECT id, referred_by_employee_id
FROM public.profiles
WHERE role = 'client'::public.app_role
ON CONFLICT (profile_id) DO UPDATE
SET assigned_employee_id = EXCLUDED.assigned_employee_id,
    updated_at = now();
