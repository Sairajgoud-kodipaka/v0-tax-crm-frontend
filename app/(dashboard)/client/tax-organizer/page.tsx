import { redirect } from 'next/navigation';

export default function ClientTaxOrganizerPage() {
  // Organizer lives in ticket context (`/client/cases/[id]`) via TaxOrganizerPanel.
  redirect('/client');
}
