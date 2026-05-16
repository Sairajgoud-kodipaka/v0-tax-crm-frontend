'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const NAV_TIMEOUT_MS = 15_000;

export function useNotificationNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const targetRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearNavigation = useCallback(() => {
    targetRef.current = null;
    setIsNavigating(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isNavigating || !targetRef.current) return;
    const targetPathname = targetRef.current.split('?')[0];
    if (pathname === targetPathname || pathname.startsWith(`${targetPathname}/`)) {
      clearNavigation();
    }
  }, [pathname, isNavigating, clearNavigation]);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const navigate = useCallback(
    async (href: string, beforeNavigate?: () => Promise<void>) => {
      if (isNavigating) return false;
      setIsNavigating(true);
      targetRef.current = href;
      timeoutRef.current = setTimeout(clearNavigation, NAV_TIMEOUT_MS);
      try {
        if (beforeNavigate) await beforeNavigate();
        router.push(href);
        return true;
      } catch {
        clearNavigation();
        return false;
      }
    },
    [isNavigating, router, clearNavigation],
  );

  return { isNavigating, navigate, clearNavigation };
}
