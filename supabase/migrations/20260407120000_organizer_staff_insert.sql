-- Allow staff to insert tax organizer snapshots for a ticket (client_id must match the ticket's client)
CREATE POLICY "organizer_insert_staff"
  ON public.tax_organizer_snapshots FOR INSERT
  WITH CHECK (
    public.is_staff()
    AND client_id IN (
      SELECT t.client_id FROM public.tickets t WHERE t.id = ticket_id
    )
  );
