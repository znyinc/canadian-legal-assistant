import { ModelAdapter, ModelProvider, ModelTier, LLMRequest, LLMResponse, TaskType } from '../ModelRoute.js';
import { providerSpecs } from '../RouterConfig.js';

export class OllamaAdapter implements ModelAdapter {
  readonly provider = ModelProvider.OLLAMA;

  private readonly spec = providerSpecs[ModelProvider.OLLAMA];

  /**
   * Ollama is available if its REST API responds on the configured base URL.
   * Uses a 2-second timeout to avoid stalling the fallback chain.
   */
  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.spec.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(2000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const tier = selectTier(request.taskType);
    const model = this.spec.models[tier];
    const baseUrl = this.spec.baseUrl.replace(/\/$/, '');

    const body: Record<string, unknown> = {
      model,
      messages: request.messages,
      stream: false,
      options: {
        temperature: request.temperature ?? 0.2,
        num_predict: request.maxTokens ?? 4096,
      },
    };
    if (request.responseFormat?.type === 'json_object') {
      body.format = 'json';
    }

    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Ollama API error: ${res.status} ${res.statusText}`);
    }

    const payload = await res.json() as {
      message?: { content?: string };
      prompt_eval_count?: number;
      eval_count?: number;
    };

    const content = payload.message?.content ?? '';
    const promptTokens = payload.prompt_eval_count;
    const completionTokens = payload.eval_count;

    return {
      content,
      model,
      provider: ModelProvider.OLLAMA,
      promptTokens,
      completionTokens,
      costUsd: 0,
    };
  }
}

function selectTier(taskType: TaskType): ModelTier {
  return taskType === TaskType.CLASSIFICATION || taskType === TaskType.EVIDENCE_SUMMARY
    ? ModelTier.FAST
    : ModelTier.SMART;
}
