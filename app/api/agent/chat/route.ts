import { NextRequest } from 'next/server';
import { runAgentConversation } from '@/lib/agents/orchestrator/agent-loop';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, message } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return new Response(JSON.stringify({ error: 'Message content is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Run agent asynchronously and stream SSE events
    (async () => {
      try {
        await runAgentConversation({
          conversationId,
          userPrompt: message.trim(),
          onEvent: (event) => {
            try {
              writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            } catch (wErr) {
              console.warn('SSE stream write error:', wErr);
            }
          },
        });
      } catch (err: any) {
        try {
          writer.write(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', message: err.message || 'Agent error' })}\n\n`
            )
          );
        } catch (_) {}
      } finally {
        try {
          await writer.close();
        } catch (_) {}
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Invalid request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
