'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function UnreadBadge({
  count,
  showCountWhenOne = false,
  className,
}: {
  count: number;
  showCountWhenOne?: boolean;
  className?: string;
}) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (count > 0) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 350);
      return () => clearTimeout(timer);
    }
    setAnimate(false);
  }, [count]);

  if (count <= 0) return null;
  const showCount = count > 1 || showCountWhenOne;

  return (
    <Badge
      variant="destructive"
      className={cn(
        'pointer-events-none h-[18px] min-w-[18px] rounded-full border-2 border-background px-1 text-[10px] font-semibold text-white',
        animate && 'unread-badge-enter',
        className,
      )}
      aria-label={`${count} unread`}
    >
      {showCount ? (count > 99 ? '99+' : count) : ''}
    </Badge>
  );
}
