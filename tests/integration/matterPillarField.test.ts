import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../backend/src/server';

describe('Matter pillar DB field', () => {
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
});