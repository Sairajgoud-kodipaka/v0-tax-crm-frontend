'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type DatePickerProps = {
  id: string;
  name?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  defaultValue?: string;
  disabled?: boolean;
};

const YEAR_FROM = 1900;
const YEAR_TO = () => new Date().getFullYear() + 10;

/** Strict mm/dd/yyyy */
function parseMmDdYyyy(value?: string): Date | undefined {
  if (!value) return undefined;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return undefined;
  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  return validateYmd(year, month, day);
}

/** Typed input: m/d/yyyy or mm/dd/yyyy */
function parseFlexibleDate(value: string): Date | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (!match) return undefined;
  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  return validateYmd(year, month, day);
}

function validateYmd(year: number, month: number, day: number): Date | undefined {
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return undefined;
  }
  return parsed;
}

function formatMmDdYyyy(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${month}/${day}/${year}`;
}

export function DatePicker({
  id,
  name,
  placeholder = 'mm/dd/yyyy',
  className,
  required,
  defaultValue,
  disabled,
}: DatePickerProps) {
  const initialDate = useMemo(() => parseMmDdYyyy(defaultValue), [defaultValue]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [text, setText] = useState(() =>
    initialDate ? formatMmDdYyyy(initialDate) : '',
  );
  const [open, setOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState<Date>(() => initialDate ?? new Date());
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const form = hiddenInputRef.current?.form;
    if (!form) return;
    const handleReset = () => {
      setSelectedDate(initialDate);
      setText(initialDate ? formatMmDdYyyy(initialDate) : '');
      setDisplayMonth(initialDate ?? new Date());
    };
    form.addEventListener('reset', handleReset);
    return () => form.removeEventListener('reset', handleReset);
  }, [initialDate]);

  useEffect(() => {
    if (selectedDate) setDisplayMonth(selectedDate);
  }, [selectedDate]);

  function handleTextBlur() {
    const parsed = parseFlexibleDate(text);
    if (!text.trim()) {
      setSelectedDate(undefined);
      return;
    }
    if (parsed) {
      setSelectedDate(parsed);
      setText(formatMmDdYyyy(parsed));
    } else {
      setSelectedDate(undefined);
    }
  }

  function handleCalendarSelect(d: Date | undefined) {
    setSelectedDate(d);
    if (d) {
      setText(formatMmDdYyyy(d));
      setOpen(false);
    }
  }

  return (
    <div className={cn('relative flex w-full', className)}>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleTextBlur}
        className="bg-background pr-10"
        aria-invalid={text.trim() !== '' && !parseFlexibleDate(text)}
      />
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) {
            setDisplayMonth(selectedDate ?? new Date());
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="absolute right-0 top-0 h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Open calendar"
          >
            <CalendarIcon className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            month={displayMonth}
            onMonthChange={setDisplayMonth}
            selected={selectedDate}
            onSelect={handleCalendarSelect}
            captionLayout="dropdown"
            fromYear={YEAR_FROM}
            toYear={YEAR_TO()}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <input
        ref={hiddenInputRef}
        type="hidden"
        name={name}
        value={selectedDate ? formatMmDdYyyy(selectedDate) : ''}
        required={required}
        readOnly
      />
    </div>
  );
}
