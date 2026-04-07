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

type DaycareExpenseRow = {
  id: string;
  childName: string;
  providerName: string;
  daycareId: string;
  daycareFee: string;
  providerAddress: string;
  comments: string;
};

export function DaycareExpensesSection({ initialRows = [] }: { initialRows?: unknown[] }) {
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rows, setRows] = useState<DaycareExpenseRow[]>(() => {
    return (initialRows as DaycareExpenseRow[]).filter((row) => row && typeof row === 'object');
  });
  const editingRow = rows.find((row) => row.id === editingId);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const childName = String(fd.get('dc-child-name') ?? '').trim();
    const providerName = String(fd.get('dc-provider-name') ?? '').trim();
    const daycareFee = String(fd.get('dc-daycare-fee') ?? '').trim();
    const daycareId = String(fd.get('dc-provider-id') ?? '').trim();
    const providerAddress = String(fd.get('dc-provider-address') ?? '').trim();
    const comments = String(fd.get('dc-comments') ?? '').trim();
    if (!childName || !providerName || !daycareFee || !daycareId) return;

    const nextRow: DaycareExpenseRow = {
      id: editingId ?? `dc-${Date.now()}`,
      childName,
      providerName,
      daycareId,
      daycareFee,
      providerAddress,
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
        <h2 className="text-base font-semibold text-foreground">Daycare Expenses</h2>
        <Button
          type="button"
          onClick={() => setOpen(true)}
          variant="default"
          className={cn('gap-2', ticketCaseBlackCtaButtonClassName)}
        >
          <Plus className="size-4" />
          Add Day Care Expense
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/60 hover:bg-muted/60">
              <TableHead className="font-semibold text-foreground">Child Name</TableHead>
              <TableHead className="font-semibold text-foreground">Day Care Provider Name</TableHead>
              <TableHead className="font-semibold text-foreground">Day Care ID</TableHead>
              <TableHead className="w-24 text-right font-semibold text-foreground" />
              <TableHead className="w-24 text-right font-semibold text-foreground" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No day care expenses yet. Use &quot;Add Day Care Expense&quot; to add one.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.childName}</TableCell>
                  <TableCell>{r.providerName}</TableCell>
                  <TableCell>{r.daycareId}</TableCell>
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
              {editingId ? 'Edit Day Care Expense' : 'Add Day Care Expense'}
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
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="dc-child-name">
                    <Req>Child name</Req>
                  </Label>
                  <Input id="dc-child-name" name="dc-child-name" className="bg-background" required defaultValue={editingRow?.childName ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dc-provider-name">
                    <Req>Day care provider name</Req>
                  </Label>
                  <Input id="dc-provider-name" name="dc-provider-name" className="bg-background" required defaultValue={editingRow?.providerName ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dc-daycare-fee">
                    <Req>Day care fee</Req>
                  </Label>
                  <Input id="dc-daycare-fee" name="dc-daycare-fee" className="bg-background" required defaultValue={editingRow?.daycareFee ?? ''} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dc-provider-id">
                    <Req>Day care provider id</Req>
                  </Label>
                  <Input id="dc-provider-id" name="dc-provider-id" className="bg-background" required defaultValue={editingRow?.daycareId ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dc-provider-address">Day care provider address</Label>
                  <Input id="dc-provider-address" name="dc-provider-address" className="bg-background" defaultValue={editingRow?.providerAddress ?? ''} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dc-comments">Comments</Label>
                <Textarea id="dc-comments" name="dc-comments" className="min-h-[100px] resize-y bg-background" defaultValue={editingRow?.comments ?? ''} />
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
