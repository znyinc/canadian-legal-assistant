import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../backend/src/server';

describe('Matter persistence', () => {
  it('persists pillarMatches and pillarAmbiguous after classification', async () => {
    const app = createApp();

    // Create matter
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