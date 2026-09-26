import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles } from 'lucide-react';

export default function AgentPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            TenderOS AI Agent
          </h1>
          <Badge variant="outline" className="border-violet-500/30 text-violet-400 bg-violet-500/10">
            Vertex AI Orchestrator
          </Badge>
        </div>
        <p className="text-sm text-zinc-400">
          Autonomous copilot for tender analysis, requirements cross-referencing, and proposal drafting.
        </p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/40">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-violet-400" />
            <CardTitle className="text-base text-zinc-200">Interactive Chat & Task Execution</CardTitle>
          </div>
          <CardDescription className="text-zinc-500">
            Routed between Claude 3.5 Sonnet (judgment-heavy) and Gemini Flash (cheap operations) on Vertex AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 text-center text-xs text-zinc-500 space-y-2">
            <Sparkles className="h-6 w-6 text-violet-400/60" />
            <span>Agent conversation interface and tool execution will connect here.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
