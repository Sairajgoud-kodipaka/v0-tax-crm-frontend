-- Realtime: push ticket row updates to subscribed clients (workflow stage sync).
-- RLS on tickets still filters which users receive events.

ALTER TABLE public.tickets REPLICA IDENTITY FULL;

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'tickets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
  END IF;
END
$migration$;
