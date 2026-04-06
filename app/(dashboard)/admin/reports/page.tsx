'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronDown, Download, Filter } from 'lucide-react';

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

const revenueByService = [
  { service: 'Individual Tax Returns', amount: '$52,000', percentage: 42 },
  { service: 'Business Tax Returns', amount: '$38,500', percentage: 31 },
  { service: 'Bookkeeping Services', amount: '$22,000', percentage: 18 },
  { service: 'Tax Planning Consulting', amount: '$12,000', percentage: 9 },
];

const keyMetrics = [
  { label: 'YTD Revenue', value: '$124,500', note: '+12% from last year' },
  { label: 'Avg Turnaround', value: '4.2 days', note: '-0.5 days vs last month' },
  { label: 'Client Satisfaction', value: '4.8/5.0', note: 'Based on 24 reviews' },
];

function escapeCsvCell(val: string | number) {
  const s = String(val);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escapeCsvCell(row[h] ?? '')).join(',')),
  ];
  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadSummaryCsv() {
  const rows = keyMetrics.map((m) => ({
    metric: m.label,
    value: m.value,
    note: m.note,
  }));
  downloadCsv(`reports-summary-${todayStamp()}.csv`, rows);
}

function downloadPerformanceCsv() {
  downloadCsv(`reports-performance-trend-${todayStamp()}.csv`, performanceData);
}

function downloadEmployeeCsv() {
  downloadCsv(`reports-employee-productivity-${todayStamp()}.csv`, employeeProductivity);
}

function downloadRevenueCsv() {
  downloadCsv(`reports-revenue-by-service-${todayStamp()}.csv`, revenueByService);
}

function todayStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function downloadAllReportCsvs() {
  downloadPerformanceCsv();
  window.setTimeout(() => downloadEmployeeCsv(), 150);
  window.setTimeout(() => downloadRevenueCsv(), 300);
  window.setTimeout(() => downloadSummaryCsv(), 450);
}

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-1">Analytics and insights for your tax practice</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
                <ChevronDown className="h-4 w-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Export data (CSV)</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => downloadSummaryCsv()}>Summary metrics</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => downloadPerformanceCsv()}>Performance trend</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => downloadEmployeeCsv()}>Employee productivity</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => downloadRevenueCsv()}>Revenue by service</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => downloadAllReportCsvs()}>
                Export everything (4 files)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">YTD Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">$124,500</div>
            <p className="mt-1 text-xs text-muted-foreground">+12% from last year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Turnaround</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">4.2 days</div>
            <p className="mt-1 text-xs text-muted-foreground">-0.5 days vs last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Client Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">4.8/5.0</div>
            <p className="mt-1 text-xs text-muted-foreground">Based on 24 reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                  }}
                />
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
                <XAxis
                  dataKey="name"
                  stroke="var(--muted-foreground)"
                  style={{ fontSize: '12px' }}
                  angle={-15}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                  }}
                />
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
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Revenue by Service</CardTitle>
            <CardDescription>Monthly revenue breakdown by service type</CardDescription>
          </div>
          <Button variant="outline" className="w-fit gap-2 shrink-0" onClick={() => downloadRevenueCsv()}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {revenueByService.map((item) => (
              <div key={item.service} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{item.service}</p>
                  <p className="font-bold text-primary">{item.amount}</p>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <p className="text-right text-xs text-muted-foreground">{item.percentage}% of total</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
