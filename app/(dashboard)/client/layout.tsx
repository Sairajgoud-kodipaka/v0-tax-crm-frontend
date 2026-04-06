'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { CLIENT_ROUTES } from '@/lib/constants';

export default function ClientLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'client') {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'client') {
    return null;
  }

  return (
    <DashboardLayout
      sidebarNavigation={CLIENT_ROUTES}
      title="My Cases"
    >
      {children}
    </DashboardLayout>
  );
}
