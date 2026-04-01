import { ModelProvider } from '../ModelRoute.js';
import { providerSpecs } from '../RouterConfig.js';

export interface EmbeddingRequest {
  input: string | string[];
  model?: string;
}

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  provider: ModelProvider;
  promptTokens?: number;
  costUsd?: number;
}

/**
 * Dedicated adapter for OpenAI-compatible embedding endpoints.
 * text-embedding-3-small is the default; override via model field.
 */
export class EmbeddingAdapter {
  readonly provider = ModelProvider.OPENAI;

  private readonly apiKey: string;
  private readonly spec = providerSpecs[ModelProvider.OPENAI];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey);
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResult> {
    const model = request.model ?? 'text-embedding-3-small';
    const baseUrl = this.spec.baseUrl.replace(/\/$/, '');

    const res = await fetch(`${baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model, input: request.input }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI Embeddings API error: ${res.status} ${res.statusText}`);
    }

    const payload = await res.json() as {
      data?: Array<{ embedding?: number[] }>;
      usage?: { prompt_tokens?: number };
      model?: string;
    };

    const embedding = payload.data?.[0]?.embedding ?? [];
    const promptTokens = payload.usage?.prompt_tokens;
    // text-embedding-3-small: $0.10 per 1M tokens → $0.0001 per 1k
    const costUsd = promptTokens ? (promptTokens / 1000) * 0.0001 : 0;

    return {
      embedding,
      model: payload.model ?? model,
      provider: ModelProvider.OPENAI,
      promptTokens,
      costUsd,
    };
  }
}
