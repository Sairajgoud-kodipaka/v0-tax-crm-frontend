-- Client formal "I'm done" submit: timestamp + thread message (pending-info only).

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS client_info_submitted_at TIMESTAMPTZ;

COMMENT ON COLUMN public.tickets.client_info_submitted_at IS 'When the client submitted organizer + documents for preparer review (pending-info flow).';

CREATE OR REPLACE FUNCTION public.submit_client_information(p_ticket_id UUID)
RETURNS VOID
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
END;
$$;

REVOKE ALL ON FUNCTION public.submit_client_information(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_client_information(UUID) TO authenticated;
