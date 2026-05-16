'use client';

import { useState } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type FormSelectOption = { value: string; label: string };

function normalizeOptions(options: readonly FormSelectOption[] | readonly string[]): FormSelectOption[] {
  return options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
}

type FormSelectProps = {
  name?: string;
  id?: string;
  form?: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  options: readonly FormSelectOption[] | readonly string[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  size?: 'sm' | 'default';
  disabled?: boolean;
  required?: boolean;
};

export function FormSelect({
  name,
  id,
  form,
  defaultValue = '',
  value: controlledValue,
  onValueChange,
  options,
  placeholder = 'Select…',
  className,
  triggerClassName,
  size = 'default',
  disabled,
  required,
}: FormSelectProps) {
  const normalized = normalizeOptions(options);
  const [internal, setInternal] = useState(defaultValue);
  const value = controlledValue ?? internal;

  const handleChange = (next: string) => {
    setInternal(next);
    onValueChange?.(next);
  };

  return (
    <div className={cn(className)}>
      {name ? <input type="hidden" name={name} form={form} value={value} required={required} /> : null}
      <Select value={value || undefined} onValueChange={handleChange} disabled={disabled} required={required}>
        <SelectTrigger id={id} size={size} className={cn('w-full', triggerClassName)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {normalized.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
