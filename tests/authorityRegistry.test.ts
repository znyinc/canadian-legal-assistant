import { describe, it, expect } from 'vitest';
import { Authority } from '../src/core/models';
import { AuthorityRegistry } from '../src/core/authority/AuthorityRegistry';
import { initialAuthorities } from '../src/data/authorities';

describe('AuthorityRegistry', () => {
  it('adds and retrieves authorities', () => {
    const reg = new AuthorityRegistry();
    initialAuthorities.forEach((a) => reg.add(a));

    const ltb = reg.getById('ON-LTB');
    expect(ltb?.name).toContain('Landlord and Tenant Board');
  });

  it('computes escalation routes', () => {
    const reg = new AuthorityRegistry();
    initialAuthorities.forEach((a) => reg.add(a));

    const route = reg.getEscalationRoute('ON-LTB');
    expect(route.map((r) => r.id)).toContain('ON-DivCt');
  });

  it('determines when an authority needs update', () => {
    const reg = new AuthorityRegistry();
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const a: Authority = {
      id: 'TEST',
      name: 'Test Authority',
      type: 'tribunal',
      jurisdiction: 'Ontario',
      version: '1.0.0',
      updatedAt: yesterday,
      updateCadenceDays: 0,
      escalationRoutes: []
    };
    reg.add(a);
    expect(reg.needsUpdate('TEST', now)).toBe(true);
  });
});
