import { ModelAdapter, ModelProvider, ModelTier, LLMRequest, LLMResponse, TaskType } from '../ModelRoute.js';
import { providerSpecs } from '../RouterConfig.js';

export class OpenAIAdapter implements ModelAdapter {
  readonly provider = ModelProvider.OPENAI;

  private readonly apiKey: string;
  private readonly spec = providerSpecs[ModelProvider.OPENAI];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey);
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const tier = selectTier(request.taskType);
    const model = this.spec.models[tier];
    const baseUrl = this.spec.baseUrl.replace(/\/$/, '');

    const body: Record<string, unknown> = {
      model,
      temperature: request.temperature ?? 0.2,
      messages: request.messages,
    };
    if (request.maxTokens !== undefined) body.max_tokens = request.maxTokens;
    if (request.responseFormat) body.response_format = request.responseFormat;

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`);
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
      provider: ModelProvider.OPENAI,
      promptTokens,
      completionTokens,
      costUsd: estimateCost(promptTokens, completionTokens, this.spec.costPer1kInput, this.spec.costPer1kOutput),
    };
  }
}

function selectTier(taskType: TaskType): ModelTier {
  return taskType === TaskType.CLASSIFICATION || taskType === TaskType.EVIDENCE_SUMMARY
    ? ModelTier.FAST
    : ModelTier.SMART;
}

function estimateCost(
  promptTokens: number | undefined,
  completionTokens: number | undefined,
  costIn: number,
  costOut: number,
): number {
  return ((promptTokens ?? 0) / 1000) * costIn + ((completionTokens ?? 0) / 1000) * costOut;
}
