import { callClaudeVertex } from './claude';
import { callGeminiVertex } from './gemini';
import type { AiTaskOptions, AiTaskResult } from './types';

/**
 * Intelligent Model Router for TenderOS:
 * Uses Google Cloud Vertex AI (Gemini 2.5 Flash / Gemini Pro) with full multi-turn and tool execution support.
 */
export async function executeAiTask(
  options: AiTaskOptions
): Promise<AiTaskResult> {
  const { taskType } = options;

  try {
    if (taskType === 'judgment' && process.env.ENABLE_CLAUDE_VERTEX === 'true') {
      try {
        return await callClaudeVertex(options);
      } catch (claudeErr) {
        console.warn('Claude on Vertex AI unavailable; falling back to Gemini Flash:', claudeErr);
        return await callGeminiVertex(options);
      }
    }

    return await callGeminiVertex(options);
  } catch (err) {
    return await callGeminiVertex(options);
  }
}
