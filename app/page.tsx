'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Redirect based on user role
    switch (user?.role) {
      case 'admin':
        router.push('/admin');
        break;
      case 'employee':
        router.push('/employee');
        break;
      case 'client':
        router.push('/client');
        break;
      default:
        router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  return null;
}
