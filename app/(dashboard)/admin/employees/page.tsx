'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockEmployees } from '@/lib/mock-data';
import { Employee } from '@/lib/types';
import { useState } from 'react';
import { Plus, MoreVertical, Edit2, Trash2 } from 'lucide-react';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const activeEmployees = employees.filter(e => e.status === 'active');
  const inactiveEmployees = employees.filter(e => e.status === 'inactive');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Employee Management</h1>
          <p className="text-muted-foreground mt-1">Manage your team members and their assignments</p>
        </div>
        <Button className="bg-primary text-primary-foreground gap-2" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4" />
          Add Employee
        </Button>
      </div>

      {/* Add Employee Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Employee</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Name</label>
                <input type="text" placeholder="Full name" className="w-full mt-1 px-3 py-2 border border-border rounded-lg" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Email</label>
                <input type="email" placeholder="Email address" className="w-full mt-1 px-3 py-2 border border-border rounded-lg" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Department</label>
                <select className="w-full mt-1 px-3 py-2 border border-border rounded-lg">
                  <option>Individual Tax</option>
                  <option>Business Tax</option>
                  <option>Audit & Assurance</option>
                  <option>Client Services</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Role</label>
                <select className="w-full mt-1 px-3 py-2 border border-border rounded-lg">
                  <option>Employee</option>
                  <option>Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button className="bg-primary text-primary-foreground">Save Employee</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Employees */}
      <Card>
        <CardHeader>
          <CardTitle>Active Employees ({activeEmployees.length})</CardTitle>
          <CardDescription>Currently active team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeEmployees.map((employee) => (
              <div key={employee.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{employee.name}</h3>
                  <div className="flex gap-3 mt-1 text-sm text-muted-foreground">
                    <span>{employee.email}</span>
                    <span>•</span>
                    <span>{employee.department}</span>
                    <span>•</span>
                    <span className="capitalize">{employee.role}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Inactive Employees */}
      {inactiveEmployees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inactive Employees ({inactiveEmployees.length})</CardTitle>
            <CardDescription>Archived team members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 opacity-75">
              {inactiveEmployees.map((employee) => (
                <div key={employee.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground line-through">{employee.name}</h3>
                    <div className="flex gap-3 mt-1 text-sm text-muted-foreground">
                      <span>{employee.email}</span>
                      <span>•</span>
                      <span>{employee.department}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-accent">
                    Reactivate
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
