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

type ElectricVehicleRow = {
  id: string;
  year: string;
  make: string;
  model: string;
  vehicleId: string;
  purchaseDate: string;
  vehicleCost: string;
  comments: string;
};

export function ElectricHybridSection({ initialRows = [] }: { initialRows?: unknown[] }) {
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rows, setRows] = useState<ElectricVehicleRow[]>(() => {
    return (initialRows as ElectricVehicleRow[]).filter((row) => row && typeof row === 'object');
  });
  const editingRow = rows.find((row) => row.id === editingId);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const year = String(fd.get('ev-year') ?? '').trim();
    const make = String(fd.get('ev-make') ?? '').trim();
    const model = String(fd.get('ev-model') ?? '').trim();
    const vehicleId = String(fd.get('ev-id') ?? '').trim();
    const purchaseDate = String(fd.get('ev-purchase-date') ?? '').trim();
    const vehicleCost = String(fd.get('ev-cost') ?? '').trim();
    const comments = String(fd.get('ev-comments') ?? '').trim();
    if (!year || !make || !model || !vehicleId || !purchaseDate || !vehicleCost) return;

    const nextRow: ElectricVehicleRow = {
      id: editingId ?? `ev-${Date.now()}`,
      year,
      make,
      model,
      vehicleId,
      purchaseDate,
      vehicleCost,
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
        <h2 className="text-base font-semibold text-foreground">Electric/Hybrid Vehicle</h2>
        <Button
          type="button"
          onClick={() => setOpen(true)}
          variant="default"
          className={cn('gap-2', ticketCaseBlackCtaButtonClassName)}
        >
          <Plus className="size-4" />
          Add Electric Vehicle
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/60 hover:bg-muted/60">
              <TableHead className="font-semibold text-foreground">Year</TableHead>
              <TableHead className="font-semibold text-foreground">Make</TableHead>
              <TableHead className="font-semibold text-foreground">Model</TableHead>
              <TableHead className="font-semibold text-foreground">Vehicle ID</TableHead>
              <TableHead className="w-24 text-right font-semibold text-foreground" />
              <TableHead className="w-24 text-right font-semibold text-foreground" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No electric/hybrid vehicles yet. Use &quot;Add Electric Vehicle&quot; to add one.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.year}</TableCell>
                  <TableCell>{r.make}</TableCell>
                  <TableCell>{r.model}</TableCell>
                  <TableCell>{r.vehicleId}</TableCell>
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
          className="max-h-[min(90vh,700px)] gap-0 overflow-hidden p-0 sm:max-w-2xl"
        >
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
            <DialogTitle className="text-base font-semibold text-foreground">
              {editingId ? 'Edit Electric Vehicle' : 'Add Electric Vehicle'}
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
            className="max-h-[calc(min(90vh,700px)-52px)] overflow-y-auto p-4 sm:p-6"
          >
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ev-year">
                    <Req>Vehicle year</Req>
                  </Label>
                  <Input id="ev-year" name="ev-year" className="bg-background" required defaultValue={editingRow?.year ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ev-make">
                    <Req>Vehicle make</Req>
                  </Label>
                  <Input id="ev-make" name="ev-make" className="bg-background" required defaultValue={editingRow?.make ?? ''} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ev-model">
                    <Req>Vehicle model</Req>
                  </Label>
                  <Input id="ev-model" name="ev-model" className="bg-background" required defaultValue={editingRow?.model ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ev-id">
                    <Req>Vehicle id</Req>
                  </Label>
                  <Input id="ev-id" name="ev-id" className="bg-background" required defaultValue={editingRow?.vehicleId ?? ''} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ev-purchase-date">
                    <Req>Vehicle purchase date</Req>
                  </Label>
                  <DatePicker id="ev-purchase-date" name="ev-purchase-date" className="bg-background" required defaultValue={editingRow?.purchaseDate ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ev-cost">
                    <Req>Vehicle cost</Req>
                  </Label>
                  <Input id="ev-cost" name="ev-cost" className="bg-background" required defaultValue={editingRow?.vehicleCost ?? ''} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ev-comments">Comments</Label>
                <Textarea id="ev-comments" name="ev-comments" className="min-h-[100px] resize-y bg-background" defaultValue={editingRow?.comments ?? ''} />
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
