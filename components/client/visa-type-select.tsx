'use client';

import { FormSelect } from '@/components/ui/form-select';
import { VISA_TYPE_OPTIONS } from '@/lib/visa-type-options';

export function VisaTypeSelect({
  id,
  name,
  className,
  triggerClassName,
  defaultValue = '',
}: {
  id: string;
  name?: string;
  className?: string;
  triggerClassName?: string;
  defaultValue?: string;
}) {
  return (
    <FormSelect
      id={id}
      name={name}
      defaultValue={defaultValue}
      options={VISA_TYPE_OPTIONS.filter((o) => o.value !== '').map((o) => ({ value: o.value, label: o.label }))}
      placeholder="Select visa type"
      className={className}
      triggerClassName={triggerClassName}
    />
  );
}
