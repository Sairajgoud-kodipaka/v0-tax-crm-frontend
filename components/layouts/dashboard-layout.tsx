'use client';

import { type ReactNode, useEffect, useState, useCallback, useTransition, memo } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import {
  Archive,
  Bell,
  BadgeCheck,
  BarChart3,
  Briefcase,
  CheckCircle2,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Contact,
  CreditCard,
  FileEdit,
  FileSignature,
  FileText,
  Gift,
  Home,
  Inbox,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Mail,
  MessageSquare,
  Phone,
  ScrollText,
  Send,
  Settings,
  UserCheck,
  UserPlus,
  Users,
  Video,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import type { SessionUser } from '@/lib/session-user';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { GlobalSearch } from '@/components/search/global-search';
import { Button } from '@/components/ui/button';
import { TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { UnreadBadge } from '@/components/ui/unread-badge';

const SIDEBAR_STORAGE_KEY = 'taxcrm-sidebar-expanded';

interface DashboardLayoutProps {
  children: ReactNode;
  user: SessionUser;
  adminSidebarNavigation?: Array<{ href: string; label: string; icon: string }>;
  employeeSidebarNavigation?: Array<{ href: string; label: string; icon: string }>;
  clientSidebarNavigation?: Array<{ href: string; label: string }>;
  currentStage?: string;
}

const STAGES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'pending-info', label: 'Pending Info', icon: Inbox },
  { id: 'under-prep', label: 'Under Prep', icon: FileEdit },
  { id: 'draft-sent', label: 'Draft Sent', icon: Send },
  { id: 'awaiting-approval', label: 'Awaiting Approval', icon: UserCheck },
  { id: 'payment-received', label: 'Payment Received', icon: CreditCard },
  { id: '8879-sent', label: '8879 Sent', icon: FileSignature },
  { id: '8879-received', label: '8879 Received', icon: CheckCircle2 },
  { id: 'filing-completed', label: 'Filing Completed', icon: BadgeCheck },
  { id: 'closed', label: 'Closed', icon: Archive },
];

const ADMIN_ROUTE_ICONS: Record<string, LucideIcon> = {
  grid: LayoutDashboard,
  list: ListTodo,
  contact: Contact,
  users: Users,
  'bar-chart': BarChart3,
  log: ScrollText,
  settings: Settings,
  mail: Mail,
  briefcase: Briefcase,
  file: FileText,
  form: ClipboardList,
  bell: Bell,
};

const EMPLOYEE_ROUTE_ICONS: Record<string, LucideIcon> = {
  grid: LayoutDashboard,
  list: ListTodo,
  contact: Contact,
  users: UserPlus,
  'bar-chart': BarChart3,
  log: ScrollText,
  settings: Settings,
  mail: Mail,
  briefcase: Briefcase,
  file: FileText,
  form: ClipboardList,
  bell: Bell,
};

const CLIENT_ROUTE_ICON: Record<string, LucideIcon> = {
  '/client': Home,
  '/client/videos': Video,
  '/client/cashback': Gift,
  '/client/feedback': MessageSquare,
  '/client/contact': Phone,
  '/client/messages': Mail,
  '/client/documents': FileText,
  '/client/tax-organizer': ClipboardList,
};

function NavTooltip({ collapsed, label, children }: { collapsed: boolean; label: string; children: ReactNode }) {
  if (!collapsed) return <>{children}</>;
  return (
    <TooltipPrimitive.Root delayDuration={200}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipContent side="right" sideOffset={10} className="font-medium">
        {label}
      </TooltipContent>
    </TooltipPrimitive.Root>
  );
}

// ─── Memoized nav sections ────────────────────────────────────────────────────
// Each section only re-renders when its own props change, not when unrelated
// state changes (e.g. the other nav sections, or unrelated parent state).

const StageNav = memo(function StageNav({
  collapsed,
  expanded,
  currentStage,
  baseUrl,
  stageAttentionCounts,
}: {
  collapsed: boolean;
  expanded: boolean;
  currentStage: string | undefined;
  baseUrl: string;
  stageAttentionCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [isPending, startStageTransition] = useTransition();
  const [pendingStage, setPendingStage] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending) setPendingStage(null);
  }, [isPending]);

  return (
    <nav className={cn('flex-1 border-t border-sidebar-border py-3', expanded ? 'px-3' : 'px-2')}>
      {expanded && (
        <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Workflow
        </p>
      )}
      <ul className="space-y-0.5">
        {STAGES.map((stage) => {
          const effectiveStage = pendingStage ?? currentStage;
          const isActive = effectiveStage === stage.id;
          const isLoading = isPending && pendingStage === stage.id;
          const Icon = stage.icon;
          const attentionCount = stageAttentionCounts[stage.id] ?? 0;
          return (
            <li key={stage.id}>
              <NavTooltip collapsed={collapsed} label={stage.label}>
                <button
                  type="button"
                  onClick={() => {
                    setPendingStage(stage.id);
                    startStageTransition(() => {
                      router.push(`${baseUrl}/queues?stage=${stage.id}`);
                    });
                  }}
                  className={cn(
                    'relative w-full flex items-center gap-3 rounded-md py-2.5 text-sm font-medium transition-colors',
                    expanded ? 'px-3' : 'justify-center px-0',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-sidebar-foreground hover:bg-[#E4E2E2] hover:text-foreground',
                    isLoading && 'opacity-70',
                  )}
                >
                  <Icon className={cn('size-[18px] shrink-0 stroke-[1.75]', isLoading && 'animate-pulse')} />
                  {expanded && <span className="truncate">{stage.label}</span>}
                  {attentionCount > 0 ? (
                    <UnreadBadge
                      count={attentionCount}
                      className="absolute -right-1 -top-1"
                    />
                  ) : null}
                </button>
              </NavTooltip>
            </li>
          );
        })}
      </ul>
    </nav>
  );
});

const NotificationsNav = memo(function NotificationsNav({
  collapsed,
  expanded,
  pathname,
  href,
  notificationCount,
}: {
  collapsed: boolean;
  expanded: boolean;
  pathname: string;
  href: string;
  notificationCount: number;
}) {
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className={cn('py-3', expanded ? 'px-3' : 'px-2')}>
      <ul className="space-y-0.5">
        <li>
          <NavTooltip collapsed={collapsed} label="Notifications">
            <Link
              href={href}
              className={cn(
                'relative flex items-center gap-3 rounded-md py-2.5 text-sm font-medium transition-colors',
                expanded ? 'px-3' : 'justify-center px-0',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-[#E4E2E2] hover:text-foreground',
              )}
            >
              <Bell className="size-[18px] shrink-0 stroke-[1.75]" />
              {expanded && <span className="truncate">Notifications</span>}
              {notificationCount > 0 ? (
                <UnreadBadge count={notificationCount} showCountWhenOne className="absolute -right-1 -top-1" />
              ) : null}
            </Link>
          </NavTooltip>
        </li>
      </ul>
    </nav>
  );
});

const WorkspaceNav = memo(function WorkspaceNav({
  collapsed,
  expanded,
  pathname,
  items,
  iconMap,
  isEmployee,
}: {
  collapsed: boolean;
  expanded: boolean;
  pathname: string;
  items: Array<{ href: string; label: string; icon: string }>;
  iconMap: Record<string, LucideIcon>;
  isEmployee: boolean;
}) {
  return (
    <nav className={cn('border-t border-sidebar-border py-3', expanded ? 'px-3' : 'px-2')}>
      {expanded && (
        <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Workspace
        </p>
      )}
      <ul className="space-y-0.5">
        {items.map((item) => {
          const isActive = isEmployee
            ? item.href === '/employee'
              ? pathname === '/employee' || pathname === '/employee/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`)
            : pathname.startsWith(item.href);
          const Icon = iconMap[item.icon] ?? LayoutDashboard;
          return (
            <li key={item.href}>
              <NavTooltip collapsed={collapsed} label={item.label}>
                <Link
                  href={item.href}
                  className={cn(
                    'relative flex items-center gap-3 rounded-md py-2.5 text-sm font-medium transition-colors',
                    expanded ? 'px-3' : 'justify-center px-0',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-sidebar-foreground hover:bg-[#E4E2E2] hover:text-foreground',
                  )}
                >
                  <Icon className="size-[18px] shrink-0 stroke-[1.75]" />
                  {expanded && <span className="truncate">{item.label}</span>}
                </Link>
              </NavTooltip>
            </li>
          );
        })}
      </ul>
    </nav>
  );
});

const ClientNav = memo(function ClientNav({
  collapsed,
  expanded,
  pathname,
  items,
}: {
  collapsed: boolean;
  expanded: boolean;
  pathname: string;
  items: Array<{ href: string; label: string }>;
}) {
  return (
    <nav className={cn('flex-1 py-3', expanded ? 'px-3' : 'px-2')}>
      {expanded && (
        <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Portal
        </p>
      )}
      <ul className="space-y-0.5">
        {items.map((item) => {
          const isActive =
            item.href === '/client'
              ? pathname === '/client'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = CLIENT_ROUTE_ICON[item.href] ?? Home;
          return (
            <li key={item.href}>
              <NavTooltip collapsed={collapsed} label={item.label}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md py-2.5 text-sm font-medium transition-colors',
                    expanded ? 'px-3' : 'justify-center px-0',
                    isActive
                      ? 'bg-[#E0E1DD] text-[#0D1B2A] shadow-sm'
                      : 'text-sidebar-foreground hover:bg-[#E4E2E2] hover:text-foreground',
                  )}
                >
                  <Icon className="size-[18px] shrink-0 stroke-[1.75]" />
                  {expanded && <span className="truncate">{item.label}</span>}
                </Link>
              </NavTooltip>
            </li>
          );
        })}
      </ul>
    </nav>
  );
});

// ─── Main layout ──────────────────────────────────────────────────────────────

export function DashboardLayout({
  children,
  user,
  adminSidebarNavigation = [],
  employeeSidebarNavigation = [],
  clientSidebarNavigation = [],
  currentStage,
}: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [, startTransition] = useTransition();
  const [stageAttentionCounts, setStageAttentionCounts] = useState<Record<string, number>>({});
  const [sidebarNotificationCount, setSidebarNotificationCount] = useState(0);
  const unreadByStage = useAppStore((s) => s.unreadByStage);
  const setUnreadSnapshot = useAppStore((s) => s.setUnreadSnapshot);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored === '0') setExpanded(false);
      if (stored === '1') setExpanded(true);
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, expanded ? '1' : '0');
    } catch { /* ignore */ }
  }, [expanded, hydrated]);

  // useTransition marks the expand/collapse as non-urgent — browser paints the
  // button press immediately, then applies the sidebar width change. This is what
  // fixes the 376ms INP on the collapse button.
  const toggleExpanded = useCallback(() => {
    startTransition(() => setExpanded((e) => !e));
  }, []);

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }, [router]);

  const isAdmin = user.role === 'admin';
  const isEmployee = user.role === 'employee';
  const isAdminOrEmployee = user.role === 'admin' || user.role === 'employee';
  const isClient = user.role === 'client';
  const baseUrl = isAdmin ? '/admin' : '/employee';
  // Keep SSR and the first client paint identical; apply localStorage preference after mount.
  const showExpanded = hydrated ? expanded : true;
  const collapsed = !showExpanded;
  const workspaceItems = isAdmin ? adminSidebarNavigation : employeeSidebarNavigation;
  const notificationsHref = isAdmin ? '/admin/notifications' : '/employee/notifications';
  const sidebarDisplayName = user.name?.trim() || user.email.split('@')[0] || 'User';
  const sidebarInitial = sidebarDisplayName.charAt(0).toUpperCase() || 'U';

  useEffect(() => {
    if (!isAdminOrEmployee) return;
    let cancelled = false;
    const supabase = createClient();

    const loadSidebarCounts = async () => {
      const [ticketsRes, notifRes] = await Promise.all([
        supabase.from('tickets').select('id, stage').neq('stage', 'closed'),
        supabase
          .from('notifications')
          .select('id, ticket_id')
          .eq('recipient_id', user.id)
          .eq('is_read', false),
      ]);
      if (cancelled) return;
      const stageByTicket = new Map(
        ((ticketsRes.data ?? []) as Array<{ id: string; stage: string }>).map((ticket) => [ticket.id, ticket.stage]),
      );
      const unreadTicketIds = new Set(
        ((notifRes.data ?? []) as Array<{ id: string; ticket_id: string | null }>)
          .map((row) => row.ticket_id)
          .filter((ticketId): ticketId is string => Boolean(ticketId)),
      );
      const entries = Array.from(unreadTicketIds).map((ticketId) => ({
        ticketId,
        stage: stageByTicket.get(ticketId) ?? 'pending-info',
        unread: true,
      }));
      setUnreadSnapshot(entries);
      setSidebarNotificationCount((notifRes.data ?? []).length);
    };

    void loadSidebarCounts();
    const interval = setInterval(() => {
      void loadSidebarCounts();
    }, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAdminOrEmployee, user.id, setUnreadSnapshot]);

  useEffect(() => {
    setStageAttentionCounts(unreadByStage);
  }, [unreadByStage]);

  return (
    <TooltipProvider delayDuration={200}>
      <div
        data-dashboard-shell
        className="flex h-dvh max-h-dvh overflow-hidden bg-background"
      >
        <aside
          suppressHydrationWarning
          className={cn(
            'flex h-full max-h-full min-h-0 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground',
            hydrated && 'transition-[width] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)]',
            showExpanded ? 'w-[260px]' : 'w-[72px]',
          )}
        >
          {/* Brand + collapse */}
          <div
            className={cn(
              'flex shrink-0 items-center gap-3 border-b border-sidebar-border py-3',
              showExpanded ? 'px-4' : 'flex-col gap-3 px-2 pt-4',
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-1 ring-black/5">
                <span className="text-sm font-bold tracking-tight">{sidebarInitial}</span>
              </div>
              {showExpanded && (
                <span className="truncate text-[15px] font-semibold tracking-tight text-sidebar-foreground">
                  {sidebarDisplayName}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={toggleExpanded}
              aria-expanded={expanded}
              aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-full border border-sidebar-border bg-background/80 text-muted-foreground shadow-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                showExpanded ? '' : 'mx-auto',
              )}
            >
              {showExpanded ? (
                <ChevronsLeft className="size-[18px] stroke-[1.75]" />
              ) : (
                <ChevronsRight className="size-[18px] stroke-[1.75]" />
              )}
            </button>
          </div>

          <div className="scrollbar-hide flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
            {isAdminOrEmployee && (
              <NotificationsNav
                collapsed={collapsed}
                expanded={showExpanded}
                pathname={pathname}
                href={notificationsHref}
                notificationCount={sidebarNotificationCount}
              />
            )}

            {isAdminOrEmployee && (
              <StageNav
                collapsed={collapsed}
                expanded={showExpanded}
                currentStage={currentStage}
                baseUrl={baseUrl}
                stageAttentionCounts={stageAttentionCounts}
              />
            )}

            {isClient && clientSidebarNavigation.length > 0 && (
              <ClientNav
                collapsed={collapsed}
                expanded={showExpanded}
                pathname={pathname}
                items={clientSidebarNavigation}
              />
            )}

            {isAdmin && workspaceItems.length > 0 && (
              <WorkspaceNav
                collapsed={collapsed}
                expanded={showExpanded}
                pathname={pathname}
                items={workspaceItems}
                iconMap={ADMIN_ROUTE_ICONS}
                isEmployee={false}
              />
            )}

            {isEmployee && workspaceItems.length > 0 && (
              <WorkspaceNav
                collapsed={collapsed}
                expanded={showExpanded}
                pathname={pathname}
                items={workspaceItems}
                iconMap={EMPLOYEE_ROUTE_ICONS}
                isEmployee={true}
              />
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 space-y-2 border-t border-sidebar-border p-3">
            <NavTooltip collapsed={collapsed} label={isClient ? 'Sign out' : 'Logout'}>
              <Button
                type="button"
                variant="outline"
                onClick={handleLogout}
                className={cn(
                  'h-10 w-full justify-start gap-2 rounded-md border-sidebar-border bg-background/60 text-sidebar-foreground shadow-sm transition-colors hover:bg-sidebar-accent',
                  collapsed && 'justify-center px-0',
                  !isClient && 'text-destructive hover:bg-destructive/10 hover:text-destructive',
                )}
              >
                <LogOut className="size-[18px] shrink-0 stroke-[1.75]" />
                {showExpanded && <span>{isClient ? 'Sign out' : 'Logout'}</span>}
              </Button>
            </NavTooltip>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            {isAdminOrEmployee && <GlobalSearch userRole={user.role} />}
            {isClient && <div />}
            <NotificationBell userId={user.id} role={user.role} />
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain p-4 pb-6 text-foreground sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
