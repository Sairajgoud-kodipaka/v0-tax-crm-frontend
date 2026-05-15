'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { STAGE_NAVIGATION } from '@/lib/constants';
import type { EmployeeClientTicketRow } from '@/lib/data/clients-queries';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type EmployeeOpt = { id: string; full_name: string | null };

const STAGE_LABEL: Record<string, string> = Object.fromEntries(STAGE_NAVIGATION.map((s) => [s.id, s.label]));

function statusLabel(status: string): string {
  if (status === 'in-progress') return 'In Progress';
  if (status === 'completed') return 'Completed';
  if (status === 'open') return 'Open';
  return status;
}

export function EmployeeClientsView(props: {
  employeeId: string;
  employees: EmployeeOpt[];
  rows: EmployeeClientTicketRow[];
  stageFilter: string;
  backHref: string;
}) {
  const { employeeId, employees, rows, stageFilter, backHref } = props;
  const selected = employees.find((e) => e.id === employeeId) ?? null;
  const filteredRows = stageFilter === 'all' ? rows : rows.filter((r) => r.stage === stageFilter);

  const stageCounts = [
    { id: 'all', label: 'All', count: rows.length },
    ...STAGE_NAVIGATION.map((stage) => ({
      ...stage,
      count: rows.filter((r) => r.stage === stage.id).length,
    })),
  ];

  const stageQueryBase = `employeeView=${encodeURIComponent(employeeId)}`;
  const summary = [
    `${rows.length} total clients`,
    `${rows.filter((r) => r.stage === 'under-prep').length} in Review`,
    `${rows.filter((r) => r.stage === 'awaiting-approval').length} Awaiting Client`,
    `${rows.filter((r) => r.status === 'completed').length} Completed`,
  ].join(' | ');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline">
          <Link href={backHref}>{'<'}- Back to All Clients</Link>
        </Button>
        <form method="get">
          <input type="hidden" name="stageFilter" value={stageFilter} />
          <label className="sr-only" htmlFor="employee-switch">
            Switch Employee
          </label>
          <select
            id="employee-switch"
            name="employeeView"
            defaultValue={employeeId}
            className="h-10 min-w-[250px] rounded-md border border-input bg-background px-3 text-sm"
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {(e.full_name?.trim() || e.id.slice(0, 8)) + ' (Tax Preparer)'}
              </option>
            ))}
          </select>
        </form>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Showing clients for: {selected?.full_name?.trim() || employeeId}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {stageCounts.map((stage) => {
          const href =
            stage.id === 'all'
              ? `?${stageQueryBase}`
              : `?${stageQueryBase}&stageFilter=${encodeURIComponent(stage.id)}`;
          return (
            <Link
              key={stage.id}
              href={href}
              className="rounded-full border border-border bg-muted/20 px-3 py-1 text-xs font-medium"
            >
              {stage.id === 'all' ? 'All' : STAGE_LABEL[stage.id] ?? stage.label}: {stage.count}
            </Link>
          );
        })}
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Ticket ID</TableHead>
              <TableHead>Current Stage</TableHead>
              <TableHead>Assigned Since</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No clients for this employee in the selected stage.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => (
                <TableRow key={row.ticket_id}>
                  <TableCell>
                    <Link href={`/admin/tickets/${row.ticket_id}`} className="font-medium text-primary hover:underline">
                      {row.client_name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{row.ticket_ref}</TableCell>
                  <TableCell>
                    <span className="rounded-full border border-border bg-muted px-2 py-1 text-xs">
                      {STAGE_LABEL[row.stage] ?? row.stage}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(row.assigned_since).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(row.last_activity), { addSuffix: true })}
                  </TableCell>
                  <TableCell>{statusLabel(row.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
