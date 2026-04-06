'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface StageSidebarProps {
  role: 'admin' | 'employee';
  currentStage?: string;
}

const STAGES = [
  { id: 'pending-info', label: 'Pending Info' },
  { id: 'under-prep', label: 'Under Prep' },
  { id: 'draft-sent', label: 'Draft Sent' },
  { id: 'awaiting-approval', label: 'Awaiting Approval' },
  { id: 'payment-received', label: 'Payment Received' },
  { id: '8879-sent', label: '8879 Sent' },
  { id: '8879-received', label: '8879 Received' },
  { id: 'filing-completed', label: 'Filing Completed' },
  { id: 'closed', label: 'Closed' },
];

export function StageSidebar({ role, currentStage }: StageSidebarProps) {
  const pathname = usePathname();
  const baseUrl = role === 'admin' ? '/admin' : '/employee';

  return (
    <div className="flex flex-col gap-1 py-4">
      <div className="px-4 py-2 mb-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Workflow Stages
        </h3>
      </div>
      
      {STAGES.map((stage) => {
        const isActive = currentStage === stage.id;
        return (
          <Link
            key={stage.id}
            href={`${baseUrl}/queues?stage=${stage.id}`}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-muted'
            )}
          >
            {stage.label}
          </Link>
        );
      })}
    </div>
  );
}
