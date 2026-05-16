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
import { FormSelect } from '@/components/ui/form-select';
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

const selectClassName = 'w-full';

type RentalPropertyRow = {
  id: string;
  propertyType: string;
  incomeReceived: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
  monthsRented: string;
  monthsUsed: string;
  ownedBy: string;
  cost: string;
  purchaseDate: string;
  expenseClaim: string;
  comments: string;
};

export function RentalIncomeSection({ initialRows = [] }: { initialRows?: unknown[] }) {
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rows, setRows] = useState<RentalPropertyRow[]>(() => {
    return (initialRows as RentalPropertyRow[]).filter((row) => row && typeof row === 'object');
  });
  const editingRow = rows.find((row) => row.id === editingId);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const propertyType = String(fd.get('rent-property-type') ?? '').trim();
    const incomeReceived = String(fd.get('rent-income-received') ?? '').trim();
    const address1 = String(fd.get('rent-address-1') ?? '').trim();
    const address2 = String(fd.get('rent-address-2') ?? '').trim();
    const city = String(fd.get('rent-city') ?? '').trim();
    const state = String(fd.get('rent-state') ?? '').trim();
    const zipcode = String(fd.get('rent-zipcode') ?? '').trim();
    const country = String(fd.get('rent-country') ?? '').trim();
    const monthsRented = String(fd.get('rent-months-rented') ?? '').trim();
    const monthsUsed = String(fd.get('rent-months-used') ?? '').trim();
    const ownedBy = String(fd.get('rent-owned-by') ?? '').trim();
    const cost = String(fd.get('rent-cost') ?? '').trim();
    const purchaseDate = String(fd.get('rent-purchase-date') ?? '').trim();
    const expenseClaim = String(fd.get('rent-expense-claim') ?? '').trim();
    const comments = String(fd.get('rent-comments') ?? '').trim();
    if (!propertyType || !address1 || !city) return;
    const nextRow: RentalPropertyRow = {
      id: editingId ?? `rent-${Date.now()}`,
      propertyType,
      incomeReceived,
      address1,
      address2,
      city,
      state,
      zipcode,
      country,
      monthsRented,
      monthsUsed,
      ownedBy,
      cost,
      purchaseDate,
      expenseClaim,
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
        <h2 className="text-base font-semibold text-foreground">Rental Income</h2>
        <Button
          type="button"
          onClick={() => setOpen(true)}
          variant="default"
          className={cn('gap-2', ticketCaseBlackCtaButtonClassName)}
        >
          <Plus className="size-4" />
          Add Rental Property
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/60 hover:bg-muted/60">
              <TableHead className="font-semibold text-foreground">Property Type</TableHead>
              <TableHead className="font-semibold text-foreground">Address</TableHead>
              <TableHead className="font-semibold text-foreground">City</TableHead>
              <TableHead className="w-24 text-right font-semibold text-foreground" />
              <TableHead className="w-24 text-right font-semibold text-foreground" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No rental properties added yet. Use &quot;Add Rental Property&quot; to add one.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.propertyType}</TableCell>
                  <TableCell>{[r.address1, r.address2].filter(Boolean).join(', ')}</TableCell>
                  <TableCell>{r.city}</TableCell>
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
          className="max-h-[min(90vh,760px)] gap-0 overflow-hidden p-0 sm:max-w-2xl"
        >
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
            <DialogTitle className="text-base font-semibold text-foreground">
              {editingId ? 'Edit Rental Property' : 'Add Rental Property'}
            </DialogTitle>
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
            key={editingId ?? 'new'}
            id={formId}
            onSubmit={handleSubmit}
            className="max-h-[calc(min(90vh,760px)-52px)] overflow-y-auto p-4 sm:p-6"
          >
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rent-property-type">
                    <Req>Property type</Req>
                  </Label>
                  <FormSelect
                    id="rent-property-type"
                    name="rent-property-type"
                    className={selectClassName}
                    defaultValue={editingRow?.propertyType || 'residencial'}
                    required
                    options={[
                      { value: 'residencial', label: 'Residencial' },
                      { value: 'commercial', label: 'Commercial' },
                      { value: 'mixed-use', label: 'Mixed Use' },
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rent-income-received">Income received</Label>
                  <Input id="rent-income-received" name="rent-income-received" className="bg-background" defaultValue={editingRow?.incomeReceived ?? ''} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rent-address-1">Address line 1</Label>
                  <Input id="rent-address-1" name="rent-address-1" className="bg-background" defaultValue={editingRow?.address1 ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rent-address-2">Address line 2</Label>
                  <Input id="rent-address-2" name="rent-address-2" className="bg-background" defaultValue={editingRow?.address2 ?? ''} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rent-city">City</Label>
                  <Input id="rent-city" name="rent-city" className="bg-background" defaultValue={editingRow?.city ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rent-state">State</Label>
                  <Input id="rent-state" name="rent-state" className="bg-background" defaultValue={editingRow?.state ?? ''} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rent-zipcode">Zipcode</Label>
                  <Input id="rent-zipcode" name="rent-zipcode" className="bg-background" defaultValue={editingRow?.zipcode ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rent-country">Country</Label>
                  <Input id="rent-country" name="rent-country" className="bg-background" defaultValue={editingRow?.country ?? ''} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rent-months-rented">
                    <Req>Months rented</Req>
                  </Label>
                  <Input id="rent-months-rented" name="rent-months-rented" className="bg-background" required defaultValue={editingRow?.monthsRented ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rent-months-used">
                    <Req>Months used</Req>
                  </Label>
                  <Input id="rent-months-used" name="rent-months-used" className="bg-background" required defaultValue={editingRow?.monthsUsed ?? ''} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="rent-owned-by">
                    <Req>Owned by</Req>
                  </Label>
                  <Input id="rent-owned-by" name="rent-owned-by" className="bg-background" required defaultValue={editingRow?.ownedBy ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rent-cost">
                    <Req>Cost of property</Req>
                  </Label>
                  <Input id="rent-cost" name="rent-cost" className="bg-background" required defaultValue={editingRow?.cost ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rent-purchase-date">Date of purchase</Label>
                  <DatePicker id="rent-purchase-date" name="rent-purchase-date" className="bg-background" defaultValue={editingRow?.purchaseDate ?? ''} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rent-expense-claim">
                  You can claim expenses like HOA, insurance, mortgage interest and property tax paid during 2024?
                </Label>
                <Textarea
                  id="rent-expense-claim"
                  name="rent-expense-claim"
                  className="min-h-[70px] resize-y bg-background"
                  defaultValue={editingRow?.expenseClaim ?? ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rent-comments">Comments</Label>
                <Textarea id="rent-comments" name="rent-comments" className="min-h-[90px] resize-y bg-background" defaultValue={editingRow?.comments ?? ''} />
              </div>

              <div className="flex justify-center border-t border-border pt-4">
                <Button type="submit" variant="default" className={cn('min-w-[120px]', ticketCaseBlackCtaButtonClassName)}>
                  {editingId ? 'Update' : 'Save'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
