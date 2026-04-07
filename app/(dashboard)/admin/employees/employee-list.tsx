'use client';

import { useActionState, useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { deleteEmployeeAction, updateEmployeeAction } from '@/app/actions/admin-employees';

type Employee = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee' | 'client';
  department: string;
};

const initialActionState = { ok: false as const, message: '' };

function EmployeeRow({ employee }: { employee: Employee }) {
  const [editing, setEditing] = useState(false);
  const [updateState, updateAction] = useActionState(updateEmployeeAction, initialActionState);
  const [deleteState, deleteAction] = useActionState(deleteEmployeeAction, initialActionState);

  return (
    <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
      {editing ? (
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
            <p className={`text-sm ${updateState.ok ? 'text-emerald-600' : 'text-destructive'}`}>{updateState.message}</p>
          ) : null}
        </form>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-medium text-foreground">{employee.name}</h3>
            <div className="flex gap-3 mt-1 text-sm text-muted-foreground">
              <span>{employee.email}</span>
              <span>-</span>
              <span>{employee.department}</span>
              <span>-</span>
              <span className="capitalize">{employee.role}</span>
            </div>
            {deleteState.message ? (
              <p className={`mt-2 text-sm ${deleteState.ok ? 'text-emerald-600' : 'text-destructive'}`}>{deleteState.message}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)} aria-label={`Edit ${employee.name}`}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <form action={deleteAction}>
              <input type="hidden" name="userId" value={employee.id} />
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Delete ${employee.name}`}
                onClick={(e) => {
                  if (!window.confirm(`Delete ${employee.email}? This cannot be undone.`)) {
                    e.preventDefault();
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function EmployeeList({ employees }: { employees: Employee[] }) {
  return (
    <div className="space-y-3">
      {employees.map((employee) => (
        <EmployeeRow key={employee.id} employee={employee} />
      ))}
    </div>
  );
}

