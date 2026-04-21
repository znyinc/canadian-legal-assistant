import { describe, it, expect } from 'vitest';
import { fallbackChains, laneChains, providerSpecs, routerPolicy, selectRoutePlan } from '../backend/src/core/router/RouterConfig';
import { TaskType, ModelProvider, ModelTier } from '../backend/src/core/router/ModelRoute';
import { OpenAIAdapter } from '../backend/src/core/router/adapters/OpenAIAdapter';
import { ClaudeAdapter } from '../backend/src/core/router/adapters/ClaudeAdapter';
import { GeminiAdapter } from '../backend/src/core/router/adapters/GeminiAdapter';
import { OllamaAdapter } from '../backend/src/core/router/adapters/OllamaAdapter';
import { LiteLLMAdapter } from '../backend/src/core/router/adapters/LiteLLMAdapter';
import { EmbeddingAdapter } from '../backend/src/core/router/adapters/EmbeddingAdapter';

describe('RouterConfig – fallback chains', () => {
  it('defines a chain for every TaskType value', () => {
    const allTypes: TaskType[] = [
      TaskType.PLAIN_LANGUAGE,
      TaskType.CLASSIFICATION,
      TaskType.DOCUMENT_DRAFT,
      TaskType.EVIDENCE_SUMMARY,
      TaskType.EMBEDDING,
    ];
    for (const t of allTypes) {
      expect(fallbackChains[t], `missing chain for TaskType.${t}`).toBeDefined();
      expect(fallbackChains[t].length, `empty chain for TaskType.${t}`).toBeGreaterThan(0);
    }
  });

  it('EMBEDDING chain has exactly one entry (no fallback for embeddings)', () => {
    expect(fallbackChains[TaskType.EMBEDDING]).toHaveLength(1);
    expect(fallbackChains[TaskType.EMBEDDING][0].provider).toBe(ModelProvider.OPENAI);
  });

  it('all chain entries have valid provider and tier values', () => {
    const validProviders = Object.values(ModelProvider);
    const validTiers = Object.values(ModelTier);

    for (const [taskType, chain] of Object.entries(fallbackChains)) {
      for (const entry of chain) {
        expect(validProviders, `invalid provider in chain for ${taskType}`).toContain(entry.provider);
        expect(validTiers, `invalid tier in chain for ${taskType}`).toContain(entry.tier);
      }
    }
  });

  it('PLAIN_LANGUAGE defaults to FAST while DOCUMENT_DRAFT starts with SMART tier', () => {
    expect(fallbackChains[TaskType.PLAIN_LANGUAGE][0].tier).toBe(ModelTier.FAST);
    expect(fallbackChains[TaskType.DOCUMENT_DRAFT][0].tier).toBe(ModelTier.SMART);
  });

  it('CLASSIFICATION and EVIDENCE_SUMMARY chains use FAST tier for all entries', () => {
    for (const entry of fallbackChains[TaskType.CLASSIFICATION]) {
      expect(entry.tier).toBe(ModelTier.FAST);
    }
    for (const entry of fallbackChains[TaskType.EVIDENCE_SUMMARY]) {
      expect(entry.tier).toBe(ModelTier.FAST);
    }
  });

  it('each chain contains at most one entry per provider', () => {
    for (const [taskType, chain] of Object.entries(fallbackChains)) {
      const providers = chain.map(e => e.provider);
      const unique = new Set(providers);
      expect(unique.size, `duplicate provider in chain for ${taskType}`).toBe(providers.length);
    }
  });

  it('defines lane chains for fast, deep, and local routing', () => {
    expect(laneChains['fast-extract'][0]).toEqual({ provider: ModelProvider.LITELLM, tier: ModelTier.FAST });
    expect(laneChains['deep-reason'][0]).toEqual({ provider: ModelProvider.LITELLM, tier: ModelTier.SMART });
    expect(laneChains['fallback-local'][0]).toEqual({ provider: ModelProvider.OLLAMA, tier: ModelTier.FAST });
  });
});

describe('RouterConfig – lane selection', () => {
  it('defaults plain-language requests to fast-extract', () => {
    const plan = selectRoutePlan({
      taskType: TaskType.PLAIN_LANGUAGE,
      messages: [],
    });

    expect(plan.lane).toBe('fast-extract');
    expect(plan.chain).toEqual(laneChains['fast-extract']);
  });

  it('escalates low-confidence plain-language requests to deep-reason', () => {
    const plan = selectRoutePlan({
      taskType: TaskType.PLAIN_LANGUAGE,
      messages: [],
      routeContext: { confidence: routerPolicy.lowConfidenceThreshold - 1 },
    });

    expect(plan.lane).toBe('deep-reason');
  });

  it('escalates ambiguous plain-language requests to deep-reason', () => {
    const plan = selectRoutePlan({
      taskType: TaskType.PLAIN_LANGUAGE,
      messages: [],
      routeContext: { ambiguity: routerPolicy.highAmbiguityThreshold + 0.1 },
    });

    expect(plan.lane).toBe('deep-reason');
  });

  it('escalates complex plain-language requests to deep-reason', () => {
    const plan = selectRoutePlan({
      taskType: TaskType.PLAIN_LANGUAGE,
      messages: [],
      routeContext: { complexityScore: routerPolicy.highComplexityThreshold + 0.1 },
    });

    expect(plan.lane).toBe('deep-reason');
  });

  it('uses local-only lane when privacy requires local routing', () => {
    const plan = selectRoutePlan({
      taskType: TaskType.CLASSIFICATION,
      messages: [],
      routeContext: { privacyMode: 'local-only' },
    });

    expect(plan.lane).toBe('fallback-local');
    expect(plan.chain).toEqual(laneChains['fallback-local']);
  });
});

describe('RouterConfig – provider specs', () => {
  it('defines specs for all ModelProvider values', () => {
    const allProviders = Object.values(ModelProvider);
    for (const p of allProviders) {
      expect(providerSpecs[p], `missing spec for ${p}`).toBeDefined();
    }
  });

  it('every provider spec has both SMART and FAST model names', () => {
    for (const [provider, spec] of Object.entries(providerSpecs)) {
      expect(spec.models[ModelTier.SMART], `missing SMART model for ${provider}`).toBeTruthy();
      expect(spec.models[ModelTier.FAST], `missing FAST model for ${provider}`).toBeTruthy();
    }
  });

  it('every provider spec has a non-empty baseUrl', () => {
    for (const [provider, spec] of Object.entries(providerSpecs)) {
      expect(spec.baseUrl, `empty baseUrl for ${provider}`).toBeTruthy();
      expect(spec.baseUrl).toMatch(/^https?:\/\//);
    }
  });

  it('Ollama provider has zero cost (local model)', () => {
    expect(providerSpecs[ModelProvider.OLLAMA].costPer1kInput).toBe(0);
    expect(providerSpecs[ModelProvider.OLLAMA].costPer1kOutput).toBe(0);
  });
});

describe('Adapter instantiation', () => {
  it('OpenAIAdapter instantiates without throwing', () => {
    expect(() => new OpenAIAdapter('')).not.toThrow();
    expect(() => new OpenAIAdapter('sk-test')).not.toThrow();
  });

  it('ClaudeAdapter instantiates without throwing', () => {
    expect(() => new ClaudeAdapter('')).not.toThrow();
    expect(() => new ClaudeAdapter('sk-test')).not.toThrow();
  });

  it('GeminiAdapter instantiates without throwing', () => {
    expect(() => new GeminiAdapter('')).not.toThrow();
    expect(() => new GeminiAdapter('sk-test')).not.toThrow();
  });

  it('OllamaAdapter instantiates without throwing', () => {
    expect(() => new OllamaAdapter()).not.toThrow();
  });

  it('LiteLLMAdapter instantiates without throwing', () => {
    expect(() => new LiteLLMAdapter('', false)).not.toThrow();
    expect(() => new LiteLLMAdapter('litellm-key', true)).not.toThrow();
  });

  it('EmbeddingAdapter instantiates without throwing', () => {
    expect(() => new EmbeddingAdapter('')).not.toThrow();
    expect(() => new EmbeddingAdapter('sk-test')).not.toThrow();
  });

  it('adapters report unavailable when key is empty', async () => {
    const openai = new OpenAIAdapter('');
    const claude = new ClaudeAdapter('');
    const gemini = new GeminiAdapter('');
    const litellm = new LiteLLMAdapter('', false);
    expect(await openai.isAvailable()).toBe(false);
    expect(await claude.isAvailable()).toBe(false);
    expect(await gemini.isAvailable()).toBe(false);
    expect(await litellm.isAvailable()).toBe(false);
  });

  it('adapters report available when key is provided', async () => {
    const openai = new OpenAIAdapter('sk-test');
    const claude = new ClaudeAdapter('sk-test');
    const gemini = new GeminiAdapter('sk-test');
    const litellm = new LiteLLMAdapter('litellm-test', true);
    expect(await openai.isAvailable()).toBe(true);
    expect(await claude.isAvailable()).toBe(true);
    expect(await gemini.isAvailable()).toBe(true);
    expect(await litellm.isAvailable()).toBe(true);
  });
});
