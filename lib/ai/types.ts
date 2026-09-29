export type TaskComplexity = 'cheap' | 'judgment';

export interface AiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiTaskOptions {
  taskType?: TaskComplexity;
  prompt?: string;
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

export interface ExtractedDocumentMetadata {
  docType?: string | null;
  certificateNumber?: string | null;
  issueDate?: string | null; // YYYY-MM-DD
  expiryDate?: string | null; // YYYY-MM-DD
  issuingAuthority?: string | null;
  entityName?: string | null;
  notes?: string | null;
  confidence: 'high' | 'medium' | 'low';
}
