'use client';

import { useId, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { VisaTypeSelect } from '@/components/client/visa-type-select';
import { ticketCaseBlackCtaButtonClassName } from '@/lib/ticket-case-tab-styles';
import { cn } from '@/lib/utils';

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

export type DependentRow = {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  relationship: string;
  ssnItin: string;
  applyItin: string;
  itinExpiryDate: string;
  dob: string;
  entryDate: string;
  trumpAccount: string;
  visaType: string;
  visaIssuedDate: string;
  visaChange: string;
  reside2024: string;
  reside2025: string;
  comments: string;
};

const ITIN_HELP = (
  <div className="space-y-3 rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
    <p className="font-medium text-foreground">
      An Individual Taxpayer Identification Number (ITIN) may expire under IRS regulations if any one of
      the conditions below applies:
    </p>
    <p>
      <span className="font-medium text-foreground">1. Expiration Based on Middle Digits.</span>
      <br />
      ITINs with middle digits 70–88 or 90–99 that were issued before January 1, 2013 are considered expired
      by the IRS, unless the ITIN holder has successfully renewed the ITIN with the IRS.
    </p>
    <p>
      <span className="font-medium text-foreground">2. Expiration Due to Non-Use.</span>
      <br />
      Regardless of the middle digits, any ITIN will expire if it has not been used on at least one U.S.
      federal income tax return for three consecutive tax years. For Tax Year 2024, the IRS considers an
      ITIN expired if it was not used on a federal tax return for Tax Years 2021, 2022, and 2023.
    </p>
  </div>
);

export function DependentsSection({ initialRows = [] }: { initialRows?: unknown[] }) {
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rows, setRows] = useState<DependentRow[]>(() => {
    return (initialRows as DependentRow[]).filter((row) => row && typeof row === 'object');
  });
  const editingRow = rows.find((row) => row.id === editingId);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const firstName = String(fd.get('dep-first') ?? '').trim();
    const middleName = String(fd.get('dep-middle') ?? '').trim();
    const lastName = String(fd.get('dep-last') ?? '').trim();
    const relationship = String(fd.get('dep-relationship') ?? '').trim();
    const ssnItin = String(fd.get('dep-ssn') ?? '').trim();
    const applyItin = String(fd.get('dep-apply-itin') ?? '').trim();
    const itinExpiryDate = String(fd.get('dep-itin-expiry') ?? '').trim();
    const dob = String(fd.get('dep-dob') ?? '').trim();
    const entryDate = String(fd.get('dep-entry') ?? '').trim();
    const trumpAccount = String(fd.get('dep-trump') ?? '').trim();
    const visaType = String(fd.get('dep-visa-type') ?? '').trim();
    const visaIssuedDate = String(fd.get('dep-visa-issued') ?? '').trim();
    const visaChange = String(fd.get('dep-visa-change') ?? '').trim();
    const reside2024 = String(fd.get('dep-reside-2024') ?? '').trim();
    const reside2025 = String(fd.get('dep-reside-2025') ?? '').trim();
    const comments = String(fd.get('dep-comments') ?? '').trim();
    if (!firstName || !lastName || !relationship) return;
    const nextRow: DependentRow = {
      id: editingId ?? `dep-${Date.now()}`,
      firstName,
      middleName,
      lastName,
      relationship,
      ssnItin,
      applyItin,
      itinExpiryDate,
      dob,
      entryDate,
      trumpAccount,
      visaType,
      visaIssuedDate,
      visaChange,
      reside2024,
      reside2025,
      comments,
    };
    setRows((prev) =>
      editingId ? prev.map((row) => (row.id === editingId ? nextRow : row)) : [...prev, nextRow],
    );
    e.currentTarget.reset();
    setEditingId(null);
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">Dependents</h2>
        <Button
          type="button"
          variant="default"
          onClick={() => setOpen(true)}
          className={cn('gap-2', ticketCaseBlackCtaButtonClassName)}
        >
          <Plus className="size-4" />
          Add Dependent
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-secondary hover:bg-secondary">
              <TableHead className="font-semibold text-secondary-foreground">First Name</TableHead>
              <TableHead className="font-semibold text-secondary-foreground">Last Name</TableHead>
              <TableHead className="font-semibold text-secondary-foreground">Relationship</TableHead>
              <TableHead className="w-24 text-right font-semibold text-secondary-foreground" />
              <TableHead className="w-24 text-right font-semibold text-secondary-foreground" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No dependents added yet. Use &quot;Add Dependent&quot; to add one.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.firstName}</TableCell>
                  <TableCell className="font-medium">{r.lastName}</TableCell>
                  <TableCell>{r.relationship}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="Edit"
                      onClick={() => {
                        setEditingId(r.id);
                        setOpen(true);
                      }}
                    >
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
      <input type="hidden" name="rows" value={JSON.stringify(rows)} readOnly />

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setEditingId(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[min(90vh,800px)] gap-0 overflow-hidden p-0 sm:max-w-2xl"
        >
          <div className="flex items-center justify-between bg-secondary px-4 py-3 text-secondary-foreground">
            <DialogTitle className="text-base font-semibold text-secondary-foreground">
              {editingId ? 'Edit Dependent' : 'Add Dependent'}
            </DialogTitle>
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-sm text-xl leading-none text-secondary-foreground opacity-90 hover:opacity-100"
                aria-label="Close"
              >
                ×
              </button>
            </DialogClose>
          </div>

          <form
            key={editingId ?? 'new'}
            id={formId}
            onSubmit={handleSubmit}
            className="max-h-[calc(min(90vh,800px)-52px)] overflow-y-auto p-4 sm:p-6"
          >
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="dep-first">
                    <Req>First name</Req>
                  </Label>
                  <Input id="dep-first" name="dep-first" className="bg-background" required defaultValue={editingRow?.firstName ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dep-middle">Middle name</Label>
                  <Input id="dep-middle" name="dep-middle" className="bg-background" defaultValue={editingRow?.middleName ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dep-last">
                    <Req>Last name</Req>
                  </Label>
                  <Input id="dep-last" name="dep-last" className="bg-background" required defaultValue={editingRow?.lastName ?? ''} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dep-relationship">
                  <Req>Relationship</Req>
                </Label>
                <Input id="dep-relationship" name="dep-relationship" className="bg-background" required defaultValue={editingRow?.relationship ?? ''} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dep-ssn">
                    <Req>SSN/ITIN</Req>
                  </Label>
                  <Input id="dep-ssn" name="dep-ssn" placeholder="XXX-XX-XXXX" className="bg-background" required defaultValue={editingRow?.ssnItin ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dep-apply-itin">
                    <Req>Apply ITIN for Dependent</Req>
                  </Label>
                  <select id="dep-apply-itin" name="dep-apply-itin" defaultValue={editingRow?.applyItin || 'no'} className={selectClassName}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dep-itin-expiry">ITIN Expiry Date</Label>
                <div className="max-w-xs">
                  <DatePicker id="dep-itin-expiry" name="dep-itin-expiry" className="bg-background" defaultValue={editingRow?.itinExpiryDate ?? ''} />
                </div>
              </div>

              {ITIN_HELP}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dep-dob">
                    <Req>Date of birth</Req>
                  </Label>
                  <DatePicker id="dep-dob" name="dep-dob" className="bg-background" required defaultValue={editingRow?.dob ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dep-entry">Date of entry</Label>
                  <DatePicker id="dep-entry" name="dep-entry" className="bg-background" defaultValue={editingRow?.entryDate ?? ''} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dep-trump">
                  <Req>Do you want to open a Trump Account/MAGA Account?</Req>
                </Label>
                <select id="dep-trump" name="dep-trump" defaultValue={editingRow?.trumpAccount || 'no'} className={cn(selectClassName, 'max-w-xs')}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
                <p className="text-xs text-muted-foreground">Applicable only for kids under 18 years.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dep-visa-type">Visa Type at the end of 2024</Label>
                  <VisaTypeSelect id="dep-visa-type" name="dep-visa-type" className={selectClassName} defaultValue={editingRow?.visaType ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dep-visa-issued">Visa issued date</Label>
                  <DatePicker id="dep-visa-issued" name="dep-visa-issued" className="bg-background" defaultValue={editingRow?.visaIssuedDate ?? ''} />
                </div>
              </div>

              <div className="space-y-2 sm:max-w-xs">
                <Label htmlFor="dep-visa-change">Was there a change in Visa during 2024?</Label>
                <select id="dep-visa-change" name="dep-visa-change" defaultValue={editingRow?.visaChange || 'no'} className={selectClassName}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dep-reside-2024">
                    <Req>Did your Dependent reside at least 6 months in US with you during 2024?</Req>
                  </Label>
                  <select id="dep-reside-2024" name="dep-reside-2024" defaultValue={editingRow?.reside2024 || 'no'} className={selectClassName}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dep-reside-2025">
                    <Req>Will your Dependent reside at least 6 months in US during 2025?</Req>
                  </Label>
                  <select id="dep-reside-2025" name="dep-reside-2025" defaultValue={editingRow?.reside2025 || 'no'} className={selectClassName}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dep-comments">Comments</Label>
                <Textarea id="dep-comments" name="dep-comments" className="min-h-[100px] resize-y bg-background" defaultValue={editingRow?.comments ?? ''} />
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    setEditingId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="default" className={ticketCaseBlackCtaButtonClassName}>
                  {editingId ? 'Update dependent' : 'Save dependent'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
