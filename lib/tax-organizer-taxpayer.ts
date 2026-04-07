/** Form `id` and stored snapshot key for Basic → Taxpayer Details */
export const TAXPAYER_ORGANIZER_FORM_ID = 'tax-organizer-taxpayer';

export type TaxpayerOrganizerSnapshot = Record<string, string>;

export function coerceTaxpayerSnapshot(raw: unknown): TaxpayerOrganizerSnapshot {
  if (!raw || typeof raw !== 'object') return {};
  const out: TaxpayerOrganizerSnapshot = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'string') out[k] = v;
    else if (v != null) out[k] = String(v);
  }
  return out;
}
