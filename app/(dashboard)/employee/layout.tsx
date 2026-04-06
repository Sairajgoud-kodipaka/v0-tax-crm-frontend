'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { EMPLOYEE_ROUTES } from '@/lib/constants';

export default function EmployeeLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'employee' && user?.role !== 'admin')) {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || (user?.role !== 'employee' && user?.role !== 'admin')) {
    return null;
  }

  return (
    <DashboardLayout
      sidebarNavigation={EMPLOYEE_ROUTES}
      title="Employee Dashboard"
    >
      {children}
    </DashboardLayout>
  );
}
