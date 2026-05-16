'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormSelect } from '@/components/ui/form-select';

const RESOURCE_OPTIONS = [
  { value: 'all', label: 'All Resources' },
  { value: 'Ticket', label: 'Tickets' },
];

export function AuditLogsFilter({ defaultType }: { defaultType: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <FormSelect
      name="type"
      defaultValue={defaultType}
      options={RESOURCE_OPTIONS}
      triggerClassName="min-w-[10rem]"
      onValueChange={(type) => {
        const params = new URLSearchParams(searchParams.toString());
        if (type === 'all') params.delete('type');
        else params.set('type', type);
        const q = params.get('q');
        if (!q) params.delete('q');
        router.push(`/admin/audit-logs?${params.toString()}`);
      }}
    />
  );
}
