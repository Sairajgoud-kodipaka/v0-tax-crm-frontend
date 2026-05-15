'use client';

import Link from 'next/link';
import { useActionState, useMemo, useState } from 'react';
import { Edit2, LayoutList, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { deleteEmployeeAction, updateEmployeeAction } from '@/app/actions/admin-employees';

export type EmployeeListItem = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee' | 'client';
  department: string;
  assignedTicketCount: number;
  activeTicketCount: number;
};

const initialActionState = { ok: false as const, message: '' };

function manageTicketsHref(employeeId: string) {
  return `/admin/clients?employeeView=${encodeURIComponent(employeeId)}&assigned=all&stageFilter=all&q=`;
}

function EmployeeRow({ employee }: { employee: EmployeeListItem }) {
  const [editing, setEditing] = useState(false);
  const [updateState, updateAction] = useActionState(updateEmployeeAction, initialActionState);
  const [deleteState, deleteAction] = useActionState(deleteEmployeeAction, initialActionState);
  const ticketsHref = manageTicketsHref(employee.id);

  return (
    <div className="flex flex-col gap-0 rounded-lg border border-border transition-colors sm:flex-row sm:items-stretch">
      {editing ? (
        <div className="w-full p-4">
          <form action={updateAction} className="space-y-3">
            <input type="hidden" name="userId" value={employee.id} />
            <div className="grid gap-3 md:grid-cols-2">
              <Input name="fullName" defaultValue={employee.name} />
              <select
                name="role"
                defaultValue={employee.role === 'client' ? 'employee' : employee.role}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm">
                Save
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
            {updateState.message ? (
              <p className={`text-sm ${updateState.ok ? 'text-primary' : 'text-destructive'}`}>{updateState.message}</p>
            ) : null}
          </form>
        </div>
      ) : (
        <>
          <Link
            href={ticketsHref}
            className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-4 hover:bg-muted/50 sm:rounded-l-lg"
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h3 className="font-medium text-foreground">{employee.name}</h3>
              <span className="text-xs font-medium tabular-nums text-muted-foreground">
                {employee.assignedTicketCount} ticket{employee.assignedTicketCount === 1 ? '' : 's'}
                {employee.activeTicketCount > 0 ? ` · ${employee.activeTicketCount} active` : null}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
              <span className="break-all">{employee.email}</span>
              <span className="hidden sm:inline">·</span>
              <span>{employee.department}</span>
              <span>·</span>
              <span className="capitalize">{employee.role}</span>
            </div>
            <span className="text-xs text-primary underline-offset-4 hover:underline">Open assigned tickets</span>
            {deleteState.message ? (
              <p className={`mt-1 text-sm ${deleteState.ok ? 'text-primary' : 'text-destructive'}`}>{deleteState.message}</p>
            ) : null}
          </Link>
          <div className="flex items-center justify-end gap-1 border-t border-border p-2 sm:flex-col sm:justify-center sm:border-l sm:border-t-0">
            <Button variant="ghost" size="sm" asChild className="shrink-0" title="Tickets & stages">
              <Link href={ticketsHref} aria-label={`Tickets for ${employee.name}`}>
                <LayoutList className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)} aria-label={`Edit ${employee.name}`} className="shrink-0">
              <Edit2 className="h-4 w-4" />
            </Button>
            <form action={deleteAction} className="inline">
              <input type="hidden" name="userId" value={employee.id} />
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Delete ${employee.name}`}
                className="shrink-0"
                onClick={(e) => {
                  if (!window.confirm(`Delete ${employee.email}? This cannot be undone.`)) {
                    e.preventDefault();
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export function EmployeeList({ employees }: { employees: EmployeeListItem[] }) {
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'employee'>('all');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return employees.filter((e) => {
      if (roleFilter !== 'all' && e.role !== roleFilter) return false;
      if (!needle) return true;
      const blob = `${e.name} ${e.email}`.toLowerCase();
      return blob.includes(needle);
    });
  }, [employees, q, roleFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[200px] flex-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="emp-filter-q">
            Search
          </label>
          <Input
            id="emp-filter-q"
            type="search"
            placeholder="Name or email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="min-w-[160px] space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="emp-filter-role">
            Role
          </label>
          <select
            id="emp-filter-role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'employee')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All roles</option>
            <option value="employee">Employees only</option>
            <option value="admin">Admins only</option>
          </select>
        </div>
        <Button type="button" variant="outline" size="sm" className="sm:mb-0.5" asChild>
          <Link href="/admin/clients">Browse all clients & tickets</Link>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} of {employees.length} in this list.
      </p>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No staff match these filters.</p>
        ) : (
          filtered.map((employee) => <EmployeeRow key={employee.id} employee={employee} />)
        )}
      </div>
    </div>
  );
}
