'use client';

import { ResidencyRecordsSection } from '@/components/client/residency-records-section';

export type { ResidencyRecordRow as SpouseResidencyRow } from '@/components/client/residency-records-section';

export function SpouseResidencySection({ initialRows = [] }: { initialRows?: unknown[] }) {
  return (
    <ResidencyRecordsSection
      sectionTitle="Spouse Residency"
      addButtonLabel="Add Spouse Residency Info"
      modalTitle="Add Spouse Residency Info"
      emptyStateActionLabel="Add Spouse Residency Info"
      fieldPrefix="sp-res"
      initialRows={initialRows}
    />
  );
}
