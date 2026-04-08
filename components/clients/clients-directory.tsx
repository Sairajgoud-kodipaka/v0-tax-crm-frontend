import Link from 'next/link';
import { updateClientAssignmentAction, updateClientNotesAction, updateClientStatusAction } from '@/app/actions/clients';
import type { ClientDirectoryRow } from '@/lib/data/clients-queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
          <CardDescription>Name or email contains your text; filter by assigned preparer or unassigned only.</CardDescription>
        </CardHeader>
        <CardContent>
          <form method="get" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-[200px] flex-1 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="cq">
                Search
              </label>
              <Input id="cq" name="q" type="search" placeholder="Name or email" defaultValue={initialQ} />
            </div>
            <div className="min-w-[200px] space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="cass">
                Assigned preparer
              </label>
              <select
                id="cass"
                name="assigned"
                defaultValue={initialAssigned}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All clients</option>
                <option value="unassigned">Unassigned only</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.full_name?.trim() || e.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="secondary">
              Apply
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[9rem]">Client</TableHead>
              <TableHead className="min-w-[10rem]">Email</TableHead>
              <TableHead className="min-w-[11rem]">Preparer</TableHead>
              <TableHead className="min-w-[12rem] whitespace-normal">Notes</TableHead>
              <TableHead className="w-[5rem]">Tickets</TableHead>
              <TableHead className="min-w-[7rem]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
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
                    <form action={updateClientAssignmentAction} className="flex flex-col gap-1">
                      <input type="hidden" name="profileId" value={row.profile_id} />
                      <select
                        name="employeeId"
                        defaultValue={row.assigned_employee_id ?? ''}
                        className="h-9 max-w-[11rem] rounded-md border border-input bg-background px-2 text-xs"
                      >
                        <option value="">Unassigned</option>
                        {employees.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.full_name?.trim() || e.id.slice(0, 8)}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" variant="outline" size="sm" className="h-8 max-w-[11rem] text-xs">
                        Save
                      </Button>
                    </form>
                  </TableCell>
                  <TableCell className="max-w-[14rem] whitespace-normal align-top">
                    <form action={updateClientNotesAction} className="flex flex-col gap-1">
                      <input type="hidden" name="profileId" value={row.profile_id} />
                      <textarea
                        name="notes"
                        rows={2}
                        defaultValue={row.notes ?? ''}
                        placeholder="Internal notes"
                        className="w-full min-w-[10rem] rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                      />
                      <Button type="submit" variant="ghost" size="sm" className="h-7 w-fit text-xs">
                        Save notes
                      </Button>
                    </form>
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
                    <form action={updateClientStatusAction}>
                      <input type="hidden" name="profileId" value={row.profile_id} />
                      <select
                        name="status"
                        defaultValue={row.status}
                        className="h-9 w-full max-w-[8rem] rounded-md border border-input bg-background px-2 text-xs"
                      >
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                      </select>
                      <Button type="submit" variant="ghost" size="sm" className="mt-1 h-7 text-xs">
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
