'use client';

import Link from 'next/link';
import { updateClientRowAction } from '@/app/actions/clients';
import type { ClientDirectoryRow } from '@/lib/data/clients-queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FormSelect } from '@/components/ui/form-select';
import { UNASSIGNED_SELECT_VALUE } from '@/lib/constants';
import { cn } from '@/lib/utils';

type EmployeeOpt = { id: string; full_name: string | null };

export function ClientsDirectory(props: {
  rows: ClientDirectoryRow[];
  employees: EmployeeOpt[];
  basePath: '/admin' | '/employee';
  initialQ: string;
  initialAssigned: string;
}) {
  const { rows, employees, basePath, initialQ, initialAssigned } = props;
  const queuesHref = `${basePath}/queues?stage=pending-info`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search and filter by preparer. Primary preparer stays in sync with the client profile (default for new tickets).
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Search &amp; filters</CardTitle>
          <CardDescription>
            Preparer filter applies as soon as you change it. Search applies when you press Enter or leave the search field.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="clients-directory-filters" method="get" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-[200px] flex-1 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="cq">
                Search
              </label>
              <Input
                id="cq"
                name="q"
                type="search"
                placeholder="Name or email"
                defaultValue={initialQ}
                onBlur={(e) => e.currentTarget.form?.requestSubmit()}
              />
            </div>
            <div className="min-w-[200px] space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="cass">
                Assigned preparer
              </label>
              <FormSelect
                id="cass"
                name="assigned"
                defaultValue={initialAssigned}
                options={[
                  { value: 'all', label: 'All clients' },
                  { value: 'unassigned', label: 'Unassigned only' },
                  ...employees.map((e) => ({
                    value: e.id,
                    label: e.full_name?.trim() || e.id.slice(0, 8),
                  })),
                ]}
                onValueChange={() => {
                  (document.getElementById('clients-directory-filters') as HTMLFormElement | null)?.requestSubmit();
                }}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[9rem]">Client</TableHead>
              <TableHead className="min-w-[10rem]">Email</TableHead>
              <TableHead className="min-w-[11rem]">Preparer</TableHead>
              <TableHead className="min-w-[12rem] whitespace-normal">Notes</TableHead>
              <TableHead className="w-[5rem]">Tickets</TableHead>
              <TableHead className="min-w-[7rem]">Status</TableHead>
              <TableHead className="w-[6rem] text-right">Save</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No clients match these filters.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.profile_id}
                  className={cn(row.status === 'archived' && 'bg-muted/40 opacity-90')}
                >
                  <TableCell className="font-medium">{row.full_name?.trim() || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{row.email ?? '—'}</TableCell>
                  <TableCell>
                    <FormSelect
                      form={`client-row-${row.profile_id}`}
                      name="employeeId"
                      defaultValue={row.assigned_employee_id ?? UNASSIGNED_SELECT_VALUE}
                      size="sm"
                      options={[
                        { value: UNASSIGNED_SELECT_VALUE, label: 'Unassigned' },
                        ...employees.map((e) => ({
                          value: e.id,
                          label: e.full_name?.trim() || e.id.slice(0, 8),
                        })),
                      ]}
                      triggerClassName="h-9 max-w-[11rem] text-xs"
                    />
                    {row.assigned_employee_id ? (
                      <Link
                        href={`${basePath}/clients?employeeView=${encodeURIComponent(row.assigned_employee_id)}`}
                        className="mt-1 block text-xs text-primary underline-offset-4 hover:underline"
                      >
                        View {row.assignee_name?.trim() || 'preparer'} clients
                      </Link>
                    ) : null}
                  </TableCell>
                  <TableCell className="max-w-[14rem] whitespace-normal align-top">
                    <textarea
                      form={`client-row-${row.profile_id}`}
                      name="notes"
                      rows={2}
                      defaultValue={row.notes ?? ''}
                      placeholder="Internal notes"
                      className="w-full min-w-[10rem] rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                    />
                  </TableCell>
                  <TableCell>
                    <span className="font-medium tabular-nums">{row.ticket_count}</span>
                    {row.ticket_count > 0 ? (
                      <Link
                        href={queuesHref}
                        className="mt-1 block text-xs text-primary underline-offset-4 hover:underline"
                      >
                        Queues
                      </Link>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <FormSelect
                      form={`client-row-${row.profile_id}`}
                      name="status"
                      defaultValue={row.status}
                      size="sm"
                      options={[
                        { value: 'active', label: 'Active' },
                        { value: 'archived', label: 'Archived' },
                      ]}
                      triggerClassName="h-9 w-full max-w-[8rem] text-xs"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <form id={`client-row-${row.profile_id}`} action={updateClientRowAction} className="inline-flex">
                      <input type="hidden" name="profileId" value={row.profile_id} />
                      <Button type="submit" variant="outline" size="sm" className="h-8 text-xs">
                        Save
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
