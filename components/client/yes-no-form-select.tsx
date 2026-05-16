'use client';

import { FormSelect, type FormSelectOption } from '@/components/ui/form-select';
import { YES_NO_OPTIONS } from '@/lib/native-select-styles';

type YesNoFormSelectProps = {
  name: string;
  id?: string;
  defaultValue?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  required?: boolean;
};

export function YesNoFormSelect({
  defaultValue = 'no',
  ...props
}: YesNoFormSelectProps) {
  return (
    <FormSelect
      {...props}
      defaultValue={defaultValue}
      options={YES_NO_OPTIONS as unknown as FormSelectOption[]}
    />
  );
}
