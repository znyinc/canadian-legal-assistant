import { describe, it, expect } from 'vitest';
import { CanLiiClient } from '../src/core/caselaw/CanLiiClient';
import { SourceAccessController } from '../src/core/access/SourceAccessController';

const canLiiPolicy = {
  service: 'CanLII' as const,
  allowedMethods: ['official-api']
};

describe('CanLiiClient', () => {
  it('rejects when access method not allowed', async () => {
    const access = new SourceAccessController();
    const client = new CanLiiClient(access);
    const res = await client.fetchCaseMetadata('test');
    expect(res.ok).toBe(false);
  });

  it('returns stubbed metadata when allowed', async () => {
    const access = new SourceAccessController();
    access.setPolicy(canLiiPolicy);
    const client = new CanLiiClient(access);
    const res = await client.fetchCaseMetadata('Sample');
    expect(res.ok).toBe(true);
    expect(res.metadata?.citation).toContain('ONCA');
  });
});
