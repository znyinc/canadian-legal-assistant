type Candidate = {
  name: string;
  url: string;
  description: string;
  primary?: boolean;
  category?: string;
};

export type SemanticSearchStatus = 'disabled' | 'ok' | 'unavailable' | 'error';

export interface SemanticSearchConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  embeddingModel: string;
  minScore: number;
}

export interface SemanticSearchHit extends Candidate {
  semanticScore: number;
  semanticSource: 'litellm-embedding';
}

export interface SemanticSearchResult {
  status: SemanticSearchStatus;
  enabled: boolean;
  source: 'litellm';
  model?: string;
  message?: string;
  hits: SemanticSearchHit[];
}

interface EmbeddingPayload {
  data?: Array<{ embedding?: number[]; index?: number }>;
  model?: string;
  error?: unknown;
}

export class SemanticLegalSearchService {
  constructor(private readonly config: SemanticSearchConfig) {}

  async rank(query: string, candidates: Candidate[]): Promise<SemanticSearchResult> {
    if (!this.config.enabled) {
      return this.status('disabled', 'Semantic search is disabled. Set SEMANTIC_SEARCH_ENABLED=true to use LiteLLM embeddings.');
    }

    if (!this.config.baseUrl.trim()) {
      return this.status('unavailable', 'Semantic search base URL is not configured.');
    }

    const uniqueCandidates = this.dedupeCandidates(candidates);
    if (uniqueCandidates.length === 0) {
      return this.status('ok', 'No candidate resources were available to rank.', []);
    }

    try {
      const inputs = [query, ...uniqueCandidates.map((candidate) => this.candidateText(candidate))];
      const payload = await this.fetchEmbeddings(inputs);
      const embeddings = payload.data ?? [];
      const queryEmbedding = embeddings[0]?.embedding ?? [];

      if (queryEmbedding.length === 0) {
        return this.status('unavailable', 'Embedding provider returned an empty query vector.');
      }

      const hits = uniqueCandidates
        .map((candidate, index) => {
          const candidateEmbedding = embeddings[index + 1]?.embedding ?? [];
          const score = cosineSimilarity(queryEmbedding, candidateEmbedding);

          return {
            ...candidate,
            semanticScore: roundScore(score),
            semanticSource: 'litellm-embedding' as const,
          };
        })
        .filter((hit) => hit.semanticScore >= this.config.minScore)
        .sort((left, right) => right.semanticScore - left.semanticScore)
        .slice(0, 8);

      return {
        status: 'ok',
        enabled: true,
        source: 'litellm',
        model: payload.model ?? this.config.embeddingModel,
        hits,
      };
    } catch (error) {
      return this.status(
        'error',
        error instanceof Error ? error.message : 'Semantic search failed.',
      );
    }
  }

  private async fetchEmbeddings(input: string[]): Promise<EmbeddingPayload> {
    const baseUrl = this.config.baseUrl.replace(/\/$/, '');
    const endpoints = baseUrl.endsWith('/v1')
      ? [`${baseUrl}/embeddings`]
      : [`${baseUrl}/embeddings`, `${baseUrl}/v1/embeddings`];
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers.Authorization = `Bearer ${this.config.apiKey}`;
    }

    let lastError = '';

    for (const endpoint of endpoints) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.config.embeddingModel,
          input,
        }),
      });

      if (!response.ok) {
        lastError = `LiteLLM embeddings API error: ${response.status} ${response.statusText}`;
        if (response.status === 404 && endpoint === endpoints[0] && endpoints.length > 1) {
          continue;
        }
        throw new Error(lastError);
      }

      const payload = await response.json() as EmbeddingPayload;
      if (payload.error) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'LiteLLM embeddings API returned an error.');
      }

      return payload;
    }

    throw new Error(lastError || 'LiteLLM embeddings API request failed.');
  }

  private candidateText(candidate: Candidate): string {
    return [
      candidate.name,
      candidate.description,
      candidate.category,
      candidate.primary ? 'primary official legal research source' : undefined,
    ].filter(Boolean).join('. ');
  }

  private dedupeCandidates(candidates: Candidate[]): Candidate[] {
    const seen = new Set<string>();

    return candidates.filter((candidate) => {
      const key = `${candidate.name}|${candidate.url}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private status(
    status: SemanticSearchStatus,
    message: string,
    hits: SemanticSearchHit[] = [],
  ): SemanticSearchResult {
    return {
      status,
      enabled: this.config.enabled,
      source: 'litellm',
      model: this.config.embeddingModel,
      message,
      hits,
    };
  }
}

function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length === 0 || right.length === 0 || left.length !== right.length) {
    return 0;
  }

  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

function roundScore(score: number): number {
  return Math.round(score * 1000) / 1000;
}
