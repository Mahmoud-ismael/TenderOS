'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Compass,
  CheckCircle2,
  Files,
  SendHorizontal,
  Building2,
  Bot,
  Settings,
  LogOut,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { ThemeToggle } from '@/components/theme-toggle';

const navItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Tender Discovery',
    href: '/discovery',
    icon: Compass,
  },
  {
    name: 'Qualification',
    href: '/qualification',
    icon: CheckCircle2,
  },
  {
    name: 'Documents',
    href: '/documents',
    icon: Files,
  },
  {
    name: 'Applications',
    href: '/applications',
    icon: SendHorizontal,
  },
  {
    name: 'Company Profile',
    href: '/company-profile',
    icon: Building2,
  },
  {
    name: 'Agent',
    href: '/agent',
    icon: Bot,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('tenderos_sidebar_collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('tenderos_sidebar_collapsed', String(next));
  };

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-[#0c0d12] dark:text-zinc-100 antialiased transition-colors duration-200">
      {/* Left Sidebar Shell */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#121318] transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-[68px]' : 'w-64'
        )}
      >
        {/* Brand Header */}
        <div
          className={cn(
            'flex h-16 items-center border-b border-zinc-200 dark:border-zinc-800 transition-all',
            isCollapsed ? 'justify-center px-2' : 'justify-between px-5'
          )}
        >
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold text-xs shadow-sm">
              TO
            </div>
            {!isCollapsed && (
              <div className="truncate animate-in fade-in duration-200">
                <span className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 text-sm block truncate">
                  TenderOS
                </span>
                <span className="block text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate">
                  Hisako Tech
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div className="flex items-center space-x-1">
              <Badge variant="outline" className="border-emerald-500/30 text-[9px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0">
                AGPO
              </Badge>
              <button
                onClick={toggleSidebar}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-3">
          {!isCollapsed && (
            <div className="px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Workspaces
            </div>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  'group flex items-center rounded-lg text-xs font-medium transition-all duration-150',
                  isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
                  isActive
                    ? 'bg-zinc-200/90 text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-zinc-50 font-semibold'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:hover:text-white'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    isActive
                      ? 'text-zinc-950 dark:text-zinc-100'
                      : 'text-zinc-500 group-hover:text-zinc-800 dark:text-zinc-400 dark:group-hover:text-zinc-200'
                  )}
                />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
                {!isCollapsed && item.name === 'Agent' && (
                  <span className="ml-auto flex items-center gap-1 rounded bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-medium text-violet-600 dark:text-violet-400 border border-violet-500/20">
                    <Sparkles className="h-2 w-2" /> Vertex
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer User / Logout / Expand button */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-2">
          {isCollapsed ? (
            <div className="flex flex-col items-center space-y-1.5 py-1">
              <button
                onClick={toggleSidebar}
                title="Expand sidebar"
                className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="rounded-md p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg bg-zinc-100 dark:bg-[#181920] p-2 border border-zinc-200 dark:border-zinc-800 mb-6 sm:mb-0">
              <div className="truncate pr-1">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">Operator</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Single User Auth</p>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors shrink-0"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area - dynamically shifts based on isCollapsed */}
      <div
        className={cn(
          'flex flex-1 flex-col min-w-0 max-w-full overflow-x-hidden transition-all duration-300 ease-in-out',
          isCollapsed ? 'pl-[68px]' : 'pl-64'
        )}
      >
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/95 dark:border-zinc-800 dark:bg-[#0c0d12]/95 px-4 md:px-6 backdrop-blur-md">
          <div className="flex items-center space-x-2.5">
            {isCollapsed && (
              <button
                onClick={toggleSidebar}
                className="p-1.5 -ml-1 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                title="Expand sidebar"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            )}
            <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">TenderOS</span>
            <span className="text-xs text-zinc-400 dark:text-zinc-600">/</span>
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
              {pathname === '/' ? 'Dashboard' : pathname.replace('/', '').replace('-', ' ')}
            </span>
          </div>

          <div className="flex items-center space-x-2.5 text-xs text-zinc-600 dark:text-zinc-400">
            <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Vertex AI & Supabase Connected
            </span>
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>

        {/* Content Shell - Fixed width container prevents layout stretch */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
