/**
 * Provider specifications and fallback chain configuration.
 * All values are environment-overridable; defaults target free/low-cost tiers.
 */
import { FallbackEntry, LLMRequest, ModelLane, ModelProvider, ModelTier, TaskType } from './ModelRoute.js';

export interface ProviderSpec {
  baseUrl: string;
  models: Record<ModelTier, string>;
  contextWindow: number;
  costPer1kInput: number;
  costPer1kOutput: number;
}

export const providerSpecs: Record<ModelProvider, ProviderSpec> = {
  [ModelProvider.LITELLM]: {
    baseUrl: process.env.LITELLM_BASE_URL ?? 'http://localhost:4000',
    models: {
      [ModelTier.SMART]: process.env.LITELLM_SMART_MODEL ?? 'litellm-smart',
      [ModelTier.FAST]: process.env.LITELLM_FAST_MODEL ?? 'litellm-fast',
    },
    contextWindow: 200000,
    costPer1kInput: 0,
    costPer1kOutput: 0,
  },

  [ModelProvider.OPENAI]: {
    baseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
    models: {
      [ModelTier.SMART]: process.env.OPENAI_SMART_MODEL ?? 'gpt-4.1-mini',
      [ModelTier.FAST]: process.env.OPENAI_FAST_MODEL ?? 'gpt-4.1-nano',
    },
    contextWindow: 1047576,
    costPer1kInput: 0.0004,
    costPer1kOutput: 0.0016,
  },

  [ModelProvider.CLAUDE]: {
    baseUrl: process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com/v1',
    models: {
      [ModelTier.SMART]: process.env.CLAUDE_SMART_MODEL ?? 'claude-haiku-4-5',
      [ModelTier.FAST]: process.env.CLAUDE_FAST_MODEL ?? 'claude-haiku-4-5',
    },
    contextWindow: 200000,
    costPer1kInput: 0.0008,
    costPer1kOutput: 0.004,
  },

  [ModelProvider.GEMINI]: {
    baseUrl: process.env.GEMINI_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta',
    models: {
      [ModelTier.SMART]: process.env.GEMINI_SMART_MODEL ?? 'gemini-2.5-flash',
      [ModelTier.FAST]: process.env.GEMINI_FAST_MODEL ?? 'gemini-2.5-flash-lite',
    },
    contextWindow: 1048576,
    costPer1kInput: 0.0001,
    costPer1kOutput: 0.0004,
  },

  [ModelProvider.OLLAMA]: {
    baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
    models: {
      [ModelTier.SMART]: process.env.OLLAMA_SMART_MODEL ?? 'llama3:latest',
      [ModelTier.FAST]: process.env.OLLAMA_FAST_MODEL ?? 'llama3:latest',
    },
    contextWindow: 8192,
    costPer1kInput: 0,
    costPer1kOutput: 0,
  },
};

export interface RouterPolicy {
  lowConfidenceThreshold: number;
  highAmbiguityThreshold: number;
  highComplexityThreshold: number;
  fastLaneLatencyBudgetMs: number;
}

export const routerPolicy: RouterPolicy = {
  lowConfidenceThreshold: parseFloat(process.env.ROUTER_LOW_CONFIDENCE_THRESHOLD ?? '70'),
  highAmbiguityThreshold: parseFloat(process.env.ROUTER_HIGH_AMBIGUITY_THRESHOLD ?? '0.45'),
  highComplexityThreshold: parseFloat(process.env.ROUTER_HIGH_COMPLEXITY_THRESHOLD ?? '0.55'),
  fastLaneLatencyBudgetMs: parseInt(process.env.ROUTER_FAST_BUDGET_MS ?? '2500', 10),
};

export function refreshRouterRuntimeConfig(): void {
  providerSpecs[ModelProvider.LITELLM].baseUrl = process.env.LITELLM_BASE_URL ?? 'http://localhost:4000';
  providerSpecs[ModelProvider.LITELLM].models[ModelTier.SMART] = process.env.LITELLM_SMART_MODEL ?? 'litellm-smart';
  providerSpecs[ModelProvider.LITELLM].models[ModelTier.FAST] = process.env.LITELLM_FAST_MODEL ?? 'litellm-fast';

  providerSpecs[ModelProvider.OPENAI].baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';
  providerSpecs[ModelProvider.OPENAI].models[ModelTier.SMART] = process.env.OPENAI_SMART_MODEL ?? 'gpt-4.1-mini';
  providerSpecs[ModelProvider.OPENAI].models[ModelTier.FAST] = process.env.OPENAI_FAST_MODEL ?? 'gpt-4.1-nano';

  providerSpecs[ModelProvider.CLAUDE].baseUrl = process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com/v1';
  providerSpecs[ModelProvider.CLAUDE].models[ModelTier.SMART] = process.env.CLAUDE_SMART_MODEL ?? 'claude-haiku-4-5';
  providerSpecs[ModelProvider.CLAUDE].models[ModelTier.FAST] = process.env.CLAUDE_FAST_MODEL ?? 'claude-haiku-4-5';

  providerSpecs[ModelProvider.GEMINI].baseUrl = process.env.GEMINI_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta';
  providerSpecs[ModelProvider.GEMINI].models[ModelTier.SMART] = process.env.GEMINI_SMART_MODEL ?? 'gemini-2.5-flash';
  providerSpecs[ModelProvider.GEMINI].models[ModelTier.FAST] = process.env.GEMINI_FAST_MODEL ?? 'gemini-2.5-flash-lite';

  providerSpecs[ModelProvider.OLLAMA].baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
  providerSpecs[ModelProvider.OLLAMA].models[ModelTier.SMART] = process.env.OLLAMA_SMART_MODEL ?? 'llama3:latest';
  providerSpecs[ModelProvider.OLLAMA].models[ModelTier.FAST] = process.env.OLLAMA_FAST_MODEL ?? 'llama3:latest';

  routerPolicy.lowConfidenceThreshold = parseFloat(process.env.ROUTER_LOW_CONFIDENCE_THRESHOLD ?? '70');
  routerPolicy.highAmbiguityThreshold = parseFloat(process.env.ROUTER_HIGH_AMBIGUITY_THRESHOLD ?? '0.45');
  routerPolicy.highComplexityThreshold = parseFloat(process.env.ROUTER_HIGH_COMPLEXITY_THRESHOLD ?? '0.55');
  routerPolicy.fastLaneLatencyBudgetMs = parseInt(process.env.ROUTER_FAST_BUDGET_MS ?? '2500', 10);
}

export const laneChains: Record<ModelLane, FallbackEntry[]> = {
  'fast-extract': [
    { provider: ModelProvider.LITELLM, tier: ModelTier.FAST },
    { provider: ModelProvider.GEMINI, tier: ModelTier.FAST },
    { provider: ModelProvider.OPENAI, tier: ModelTier.FAST },
    { provider: ModelProvider.CLAUDE, tier: ModelTier.FAST },
    { provider: ModelProvider.OLLAMA, tier: ModelTier.FAST },
  ],
  'deep-reason': [
    { provider: ModelProvider.LITELLM, tier: ModelTier.SMART },
    { provider: ModelProvider.GEMINI, tier: ModelTier.SMART },
    { provider: ModelProvider.OPENAI, tier: ModelTier.SMART },
    { provider: ModelProvider.CLAUDE, tier: ModelTier.SMART },
    { provider: ModelProvider.OLLAMA, tier: ModelTier.SMART },
  ],
  'fallback-local': [
    { provider: ModelProvider.OLLAMA, tier: ModelTier.FAST },
    { provider: ModelProvider.OLLAMA, tier: ModelTier.SMART },
  ],
};

/**
 * Fallback chains per TaskType — tried in order until one succeeds.
 * Claude SMART first for quality-sensitive tasks; FAST providers for high-frequency tasks.
 */
/**
 * Fallback chains per TaskType — tried in order until one succeeds.
 * Cloud APIs first (cheapest to most expensive), Ollama last as local fallback.
 * Ollama's 32B model has slow cold-start (~80s) so it should not block fast paths.
 */
export const fallbackChains: Record<TaskType, FallbackEntry[]> = {
  [TaskType.PLAIN_LANGUAGE]: [
    { provider: ModelProvider.LITELLM, tier: ModelTier.FAST },
    { provider: ModelProvider.GEMINI, tier: ModelTier.FAST },
    { provider: ModelProvider.OPENAI, tier: ModelTier.FAST },
    { provider: ModelProvider.CLAUDE, tier: ModelTier.FAST },
    { provider: ModelProvider.OLLAMA, tier: ModelTier.FAST },
  ],

  [TaskType.CLASSIFICATION]: [
    { provider: ModelProvider.LITELLM, tier: ModelTier.FAST },
    { provider: ModelProvider.GEMINI, tier: ModelTier.FAST },
    { provider: ModelProvider.OPENAI, tier: ModelTier.FAST },
    { provider: ModelProvider.CLAUDE, tier: ModelTier.FAST },
    { provider: ModelProvider.OLLAMA, tier: ModelTier.FAST },
  ],

  [TaskType.DOCUMENT_DRAFT]: [
    { provider: ModelProvider.LITELLM, tier: ModelTier.SMART },
    { provider: ModelProvider.GEMINI, tier: ModelTier.SMART },
    { provider: ModelProvider.OPENAI, tier: ModelTier.SMART },
    { provider: ModelProvider.CLAUDE, tier: ModelTier.SMART },
    { provider: ModelProvider.OLLAMA, tier: ModelTier.SMART },
  ],

  [TaskType.EVIDENCE_SUMMARY]: [
    { provider: ModelProvider.LITELLM, tier: ModelTier.FAST },
    { provider: ModelProvider.GEMINI, tier: ModelTier.FAST },
    { provider: ModelProvider.OPENAI, tier: ModelTier.FAST },
    { provider: ModelProvider.CLAUDE, tier: ModelTier.FAST },
    { provider: ModelProvider.OLLAMA, tier: ModelTier.FAST },
  ],

  [TaskType.EMBEDDING]: [
    { provider: ModelProvider.OPENAI, tier: ModelTier.SMART },
  ],
};

export function selectRoutePlan(request: LLMRequest): {
  lane: ModelLane;
  chain: FallbackEntry[];
  decisionReason: string;
} {
  if (request.preferredLane) {
    return {
      lane: request.preferredLane,
      chain: laneChains[request.preferredLane],
      decisionReason: `Preferred lane '${request.preferredLane}' requested by caller.`,
    };
  }

  if (request.routeContext?.privacyMode === 'local-only') {
    return {
      lane: 'fallback-local',
      chain: laneChains['fallback-local'],
      decisionReason: 'Privacy mode requires local-only routing through Ollama.',
    };
  }

  switch (request.taskType) {
    case TaskType.DOCUMENT_DRAFT:
      return {
        lane: 'deep-reason',
        chain: laneChains['deep-reason'],
        decisionReason: 'Document drafting defaults to the deep-reason lane for higher output quality.',
      };

    case TaskType.CLASSIFICATION:
    case TaskType.EVIDENCE_SUMMARY:
      return {
        lane: 'fast-extract',
        chain: laneChains['fast-extract'],
        decisionReason: 'Classification and evidence summary stay on the fast-extract lane by default.',
      };

    case TaskType.PLAIN_LANGUAGE: {
      const confidence = request.routeContext?.confidence;
      const ambiguity = request.routeContext?.ambiguity;
      const complexityScore = request.routeContext?.complexityScore;
      const urgency = request.routeContext?.urgency;
      const latencyBudgetMs = request.routeContext?.latencyBudgetMs;

      if (typeof complexityScore === 'number' && complexityScore >= routerPolicy.highComplexityThreshold) {
        return {
          lane: 'deep-reason',
          chain: laneChains['deep-reason'],
          decisionReason: `Complexity ${complexityScore.toFixed(2)} exceeded threshold ${routerPolicy.highComplexityThreshold.toFixed(2)}.`,
        };
      }

      if (typeof ambiguity === 'number' && ambiguity >= routerPolicy.highAmbiguityThreshold) {
        return {
          lane: 'deep-reason',
          chain: laneChains['deep-reason'],
          decisionReason: `Ambiguity ${ambiguity.toFixed(2)} exceeded threshold ${routerPolicy.highAmbiguityThreshold.toFixed(2)}.`,
        };
      }

      if (typeof confidence === 'number' && confidence <= routerPolicy.lowConfidenceThreshold) {
        return {
          lane: 'deep-reason',
          chain: laneChains['deep-reason'],
          decisionReason: `Confidence ${confidence.toFixed(0)} fell below threshold ${routerPolicy.lowConfidenceThreshold}.`,
        };
      }

      if (urgency === 'high' && typeof latencyBudgetMs !== 'number') {
        return {
          lane: 'fast-extract',
          chain: laneChains['fast-extract'],
          decisionReason: 'Urgent plain-language request kept on fast-extract lane to minimize latency.',
        };
      }

      if (typeof latencyBudgetMs === 'number' && latencyBudgetMs <= routerPolicy.fastLaneLatencyBudgetMs) {
        return {
          lane: 'fast-extract',
          chain: laneChains['fast-extract'],
          decisionReason: `Latency budget ${latencyBudgetMs}ms favors the fast-extract lane.`,
        };
      }

      return {
        lane: 'fast-extract',
        chain: laneChains['fast-extract'],
        decisionReason: 'Plain-language request defaults to fast-extract and escalates only when signals demand it.',
      };
    }

    case TaskType.EMBEDDING:
    default:
      return {
        lane: 'deep-reason',
        chain: fallbackChains[request.taskType] ?? [],
        decisionReason: `Using configured default chain for task ${request.taskType}.`,
      };
  }
}
