-- Read receipts: last message each participant has read in a ticket thread (for "Seen" / read cursors)

CREATE TABLE public.ticket_thread_reads (
  ticket_id UUID NOT NULL REFERENCES public.tickets (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  last_read_message_id UUID REFERENCES public.messages (id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (ticket_id, user_id)
);

CREATE INDEX idx_ticket_thread_reads_ticket ON public.ticket_thread_reads (ticket_id);

ALTER TABLE public.ticket_thread_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_thread_reads REPLICA IDENTITY FULL;

CREATE POLICY "ticket_thread_reads_select"
  ON public.ticket_thread_reads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_thread_reads.ticket_id AND public.can_access_ticket(t)
    )
  );

CREATE POLICY "ticket_thread_reads_upsert_own"
  ON public.ticket_thread_reads FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id AND public.can_access_ticket(t)
    )
  );

CREATE POLICY "ticket_thread_reads_update_own"
  ON public.ticket_thread_reads FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id AND public.can_access_ticket(t)
    )
  );

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'ticket_thread_reads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_thread_reads;
  END IF;
END
$migration$;
