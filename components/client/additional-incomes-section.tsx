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

export function AdditionalIncomesSection() {
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<AdditionalIncomeRow[]>([]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const incomeSource = String(fd.get('add-inc-source') ?? '').trim();
    const incomeType = String(fd.get('add-inc-type') ?? '').trim();
    const incomeAmount = String(fd.get('add-inc-amount') ?? '').trim();
    const taxPaid = String(fd.get('add-inc-tax') ?? '').trim();
    const comments = String(fd.get('add-inc-comments') ?? '').trim();
    if (!incomeSource || !incomeType || !incomeAmount || !taxPaid) return;

    setRows((prev) => [
      ...prev,
      {
        id: `add-inc-${Date.now()}`,
        incomeSource,
        incomeType,
        incomeAmount,
        taxPaid,
        comments,
      },
    ]);
    e.currentTarget.reset();
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">Additional Incomes</h2>
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="gap-2 bg-amber-400 text-zinc-900 hover:bg-amber-500"
        >
          <Plus className="size-4" />
          Add Income
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-zinc-100 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-800">
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
          className="max-h-[min(90vh,640px)] gap-0 overflow-hidden p-0 sm:max-w-2xl"
        >
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
            <DialogTitle className="text-base font-semibold text-foreground">Add Income</DialogTitle>
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
            className="max-h-[calc(min(90vh,640px)-52px)] overflow-y-auto p-4 sm:p-6"
          >
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="add-inc-source">
                    <Req>Income source</Req>
                  </Label>
                  <Input id="add-inc-source" name="add-inc-source" className="bg-background" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-inc-type">
                    <Req>Income type</Req>
                  </Label>
                  <Input id="add-inc-type" name="add-inc-type" className="bg-background" required />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="add-inc-amount">
                    <Req>Income amount</Req>
                  </Label>
                  <Input id="add-inc-amount" name="add-inc-amount" className="bg-background" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-inc-tax">
                    <Req>Income tax paid</Req>
                  </Label>
                  <Input id="add-inc-tax" name="add-inc-tax" className="bg-background" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-inc-comments">Comments</Label>
                <Textarea id="add-inc-comments" name="add-inc-comments" className="min-h-[100px] resize-y bg-background" />
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
