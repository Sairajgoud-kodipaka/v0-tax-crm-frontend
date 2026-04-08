-- Allow document owners (uploaders) to UPDATE rows for replace-file flows, not only staff.
DROP POLICY IF EXISTS "documents_update_staff" ON public.documents;

CREATE POLICY "documents_update_staff_or_uploader"
  ON public.documents FOR UPDATE
  TO authenticated
  USING (
    public.is_staff()
    OR (
      uploaded_by IS NOT NULL
      AND uploaded_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.tickets t
        WHERE t.id = documents.ticket_id AND public.can_access_ticket(t)
      )
    )
  )
  WITH CHECK (
    public.is_staff()
    OR (
      uploaded_by IS NOT NULL
      AND uploaded_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.tickets t
        WHERE t.id = documents.ticket_id AND public.can_access_ticket(t)
      )
    )
  );
