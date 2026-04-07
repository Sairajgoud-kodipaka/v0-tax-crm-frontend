'use client';

import { useId, useMemo, useState } from 'react';
import { ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { ticketCaseBlackCtaButtonClassName } from '@/lib/ticket-case-tab-styles';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { US_STATE_OPTIONS } from '@/lib/us-states';

const selectClassName =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring';

function Req({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <span className="text-destructive" aria-hidden>
        *
      </span>
    </>
  );
}

export type ResidencyRecordRow = {
  id: string;
  country: string;
  stateCode: string;
  city: string;
  zipcode: string;
  fromDate: string;
  toDate: string;
  comments: string;
};

function stateLabel(code: string): string {
  return (US_STATE_OPTIONS.find((o) => o.value === code)?.label ?? code) || '—';
}

export type ResidencyRecordsSectionProps = {
  sectionTitle: string;
  addButtonLabel: string;
  modalTitle: string;
  /** Shown in empty table; should match the add action, e.g. "Add Spouse Residency Info" */
  emptyStateActionLabel: string;
  /** Prefix for form field `name` and `id` attributes (e.g. tp-res, sp-res) */
  fieldPrefix: string;
};

export function ResidencyRecordsSection({
  sectionTitle,
  addButtonLabel,
  modalTitle,
  emptyStateActionLabel,
  fieldPrefix,
}: ResidencyRecordsSectionProps) {
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ResidencyRecordRow[]>([]);

  const stateOptionMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const o of US_STATE_OPTIONS) m.set(o.value, o.label);
    return m;
  }, []);

  const f = {
    country: `${fieldPrefix}-country`,
    state: `${fieldPrefix}-state`,
    city: `${fieldPrefix}-city`,
    zip: `${fieldPrefix}-zip`,
    from: `${fieldPrefix}-from`,
    to: `${fieldPrefix}-to`,
    comments: `${fieldPrefix}-comments`,
  } as const;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const country = String(fd.get(f.country) ?? '').trim();
    const stateCode = String(fd.get(f.state) ?? '').trim();
    const city = String(fd.get(f.city) ?? '').trim();
    const zipcode = String(fd.get(f.zip) ?? '').trim();
    const fromDate = String(fd.get(f.from) ?? '').trim();
    const toDate = String(fd.get(f.to) ?? '').trim();
    const comments = String(fd.get(f.comments) ?? '').trim();
    if (!country || !stateCode || !city || !zipcode || !fromDate || !toDate) return;

    setRows((prev) => [
      ...prev,
      {
        id: `${fieldPrefix}-${Date.now()}`,
        country,
        stateCode,
        city,
        zipcode,
        fromDate,
        toDate,
        comments,
      },
    ]);
    e.currentTarget.reset();
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">{sectionTitle}</h2>
        <Button
          type="button"
          onClick={() => setOpen(true)}
          variant="default"
          className={cn('gap-2', ticketCaseBlackCtaButtonClassName)}
        >
          <Plus className="size-4" />
          {addButtonLabel}
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/60 hover:bg-muted/60">
              <TableHead className="font-semibold text-foreground">Country</TableHead>
              <TableHead className="font-semibold text-foreground">State</TableHead>
              <TableHead className="font-semibold text-foreground">From Date</TableHead>
              <TableHead className="font-semibold text-foreground">To Date</TableHead>
              <TableHead className="w-24 text-right font-semibold text-foreground" />
              <TableHead className="w-24 text-right font-semibold text-foreground" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No residency records yet. Use &quot;{emptyStateActionLabel}&quot; to add one.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.country}</TableCell>
                  <TableCell>{stateOptionMap.get(r.stateCode) ?? stateLabel(r.stateCode)}</TableCell>
                  <TableCell>{r.fromDate}</TableCell>
                  <TableCell>{r.toDate}</TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="ghost" size="icon" className="size-8" aria-label="Edit">
                      <Pencil className="size-4" />
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      aria-label="Delete"
                      onClick={() => setRows((prev) => prev.filter((x) => x.id !== r.id))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/10">
          Next Page
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[min(90vh,720px)] gap-0 overflow-hidden p-0 sm:max-w-lg"
        >
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
            <DialogTitle className="text-base font-semibold text-foreground">{modalTitle}</DialogTitle>
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-sm text-xl leading-none text-muted-foreground opacity-90 hover:opacity-100"
                aria-label="Close"
              >
                ×
              </button>
            </DialogClose>
          </div>

          <form
            id={formId}
            onSubmit={handleSubmit}
            className="max-h-[calc(min(90vh,720px)-52px)] overflow-y-auto p-4 sm:p-6"
          >
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor={f.country}>
                  <Req>Country</Req>
                </Label>
                <Input id={f.country} name={f.country} className="bg-background" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor={f.state}>
                  <Req>State</Req>
                </Label>
                <select id={f.state} name={f.state} className={selectClassName} required defaultValue="">
                  {US_STATE_OPTIONS.map((o) => (
                    <option key={o.value || 'placeholder'} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={f.city}>
                  <Req>City</Req>
                </Label>
                <Input id={f.city} name={f.city} className="bg-background" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor={f.zip}>
                  <Req>Zipcode</Req>
                </Label>
                <Input id={f.zip} name={f.zip} autoComplete="postal-code" className="bg-background" required />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={f.from}>
                    <Req>From date</Req>
                  </Label>
                  <DatePicker id={f.from} name={f.from} className="bg-background" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={f.to}>
                    <Req>To date</Req>
                  </Label>
                  <DatePicker id={f.to} name={f.to} className="bg-background" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={f.comments}>Comments</Label>
                <Textarea id={f.comments} name={f.comments} className="min-h-[100px] resize-y bg-background" />
              </div>

              <div className="flex justify-center border-t border-border pt-4">
                <Button type="submit" variant="default" className={cn('min-w-[120px]', ticketCaseBlackCtaButtonClassName)}>
                  Save
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
