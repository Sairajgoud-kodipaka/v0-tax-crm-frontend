'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Filter } from 'lucide-react';

const performanceData = [
  { month: 'Jan', completed: 12, pending: 5, overdue: 2 },
  { month: 'Feb', completed: 15, pending: 4, overdue: 1 },
  { month: 'Mar', completed: 18, pending: 6, overdue: 2 },
  { month: 'Apr', completed: 14, pending: 5, overdue: 0 },
  { month: 'May', completed: 16, pending: 3, overdue: 1 },
];

const employeeProductivity = [
  { name: 'Michael Chen', completed: 24, pending: 3 },
  { name: 'James Wilson', completed: 19, pending: 5 },
  { name: 'Lisa Anderson', completed: 22, pending: 2 },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-1">Analytics and insights for your tax practice</p>
        </div>
        <Button className="bg-primary text-primary-foreground gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">YTD Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">$124,500</div>
            <p className="text-xs text-muted-foreground mt-1">+12% from last year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Turnaround</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">4.2 days</div>
            <p className="text-xs text-muted-foreground mt-1">-0.5 days vs last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Client Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">4.8/5.0</div>
            <p className="text-xs text-muted-foreground mt-1">Based on 24 reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trend (5 Months)</CardTitle>
            <CardDescription>Completed, pending, and overdue cases</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem' }} />
                <Legend />
                <Line type="monotone" dataKey="completed" stroke="var(--accent)" strokeWidth={2} />
                <Line type="monotone" dataKey="pending" stroke="var(--primary)" strokeWidth={2} />
                <Line type="monotone" dataKey="overdue" stroke="var(--destructive)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Employee Productivity */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Productivity</CardTitle>
            <CardDescription>Cases completed and pending by team member</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employeeProductivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} angle={-15} textAnchor="end" height={80} />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem' }} />
                <Legend />
                <Bar dataKey="completed" fill="var(--accent)" />
                <Bar dataKey="pending" fill="var(--primary)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Report */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Revenue by Service</CardTitle>
            <CardDescription>Monthly revenue breakdown by service type</CardDescription>
          </div>
          <Button variant="outline" gap-2>
            <Download className="w-4 h-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { service: 'Individual Tax Returns', amount: '$52,000', percentage: 42 },
              { service: 'Business Tax Returns', amount: '$38,500', percentage: 31 },
              { service: 'Bookkeeping Services', amount: '$22,000', percentage: 18 },
              { service: 'Tax Planning Consulting', amount: '$12,000', percentage: 9 },
            ].map((item) => (
              <div key={item.service} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{item.service}</p>
                  <p className="text-primary font-bold">{item.amount}</p>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right">{item.percentage}% of total</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
