'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  ShieldAlert,
  Sparkles,
  AlertTriangle,
  ExternalLink,
  Settings,
  X,
  FileCheck2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  fetchNotificationsAction,
  markReadAction,
  markAllReadAction,
} from '@/app/actions/notifications';
import type { NotificationRow } from '@/lib/data/notifications';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const res = await fetchNotificationsAction();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Poll every 30 seconds for background cron updates
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await markReadAction(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllReadAction();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = async (notif: NotificationRow) => {
    if (!notif.is_read) {
      await markReadAction(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const filteredNotifications = notifications.filter((n) =>
    filter === 'unread' ? !n.is_read : true
  );

  const getIconForType = (type: string, severity: string) => {
    switch (type) {
      case 'deadline_approaching':
        return <Clock className="h-4 w-4 text-amber-400" />;
      case 'compliance_expiring':
        return <ShieldAlert className="h-4 w-4 text-red-400" />;
      case 'qualification_pending':
        return <Sparkles className="h-4 w-4 text-emerald-400" />;
      case 'checklist_incomplete':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      default:
        return <FileCheck2 className="h-4 w-4 text-cyan-400" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications();
        }}
        aria-label="Open notifications"
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors',
          isOpen && 'bg-zinc-800 text-zinc-100 border-zinc-700'
        )}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold text-zinc-950 shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-zinc-800 bg-zinc-900/95 shadow-2xl backdrop-blur-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-zinc-100">Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-[10px] py-0 px-1.5">
                  {unreadCount} new
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3 w-3" /> Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex border-b border-zinc-800/60 bg-zinc-950/40 px-3 py-1.5 text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={cn(
                'px-2.5 py-1 rounded text-[11px] font-medium transition-colors',
                filter === 'all'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={cn(
                'px-2.5 py-1 rounded text-[11px] font-medium transition-colors ml-1',
                filter === 'unread'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/40">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500 space-y-1">
                <Bell className="h-5 w-5 mx-auto text-zinc-600 mb-1 opacity-60" />
                <p>No {filter === 'unread' ? 'unread ' : ''}notifications</p>
                <p className="text-[10px] text-zinc-600">
                  Tender deadlines and compliance alerts will appear here.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={cn(
                    'group flex items-start gap-3 p-3 transition-colors cursor-pointer text-xs',
                    notif.is_read
                      ? 'bg-transparent hover:bg-zinc-800/40'
                      : 'bg-zinc-950/60 hover:bg-zinc-800/60'
                  )}
                >
                  <div className="mt-0.5 shrink-0">
                    {getIconForType(notif.type, notif.severity)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={cn(
                          'truncate font-medium',
                          notif.is_read ? 'text-zinc-300' : 'text-zinc-100 font-semibold'
                        )}
                      >
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-zinc-500 shrink-0 font-mono">
                        {formatRelativeTime(notif.created_at)}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-snug">
                      {notif.message}
                    </p>
                  </div>

                  {!notif.is_read && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(notif.id, e)}
                      title="Mark as read"
                      className="mt-1 shrink-0 text-zinc-500 hover:text-zinc-300 p-0.5"
                    >
                      <span className="h-2 w-2 rounded-full bg-cyan-400 block" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-zinc-800/80 bg-zinc-950/60 px-4 py-2.5 flex items-center justify-between text-xs">
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 transition-colors"
            >
              <Settings className="h-3 w-3" /> Configure Notification Thresholds
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
