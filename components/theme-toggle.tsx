'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!mounted) {
    return (
      <div className={cn('h-8 w-8 rounded-lg border border-zinc-800 bg-zinc-900/60', className)} />
    );
  }

  const themes = [
    { key: 'light', label: 'Light', icon: Sun },
    { key: 'dark', label: 'Dark', icon: Moon },
    { key: 'system', label: 'System', icon: Laptop },
  ];

  const currentIcon =
    theme === 'system'
      ? Laptop
      : resolvedTheme === 'dark'
      ? Moon
      : Sun;
  const IconComponent = currentIcon;

  return (
    <div ref={containerRef} className={cn('relative inline-block text-left', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 transition-all shadow-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-850 dark:hover:text-white"
        title="Change theme appearance (Shortcut: press 'D')"
        aria-label="Change theme"
      >
        <IconComponent className="h-3.5 w-3.5 text-amber-500 dark:text-violet-400 transition-transform duration-200" />
        <span className="hidden sm:inline capitalize font-medium">{theme}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-36 origin-top-right rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150 dark:border-zinc-800 dark:bg-[#14151b]">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Theme Mode
          </div>
          <div className="space-y-0.5">
            {themes.map((t) => {
              const Icon = t.icon;
              const isSelected = theme === t.key;

              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setTheme(t.key);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                    isSelected
                      ? 'bg-zinc-100 text-zinc-900 font-semibold dark:bg-zinc-800 dark:text-zinc-100'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                    <span>{t.label}</span>
                  </div>
                  {isSelected && <Check className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />}
                </button>
              );
            })}
          </div>
          <div className="mt-1 border-t border-zinc-100 dark:border-zinc-800/80 pt-1.5 px-2 text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>Quick toggle:</span>
            <kbd className="rounded bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 text-[9px] font-mono border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300">
              D
            </kbd>
          </div>
        </div>
      )}
    </div>
  );
}
