'use client';

import { ResidencyRecordsSection } from '@/components/client/residency-records-section';

export type { ResidencyRecordRow as TaxpayerResidencyRow } from '@/components/client/residency-records-section';

export function TaxpayerResidencySection({ initialRows = [] }: { initialRows?: unknown[] }) {
  return (
    <ResidencyRecordsSection
      sectionTitle="Taxpayer Residency"
      addButtonLabel="Add Taxpayer Residency Info"
      modalTitle="Add Taxpayer Residency Info"
      emptyStateActionLabel="Add Taxpayer Residency Info"
      fieldPrefix="tp-res"
      initialRows={initialRows}
    />
  );
}
