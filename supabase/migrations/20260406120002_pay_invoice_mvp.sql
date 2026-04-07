-- Client can pay own unpaid invoice (MVP placeholder for Stripe)
CREATE OR REPLACE FUNCTION public.pay_invoice_mvp(p_invoice_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv public.invoices%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO inv FROM public.invoices WHERE id = p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = inv.ticket_id AND t.client_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF inv.status = 'paid' THEN
    RETURN;
  END IF;

  UPDATE public.invoices
  SET status = 'paid', paid_at = now()
  WHERE id = p_invoice_id;

  INSERT INTO public.payments (invoice_id, ticket_id, provider, status, amount_cents, receipt_reference)
  VALUES (
    p_invoice_id,
    inv.ticket_id,
    'mvp',
    'succeeded',
    inv.amount_cents,
    'MVP-' || substring(p_invoice_id::text, 1, 8)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.pay_invoice_mvp(UUID) TO authenticated;
