'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  adminSidebarNavigation?: Array<{ href: string; label: string; icon: string }>;
  title: string;
  currentStage?: string;
}

const STAGES = [
  { id: 'pending-info', label: 'Pending Info' },
  { id: 'under-prep', label: 'Under Prep' },
  { id: 'draft-sent', label: 'Draft Sent' },
  { id: 'awaiting-approval', label: 'Awaiting Approval' },
  { id: 'payment-received', label: 'Payment Received' },
  { id: '8879-sent', label: '8879 Sent' },
  { id: '8879-received', label: '8879 Received' },
  { id: 'filing-completed', label: 'Filing Completed' },
  { id: 'closed', label: 'Closed' },
];

export function DashboardLayout({
  children,
  adminSidebarNavigation = [],
  title,
  currentStage,
}: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) {
    return null;
  }

  const isAdmin = user.role === 'admin';
  const isAdminOrEmployee = user.role === 'admin' || user.role === 'employee';
  const baseUrl = isAdmin ? '/admin' : '/employee';

  return (
    <div className="flex h-screen bg-background">
      {/* Primary Sidebar - Workflow Stages for Admin/Employee, Basic Nav for Client */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 flex flex-col overflow-y-auto`}
      >
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border flex-shrink-0">
          <h1 className="text-xl font-bold text-sidebar-primary">TaxCRM</h1>
        </div>

        {/* Workflow Stages (Admin & Employee Only) */}
        {isAdminOrEmployee && (
          <nav className="flex-1 px-4 py-4">
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                {sidebarOpen ? 'Workflow Stages' : ''}
              </h3>
            </div>
            <div className="space-y-1">
              {STAGES.map((stage) => {
                const isActive = currentStage === stage.id;
                return (
                  <Link
                    key={stage.id}
                    href={`${baseUrl}/queues?stage=${stage.id}`}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <span className="w-4 h-4 flex-shrink-0" />
                    {sidebarOpen ? <span>{stage.label}</span> : null}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}

        {/* Admin-Only Navigation Items */}
        {isAdmin && (
          <nav className="border-t border-sidebar-border px-4 py-4 space-y-2 flex-shrink-0">
            {adminSidebarNavigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm font-medium',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {item.icon === 'grid' && '📊'}
                    {item.icon === 'list' && '📋'}
                    {item.icon === 'users' && '👥'}
                    {item.icon === 'bar-chart' && '📈'}
                    {item.icon === 'log' && '📝'}
                    {item.icon === 'settings' && '⚙️'}
                    {item.icon === 'mail' && '✉️'}
                    {item.icon === 'briefcase' && '💼'}
                    {item.icon === 'file' && '📄'}
                    {item.icon === 'form' && '📋'}
                  </span>
                  {sidebarOpen ? <span>{item.label}</span> : null}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Footer with Logout */}
        <div className="border-t border-sidebar-border p-4 space-y-2 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center px-4 py-2 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen ? 'Logout' : null}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
            {user.avatar && (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full"
              />
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
