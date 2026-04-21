import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Disable LLM calls in integration tests
vi.mock('../../backend/src/config', () => ({
  config: {
    port: 3001,
    nodeEnv: 'test',
    apiKeyEnabled: false,
    apiKey: '',
    corsOrigin: 'http://localhost:5173',
    uploadDir: './uploads',
    maxFileSize: 10485760,
    canliiApiKey: '',
    nuanceLlmEnabled: false,
    nuanceLlmModel: 'qwen2.5:32b',
    nuanceLlmApiKey: '',
    nuanceLlmBaseUrl: 'http://localhost:11434',
    openaiApiKey: '',
    anthropicApiKey: '',
    geminiApiKey: '',
    ollamaBaseUrl: 'http://localhost:11434',
  },
}));

import { createApp } from '../../backend/src/server';

describe('Conversational routes integration', () => {
  it('processes intake input and returns classification envelope', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/conversational/intake/process')
      .send({
        userInput: 'I have a dispute with my landlord about repairs and an N4 notice.',
        conversationHistory: [],
      });

    expect(response.status).toBe(200);
    expect(response.body.classification).toBeDefined();
    expect(typeof response.body.classification.domain).toBe('string');
    expect(typeof response.body.classification.jurisdiction).toBe('string');
    expect(typeof response.body.confidence).toBe('number');
    expect(Array.isArray(response.body.followUpQuestions)).toBe(true);
    expect(typeof response.body.isComplete).toBe('boolean');
    expect(typeof response.body.reviewState).toBe('string');
    expect(typeof response.body.importReadiness).toBe('boolean');
    expect(response.body.strategicBriefing).toBeDefined();
    expect(typeof response.body.strategicBriefing.assumption).toBe('string');
    expect(Array.isArray(response.body.strategicBriefing.practicalOptions)).toBe(true);
  });

  it('streams intake response over SSE and includes final import/review state', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/conversational/intake/stream')
      .send({
        userInput: 'My landlord sent an eviction notice and I need help understanding options.',
        conversationHistory: [],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(response.text).toContain('event: meta');
    expect(response.text).toContain('event: delta');
    expect(response.text).toContain('event: final');
    expect(response.text).toContain('event: done');

    const finalMatch = response.text.match(/event: final\n(?:data: )(.*)\n\n/);
    expect(finalMatch).toBeTruthy();

    const finalPayload = JSON.parse(finalMatch![1]);
    expect(finalPayload.classification).toBeDefined();
    expect(typeof finalPayload.confidence).toBe('number');
    expect(typeof finalPayload.reviewState).toBe('string');
    expect(typeof finalPayload.importReadiness).toBe('boolean');
    expect(finalPayload.strategicBriefing).toBeDefined();
    expect(typeof finalPayload.strategicBriefing.pivotalQuestion).toBe('string');
  });

  it('returns deterministic intake result for conversational classification', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/conversational/intake/process')
      .send({
        userInput: 'A rear-end collision damaged my parked car and insurance is disputing costs.',
        conversationHistory: [],
      });

    expect(response.status).toBe(200);
    expect(response.body.classification).toBeDefined();
    expect(typeof response.body.classification.domain).toBe('string');
    expect(typeof response.body.confidence).toBe('number');
    expect(Array.isArray(response.body.followUpQuestions)).toBe(true);
    expect(typeof response.body.reviewState).toBe('string');
  });

  it('generates guidance payload from conversational description', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/conversational/guidance/generate')
      .send({
        description: 'A city tree branch fell and damaged my parked car. I need to recover costs.',
        domain: 'civil-negligence',
        jurisdiction: 'Ontario',
        urgency: 'medium',
      });

    expect(response.status).toBe(200);
    expect(response.body.classification).toBeDefined();
    expect(typeof response.body.classification.domain).toBe('string');
    expect(response.body.guidance).toBeDefined();
    expect(response.body.guidance.acknowledgment).toBeDefined();
  });

  it('supports conversational import-back flow with matter creation, classification, and audit retrieval', async () => {
    const app = createApp();

    const guidanceRes = await request(app)
      .post('/api/conversational/guidance/generate')
      .send({
        description: 'My employer terminated me without notice and I want to know my options.',
        domain: 'employment',
        jurisdiction: 'Ontario',
        urgency: 'high',
      });

    expect(guidanceRes.status).toBe(200);

    const createMatterRes = await request(app)
      .post('/api/matters')
      .send({
        description: 'My employer terminated me without notice and I want to know my options.',
        province: 'Ontario',
        domain: guidanceRes.body.classification?.domain || 'employment',
      });

    expect(createMatterRes.status).toBe(201);
    expect(createMatterRes.body.id).toBeDefined();

    const matterId = createMatterRes.body.id as string;

    const classifyRes = await request(app)
      .post(`/api/matters/${matterId}/classify`)
      .send({});

    expect(classifyRes.status).toBe(200);
    expect(classifyRes.body.classification).toBeDefined();

    const auditListRes = await request(app)
      .get(`/api/audit?matterId=${matterId}`);

    expect(auditListRes.status).toBe(200);
    expect(Array.isArray(auditListRes.body)).toBe(true);
  });

  it('returns the action-first nuance response shape', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/conversational/nuance/respond')
      .send({
        message: 'My landlord sent an N4 notice and will not repair a leak in my unit.',
        history: [],
      });

    expect(response.status).toBe(200);
    expect(typeof response.body.message).toBe('string');
    expect(typeof response.body.context?.directAnswer).toBe('string');
    expect(Array.isArray(response.body.context?.immediateActions)).toBe(true);
    expect(Array.isArray(response.body.context?.escalationCriteria)).toBe(true);
    expect(typeof response.body.context?.singleNextQuestion).toBe('string');
    expect(typeof response.body.context?.conciseDisclaimer).toBe('string');
    expect(typeof response.body.disclaimer).toBe('string');
    expect(response.headers['x-conversational-nuance-source']).toBe(response.body.context?.source);
    expect(response.headers['x-conversational-nuance-model']).toBe(response.body.context?.model || 'none');
  });

  it('preflights a new matter before persistence and returns normalized routing hints', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/matters/preflight')
      .send({
        description: 'My landlord sent an N4 notice, there is an unresolved leak, and I have photos and text messages about the damage.',
        province: 'Ontario',
        domain: 'landlordTenant',
      });

    expect(response.status).toBe(200);
    expect(response.body.domain).toBe('landlordTenant');
    expect(typeof response.body.summary).toBe('string');
    expect(typeof response.body.confidence).toBe('number');
    expect(Array.isArray(response.body.evidenceChecklist)).toBe(true);
    expect(['llm', 'fallback']).toContain(response.body.source);
  });

  it('supports session lifecycle endpoints for conversational intake v2', async () => {
    const app = createApp();

    const createRes = await request(app)
      .post('/api/conversational/sessions')
      .send({
        initialUserInput: 'I was terminated without notice and I need to understand my options.',
      });

    expect(createRes.status).toBe(201);
    expect(typeof createRes.body.sessionId).toBe('string');
    expect(createRes.body.reviewState).toBeDefined();

    const sessionId = createRes.body.sessionId as string;

    const getRes = await request(app).get(`/api/conversational/sessions/${sessionId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.sessionId).toBe(sessionId);

    const reviewRes = await request(app).get(`/api/conversational/sessions/${sessionId}/review`);
    expect(reviewRes.status).toBe(200);
    expect(typeof reviewRes.body.reviewState).toBe('string');
    expect(typeof reviewRes.body.importReadiness).toBe('boolean');

    const turnRes = await request(app)
      .post(`/api/conversational/sessions/${sessionId}/turn`)
      .send({
        userInput: 'I have my contract and termination email ready.',
      });
    expect(turnRes.status).toBe(200);
    expect(turnRes.body.turnCount).toBeGreaterThanOrEqual(2);

    const importRes = await request(app).post(`/api/conversational/sessions/${sessionId}/import`).send({});
    expect([200, 409]).toContain(importRes.status);
  });
});
