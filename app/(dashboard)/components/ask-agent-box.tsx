'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Sparkles, ArrowRight, CornerDownLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function AskAgentBox() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/agent?q=${encodeURIComponent(query.trim())}`);
  };

  const handleChipClick = (prompt: string) => {
    router.push(`/agent?q=${encodeURIComponent(prompt)}`);
  };

  const promptChips = [
    'Which tenders are closing this week?',
    'What is blocking my compliance bundle?',
    'Any newly qualified ICT tenders to review?',
    'Show me our historical win-rate stats',
  ];

  return (
    <Card className="border-violet-200 dark:border-violet-500/40 bg-white dark:bg-[#13141f] p-4 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30">
              <Bot className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              Ask TenderOS AI Copilot
              <span className="flex items-center gap-1 rounded bg-violet-100 dark:bg-violet-500/20 px-1.5 py-0.5 text-[9px] font-medium text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30">
                <Sparkles className="h-2.5 w-2.5" /> Vertex Gemini
              </span>
            </span>
          </div>

          <span className="text-[11px] text-zinc-600 dark:text-zinc-400 hidden sm:inline">
            Direct action control center
          </span>
        </div>

        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question or issue a command (e.g. 'Approve tender X and start the application', 'Which tenders close in 48 hours?')..."
            className="w-full rounded-xl border border-zinc-300 bg-zinc-50/80 py-2.5 pl-3.5 pr-24 text-xs text-zinc-900 placeholder:text-zinc-500 focus:bg-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:border-violet-400 shadow-sm"
          />

          <Button
            type="submit"
            size="sm"
            disabled={!query.trim()}
            className="absolute right-1.5 h-7 px-3 bg-violet-600 hover:bg-violet-500 text-white text-xs gap-1 shadow-sm font-medium disabled:opacity-50"
          >
            <span>Ask</span>
            <CornerDownLeft className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-600 dark:text-zinc-300 mr-1">
            Quick Prompts:
          </span>
          {promptChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleChipClick(chip)}
              className="rounded-md border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-700 hover:border-zinc-300 hover:bg-zinc-200 transition-colors dark:border-zinc-700/80 dark:bg-zinc-800/80 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-white"
            >
              {chip}
            </button>
          ))}
        </div>
      </form>
    </Card>
  );
}
