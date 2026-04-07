-- Allow deleting tickets only for admin users.
CREATE POLICY "tickets_delete_admin"
  ON public.tickets FOR DELETE
  USING (public.is_admin());
