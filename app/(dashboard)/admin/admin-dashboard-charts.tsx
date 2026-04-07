'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const chartColors = ['#1e3a8a', '#047857', '#7c3aed', '#db2777', '#ea580c'];

export function AdminDashboardCharts({ stageData }: { stageData: { name: string; value: number }[] }) {
  const visibleStageData = stageData.filter((item) => item.value > 0);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Tickets by Stage</CardTitle>
          <CardDescription>Current distribution across workflow stages</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="name"
                stroke="var(--muted-foreground)"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip />
              <Bar dataKey="value" fill="var(--primary)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workload Distribution</CardTitle>
          <CardDescription>Percentage of cases in each stage</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={visibleStageData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="var(--primary)"
                dataKey="value"
              >
                {visibleStageData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '10px',
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {visibleStageData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <span
                    className="inline-block size-2.5 rounded-full"
                    style={{ backgroundColor: chartColors[index % chartColors.length] }}
                  />
                  <span>{item.name}</span>
                </div>
                <span className="text-sm font-medium text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
