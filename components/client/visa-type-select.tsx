import { VISA_TYPE_OPTIONS } from '@/lib/visa-type-options';

export function VisaTypeSelect({
  id,
  name,
  className,
  defaultValue = '',
}: {
  id: string;
  name?: string;
  className: string;
  defaultValue?: string;
}) {
  return (
    <select id={id} name={name} defaultValue={defaultValue} className={className}>
      {VISA_TYPE_OPTIONS.map((o) => (
        <option key={o.value || 'dash'} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
