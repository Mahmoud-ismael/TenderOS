'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Send,
  Sparkles,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Terminal,
  CheckCircle2,
  Clock,
  Building2,
  FileCheck2,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Layers,
  Wand2,
} from 'lucide-react';
import type { AgentConversationRow, AgentMessageRow } from '@/lib/data/agent';
import { cn } from '@/lib/utils';

interface ToolTraceItem {
  toolName: string;
  input: any;
  result?: any;
  timestamp?: string;
}

interface MessageItem {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolTraceItem[] | null;
  created_at: string;
}

export function AgentChatInterface({
  conversations,
  activeConversation,
  initialMessages,
  initialQuery,
}: {
  conversations: AgentConversationRow[];
  activeConversation: AgentConversationRow | null;
  initialMessages: AgentMessageRow[];
  initialQuery?: string;
}) {
  const router = useRouter();

  const parseInitialMessages = (raw: AgentMessageRow[]): MessageItem[] => {
    return (raw || []).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      tool_calls: Array.isArray(m.tool_calls) ? (m.tool_calls as unknown as ToolTraceItem[]) : null,
      created_at: m.created_at,
    }));
  };

  const [messages, setMessages] = useState<MessageItem[]>(() => parseInitialMessages(initialMessages));
  const [inputPrompt, setInputPrompt] = useState(initialQuery || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentToolStatus, setCurrentToolStatus] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessages(parseInitialMessages(initialMessages));
  }, [initialMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentToolStatus]);

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || isGenerating) return;

    setInputPrompt('');
    setIsGenerating(true);
    setCurrentToolStatus('Consulting Google Vertex AI (Gemini)...');

    const tempUserMsgId = `temp-user-${Date.now()}`;
    const newMessages: MessageItem[] = [
      ...messages,
      {
        id: tempUserMsgId,
        role: 'user',
        content: prompt,
        created_at: new Date().toISOString(),
      },
    ];
    setMessages(newMessages);

    // Placeholder for streaming assistant response
    const tempAssistantMsgId = `temp-assistant-${Date.now()}`;
    const liveToolTraces: ToolTraceItem[] = [];

    setMessages([
      ...newMessages,
      {
        id: tempAssistantMsgId,
        role: 'assistant',
        content: '',
        tool_calls: liveToolTraces,
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversation?.id,
          message: prompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat API responded with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No readable stream available in response.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let serverConvId = activeConversation?.id;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.substring(6));

              if (event.type === 'thinking') {
                setCurrentToolStatus(event.message || 'Thinking...');
              } else if (event.type === 'tool_call') {
                setCurrentToolStatus(`Executing tool: ${event.toolName}...`);
                liveToolTraces.push({
                  toolName: event.toolName,
                  input: event.input,
                  timestamp: new Date().toISOString(),
                });
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === tempAssistantMsgId
                      ? { ...m, tool_calls: [...liveToolTraces] }
                      : m
                  )
                );
              } else if (event.type === 'tool_result') {
                setCurrentToolStatus(null);
                const target = liveToolTraces.find((t) => t.toolName === event.toolName);
                if (target) {
                  target.result = event.result;
                }
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === tempAssistantMsgId
                      ? { ...m, tool_calls: [...liveToolTraces] }
                      : m
                  )
                );
              } else if (event.type === 'text_delta') {
                accumulatedText += event.text || '';
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === tempAssistantMsgId
                      ? { ...m, content: accumulatedText }
                      : m
                  )
                );
              } else if (event.type === 'done') {
                serverConvId = event.data?.conversationId;
                if (event.data?.finalText) {
                  accumulatedText = event.data.finalText;
                }
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === tempAssistantMsgId
                      ? {
                          ...m,
                          id: event.data?.assistantMessageId || m.id,
                          content: accumulatedText,
                          tool_calls: event.data?.toolCallsTrace || liveToolTraces,
                        }
                      : m
                  )
                );
              } else if (event.type === 'error') {
                accumulatedText += `\n\n*(Error: ${event.message})*`;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === tempAssistantMsgId
                      ? { ...m, content: accumulatedText }
                      : m
                  )
                );
              }
            } catch (pErr) {
              // Ignore partial JSON parses in SSE chunk
            }
          }
        }
      }

      // If a new conversation was created on the server, redirect to its URL
      if (!activeConversation && serverConvId) {
        router.push(`/agent?conversationId=${serverConvId}`);
        router.refresh();
      }
    } catch (err: any) {
      console.error('Agent chat error:', err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempAssistantMsgId
            ? {
                ...m,
                content: `Encountered an error executing this request: ${err.message}. Please check your connection or try again.`,
              }
            : m
        )
      );
    } finally {
      setIsGenerating(false);
      setCurrentToolStatus(null);
    }
  };

  const handleNewChat = () => {
    router.push('/agent');
  };

  const handleCopyMessage = (content: string, idx: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const suggestionPrompts = [
    'Which tenders are closing this week and what are their estimated values?',
    "Check Hisako's company profile and tell me if any compliance documents are blocking us.",
    'Are there any newly qualified tenders ready for approval and application?',
    'What is the current win-rate statistics across all submitted applications?',
  ];

  return (
    <div className="flex h-[calc(100vh-8.5rem)] rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
      {/* Sidebar: Conversation History */}
      <aside className="hidden md:flex w-72 flex-col border-r border-zinc-800 bg-zinc-900/60">
        <div className="p-3 border-b border-zinc-800/80">
          <Button
            size="sm"
            onClick={handleNewChat}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white text-xs h-9 justify-center gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" /> New Conversation
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Recent Conversations
          </div>

          {conversations.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              No conversations yet. Start a new chat to control TenderOS.
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = activeConversation?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => router.push(`/agent?conversationId=${conv.id}`)}
                  className={cn(
                    'w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-colors group',
                    isActive
                      ? 'bg-zinc-800 text-zinc-100 font-medium'
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  )}
                >
                  <span className="truncate pr-2">{conv.title || 'Untitled Session'}</span>
                  <span className="text-[10px] text-zinc-500 shrink-0 font-mono">
                    {new Date(conv.updated_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Chat Workspace */}
      <main className="flex-1 flex flex-col bg-zinc-950/80">
        {/* Header Bar */}
        <header className="flex h-14 items-center justify-between border-b border-zinc-800/80 px-6 bg-zinc-900/40">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/30">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-100">
                  {activeConversation?.title || 'TenderOS Autonomous Agent'}
                </span>
                <Badge
                  variant="outline"
                  className="border-violet-500/30 text-violet-400 bg-violet-500/10 text-[9px] py-0"
                >
                  Vertex AI (Gemini 2.5 Flash)
                </Badge>
              </div>
              <span className="text-[10px] text-zinc-400 block">
                Autonomous tool use enabled across tender scraping, qualification, and bid proposals
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleNewChat}
              className="md:hidden h-8 text-xs text-zinc-300"
            >
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
          </div>
        </header>

        {/* Message Trajectory Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 max-w-lg mx-auto">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/30 text-violet-400 shadow-inner">
                <Sparkles className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-zinc-100">
                  TenderOS Autonomous Control Center
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  I can search tenders, qualify opportunities, draft proposals, regenerate sections, inspect compliance vaults, and assemble master bid submission packets.
                </p>
              </div>

              {/* Quick Prompt Chips */}
              <div className="w-full space-y-2 pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 text-left">
                  Try asking:
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {suggestionPrompts.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(s)}
                      className="w-full text-left p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 transition-colors flex items-center justify-between group"
                    >
                      <span>{s}</span>
                      <ChevronRight className="h-3 w-3 text-zinc-500 group-hover:text-zinc-300 shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              const hasTools = msg.tool_calls && msg.tool_calls.length > 0;

              return (
                <div
                  key={msg.id || idx}
                  className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}
                >
                  <div
                    className={cn(
                      'max-w-3xl rounded-xl p-4 text-xs transition-all space-y-2',
                      isUser
                        ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                        : 'bg-zinc-900/80 text-zinc-200 border border-zinc-800/90 shadow-sm'
                    )}
                  >
                    {/* Tool Call Activity Trace (Visible Thinking Accordion) */}
                    {hasTools && (
                      <ToolActivityAccordion toolCalls={msg.tool_calls!} />
                    )}

                    {/* Markdown Body */}
                    {msg.content ? (
                      <div className="prose prose-invert prose-sm max-w-none prose-headings:text-zinc-100 prose-headings:font-bold prose-h1:text-base prose-h2:text-sm prose-h3:text-xs prose-p:text-xs prose-p:leading-relaxed prose-li:text-xs prose-table:text-xs prose-th:bg-zinc-950 prose-th:p-2 prose-td:p-2 prose-td:border-zinc-800">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : null}

                    {/* Message Footer / Copy */}
                    {!isUser && msg.content && (
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-200 dark:border-zinc-800/60 text-[10px] text-zinc-500">
                        <span>Google Vertex AI (Gemini 2.5 Flash)</span>
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.content, idx)}
                          className="hover:text-zinc-300 flex items-center gap-1 transition-colors"
                        >
                          {copiedIdx === idx ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Live Tool Execution Status Indicator */}
          {currentToolStatus && (
            <div className="flex items-center space-x-2 text-xs text-violet-400 bg-violet-950/30 border border-violet-500/30 px-3 py-2 rounded-lg max-w-md animate-pulse">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{currentToolStatus}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/40">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2 max-w-4xl mx-auto"
          >
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                rows={2}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask TenderOS... (e.g. 'Which tenders are closing this week?', 'Approve tender X and start the application', 'Draft financial proposal for application Y')"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 pr-10 text-xs text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={isGenerating || !inputPrompt.trim()}
              className="h-10 w-10 shrink-0 bg-violet-600 hover:bg-violet-500 text-white rounded-xl shadow-md"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}

/**
 * Collapsible Accordion component rendering the agent's visible thinking & tool execution traces.
 */
function ToolActivityAccordion({ toolCalls }: { toolCalls: ToolTraceItem[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-violet-500/20 bg-zinc-950/70 p-2 text-xs space-y-1.5">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left text-[11px] font-medium text-violet-300 hover:text-violet-200"
      >
        <span className="flex items-center gap-1.5">
          <Terminal className="h-3.5 w-3.5 text-violet-400" />
          Tool Activity ({toolCalls.length} action{toolCalls.length > 1 ? 's' : ''} executed)
        </span>
        {isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>

      {isExpanded && (
        <div className="pt-1.5 space-y-2 border-t border-zinc-800/80">
          {toolCalls.map((tc, idx) => (
            <div
              key={idx}
              className="rounded bg-zinc-900/80 border border-zinc-800 p-2 space-y-1 font-mono text-[10px]"
            >
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-violet-400 font-semibold">{tc.toolName}</span>
                {tc.result ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> success
                  </span>
                ) : (
                  <span className="text-amber-400">executing...</span>
                )}
              </div>

              {tc.input && Object.keys(tc.input).length > 0 && (
                <div className="text-zinc-500">
                  <span className="text-zinc-400">Input: </span>
                  {JSON.stringify(tc.input)}
                </div>
              )}

              {tc.result && (
                <div className="text-zinc-400 overflow-x-auto max-h-24">
                  <span className="text-zinc-500">Output: </span>
                  {typeof tc.result === 'object'
                    ? JSON.stringify(tc.result, null, 1)
                    : String(tc.result)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
