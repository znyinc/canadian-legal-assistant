/**
 * Core types for the provider-agnostic model routing layer.
 * All LLM calls in the backend flow through ModelRouter using these interfaces.
 */

export enum TaskType {
  PLAIN_LANGUAGE = 'plain_language',
  CLASSIFICATION = 'classification',
  DOCUMENT_DRAFT = 'document_draft',
  EVIDENCE_SUMMARY = 'evidence_summary',
  EMBEDDING = 'embedding',
}

export enum ModelProvider {
  OPENAI = 'openai',
  CLAUDE = 'claude',
  GEMINI = 'gemini',
  OLLAMA = 'ollama',
}

export enum ModelTier {
  SMART = 'smart',
  FAST = 'fast',
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  taskType: TaskType;
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: 'json_object' | 'text' };
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: ModelProvider;
  promptTokens?: number;
  completionTokens?: number;
  costUsd?: number;
}

export interface ModelAdapter {
  readonly provider: ModelProvider;
  isAvailable(): Promise<boolean>;
  complete(request: LLMRequest): Promise<LLMResponse>;
}

export interface FallbackEntry {
  provider: ModelProvider;
  tier: ModelTier;
}
