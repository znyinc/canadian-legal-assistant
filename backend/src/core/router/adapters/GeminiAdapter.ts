import { ModelAdapter, ModelProvider, ModelTier, LLMRequest, LLMResponse, TaskType } from '../ModelRoute.js';
import { providerSpecs } from '../RouterConfig.js';

export class GeminiAdapter implements ModelAdapter {
  readonly provider = ModelProvider.GEMINI;

  private readonly apiKey: string;
  private readonly spec = providerSpecs[ModelProvider.GEMINI];

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

    const systemInstruction = request.messages
      .filter(m => m.role === 'system')
      .map(m => m.content)
      .join('\n');

    const contents = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        // Gemini uses 'model' instead of 'assistant'
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: request.temperature ?? 0.2,
        maxOutputTokens: request.maxTokens ?? 4096,
        responseMimeType:
          request.responseFormat?.type === 'json_object' ? 'application/json' : 'text/plain',
      },
    };
    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const res = await fetch(`${baseUrl}/models/${model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);
    }

    const payload = await res.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };

    const content = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const promptTokens = payload.usageMetadata?.promptTokenCount;
    const completionTokens = payload.usageMetadata?.candidatesTokenCount;

    return {
      content,
      model,
      provider: ModelProvider.GEMINI,
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
