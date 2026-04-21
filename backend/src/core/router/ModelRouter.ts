import {
  FallbackEntry,
  LLMRequest,
  LLMResponse,
  ModelAdapter,
  ModelProvider,
  RouteDecision,
  TaskType,
} from './ModelRoute.js';
import { fallbackChains, providerSpecs, selectRoutePlan } from './RouterConfig.js';
import { OpenAIAdapter } from './adapters/OpenAIAdapter.js';
import { ClaudeAdapter } from './adapters/ClaudeAdapter.js';
import { GeminiAdapter } from './adapters/GeminiAdapter.js';
import { OllamaAdapter } from './adapters/OllamaAdapter.js';
import { LiteLLMAdapter } from './adapters/LiteLLMAdapter.js';
import { EmbeddingAdapter } from './adapters/EmbeddingAdapter.js';
import type { EmbeddingRequest, EmbeddingResult } from './adapters/EmbeddingAdapter.js';

export { TaskType } from './ModelRoute.js';
export type { EmbeddingRequest, EmbeddingResult };

interface ProviderTelemetry {
  successes: number;
  failures: number;
  unavailable: number;
  consecutiveFailures: number;
  lastError?: string;
  lastLatencyMs?: number;
  emaLatencyMs?: number;
  lastSuccessAt?: string;
  lastFailureAt?: string;
}

export interface ProviderTelemetrySnapshot {
  provider: ModelProvider;
  successes: number;
  failures: number;
  unavailable: number;
  consecutiveFailures: number;
  lastError?: string;
  lastLatencyMs?: number;
  emaLatencyMs?: number;
  lastSuccessAt?: string;
  lastFailureAt?: string;
}

export interface ProviderBenchmarkResult {
  provider: ModelProvider;
  status: 'ok' | 'unavailable' | 'error';
  latencyMs?: number;
  model?: string;
  error?: string;
}

interface RouterOptions {
  liteLlmApiKey?: string;
  liteLlmBaseUrl?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  geminiApiKey?: string;
  ollamaBaseUrl?: string;
}

export class ModelRouter {
  private readonly adapters = new Map<ModelProvider, ModelAdapter>();
  private readonly embeddingAdapter: EmbeddingAdapter;
  private readonly telemetry = new Map<ModelProvider, ProviderTelemetry>();

  constructor(options: RouterOptions = {}) {
    const liteLlmKey = options.liteLlmApiKey ?? process.env.LITELLM_API_KEY ?? '';
    const liteLlmConfigured = Boolean(options.liteLlmBaseUrl ?? process.env.LITELLM_BASE_URL);
    const openaiKey = options.openaiApiKey ?? process.env.OPENAI_API_KEY ?? '';
    const anthropicKey = options.anthropicApiKey ?? process.env.ANTHROPIC_API_KEY ?? '';
    const geminiKey = options.geminiApiKey ?? process.env.GEMINI_API_KEY ?? '';

    if (options.liteLlmBaseUrl) {
      providerSpecs[ModelProvider.LITELLM].baseUrl = options.liteLlmBaseUrl;
    }

    if (options.ollamaBaseUrl) {
      providerSpecs[ModelProvider.OLLAMA].baseUrl = options.ollamaBaseUrl;
    }

    this.adapters.set(ModelProvider.LITELLM, new LiteLLMAdapter(liteLlmKey, liteLlmConfigured));
    this.adapters.set(ModelProvider.OPENAI, new OpenAIAdapter(openaiKey));
    this.adapters.set(ModelProvider.CLAUDE, new ClaudeAdapter(anthropicKey));
    this.adapters.set(ModelProvider.GEMINI, new GeminiAdapter(geminiKey));
    this.adapters.set(ModelProvider.OLLAMA, new OllamaAdapter());

    for (const provider of Object.values(ModelProvider)) {
      this.telemetry.set(provider, {
        successes: 0,
        failures: 0,
        unavailable: 0,
        consecutiveFailures: 0,
      });
    }

    this.embeddingAdapter = new EmbeddingAdapter(openaiKey);
  }

  /**
   * Route an LLM request through the configured fallback chain for its TaskType.
   * Tries each provider in order; skips unavailable ones and catches errors to try the next.
   * Throws if all providers fail.
   */
  async route(request: LLMRequest): Promise<LLMResponse> {
    const routePlan = selectRoutePlan(request);
    const initialChain: FallbackEntry[] = routePlan.chain.length > 0
      ? routePlan.chain
      : (fallbackChains[request.taskType] ?? []);
    const chain = this.sortChainByHealth(initialChain, request);
    if (chain.length === 0) {
      throw new Error(`No fallback chain configured for TaskType ${request.taskType}`);
    }

    const errors: Array<{ provider: string; error: string }> = [];

    for (const entry of chain) {
      const adapter = this.adapters.get(entry.provider);
      if (!adapter) continue;

      const available = await adapter.isAvailable();
      if (!available) {
        errors.push({ provider: entry.provider, error: 'adapter not available (missing key)' });
        this.recordUnavailable(entry.provider, 'adapter not available (missing key)');
        continue;
      }

      const startedAt = Date.now();
      try {
        const response = await adapter.complete(request);
        this.recordSuccess(entry.provider, Date.now() - startedAt);
        const routeDecision: RouteDecision = {
          lane: routePlan.lane,
          provider: response.provider,
          model: response.model,
          decisionReason: routePlan.decisionReason,
          fallbackCause: errors.length > 0
            ? errors.map((entryError) => `${entryError.provider}: ${entryError.error}`).join('; ')
            : undefined,
        };

        return {
          ...response,
          routeDecision,
        };
      } catch (err) {
        this.recordFailure(entry.provider, err, Date.now() - startedAt);
        errors.push({
          provider: entry.provider,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const summary = errors.map(e => `${e.provider}: ${e.error}`).join('; ');
    throw new Error(
      `All providers failed for task ${request.taskType}. Errors: ${summary}`,
    );
  }

  getEmbeddingAdapter(): EmbeddingAdapter {
    return this.embeddingAdapter;
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResult> {
    return this.embeddingAdapter.embed(request);
  }

  getProviderTelemetry(): ProviderTelemetrySnapshot[] {
    return Object.values(ModelProvider).map((provider) => {
      const item = this.telemetry.get(provider) ?? {
        successes: 0,
        failures: 0,
        unavailable: 0,
        consecutiveFailures: 0,
      };

      return {
        provider,
        ...item,
      };
    });
  }

  async benchmarkProviders(request: LLMRequest, providers: ModelProvider[] = Object.values(ModelProvider)): Promise<ProviderBenchmarkResult[]> {
    const results: ProviderBenchmarkResult[] = [];

    for (const provider of providers) {
      const adapter = this.adapters.get(provider);
      if (!adapter) {
        results.push({ provider, status: 'unavailable', error: 'adapter missing' });
        continue;
      }

      const available = await adapter.isAvailable();
      if (!available) {
        this.recordUnavailable(provider, 'adapter not available (missing key)');
        results.push({ provider, status: 'unavailable', error: 'adapter not available (missing key)' });
        continue;
      }

      const startedAt = Date.now();
      try {
        const response = await adapter.complete(request);
        const latencyMs = Date.now() - startedAt;
        this.recordSuccess(provider, latencyMs);
        results.push({
          provider,
          status: 'ok',
          latencyMs,
          model: response.model,
        });
      } catch (error) {
        const latencyMs = Date.now() - startedAt;
        this.recordFailure(provider, error, latencyMs);
        results.push({
          provider,
          status: 'error',
          latencyMs,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  private sortChainByHealth(chain: FallbackEntry[], request: LLMRequest): FallbackEntry[] {
    const shouldOptimizeLatency =
      request.routeContext?.urgency === 'high' ||
      (typeof request.routeContext?.latencyBudgetMs === 'number' && request.routeContext.latencyBudgetMs <= 2500);

    if (!shouldOptimizeLatency) {
      return chain;
    }

    return chain
      .map((entry, index) => ({ entry, index }))
      .sort((left, right) => {
        const leftScore = this.computeProviderScore(left.entry.provider, left.index);
        const rightScore = this.computeProviderScore(right.entry.provider, right.index);
        return leftScore - rightScore;
      })
      .map((item) => item.entry);
  }

  private computeProviderScore(provider: ModelProvider, fallbackIndex: number): number {
    const telemetry = this.telemetry.get(provider);
    if (!telemetry) {
      return fallbackIndex;
    }

    const latencyPenalty = (telemetry.emaLatencyMs ?? telemetry.lastLatencyMs ?? 0) / 1000;
    const failurePenalty = telemetry.consecutiveFailures * 5;
    return fallbackIndex + latencyPenalty + failurePenalty;
  }

  private recordSuccess(provider: ModelProvider, latencyMs: number): void {
    const current = this.telemetry.get(provider);
    if (!current) return;

    current.successes += 1;
    current.consecutiveFailures = 0;
    current.lastLatencyMs = latencyMs;
    current.lastSuccessAt = new Date().toISOString();
    current.emaLatencyMs = typeof current.emaLatencyMs === 'number'
      ? (current.emaLatencyMs * 0.8) + (latencyMs * 0.2)
      : latencyMs;
    this.telemetry.set(provider, current);
  }

  private recordFailure(provider: ModelProvider, error: unknown, latencyMs?: number): void {
    const current = this.telemetry.get(provider);
    if (!current) return;

    current.failures += 1;
    current.consecutiveFailures += 1;
    current.lastFailureAt = new Date().toISOString();
    current.lastError = error instanceof Error ? error.message : String(error);
    if (typeof latencyMs === 'number') {
      current.lastLatencyMs = latencyMs;
      current.emaLatencyMs = typeof current.emaLatencyMs === 'number'
        ? (current.emaLatencyMs * 0.8) + (latencyMs * 0.2)
        : latencyMs;
    }
    this.telemetry.set(provider, current);
  }

  private recordUnavailable(provider: ModelProvider, reason: string): void {
    const current = this.telemetry.get(provider);
    if (!current) return;

    current.unavailable += 1;
    current.lastFailureAt = new Date().toISOString();
    current.lastError = reason;
    this.telemetry.set(provider, current);
  }
}

let _instance: ModelRouter | null = null;

/**
 * Get or create the process-wide ModelRouter singleton.
 * Reads API keys from environment automatically.
 */
export function getModelRouter(): ModelRouter {
  if (!_instance) {
    _instance = new ModelRouter();
  }
  return _instance;
}

/** Reset singleton (for tests only) */
export function _resetModelRouter(): void {
  _instance = null;
}
