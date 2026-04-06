'use client';

import { useId, useState } from 'react';
import { Calendar, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { VisaTypeSelect } from '@/components/client/visa-type-select';
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
  lastName: string;
  relationship: string;
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

export function DependentsSection() {
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<DependentRow[]>([]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const firstName = String(fd.get('dep-first') ?? '').trim();
    const lastName = String(fd.get('dep-last') ?? '').trim();
    const relationship = String(fd.get('dep-relationship') ?? '').trim();
    if (!firstName || !lastName || !relationship) return;
    setRows((prev) => [
      ...prev,
      {
        id: `dep-${Date.now()}`,
        firstName,
        lastName,
        relationship,
      },
    ]);
    e.currentTarget.reset();
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">Dependents</h2>
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="gap-2 bg-amber-400 text-zinc-900 hover:bg-amber-500"
        >
          <Plus className="size-4" />
          Add Dependent
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-zinc-700 hover:bg-zinc-700">
              <TableHead className="font-semibold text-white">First Name</TableHead>
              <TableHead className="font-semibold text-white">Last Name</TableHead>
              <TableHead className="font-semibold text-white">Relationship</TableHead>
              <TableHead className="w-24 text-right font-semibold text-white" />
              <TableHead className="w-24 text-right font-semibold text-white" />
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
        <Button type="button" variant="outline" className="gap-2 border-amber-400 text-amber-900 hover:bg-amber-50">
          Next Page
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[min(90vh,800px)] gap-0 overflow-hidden p-0 sm:max-w-2xl"
        >
          <div className="flex items-center justify-between bg-zinc-700 px-4 py-3 text-white">
            <DialogTitle className="text-base font-semibold text-white">Add Dependent</DialogTitle>
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-sm text-xl leading-none text-white opacity-90 hover:opacity-100"
                aria-label="Close"
              >
                ×
              </button>
            </DialogClose>
          </div>

          <form
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
                  <Input id="dep-first" name="dep-first" className="bg-background" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dep-middle">Middle name</Label>
                  <Input id="dep-middle" name="dep-middle" className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dep-last">
                    <Req>Last name</Req>
                  </Label>
                  <Input id="dep-last" name="dep-last" className="bg-background" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dep-relationship">
                  <Req>Relationship</Req>
                </Label>
                <Input id="dep-relationship" name="dep-relationship" className="bg-background" required />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dep-ssn">
                    <Req>SSN/ITIN</Req>
                  </Label>
                  <Input id="dep-ssn" name="dep-ssn" placeholder="XXX-XX-XXXX" className="bg-background" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dep-apply-itin">
                    <Req>Apply ITIN for Dependent</Req>
                  </Label>
                  <select id="dep-apply-itin" name="dep-apply-itin" defaultValue="no" className={selectClassName}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dep-itin-expiry">ITIN Expiry Date</Label>
                <div className="relative max-w-xs">
                  <Input
                    id="dep-itin-expiry"
                    name="dep-itin-expiry"
                    type="text"
                    placeholder="mm/dd/yyyy"
                    className="bg-background pr-10"
                  />
                  <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              {ITIN_HELP}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dep-dob">
                    <Req>Date of birth</Req>
                  </Label>
                  <div className="relative">
                    <Input
                      id="dep-dob"
                      name="dep-dob"
                      type="text"
                      placeholder="mm/dd/yyyy"
                      className="bg-background pr-10"
                      required
                    />
                    <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dep-entry">Date of entry</Label>
                  <div className="relative">
                    <Input
                      id="dep-entry"
                      name="dep-entry"
                      type="text"
                      placeholder="mm/dd/yyyy"
                      className="bg-background pr-10"
                    />
                    <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dep-trump">
                  <Req>Do you want to open a Trump Account/MAGA Account?</Req>
                </Label>
                <select id="dep-trump" name="dep-trump" defaultValue="no" className={cn(selectClassName, 'max-w-xs')}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
                <p className="text-xs text-muted-foreground">Applicable only for kids under 18 years.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dep-visa-type">Visa Type at the end of 2024</Label>
                  <VisaTypeSelect id="dep-visa-type" name="dep-visa-type" className={selectClassName} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dep-visa-issued">Visa issued date</Label>
                  <div className="relative">
                    <Input
                      id="dep-visa-issued"
                      name="dep-visa-issued"
                      type="text"
                      placeholder="mm/dd/yyyy"
                      className="bg-background pr-10"
                    />
                    <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 sm:max-w-xs">
                <Label htmlFor="dep-visa-change">Was there a change in Visa during 2024?</Label>
                <select id="dep-visa-change" name="dep-visa-change" defaultValue="no" className={selectClassName}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dep-reside-2024">
                    <Req>Did your Dependent reside at least 6 months in US with you during 2024?</Req>
                  </Label>
                  <select id="dep-reside-2024" name="dep-reside-2024" defaultValue="no" className={selectClassName}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dep-reside-2025">
                    <Req>Will your Dependent reside at least 6 months in US during 2025?</Req>
                  </Label>
                  <select id="dep-reside-2025" name="dep-reside-2025" defaultValue="no" className={selectClassName}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dep-comments">Comments</Label>
                <Textarea id="dep-comments" name="dep-comments" className="min-h-[100px] resize-y bg-background" />
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-amber-400 text-zinc-900 hover:bg-amber-500">
                  Save dependent
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
