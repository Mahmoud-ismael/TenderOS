export type TaskComplexity = 'cheap' | 'judgment';

export interface AiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiTaskOptions {
  taskType: TaskComplexity;
  prompt: string;
  systemPrompt?: string;
  messages?: AiMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
}

export interface AiTaskResult {
  text: string;
  model: string;
  provider: 'anthropic-vertex' | 'google-vertex';
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}
