'use client';

import { type ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import {
  Archive,
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
import { Button } from '@/components/ui/button';
import { TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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

function NavTooltip({
  collapsed,
  label,
  children,
}: {
  collapsed: boolean;
  label: string;
  children: ReactNode;
}) {
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

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored === '0') setExpanded(false);
      if (stored === '1') setExpanded(true);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, expanded ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [expanded, hydrated]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const isAdmin = user.role === 'admin';
  const isEmployee = user.role === 'employee';
  const isAdminOrEmployee = user.role === 'admin' || user.role === 'employee';
  const isClient = user.role === 'client';
  const baseUrl = isAdmin ? '/admin' : '/employee';
  const collapsed = !expanded;
  const sidebarDisplayName =
    user.name?.trim() || user.email.split('@')[0] || 'User';
  const sidebarInitial = sidebarDisplayName.charAt(0).toUpperCase() || 'U';

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-screen bg-background">
        <aside
          className={cn(
            'flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground',
            'transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
            expanded ? 'w-[260px]' : 'w-[72px]',
          )}
        >
          {/* Brand + collapse */}
          <div
            className={cn(
              'flex shrink-0 items-center gap-3 border-b border-sidebar-border py-3',
              expanded ? 'px-4' : 'flex-col gap-3 px-2 pt-4',
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-1 ring-black/5">
                <span className="text-sm font-bold tracking-tight">{sidebarInitial}</span>
              </div>
              {expanded && (
                <span className="truncate text-[15px] font-semibold tracking-tight text-sidebar-foreground">
                  {sidebarDisplayName}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-full border border-sidebar-border bg-background/80 text-muted-foreground shadow-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                expanded ? '' : 'mx-auto',
              )}
            >
              {expanded ? (
                <ChevronsLeft className="size-[18px] stroke-[1.75]" />
              ) : (
                <ChevronsRight className="size-[18px] stroke-[1.75]" />
              )}
            </button>
          </div>

          <div className="scrollbar-hide flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
            {/* Workflow stages */}
            {isAdminOrEmployee && (
              <nav className={cn('flex-1 py-3', expanded ? 'px-3' : 'px-2')}>
                {expanded && (
                  <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Workflow
                  </p>
                )}
                <ul className="space-y-0.5">
                  {STAGES.map((stage) => {
                    const isActive = currentStage === stage.id;
                    const Icon = stage.icon;
                    const href = `${baseUrl}/queues?stage=${stage.id}`;
                    const link = (
                      <Link
                        href={href}
                        className={cn(
                          'flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-colors',
                          expanded ? 'px-3' : 'justify-center px-0',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-sidebar-foreground hover:bg-[#E4E2E2] hover:text-foreground',
                        )}
                      >
                        <Icon className="size-[18px] shrink-0 stroke-[1.75]" />
                        {expanded && <span className="truncate">{stage.label}</span>}
                      </Link>
                    );
                    return (
                      <li key={stage.id}>
                        <NavTooltip collapsed={collapsed} label={stage.label}>
                          {link}
                        </NavTooltip>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            )}

            {/* Client portal */}
            {isClient && clientSidebarNavigation.length > 0 && (
              <nav className={cn('flex-1 py-3', expanded ? 'px-3' : 'px-2')}>
                {expanded && (
                  <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Portal
                  </p>
                )}
                <ul className="space-y-0.5">
                  {clientSidebarNavigation.map((item) => {
                    const isActive =
                      item.href === '/client'
                        ? pathname === '/client'
                        : pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = CLIENT_ROUTE_ICON[item.href] ?? Home;
                    const link = (
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-colors',
                          expanded ? 'px-3' : 'justify-center px-0',
                          isActive
                            ? 'bg-[#E0E1DD] text-[#0D1B2A] shadow-sm'
                            : 'text-sidebar-foreground hover:bg-[#E4E2E2] hover:text-foreground',
                        )}
                      >
                        <Icon className="size-[18px] shrink-0 stroke-[1.75]" />
                        {expanded && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                    return (
                      <li key={item.href}>
                        <NavTooltip collapsed={collapsed} label={item.label}>
                          {link}
                        </NavTooltip>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            )}

            {/* Admin workspace */}
            {isAdmin && adminSidebarNavigation.length > 0 && (
              <nav className={cn('border-t border-sidebar-border py-3', expanded ? 'px-3' : 'px-2')}>
                {expanded && (
                  <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Workspace
                  </p>
                )}
                <ul className="space-y-0.5">
                  {adminSidebarNavigation.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = ADMIN_ROUTE_ICONS[item.icon] ?? LayoutDashboard;
                    const link = (
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-colors',
                          expanded ? 'px-3' : 'justify-center px-0',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-sidebar-foreground hover:bg-[#E4E2E2] hover:text-foreground',
                        )}
                      >
                        <Icon className="size-[18px] shrink-0 stroke-[1.75]" />
                        {expanded && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                    return (
                      <li key={item.href}>
                        <NavTooltip collapsed={collapsed} label={item.label}>
                          {link}
                        </NavTooltip>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            )}

            {/* Employee workspace */}
            {isEmployee && employeeSidebarNavigation.length > 0 && (
              <nav className={cn('border-t border-sidebar-border py-3', expanded ? 'px-3' : 'px-2')}>
                {expanded && (
                  <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Workspace
                  </p>
                )}
                <ul className="space-y-0.5">
                  {employeeSidebarNavigation.map((item) => {
                    const isActive =
                      item.href === '/employee'
                        ? pathname === '/employee' || pathname === '/employee/'
                        : pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = EMPLOYEE_ROUTE_ICONS[item.icon] ?? LayoutDashboard;
                    const link = (
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-colors',
                          expanded ? 'px-3' : 'justify-center px-0',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-sidebar-foreground hover:bg-[#E4E2E2] hover:text-foreground',
                        )}
                      >
                        <Icon className="size-[18px] shrink-0 stroke-[1.75]" />
                        {expanded && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                    return (
                      <li key={item.href}>
                        <NavTooltip collapsed={collapsed} label={item.label}>
                          {link}
                        </NavTooltip>
                      </li>
                    );
                  })}
                </ul>
              </nav>
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
                  'h-10 w-full justify-start gap-2 rounded-xl border-sidebar-border bg-background/60 text-sidebar-foreground shadow-sm transition-colors hover:bg-sidebar-accent',
                  collapsed && 'justify-center px-0',
                  !isClient && 'text-destructive hover:bg-destructive/10 hover:text-destructive',
                )}
              >
                <LogOut className="size-[18px] shrink-0 stroke-[1.75]" />
                {expanded && <span>{isClient ? 'Sign out' : 'Logout'}</span>}
              </Button>
            </NavTooltip>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-14 shrink-0 items-center justify-end gap-2 border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <NotificationBell userId={user.id} role={user.role} />
          </header>
          <main className="min-h-0 flex-1 overflow-auto p-6 text-foreground">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
