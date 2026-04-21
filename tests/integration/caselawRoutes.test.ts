import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../backend/src/config', () => {
  const config = {
    port: 3001,
    nodeEnv: 'test',
    apiKeyEnabled: false,
    apiKey: '',
    corsOrigin: 'http://localhost:5173',
    uploadDir: './uploads',
    maxFileSize: 10485760,
    canliiApiKey: '',
    allowRuntimeEnvEditing: true,
    nuanceLlmEnabled: false,
    nuanceLlmModel: 'qwen2.5:32b',
    nuanceLlmApiKey: '',
    nuanceLlmBaseUrl: 'http://localhost:11434',
    liteLlmBaseUrl: 'http://localhost:4000',
    liteLlmApiKey: '',
    semanticSearchEnabled: false,
    semanticSearchBaseUrl: '',
    semanticSearchApiKey: '',
    semanticSearchEmbeddingModel: 'embedding',
    semanticSearchMinScore: 0.25,
    openaiApiKey: '',
    anthropicApiKey: '',
    geminiApiKey: '',
    ollamaBaseUrl: 'http://localhost:11434',
  };

  return {
    config,
    reloadRuntimeConfig: () => config,
  };
});

import { createApp } from '../../backend/src/server';
import { config } from '../../backend/src/config';

describe('Case law routes integration', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    config.semanticSearchEnabled = false;
    config.semanticSearchBaseUrl = '';
    config.semanticSearchApiKey = '';
    config.semanticSearchEmbeddingModel = 'embedding';
    config.semanticSearchMinScore = 0.25;
  });

  it('returns a CanLII search link and current official court pages for a query', async () => {
    const app = createApp();

    const response = await request(app)
      .get('/api/caselaw/search')
      .query({ query: '2025 ONCA 1' });

    expect(response.status).toBe(200);
    expect(response.body.searchUrl).toBe(
      'https://www.canlii.org/en/#search/type=decision&text=2025%20ONCA%201'
    );

    const urls = (response.body.alternatives || []).map((item: any) => item.url);
    expect(urls).toContain('https://www.canlii.org/en/info/search.html');
    expect(urls).toContain('https://www.ontariocourts.ca/coa/about-the-court/decision-database/');
    expect(urls).toContain('https://www.scc-csc.ca/judgments-jugements/');
    expect(urls).toContain('https://tribunalsontario.ca/ltb/law-rules-and-decisions/');
    expect(urls).toContain('https://tribunalsontario.ca/hrto/legislation-and-regulation/');
    expect(urls).toContain('https://www.ontariocourts.ca/scj/areas-of-law/small-claims-court/');
  });

  it('uses LiteLLM semantic embeddings to rank official case law resources when enabled', async () => {
    config.semanticSearchEnabled = true;
    config.semanticSearchBaseUrl = 'http://localhost:8080/v1';
    config.semanticSearchApiKey = 'router-test-key';
    config.semanticSearchEmbeddingModel = 'embedding';
    config.semanticSearchMinScore = 0.5;

    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body || '{}')) as { input: string[] };
      const data = body.input.map((text) => {
        const normalized = text.toLowerCase();
        const isLandlordTenant = normalized.includes('landlord') || normalized.includes('tenant') || normalized.includes('eviction');
        return {
          embedding: isLandlordTenant ? [1, 0] : [0, 1],
        };
      });

      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          model: 'embedding',
          data,
        }),
      } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);

    const app = createApp();

    const response = await request(app)
      .get('/api/caselaw/search')
      .query({ query: 'tenant eviction rent arrears' });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/v1/embeddings',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer router-test-key',
        }),
      }),
    );
    expect(response.body.semanticSearch).toMatchObject({
      enabled: true,
      status: 'ok',
      source: 'litellm',
      model: 'embedding',
    });

    const ltb = response.body.alternatives.find((item: any) => item.name === 'Landlord and Tenant Board');
    expect(ltb.semanticScore).toBe(1);
    expect(ltb.semanticSource).toBe('litellm-embedding');
  });

  it('returns updated guidance links for the LTB', async () => {
    const app = createApp();

    const response = await request(app)
      .get('/api/caselaw/court-guidance')
      .query({ court: 'ltb' });

    expect(response.status).toBe(200);
    expect(response.body.url).toBe('https://tribunalsontario.ca/ltb/');
    expect(response.body.guidance.map((item: any) => item.url)).toEqual([
      'https://tribunalsontario.ca/ltb/application-and-hearing-process/',
      'https://tribunalsontario.ca/ltb/filing-and-fees/',
      'https://tribunalsontario.ca/ltb/law-rules-and-decisions/',
    ]);
  });
});
