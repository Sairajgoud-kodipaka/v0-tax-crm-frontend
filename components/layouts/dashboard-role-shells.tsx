'use client';

import { Suspense, type ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { ADMIN_ROUTES, CLIENT_ROUTES, EMPLOYEE_ROUTES } from '@/lib/constants';
import type { SessionUser } from '@/lib/session-user';

function AdminDashboardShellInner({ user, children }: { user: SessionUser; children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStage = pathname.includes('/queues') ? searchParams.get('stage') ?? 'pending-info' : undefined;
  return (
    <DashboardLayout
      user={user}
      adminSidebarNavigation={ADMIN_ROUTES}
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
  return (
    <DashboardLayout
      user={user}
      employeeSidebarNavigation={EMPLOYEE_ROUTES}
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
  return (
    <DashboardLayout user={user} clientSidebarNavigation={CLIENT_ROUTES}>
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
