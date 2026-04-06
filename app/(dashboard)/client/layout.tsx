'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { CLIENT_ROUTES } from '@/lib/constants';

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

export default function ClientLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
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
      clientSidebarNavigation={CLIENT_ROUTES}
      title={clientHeaderTitle(pathname)}
    >
      {children}
    </DashboardLayout>
  );
}
