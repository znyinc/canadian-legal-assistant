import { ModelAdapter, ModelProvider, ModelTier, LLMRequest, LLMResponse, TaskType } from '../ModelRoute.js';
import { providerSpecs } from '../RouterConfig.js';

export class ClaudeAdapter implements ModelAdapter {
  readonly provider = ModelProvider.CLAUDE;

  private readonly apiKey: string;
  private readonly spec = providerSpecs[ModelProvider.CLAUDE];

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

    // Claude requires system prompt as a top-level field, separate from messages
    const systemContent = request.messages
      .filter(m => m.role === 'system')
      .map(m => m.content)
      .join('\n');
    const messages = request.messages.filter(m => m.role !== 'system');

    const body: Record<string, unknown> = {
      model,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.2,
      messages,
    };
    if (systemContent) body.system = systemContent;

    const res = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Claude API error: ${res.status} ${res.statusText}`);
    }

    const payload = await res.json() as {
      content?: Array<{ type: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
      model?: string;
    };

    const content = payload.content?.find(b => b.type === 'text')?.text ?? '';
    const promptTokens = payload.usage?.input_tokens;
    const completionTokens = payload.usage?.output_tokens;

    return {
      content,
      model: payload.model ?? model,
      provider: ModelProvider.CLAUDE,
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
