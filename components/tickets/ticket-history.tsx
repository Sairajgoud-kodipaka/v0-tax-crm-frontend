'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  FileText,
  MessageSquare,
  Upload,
  RefreshCw,
  FileSignature,
  CheckCircle,
  CreditCard,
  Receipt,
  UserCheck,
  Settings,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { TicketActivity } from '@/hooks/use-ticket-history-realtime';

const ACTION_ICONS: Record<string, React.ComponentType<any>> = {
  ticket_created: Settings,
  stage_changed: UserCheck,
  document_uploaded: Upload,
  document_updated: RefreshCw,
  document_requested: FileText,
  message_sent: MessageSquare,
  organizer_updated: FileSignature,
  draft_sent: FileText,
  draft_approved: CheckCircle,
  draft_rejected: RefreshCw,
  final_document_available: CheckCircle,
  payment_processed: CreditCard,
  invoice_created: Receipt,
};

const ACTION_LABELS: Record<string, string> = {
  ticket_created: 'Ticket Created',
  stage_changed: 'Stage Changed',
  document_uploaded: 'Document Uploaded',
  document_updated: 'Document Updated',
  document_requested: 'Document Requested',
  message_sent: 'Message Sent',
  organizer_updated: 'Organizer Updated',
  draft_sent: 'Draft Sent',
  draft_approved: 'Draft Approved',
  draft_rejected: 'Draft Rejected',
  final_document_available: 'Final Document Available',
  payment_processed: 'Payment Processed',
  invoice_created: 'Invoice Created',
};

interface TicketHistoryProps {
  activities: TicketActivity[];
  isStaff: boolean; // True for employee/admin, false for client
  onTabSwitch?: (tab: string, entityId?: string) => void; // To switch tabs on click
}

export function TicketHistory({ activities, isStaff, onTabSwitch }: TicketHistoryProps) {
  const [showAll, setShowAll] = useState(!isStaff); // Staff can toggle filters
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filteredActivities = showAll
    ? activities
    : activities.filter((a) => a.isVisibleToClient);

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedActivities = filteredActivities.slice(startIndex, startIndex + itemsPerPage);

  const handleClick = (activity: TicketActivity) => {
    if (!onTabSwitch) return;

    switch (activity.relatedEntityType) {
      case 'document':
        onTabSwitch('documents', activity.relatedEntityId);
        break;
      case 'message':
        onTabSwitch('messages', activity.relatedEntityId);
        break;
      case 'organizer':
        onTabSwitch('organizer');
        break;
      default:
        // No action for others
        break;
    }
  };

  const goToPrevious = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNext = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));

  return (
    <div className="space-y-4">
      {isStaff && (
        <div className="flex items-center gap-2">
          <Button
            variant={showAll ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setShowAll(true);
              setCurrentPage(1);
            }}
          >
            <Eye className="w-4 h-4 mr-1" />
            All Activities
          </Button>
          <Button
            variant={!showAll ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setShowAll(false);
              setCurrentPage(1);
            }}
          >
            <EyeOff className="w-4 h-4 mr-1" />
            Client-Visible Only
          </Button>
        </div>
      )}

      <ScrollArea className="h-96">
        <div className="space-y-3">
          {paginatedActivities.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No activities yet.
            </p>
          ) : (
            paginatedActivities.map((activity) => {
              const Icon = ACTION_ICONS[activity.actionType] || FileText;
              const label = ACTION_LABELS[activity.actionType] || 'Activity';
              const isClickable = !!activity.relatedEntityType;

              return (
                <div
                  key={activity.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border',
                    isClickable && 'cursor-pointer hover:bg-muted/50',
                  )}
                  onClick={() => isClickable && handleClick(activity)}
                >
                  <Icon className="w-5 h-5 mt-0.5 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.actionDetails.display_text ||
                       activity.actionDetails.file_name ||
                       activity.actionDetails.message_preview ||
                       activity.actionDetails.sections_updated?.join(', ') ||
                       'Details available'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
                      {activity.actorType === 'client' ? ' by Client' : ' by Staff'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevious}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNext}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}