import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../backend/src/server';

describe('Workflow routes integration', () => {
  it('starts, retrieves, updates, and researches a workflow for a matter', async () => {
    const app = createApp();

    const createMatterRes = await request(app)
      .post('/api/matters')
      .send({
        description: 'A contractor failed to complete agreed repairs and owes me $18,000 in damage.',
        province: 'Ontario',
        domain: 'civilNegligence',
        disputeAmount: 18000,
      });

    expect(createMatterRes.status).toBe(201);
    const matterId = createMatterRes.body.id as string;

    const startRes = await request(app).post(`/api/workflows/matters/${matterId}/workflow/start`);
    expect(startRes.status).toBe(200);
    expect(startRes.body.definition.id).toBe('ontario-civil-self-rep');
    expect(startRes.body.run.track).toBe('ontario-small-claims');

    const generateRes = await request(app)
      .post(`/api/workflows/matters/${matterId}/workflow/steps/limitation-period-verification/generate`);
    expect(generateRes.status).toBe(200);
    expect(generateRes.body.artifact.artifactType).toBe('limitation-memo');

    const gateRes = await request(app)
      .post(`/api/workflows/matters/${matterId}/workflow/gates/gate-1/assess`)
      .send({
        answers: {
          q1: 'correct track',
          q2: 'proceed',
        },
      });
    expect(gateRes.status).toBe(200);
    expect(gateRes.body.result.gateId).toBe('gate-1');

    const getRes = await request(app).get(`/api/workflows/matters/${matterId}/workflow`);
    expect(getRes.status).toBe(200);
    expect(Array.isArray(getRes.body.run.artifacts)).toBe(true);
    expect(getRes.body.run.artifacts.length).toBeGreaterThan(0);

    const researchRes = await request(app)
      .post(`/api/workflows/matters/${matterId}/workflow/research`)
      .send({ query: 'Rule 49 offer to settle Ontario' });
    expect(researchRes.status).toBe(200);
    expect(Array.isArray(researchRes.body.citations)).toBe(true);
    expect(researchRes.body.bundle.entries.length).toBeGreaterThan(0);
  });

  it('supports new matter to classify to workflow retrieval path', async () => {
    const app = createApp();

    const createMatterRes = await request(app)
      .post('/api/matters')
      .send({
        description: 'My landlord sent an N4 and there is an unresolved leak in my unit.',
        province: 'Ontario',
        domain: 'landlordTenant',
      });

    expect(createMatterRes.status).toBe(201);
    const matterId = createMatterRes.body.id as string;

    const classifyRes = await request(app)
      .post(`/api/matters/${matterId}/classify`)
      .send({});

    expect(classifyRes.status).toBe(200);
    expect(classifyRes.body.classification).toBeDefined();
    expect(classifyRes.body.forumMap).toBeDefined();

    const workflowRes = await request(app)
      .get(`/api/workflows/matters/${matterId}/workflow`);

    expect(workflowRes.status).toBe(200);
    expect(workflowRes.body.definition).toBeDefined();
    expect(workflowRes.body.run).toBeDefined();
    expect(typeof workflowRes.body.run.currentPhaseId).toBe('string');
    expect(Array.isArray(workflowRes.body.run.stepStates)).toBe(true);
  });
});

