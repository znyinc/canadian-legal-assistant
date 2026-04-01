import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ModelRouter, getModelRouter, _resetModelRouter, TaskType } from '../backend/src/core/router/ModelRouter';
import { ModelProvider } from '../backend/src/core/router/ModelRoute';
import { fallbackChains } from '../backend/src/core/router/RouterConfig';

/** Minimal OpenAI-shaped response stub */
function openAiStub(content: string, model = 'gpt-4o-mini') {
  return {
    ok: true,
    statusText: 'OK',
    json: async () => ({
      choices: [{ message: { content } }],
      model,
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    }),
  };
}

/** Minimal Claude-shaped response stub */
function claudeStub(content: string, model = 'claude-haiku-4-5') {
  return {
    ok: true,
    statusText: 'OK',
    json: async () => ({
      content: [{ type: 'text', text: content }],
      model,
      usage: { input_tokens: 10, output_tokens: 5 },
    }),
  };
}

describe('ModelRouter', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    _resetModelRouter();
    mockFetch = vi.fn();
    // @ts-expect-error replace globalThis.fetch for tests
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    _resetModelRouter();
    vi.restoreAllMocks();
  });

  // ── Re-exports ──────────────────────────────────────────────────────────────

  it('re-exports TaskType enum', () => {
    expect(TaskType.CLASSIFICATION).toBeDefined();
    expect(TaskType.PLAIN_LANGUAGE).toBeDefined();
    expect(TaskType.DOCUMENT_DRAFT).toBeDefined();
    expect(TaskType.EVIDENCE_SUMMARY).toBeDefined();
    expect(TaskType.EMBEDDING).toBeDefined();
  });

  // ── Singleton ───────────────────────────────────────────────────────────────

  it('getModelRouter() returns the same instance on repeated calls', () => {
    const a = getModelRouter();
    const b = getModelRouter();
    expect(a).toBe(b);
  });

  it('_resetModelRouter() clears the singleton so a new one is created', () => {
    const a = getModelRouter();
    _resetModelRouter();
    const b = getModelRouter();
    expect(a).not.toBe(b);
  });

  // ── First provider available ─────────────────────────────────────────────────

  it('routes CLASSIFICATION to OPENAI when key provided and fetch succeeds', async () => {
    process.env.OPENAI_API_KEY = 'sk-test-key';

    mockFetch.mockResolvedValueOnce(openAiStub('{"domain":"employment"}'));

    const router = new ModelRouter({ openaiApiKey: 'sk-test-key' });
    const response = await router.route({
      taskType: TaskType.CLASSIFICATION,
      messages: [{ role: 'user', content: 'classify this' }],
    });

    expect(response.content).toBe('{"domain":"employment"}');
    expect(response.provider).toBe(ModelProvider.OPENAI);
    expect(response.model).toBe('gpt-4o-mini');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toContain('/chat/completions');
  });

  // ── Fallback on unavailable ──────────────────────────────────────────────────

  it('skips first provider when its key is empty and falls back to next available', async () => {
    // PLAIN_LANGUAGE chain: CLAUDE → OPENAI → GEMINI → OLLAMA
    // Claude key is empty → skip. OpenAI key provided → use it.
    process.env.ANTHROPIC_API_KEY = '';
    process.env.OPENAI_API_KEY = 'sk-test-key';

    mockFetch.mockResolvedValueOnce(openAiStub('plain language result'));

    const router = new ModelRouter({ openaiApiKey: 'sk-test-key', anthropicApiKey: '' });
    const response = await router.route({
      taskType: TaskType.PLAIN_LANGUAGE,
      messages: [{ role: 'user', content: 'explain this' }],
    });

    expect(response.provider).toBe(ModelProvider.OPENAI);
    expect(response.content).toBe('plain language result');
    // Only one fetch call (Claude was skipped as unavailable)
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  // ── Fallback on error ────────────────────────────────────────────────────────

  it('falls back to second provider when first throws on complete()', async () => {
    // CLASSIFICATION chain: OPENAI → CLAUDE → GEMINI → OLLAMA
    const router = new ModelRouter({
      openaiApiKey: 'sk-openai',
      anthropicApiKey: 'sk-claude',
    });

    // First call (OpenAI) throws a network error
    mockFetch
      .mockRejectedValueOnce(new Error('network timeout'))
      // Second call (Claude) succeeds
      .mockResolvedValueOnce(claudeStub('claude fallback result'));

    const response = await router.route({
      taskType: TaskType.CLASSIFICATION,
      messages: [{ role: 'user', content: 'classify' }],
    });

    expect(response.provider).toBe(ModelProvider.CLAUDE);
    expect(response.content).toBe('claude fallback result');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  // ── All fail ─────────────────────────────────────────────────────────────────

  it('throws a descriptive error when all providers fail', async () => {
    // Supply keys for OpenAI and Claude, no others.
    // Both will throw fetch errors.
    const router = new ModelRouter({
      openaiApiKey: 'sk-openai',
      anthropicApiKey: 'sk-claude',
    });

    mockFetch
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockRejectedValueOnce(new Error('rate limited'));

    // Gemini key is empty → skipped. Ollama: isAvailable() does a GET /api/tags which also gets rejected
    mockFetch.mockRejectedValueOnce(new Error('ollama not running'));

    await expect(
      router.route({
        taskType: TaskType.CLASSIFICATION,
        messages: [{ role: 'user', content: 'classify' }],
      }),
    ).rejects.toThrow(/All providers failed/);
  });

  // ── Unknown task type ────────────────────────────────────────────────────────

  it('throws when no fallback chain is configured for a TaskType', async () => {
    const router = new ModelRouter({ openaiApiKey: 'sk-test' });

    await expect(
      router.route({
        taskType: 'NONEXISTENT_TASK' as TaskType,
        messages: [],
      }),
    ).rejects.toThrow(/No fallback chain configured/);
  });

  // ── EMBEDDING endpoint ───────────────────────────────────────────────────────

  it('embed() calls the embedding endpoint and returns a float vector', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ embedding: [0.1, 0.2, 0.3] }],
        model: 'text-embedding-3-small',
        usage: { prompt_tokens: 4 },
      }),
    });

    const router = new ModelRouter({ openaiApiKey: 'sk-test' });
    const result = await router.embed({ input: 'hello world' });

    expect(result.embedding).toEqual([0.1, 0.2, 0.3]);
    expect(result.provider).toBe(ModelProvider.OPENAI);
    expect(mockFetch.mock.calls[0][0]).toContain('/embeddings');
  });

  // ── Chain first-provider assertions ──────────────────────────────────────────

  it('PLAIN_LANGUAGE chain starts with CLAUDE as highest-quality provider', () => {
    expect(fallbackChains[TaskType.PLAIN_LANGUAGE][0].provider).toBe(ModelProvider.CLAUDE);
  });

  it('DOCUMENT_DRAFT chain starts with CLAUDE for best drafting quality', () => {
    expect(fallbackChains[TaskType.DOCUMENT_DRAFT][0].provider).toBe(ModelProvider.CLAUDE);
  });

  it('CLASSIFICATION chain starts with OPENAI for structured-output reliability', () => {
    expect(fallbackChains[TaskType.CLASSIFICATION][0].provider).toBe(ModelProvider.OPENAI);
  });

  it('EVIDENCE_SUMMARY chain starts with OPENAI for fast summarisation', () => {
    expect(fallbackChains[TaskType.EVIDENCE_SUMMARY][0].provider).toBe(ModelProvider.OPENAI);
  });
});
