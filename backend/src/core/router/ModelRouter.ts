import {
  FallbackEntry,
  LLMRequest,
  LLMResponse,
  ModelAdapter,
  ModelProvider,
  TaskType,
} from './ModelRoute.js';
import { fallbackChains, providerSpecs } from './RouterConfig.js';
import { OpenAIAdapter } from './adapters/OpenAIAdapter.js';
import { ClaudeAdapter } from './adapters/ClaudeAdapter.js';
import { GeminiAdapter } from './adapters/GeminiAdapter.js';
import { OllamaAdapter } from './adapters/OllamaAdapter.js';
import { EmbeddingAdapter, EmbeddingRequest, EmbeddingResult } from './adapters/EmbeddingAdapter.js';

export { TaskType } from './ModelRoute.js';
export { EmbeddingRequest, EmbeddingResult };

interface RouterOptions {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  geminiApiKey?: string;
  ollamaBaseUrl?: string;
}

export class ModelRouter {
  private readonly adapters = new Map<ModelProvider, ModelAdapter>();
  private readonly embeddingAdapter: EmbeddingAdapter;

  constructor(options: RouterOptions = {}) {
    const openaiKey = options.openaiApiKey ?? process.env.OPENAI_API_KEY ?? '';
    const anthropicKey = options.anthropicApiKey ?? process.env.ANTHROPIC_API_KEY ?? '';
    const geminiKey = options.geminiApiKey ?? process.env.GEMINI_API_KEY ?? '';

    if (options.ollamaBaseUrl) {
      providerSpecs[ModelProvider.OLLAMA].baseUrl = options.ollamaBaseUrl;
    }

    this.adapters.set(ModelProvider.OPENAI, new OpenAIAdapter(openaiKey));
    this.adapters.set(ModelProvider.CLAUDE, new ClaudeAdapter(anthropicKey));
    this.adapters.set(ModelProvider.GEMINI, new GeminiAdapter(geminiKey));
    this.adapters.set(ModelProvider.OLLAMA, new OllamaAdapter());

    this.embeddingAdapter = new EmbeddingAdapter(openaiKey);
  }

  /**
   * Route an LLM request through the configured fallback chain for its TaskType.
   * Tries each provider in order; skips unavailable ones and catches errors to try the next.
   * Throws if all providers fail.
   */
  async route(request: LLMRequest): Promise<LLMResponse> {
    const chain: FallbackEntry[] = fallbackChains[request.taskType] ?? [];
    if (chain.length === 0) {
      throw new Error(`No fallback chain configured for TaskType ${TaskType[request.taskType]}`);
    }

    const errors: Array<{ provider: string; error: string }> = [];

    for (const entry of chain) {
      const adapter = this.adapters.get(entry.provider);
      if (!adapter) continue;

      const available = await adapter.isAvailable();
      if (!available) {
        errors.push({ provider: ModelProvider[entry.provider], error: 'adapter not available (missing key)' });
        continue;
      }

      try {
        return await adapter.complete(request);
      } catch (err) {
        errors.push({
          provider: ModelProvider[entry.provider],
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const summary = errors.map(e => `${e.provider}: ${e.error}`).join('; ');
    throw new Error(
      `All providers failed for task ${TaskType[request.taskType]}. Errors: ${summary}`,
    );
  }

  getEmbeddingAdapter(): EmbeddingAdapter {
    return this.embeddingAdapter;
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResult> {
    return this.embeddingAdapter.embed(request);
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
