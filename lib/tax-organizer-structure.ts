/** Secondary navigation under Tax Organizer (light bar) */
export const ORGANIZER_SECONDARY = [
  { id: 'basic', label: 'Basic Details' },
  { id: 'residency', label: 'Residency Details' },
  { id: 'income', label: 'Income Details' },
  { id: 'expense', label: 'Expense Details' },
] as const;

export type OrganizerSecondaryId = (typeof ORGANIZER_SECONDARY)[number]['id'];

export const ORGANIZER_TERTIARY: Record<
  OrganizerSecondaryId,
  readonly { id: string; label: string }[]
> = {
  basic: [
    { id: 'taxpayer', label: 'Taxpayer Details' },
    { id: 'dependents', label: 'Dependents' },
    { id: 'address', label: 'Address' },
    { id: 'bank', label: 'Bank Details' },
  ],
  residency: [
    { id: 'taxpayer-residency', label: 'Taxpayer Residency' },
    { id: 'spouse-residency', label: 'Spouse Residency' },
    { id: 'additional-state', label: 'Additional State Info' },
  ],
  income: [
    { id: 'income-sources', label: 'Income Sources' },
    { id: 'additional-incomes', label: 'Additional Incomes' },
    { id: 'rental-income', label: 'Rental Income' },
  ],
  expense: [
    { id: 'expenses', label: 'Expenses' },
    { id: 'electric-hybrid', label: 'Electric/Hybrid Vehicle' },
    { id: 'daycare', label: 'Daycare Expenses' },
  ],
};

export function defaultTertiaryFor(secondary: OrganizerSecondaryId): string {
  return ORGANIZER_TERTIARY[secondary][0].id;
}
