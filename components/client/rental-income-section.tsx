'use client';

import { useId, useState } from 'react';
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

const selectClassName =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring';

type RentalPropertyRow = {
  id: string;
  propertyType: string;
  address: string;
  city: string;
};

export function RentalIncomeSection() {
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<RentalPropertyRow[]>([]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const propertyType = String(fd.get('rent-property-type') ?? '').trim();
    const address1 = String(fd.get('rent-address-1') ?? '').trim();
    const address2 = String(fd.get('rent-address-2') ?? '').trim();
    const city = String(fd.get('rent-city') ?? '').trim();
    if (!propertyType || !address1 || !city) return;

    const address = [address1, address2].filter(Boolean).join(', ');
    setRows((prev) => [
      ...prev,
      {
        id: `rent-${Date.now()}`,
        propertyType,
        address,
        city,
      },
    ]);
    e.currentTarget.reset();
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">Rental Income</h2>
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="gap-2 bg-amber-400 text-zinc-900 hover:bg-amber-500"
        >
          <Plus className="size-4" />
          Add Rental Property
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-zinc-100 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-800">
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
                  <TableCell>{r.address}</TableCell>
                  <TableCell>{r.city}</TableCell>
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
          className="max-h-[min(90vh,760px)] gap-0 overflow-hidden p-0 sm:max-w-2xl"
        >
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
            <DialogTitle className="text-base font-semibold text-foreground">Add Rental Property</DialogTitle>
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
            className="max-h-[calc(min(90vh,760px)-52px)] overflow-y-auto p-4 sm:p-6"
          >
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rent-property-type">
                    <Req>Property type</Req>
                  </Label>
                  <select
                    id="rent-property-type"
                    name="rent-property-type"
                    className={selectClassName}
                    defaultValue="residencial"
                    required
                  >
                    <option value="residencial">Residencial</option>
                    <option value="commercial">Commercial</option>
                    <option value="mixed-use">Mixed Use</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rent-income-received">Income received</Label>
                  <Input id="rent-income-received" name="rent-income-received" className="bg-background" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rent-address-1">Address line 1</Label>
                  <Input id="rent-address-1" name="rent-address-1" className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rent-address-2">Address line 2</Label>
                  <Input id="rent-address-2" name="rent-address-2" className="bg-background" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rent-city">City</Label>
                  <Input id="rent-city" name="rent-city" className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rent-state">State</Label>
                  <Input id="rent-state" name="rent-state" className="bg-background" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rent-zipcode">Zipcode</Label>
                  <Input id="rent-zipcode" name="rent-zipcode" className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rent-country">Country</Label>
                  <Input id="rent-country" name="rent-country" className="bg-background" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rent-months-rented">
                    <Req>Months rented</Req>
                  </Label>
                  <Input id="rent-months-rented" name="rent-months-rented" className="bg-background" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rent-months-used">
                    <Req>Months used</Req>
                  </Label>
                  <Input id="rent-months-used" name="rent-months-used" className="bg-background" required />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="rent-owned-by">
                    <Req>Owned by</Req>
                  </Label>
                  <Input id="rent-owned-by" name="rent-owned-by" className="bg-background" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rent-cost">
                    <Req>Cost of property</Req>
                  </Label>
                  <Input id="rent-cost" name="rent-cost" className="bg-background" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rent-purchase-date">Date of purchase</Label>
                  <DatePicker id="rent-purchase-date" name="rent-purchase-date" className="bg-background" />
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rent-comments">Comments</Label>
                <Textarea id="rent-comments" name="rent-comments" className="min-h-[90px] resize-y bg-background" />
              </div>

              <div className="flex justify-center border-t border-border pt-4">
                <Button type="submit" className="min-w-[120px] bg-amber-400 text-zinc-900 hover:bg-amber-500">
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
