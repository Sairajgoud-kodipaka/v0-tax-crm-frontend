'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
  sidebarNavigation: Array<{ href: string; label: string; icon: string }>;
  title: string;
}

export function DashboardLayout({
  children,
  sidebarNavigation,
  title,
}: DashboardLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 flex flex-col`}
      >
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-xl font-bold text-sidebar-primary">TaxCRM</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {sidebarNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <span className="w-6 h-6 flex items-center justify-center">
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
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-2">
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
            {sidebarOpen && 'Logout'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
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
