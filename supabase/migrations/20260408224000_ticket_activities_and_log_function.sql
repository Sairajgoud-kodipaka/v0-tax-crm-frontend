-- Ticket activities table and log_ticket_activity RPC helper

CREATE TYPE public.ticket_activity_actor_type AS ENUM ('client', 'employee', 'admin');

CREATE TYPE public.related_entity_type AS ENUM ('document', 'message', 'organizer');

CREATE TYPE public.activity_action AS ENUM (
  'ticket_created',
  'stage_changed',
  'document_uploaded',
  'document_updated',
  'document_requested',
  'message_sent',
  'organizer_updated',
  'draft_sent',
  'final_document_available',
  'payment_processed',
  'invoice_created'
);

CREATE TABLE public.ticket_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets (id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  actor_type public.ticket_activity_actor_type NOT NULL,
  action_type public.activity_action NOT NULL,
  action_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_visible_to_client BOOLEAN NOT NULL DEFAULT TRUE,
  related_entity_id UUID,
  related_entity_type public.related_entity_type,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticket_activities_ticket ON public.ticket_activities (ticket_id, created_at DESC);

ALTER TABLE public.ticket_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ticket_activities_select_access"
  ON public.ticket_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_activities.ticket_id
        AND public.can_access_ticket(t)
    )
  );

CREATE POLICY "ticket_activities_insert_access"
  ON public.ticket_activities FOR INSERT
  WITH CHECK (
    actor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id
        AND public.can_access_ticket(t)
    )
  );

CREATE OR REPLACE FUNCTION public.log_ticket_activity(
  p_ticket_id UUID,
  p_actor_id UUID,
  p_action_type public.activity_action,
  p_details JSONB,
  p_is_visible_to_client BOOLEAN,
  p_related_entity_id UUID,
  p_related_entity_type public.related_entity_type
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ticket_activities (
    ticket_id,
    actor_id,
    actor_type,
    action_type,
    action_details,
    is_visible_to_client,
    related_entity_id,
    related_entity_type
  ) VALUES (
    p_ticket_id,
    p_actor_id,
    (SELECT role FROM public.profiles WHERE id = p_actor_id),
    p_action_type,
    COALESCE(p_details, '{}'::jsonb),
    p_is_visible_to_client,
    p_related_entity_id,
    p_related_entity_type
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_ticket_activity(UUID, UUID, public.activity_action, JSONB, BOOLEAN, UUID, public.related_entity_type) TO authenticated;
