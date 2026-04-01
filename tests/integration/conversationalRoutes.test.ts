import { describe, it, expect } from 'vitest';
import request from 'supertest';
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
});
