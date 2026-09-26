'use client';

import React from 'react';
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
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const navItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Tender Discovery',
    href: '/tenders',
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
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      {/* Left Sidebar Shell */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl">
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-800/70 px-6">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-950 font-bold text-sm shadow-sm">
              TO
            </div>
            <div>
              <span className="font-semibold tracking-tight text-zinc-100 text-sm">
                TenderOS
              </span>
              <span className="block text-[10px] uppercase tracking-wider text-zinc-400">
                Hisako Tech
              </span>
            </div>
          </div>
          <Badge variant="outline" className="border-emerald-500/30 text-[10px] text-emerald-400 bg-emerald-500/10">
            AGPO
          </Badge>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Workspaces
          </div>
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
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    isActive ? 'text-zinc-100' : 'text-zinc-500 group-hover:text-zinc-300'
                  )}
                />
                <span>{item.name}</span>
                {item.name === 'Agent' && (
                  <span className="ml-auto flex items-center gap-1 rounded bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-400 border border-violet-500/20">
                    <Sparkles className="h-2.5 w-2.5" /> Vertex
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer User / Logout */}
        <div className="border-t border-zinc-800/70 p-3">
          <div className="flex items-center justify-between rounded-lg bg-zinc-950/60 p-2.5 border border-zinc-800/50">
            <div className="truncate">
              <p className="text-xs font-medium text-zinc-200 truncate">Operator</p>
              <p className="text-[11px] text-zinc-500 truncate">Single User Auth</p>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/70 px-8 backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-zinc-500">TenderOS</span>
            <span className="text-xs text-zinc-600">/</span>
            <span className="text-xs font-medium text-zinc-300 capitalize">
              {pathname === '/' ? 'Dashboard' : pathname.replace('/', '').replace('-', ' ')}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected to Vertex AI & Supabase
            </span>
          </div>
        </header>

        {/* Content Shell */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
