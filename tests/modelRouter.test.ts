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
    delete process.env.LITELLM_BASE_URL;
    delete process.env.LITELLM_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GEMINI_API_KEY;
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

  it('routes through LiteLLM first when it is explicitly configured', async () => {
    mockFetch.mockResolvedValueOnce(openAiStub('{"domain":"employment"}', 'litellm-fast'));

    const router = new ModelRouter({
      liteLlmBaseUrl: 'http://localhost:4000',
      liteLlmApiKey: 'litellm-test-key',
      geminiApiKey: 'test-gemini-key',
      openaiApiKey: 'sk-openai',
    });

    const response = await router.route({
      taskType: TaskType.CLASSIFICATION,
      messages: [{ role: 'user', content: 'classify this' }],
    });

    expect(response.content).toBe('{"domain":"employment"}');
    expect(response.provider).toBe(ModelProvider.LITELLM);
    expect(mockFetch.mock.calls[0][0]).toContain('http://localhost:4000/chat/completions');
  });

  it('routes CLASSIFICATION to first available cloud provider (Gemini)', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';

    // Gemini stub (uses Gemini API format)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      statusText: 'OK',
      json: async () => ({
        candidates: [{ content: { parts: [{ text: '{"domain":"employment"}' }] } }],
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
      }),
    });

    const router = new ModelRouter({ geminiApiKey: 'test-gemini-key' });
    const response = await router.route({
      taskType: TaskType.CLASSIFICATION,
      messages: [{ role: 'user', content: 'classify this' }],
    });

    expect(response.content).toBe('{"domain":"employment"}');
    expect(response.provider).toBe(ModelProvider.GEMINI);
    expect(response.routeDecision?.lane).toBe('fast-extract');
  });

  // ── Fallback on unavailable ──────────────────────────────────────────────────

  it('skips unavailable providers and falls back to next available', async () => {
    // PLAIN_LANGUAGE chain: GEMINI → OPENAI → CLAUDE → OLLAMA
    // Gemini key empty → skip. OpenAI key provided → use it.
    process.env.OPENAI_API_KEY = 'sk-test-key';

    mockFetch.mockResolvedValueOnce(openAiStub('plain language result'));

    const router = new ModelRouter({ openaiApiKey: 'sk-test-key', geminiApiKey: '' });
    const response = await router.route({
      taskType: TaskType.PLAIN_LANGUAGE,
      messages: [{ role: 'user', content: 'explain this' }],
    });

    expect(response.provider).toBe(ModelProvider.OPENAI);
    expect(response.content).toBe('plain language result');
    expect(response.routeDecision?.lane).toBe('fast-extract');
  });

  // ── Fallback on error ────────────────────────────────────────────────────────

  it('falls back through chain when providers fail sequentially', async () => {
    // CLASSIFICATION chain: GEMINI → OPENAI → CLAUDE → OLLAMA
    const router = new ModelRouter({
      geminiApiKey: 'test-gemini',
      openaiApiKey: 'sk-openai',
      anthropicApiKey: 'sk-claude',
    });

    mockFetch
      .mockRejectedValueOnce(new Error('gemini quota exceeded'))  // Gemini fails
      .mockRejectedValueOnce(new Error('network timeout'))        // OpenAI fails
      .mockResolvedValueOnce(claudeStub('claude fallback result')); // Claude succeeds

    const response = await router.route({
      taskType: TaskType.CLASSIFICATION,
      messages: [{ role: 'user', content: 'classify' }],
    });

    expect(response.provider).toBe(ModelProvider.CLAUDE);
    expect(response.content).toBe('claude fallback result');
    expect(response.routeDecision?.fallbackCause).toBeDefined();
  });

  it('escalates ambiguous plain-language requests to the deep-reason lane', async () => {
    const router = new ModelRouter({
      geminiApiKey: 'test-gemini',
      openaiApiKey: 'sk-openai',
      anthropicApiKey: 'sk-claude',
    });

    // Deep-reason chain: GEMINI → OPENAI → CLAUDE → OLLAMA
    // Gemini succeeds first
    mockFetch.mockResolvedValueOnce({
      ok: true,
      statusText: 'OK',
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'deep reasoning result' }] } }],
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20 },
      }),
    });

    const response = await router.route({
      taskType: TaskType.PLAIN_LANGUAGE,
      messages: [{ role: 'user', content: 'resolve this ambiguous situation' }],
      routeContext: {
        confidence: 42,
        ambiguity: 0.7,
      },
    });

    expect(response.provider).toBe(ModelProvider.GEMINI);
    expect(response.routeDecision?.lane).toBe('deep-reason');
  });

  it('escalates complex plain-language requests to the deep-reason lane', async () => {
    const router = new ModelRouter({
      geminiApiKey: 'test-gemini',
      openaiApiKey: 'sk-openai',
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      statusText: 'OK',
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'complex reasoning result' }] } }],
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20 },
      }),
    });

    const response = await router.route({
      taskType: TaskType.PLAIN_LANGUAGE,
      messages: [{ role: 'user', content: 'untangle this multi-party scenario' }],
      routeContext: {
        confidence: 86,
        ambiguity: 0.2,
        complexityScore: 0.9,
      },
    });

    expect(response.provider).toBe(ModelProvider.GEMINI);
    expect(response.routeDecision?.lane).toBe('deep-reason');
  });

  it('uses Ollama-only chain when privacy mode requires local routing', async () => {
    const router = new ModelRouter({
      openaiApiKey: 'sk-openai',
    });

    mockFetch
      .mockResolvedValueOnce({ ok: true, statusText: 'OK' })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: { content: 'local result' },
          prompt_eval_count: 8,
          eval_count: 4,
        }),
      });

    const response = await router.route({
      taskType: TaskType.CLASSIFICATION,
      messages: [{ role: 'user', content: 'classify locally' }],
      routeContext: {
        privacyMode: 'local-only',
      },
    });

    expect(response.provider).toBe(ModelProvider.OLLAMA);
    expect(response.routeDecision?.lane).toBe('fallback-local');
    expect(mockFetch.mock.calls[0][0]).toContain('/api/tags');
    expect(mockFetch.mock.calls[1][0]).toContain('/api/chat');
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

  it('PLAIN_LANGUAGE chain starts with LiteLLM so a configured proxy can route cloud traffic centrally', () => {
    expect(fallbackChains[TaskType.PLAIN_LANGUAGE][0].provider).toBe(ModelProvider.LITELLM);
  });

  it('DOCUMENT_DRAFT chain starts with LiteLLM so drafting can use proxy-managed model groups', () => {
    expect(fallbackChains[TaskType.DOCUMENT_DRAFT][0].provider).toBe(ModelProvider.LITELLM);
  });

  it('CLASSIFICATION chain starts with LiteLLM so routing decisions can be centralized when available', () => {
    expect(fallbackChains[TaskType.CLASSIFICATION][0].provider).toBe(ModelProvider.LITELLM);
  });

  it('EVIDENCE_SUMMARY chain starts with LiteLLM so summarization traffic can use proxy policies first', () => {
    expect(fallbackChains[TaskType.EVIDENCE_SUMMARY][0].provider).toBe(ModelProvider.LITELLM);
  });
});
