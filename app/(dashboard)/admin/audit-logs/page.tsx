'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockAuditLogs } from '@/lib/mock-data';
import { Search } from 'lucide-react';
import { useState } from 'react';

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredLogs = mockAuditLogs.filter((log) => {
    const matchesSearch = log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.resourceType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || log.resourceType === filterType;
    return matchesSearch && matchesType;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'Created':
        return 'text-green-600 bg-green-50';
      case 'Updated':
        return 'text-blue-600 bg-blue-50';
      case 'Deleted':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">Track all system changes and user activities</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by user, action, or resource..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg"
                />
              </div>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg bg-background"
            >
              <option value="all">All Resources</option>
              <option value="Ticket">Tickets</option>
              <option value="Employee">Employees</option>
              <option value="Settings">Settings</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No audit logs found</p>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-sm font-medium text-foreground">{log.resourceType}</span>
                      <span className="text-sm text-muted-foreground">#{log.resourceId}</span>
                    </div>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>By: {log.userName}</span>
                      <span>•</span>
                      <span>{log.timestamp.toLocaleString()}</span>
                    </div>
                    {log.details && (
                      <div className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded">
                        <p className="font-mono">{JSON.stringify(log.details).slice(0, 100)}...</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{mockAuditLogs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">
              {mockAuditLogs.filter((log) => {
                const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return log.timestamp > oneWeekAgo;
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">
              {new Set(mockAuditLogs.map((log) => log.userId)).size}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
