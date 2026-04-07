-- Denormalize sender display for message threads (clients cannot read employee profiles via RLS)
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS sender_display_name TEXT,
  ADD COLUMN IF NOT EXISTS sender_role public.app_role;

CREATE OR REPLACE FUNCTION public.messages_set_sender_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn TEXT;
  r public.app_role;
BEGIN
  SELECT full_name, role INTO fn, r FROM public.profiles WHERE id = NEW.sender_id;
  NEW.sender_display_name := COALESCE(fn, 'User');
  NEW.sender_role := COALESCE(r, 'client');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_messages_sender_snapshot ON public.messages;
CREATE TRIGGER tr_messages_sender_snapshot
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE PROCEDURE public.messages_set_sender_snapshot();
