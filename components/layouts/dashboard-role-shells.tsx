'use client';

import { Suspense, type ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { ADMIN_ROUTES, CLIENT_ROUTES, EMPLOYEE_ROUTES } from '@/lib/constants';
import type { SessionUser } from '@/lib/session-user';

function employeeHeaderTitle(pathname: string): string {
  if (pathname === '/employee' || pathname === '/employee/') return 'Dashboard';
  if (pathname.startsWith('/employee/messages')) return 'Messages';
  if (pathname.startsWith('/employee/invite')) return 'Invite Client';
  if (pathname.startsWith('/employee/queues')) return 'Queues';
  if (pathname.startsWith('/employee/tickets/')) return '';
  return 'Employee';
}

function clientHeaderTitle(pathname: string): string {
  if (pathname === '/client') return 'Home';
  if (pathname.startsWith('/client/cases/')) return '';
  const map: Record<string, string> = {
    '/client/videos': 'Tax Videos for NRI',
    '/client/cashback': 'Cash Back',
    '/client/feedback': 'Feedback',
    '/client/contact': 'Contact Us',
    '/client/messages': 'Messages',
    '/client/documents': 'Documents',
    '/client/tax-organizer': 'Tax Organizer',
  };
  return map[pathname] ?? 'Home';
}

function AdminDashboardShellInner({ user, children }: { user: SessionUser; children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStage = pathname.includes('/queues') ? searchParams.get('stage') ?? 'pending-info' : undefined;
  return (
    <DashboardLayout
      user={user}
      adminSidebarNavigation={ADMIN_ROUTES}
      title="Admin Dashboard"
      currentStage={currentStage}
    >
      {children}
    </DashboardLayout>
  );
}

export function AdminDashboardShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-muted-foreground">Loading…</div>}>
      <AdminDashboardShellInner user={user}>{children}</AdminDashboardShellInner>
    </Suspense>
  );
}

function EmployeeDashboardShellInner({ user, children }: { user: SessionUser; children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStage = pathname.includes('/queues') ? searchParams.get('stage') ?? 'pending-info' : undefined;
  const title = employeeHeaderTitle(pathname);
  return (
    <DashboardLayout
      user={user}
      employeeSidebarNavigation={EMPLOYEE_ROUTES}
      title={title}
      currentStage={currentStage}
    >
      {children}
    </DashboardLayout>
  );
}

export function EmployeeDashboardShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-muted-foreground">Loading…</div>}>
      <EmployeeDashboardShellInner user={user}>{children}</EmployeeDashboardShellInner>
    </Suspense>
  );
}

function ClientDashboardShellInner({ user, children }: { user: SessionUser; children: ReactNode }) {
  const pathname = usePathname();
  const title = clientHeaderTitle(pathname);
  return (
    <DashboardLayout user={user} clientSidebarNavigation={CLIENT_ROUTES} title={title}>
      {children}
    </DashboardLayout>
  );
}

export function ClientDashboardShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-muted-foreground">Loading…</div>}>
      <ClientDashboardShellInner user={user}>{children}</ClientDashboardShellInner>
    </Suspense>
  );
}
