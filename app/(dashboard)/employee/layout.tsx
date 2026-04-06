'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { EMPLOYEE_ROUTES } from '@/lib/constants';

function employeeHeaderTitle(pathname: string): string {
  if (pathname === '/employee' || pathname === '/employee/') return 'Dashboard';
  if (pathname.startsWith('/employee/messages')) return 'Messages';
  if (pathname.startsWith('/employee/queues')) return 'Queues';
  if (pathname.startsWith('/employee/tickets/')) return '';
  return 'Employee';
}

export default function EmployeeLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'employee') {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'employee') {
    return null;
  }

  return (
    <DashboardLayout
      title={employeeHeaderTitle(pathname)}
      employeeSidebarNavigation={EMPLOYEE_ROUTES}
    >
      {children}
    </DashboardLayout>
  );
}
