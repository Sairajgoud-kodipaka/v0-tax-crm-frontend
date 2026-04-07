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

export type AdditionalIncomeRow = {
  id: string;
  incomeSource: string;
  incomeType: string;
  incomeAmount: string;
  taxPaid: string;
  comments: string;
};

export function AdditionalIncomesSection({ initialRows = [] }: { initialRows?: unknown[] }) {
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rows, setRows] = useState<AdditionalIncomeRow[]>(() => {
    return (initialRows as AdditionalIncomeRow[]).filter((row) => row && typeof row === 'object');
  });
  const editingRow = rows.find((row) => row.id === editingId);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const incomeSource = String(fd.get('add-inc-source') ?? '').trim();
    const incomeType = String(fd.get('add-inc-type') ?? '').trim();
    const incomeAmount = String(fd.get('add-inc-amount') ?? '').trim();
    const taxPaid = String(fd.get('add-inc-tax') ?? '').trim();
    const comments = String(fd.get('add-inc-comments') ?? '').trim();
    if (!incomeSource || !incomeType || !incomeAmount || !taxPaid) return;

    const nextRow: AdditionalIncomeRow = {
      id: editingId ?? `add-inc-${Date.now()}`,
      incomeSource,
      incomeType,
      incomeAmount,
      taxPaid,
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
        <h2 className="text-base font-semibold text-foreground">Additional Incomes</h2>
        <Button
          type="button"
          onClick={() => setOpen(true)}
          variant="default"
          className={cn('gap-2', ticketCaseBlackCtaButtonClassName)}
        >
          <Plus className="size-4" />
          Add Income
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/60 hover:bg-muted/60">
              <TableHead className="font-semibold text-foreground">Income Source</TableHead>
              <TableHead className="font-semibold text-foreground">Income Type</TableHead>
              <TableHead className="font-semibold text-foreground">Income Amount</TableHead>
              <TableHead className="font-semibold text-foreground">Tax Paid</TableHead>
              <TableHead className="w-24 text-right font-semibold text-foreground" />
              <TableHead className="w-24 text-right font-semibold text-foreground" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No income entries yet. Use &quot;Add Income&quot; to add one.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.incomeSource}</TableCell>
                  <TableCell>{r.incomeType}</TableCell>
                  <TableCell>{r.incomeAmount}</TableCell>
                  <TableCell>{r.taxPaid}</TableCell>
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
          className="max-h-[min(90vh,640px)] gap-0 overflow-hidden p-0 sm:max-w-2xl"
        >
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
            <DialogTitle className="text-base font-semibold text-foreground">
              {editingId ? 'Edit Income' : 'Add Income'}
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
            className="max-h-[calc(min(90vh,640px)-52px)] overflow-y-auto p-4 sm:p-6"
          >
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="add-inc-source">
                    <Req>Income source</Req>
                  </Label>
                  <Input id="add-inc-source" name="add-inc-source" className="bg-background" required defaultValue={editingRow?.incomeSource ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-inc-type">
                    <Req>Income type</Req>
                  </Label>
                  <Input id="add-inc-type" name="add-inc-type" className="bg-background" required defaultValue={editingRow?.incomeType ?? ''} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="add-inc-amount">
                    <Req>Income amount</Req>
                  </Label>
                  <Input id="add-inc-amount" name="add-inc-amount" className="bg-background" required defaultValue={editingRow?.incomeAmount ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-inc-tax">
                    <Req>Income tax paid</Req>
                  </Label>
                  <Input id="add-inc-tax" name="add-inc-tax" className="bg-background" required defaultValue={editingRow?.taxPaid ?? ''} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-inc-comments">Comments</Label>
                <Textarea id="add-inc-comments" name="add-inc-comments" className="min-h-[100px] resize-y bg-background" defaultValue={editingRow?.comments ?? ''} />
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
