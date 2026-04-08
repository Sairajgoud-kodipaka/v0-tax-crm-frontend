-- Client actions from Draft Sent: approve (→ awaiting-approval) or request changes (→ under-prep).
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
END;
$$;

GRANT EXECUTE ON FUNCTION public.client_draft_response(UUID, TEXT) TO authenticated;
