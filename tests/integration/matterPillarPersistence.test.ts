import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../backend/src/server';

describe('Matter pillar persistence', () => {
  it('saves pillar and pillarMatches into DB columns', async () => {
    const app = createApp();
    const createRes = await request(app).post('/api/matters').send({
      description: 'Slip and fall negligence at a supermarket causing injury',
      province: 'ON',
      domain: 'other'
    });
    expect(createRes.status).toBe(201);
    const matter = createRes.body;

    const classifyRes = await request(app).post(`/api/matters/${matter.id}/classify`).send({});
    expect(classifyRes.status).toBe(200);

    const fetchRes = await request(app).get(`/api/matters/${matter.id}`);
    expect(fetchRes.status).toBe(200);
    const stored = fetchRes.body;
    expect(stored.pillar).toBe('Civil');
    expect(stored.pillarMatches).toBeDefined();

    const matches = JSON.parse(stored.pillarMatches);
    expect(Array.isArray(matches)).toBe(true);
    expect(matches.length).toBeGreaterThan(0);
    expect(stored.pillarAmbiguous === null || typeof stored.pillarAmbiguous === 'boolean').toBe(true);
  });

  it('persists pillarMatches and pillarAmbiguous with ambiguous classification', async () => {
    const app = createApp();

    // Create matter with ambiguous description
    const createRes = await request(app).post('/api/matters').send({
      description: 'I was assaulted and also received a parking ticket',
      province: 'ON',
      domain: 'other'
    });
    expect(createRes.status).toBe(201);
    const matter = createRes.body;
    expect(matter.id).toBeDefined();

    // Trigger classification
    const classifyRes = await request(app).post(`/api/matters/${matter.id}/classify`).send({});
    expect(classifyRes.status).toBe(200);
    expect(classifyRes.body.pillarMatches && classifyRes.body.pillarMatches.length).toBeGreaterThan(1);
    expect(classifyRes.body.pillarAmbiguous).toBe(true);

    // Fetch matter and verify stored classification JSON contains the pillarMatches and ambiguous flag
    const fetchRes = await request(app).get(`/api/matters/${matter.id}`);
    expect(fetchRes.status).toBe(200);
    const stored = fetchRes.body;
    expect(stored.classification).toBeDefined();
    const parsed = JSON.parse(stored.classification);
    expect(parsed.pillarMatches && Array.isArray(parsed.pillarMatches)).toBe(true);
    expect(parsed.pillarAmbiguous).toBe(true);
  });
});