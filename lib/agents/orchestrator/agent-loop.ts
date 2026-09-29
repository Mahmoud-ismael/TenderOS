import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getGoogleVertexClient } from '@/lib/ai/gemini';
import { AGENT_TOOLS, executeAgentTool } from './tools';

export interface AgentEvent {
  type: 'thinking' | 'tool_call' | 'tool_result' | 'text_delta' | 'done' | 'error';
  data?: any;
  message?: string;
  toolName?: string;
  input?: any;
  result?: any;
  text?: string;
}

export interface RunAgentParams {
  conversationId?: string;
  userPrompt: string;
  onEvent?: (event: AgentEvent) => void;
}

/**
 * Multi-turn autonomous agent loop with Google Cloud Vertex AI Gemini.
 * Handles tool-calling, tool feedback injection, conversation persistence, and live traces.
 */
export async function runAgentConversation(params: RunAgentParams): Promise<{
  conversationId: string;
  assistantMessageId: string;
  finalText: string;
  toolCallsTrace: any[];
}> {
  let supabase: any;
  try {
    supabase = await createClient();
  } catch {
    supabase = createAdminClient();
  }
  const { userPrompt, onEvent } = params;

  // 1. Resolve or Create Conversation
  let conversationId: string = params.conversationId || '';

  if (!conversationId) {
    const titleSnippet = userPrompt.length > 40 ? userPrompt.substring(0, 40) + '...' : userPrompt;
    let { data: conv, error: convErr } = await supabase
      .from('agent_conversations')
      .insert({ title: titleSnippet })
      .select('id')
      .single();

    if ((convErr || !conv) && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      supabase = createAdminClient();
      const res = await supabase
        .from('agent_conversations')
        .insert({ title: titleSnippet })
        .select('id')
        .single();
      conv = res.data;
      convErr = res.error;
    }

    if (convErr || !conv) throw new Error(`Failed to create agent conversation: ${convErr?.message || 'Unknown database error'}`);
    conversationId = conv.id;
  }

  // 2. Persist User Message
  await supabase.from('agent_messages').insert({
    conversation_id: conversationId,
    role: 'user',
    content: userPrompt,
  });

  // 3. Load Recent Conversation History (up to 14 prior messages)
  const { data: history } = await supabase
    .from('agent_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(14);

  // Format messages for Gemini
  const contents: any[] = [];
  if (history && history.length > 0) {
    for (const msg of history) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content || '' }],
        });
      }
    }
  } else {
    contents.push({ role: 'user', parts: [{ text: userPrompt }] });
  }

  const systemPrompt = `You are the TenderOS Principal AI Bid Copilot and System Controller for Hisako Tech Solutions Ltd.
Hisako is a registered Kenyan technology firm and certified AGPO Youth enterprise specializing in ICT services, web/app development, cloud architecture, and IT consulting.

Your Capabilities & Operating Rules:
1. CONTROL CENTER: You have real-time function-calling tools to query live tenders, run AI qualifications, inspect company credentials, draft and regenerate bid documents (technical & financial proposals, cover letters, forms of tender), assemble master submission packets, and mark applications as submitted.
2. GROUND TRUTH: Always use your tools to inspect actual database records before answering questions about active tenders, deadlines, compliance cert health, or application status.
3. ACTION ORIENTED: When the user asks you to take an action (e.g., "approve tender X", "draft technical proposal for application Y", "regenerate payment terms section"), execute the relevant tool immediately, report the exact outcome, and suggest the next logical step.
4. TONE & KNOWLEDGE: Authoritative, strategic, and deeply knowledgeable about the Kenyan Public Procurement and Asset Disposal Act (PPADA 2015), AGPO Youth affirmative procurement regulations, KRA compliance, and government bid formatting standards.`;

  const vertexAI = getGoogleVertexClient();
  const modelName = process.env.VERTEX_AI_MODEL || 'gemini-2.5-flash';

  const functionDeclarations = AGENT_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.input_schema,
  }));

  const generativeModel = vertexAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 4096,
    },
    systemInstruction: {
      role: 'system',
      parts: [{ text: systemPrompt }],
    },
    tools: [
      {
        functionDeclarations,
      },
    ],
  });

  const toolCallsTrace: any[] = [];
  let finalText = '';

  onEvent?.({ type: 'thinking', message: 'Analyzing request and inspecting tender database...' });

  const maxSteps = 6;
  let currentStep = 0;

  try {
    while (currentStep < maxSteps) {
      currentStep++;

      const result = await generativeModel.generateContent({
        contents,
      });

      const candidate = result.response.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      // Check if model returned function calls
      const functionCallParts = parts.filter((p) => p.functionCall);

      if (functionCallParts.length > 0) {
        // Append model response containing the function calls
        contents.push({
          role: 'model',
          parts,
        });

        const toolResponseParts: any[] = [];

        for (const p of functionCallParts) {
          const fc = p.functionCall!;
          onEvent?.({
            type: 'tool_call',
            toolName: fc.name,
            input: fc.args,
            data: { name: fc.name, input: fc.args },
          });

          // Execute tool
          const toolResult = await executeAgentTool(fc.name, fc.args);

          toolCallsTrace.push({
            toolName: fc.name,
            input: fc.args,
            result: toolResult,
            timestamp: new Date().toISOString(),
          });

          onEvent?.({
            type: 'tool_result',
            toolName: fc.name,
            result: toolResult,
            data: { name: fc.name, result: toolResult },
          });

          toolResponseParts.push({
            functionResponse: {
              name: fc.name,
              response: {
                output: toolResult,
              },
            },
          });
        }

        // Feed tool responses back to Gemini
        contents.push({
          role: 'user',
          parts: toolResponseParts,
        });

        continue;
      }

      // No function calls: extract final text response
      const text = parts
        .map((p) => p.text || '')
        .join('\n')
        .trim();

      finalText = text || 'Task completed successfully.';
      break;
    }

    if (!finalText && toolCallsTrace.length > 0) {
      finalText = 'Actions executed successfully. See tool activity trace above.';
    }

    // 4. Persist Assistant Message in Database with Tool Calls Trace
    const { data: assistantMsg } = await supabase
      .from('agent_messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: finalText,
        tool_calls: toolCallsTrace.length > 0 ? (toolCallsTrace as any) : null,
      })
      .select('id')
      .single();

    // Update conversation timestamp
    await supabase
      .from('agent_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    onEvent?.({
      type: 'done',
      data: {
        conversationId,
        assistantMessageId: assistantMsg?.id || 'new-msg',
        finalText,
        toolCallsTrace,
      },
    });

    return {
      conversationId,
      assistantMessageId: assistantMsg?.id || 'new-msg',
      finalText,
      toolCallsTrace,
    };
  } catch (error: any) {
    console.error('Agent loop execution error:', error);
    onEvent?.({ type: 'error', message: error.message || 'Agent loop encountered an error.' });

    // Fallback save error message
    const errorText = `I encountered an issue executing this request: ${error.message || 'Internal agent error'}. Please verify your parameters or try again.`;
    const { data: assistantMsg } = await supabase
      .from('agent_messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: errorText,
        tool_calls: toolCallsTrace.length > 0 ? (toolCallsTrace as any) : null,
      })
      .select('id')
      .single();

    return {
      conversationId,
      assistantMessageId: assistantMsg?.id || 'err-msg',
      finalText: errorText,
      toolCallsTrace,
    };
  }
}
