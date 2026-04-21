import { ModelAdapter, ModelProvider, ModelTier, LLMRequest, LLMResponse, TaskType } from '../ModelRoute.js';
import { providerSpecs } from '../RouterConfig.js';

export class LiteLLMAdapter implements ModelAdapter {
  readonly provider = ModelProvider.LITELLM;

  private readonly apiKey: string;
  private readonly enabled: boolean;
  private readonly spec = providerSpecs[ModelProvider.LITELLM];

  constructor(apiKey: string, enabled: boolean) {
    this.apiKey = apiKey;
    this.enabled = enabled;
  }

  async isAvailable(): Promise<boolean> {
    return this.enabled && Boolean(this.spec.baseUrl);
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const tier = selectTier(request.taskType);
    const model = this.spec.models[tier];
    const baseUrl = this.spec.baseUrl.replace(/\/$/, '');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    const body: Record<string, unknown> = {
      model,
      temperature: request.temperature ?? 0.2,
      messages: request.messages,
    };
    if (request.maxTokens !== undefined) body.max_tokens = request.maxTokens;
    if (request.responseFormat) body.response_format = request.responseFormat;

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`LiteLLM API error: ${res.status} ${res.statusText}`);
    }

    const payload = await res.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
      model?: string;
    };

    const content = payload.choices?.[0]?.message?.content ?? '';
    const promptTokens = payload.usage?.prompt_tokens;
    const completionTokens = payload.usage?.completion_tokens;

    return {
      content,
      model: payload.model ?? model,
      provider: ModelProvider.LITELLM,
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