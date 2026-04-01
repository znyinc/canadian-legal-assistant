/**
 * Provider specifications and fallback chain configuration.
 * All values are environment-overridable; defaults target free/low-cost tiers.
 */
import { ModelProvider, ModelTier, TaskType, FallbackEntry } from './ModelRoute.js';

export interface ProviderSpec {
  baseUrl: string;
  models: Record<ModelTier, string>;
  contextWindow: number;
  costPer1kInput: number;
  costPer1kOutput: number;
}

export const providerSpecs: Record<ModelProvider, ProviderSpec> = {
  [ModelProvider.OPENAI]: {
    baseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
    models: {
      [ModelTier.SMART]: process.env.OPENAI_SMART_MODEL ?? 'gpt-4o',
      [ModelTier.FAST]: process.env.OPENAI_FAST_MODEL ?? 'gpt-4o-mini',
    },
    contextWindow: 128000,
    costPer1kInput: 0.0025,
    costPer1kOutput: 0.01,
  },

  [ModelProvider.CLAUDE]: {
    baseUrl: process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com/v1',
    models: {
      [ModelTier.SMART]: process.env.CLAUDE_SMART_MODEL ?? 'claude-opus-4-5',
      [ModelTier.FAST]: process.env.CLAUDE_FAST_MODEL ?? 'claude-haiku-4-5',
    },
    contextWindow: 200000,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
  },

  [ModelProvider.GEMINI]: {
    baseUrl: process.env.GEMINI_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta',
    models: {
      [ModelTier.SMART]: process.env.GEMINI_SMART_MODEL ?? 'gemini-1.5-pro',
      [ModelTier.FAST]: process.env.GEMINI_FAST_MODEL ?? 'gemini-1.5-flash',
    },
    contextWindow: 1048576,
    costPer1kInput: 0.00125,
    costPer1kOutput: 0.005,
  },

  [ModelProvider.OLLAMA]: {
    baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
    models: {
      [ModelTier.SMART]: process.env.OLLAMA_SMART_MODEL ?? 'llama3.1:70b',
      [ModelTier.FAST]: process.env.OLLAMA_FAST_MODEL ?? 'llama3.1:8b',
    },
    contextWindow: 8192,
    costPer1kInput: 0,
    costPer1kOutput: 0,
  },
};

/**
 * Fallback chains per TaskType — tried in order until one succeeds.
 * Claude SMART first for quality-sensitive tasks; FAST providers for high-frequency tasks.
 */
export const fallbackChains: Record<TaskType, FallbackEntry[]> = {
  [TaskType.PLAIN_LANGUAGE]: [
    { provider: ModelProvider.CLAUDE, tier: ModelTier.SMART },
    { provider: ModelProvider.OPENAI, tier: ModelTier.SMART },
    { provider: ModelProvider.GEMINI, tier: ModelTier.SMART },
    { provider: ModelProvider.OLLAMA, tier: ModelTier.FAST },
  ],

  [TaskType.CLASSIFICATION]: [
    { provider: ModelProvider.OPENAI, tier: ModelTier.FAST },
    { provider: ModelProvider.CLAUDE, tier: ModelTier.FAST },
    { provider: ModelProvider.GEMINI, tier: ModelTier.FAST },
    { provider: ModelProvider.OLLAMA, tier: ModelTier.FAST },
  ],

  [TaskType.DOCUMENT_DRAFT]: [
    { provider: ModelProvider.CLAUDE, tier: ModelTier.SMART },
    { provider: ModelProvider.OPENAI, tier: ModelTier.SMART },
    { provider: ModelProvider.GEMINI, tier: ModelTier.SMART },
    { provider: ModelProvider.OLLAMA, tier: ModelTier.FAST },
  ],

  [TaskType.EVIDENCE_SUMMARY]: [
    { provider: ModelProvider.OPENAI, tier: ModelTier.FAST },
    { provider: ModelProvider.CLAUDE, tier: ModelTier.FAST },
    { provider: ModelProvider.GEMINI, tier: ModelTier.FAST },
    { provider: ModelProvider.OLLAMA, tier: ModelTier.FAST },
  ],

  [TaskType.EMBEDDING]: [
    { provider: ModelProvider.OPENAI, tier: ModelTier.SMART },
  ],
};
