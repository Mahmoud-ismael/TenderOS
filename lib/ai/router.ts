import { callClaudeVertex } from './claude';
import { callGeminiVertex } from './gemini';
import type { AiTaskOptions, AiTaskResult } from './types';

/**
 * Intelligent Model Router for TenderOS:
 * - Cheap tier (Gemini Flash on Vertex AI): metadata extraction, document parsing, checklist item verification.
 * - Judgment tier (Claude Sonnet on Vertex AI): tender qualification analysis, proposal drafting, evaluation scoring.
 */
export async function executeAiTask(
  options: AiTaskOptions
): Promise<AiTaskResult> {
  const { taskType } = options;

  switch (taskType) {
    case 'judgment':
      return await callClaudeVertex(options);

    case 'cheap':
    default:
      return await callGeminiVertex(options);
  }
}
