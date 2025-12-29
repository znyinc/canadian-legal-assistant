import { describe, it, expect } from 'vitest';
import { needGoToCourt } from '../frontend/src/utils/forumUtils';

describe('forumUtils', () => {
  it('returns true for court primary forum', () => {
    const fm = { primaryForum: { id: 'ON-SC', name: 'Superior Court of Justice', type: 'court' } };
    const r = needGoToCourt(fm);
    expect(r.need).toBe(true);
    expect(r.reason).toContain('court');
  });

  it('returns false for tribunal primary forum', () => {
    const fm = { primaryForum: { id: 'ON-LTB', name: 'Landlord and Tenant Board', type: 'tribunal' } };
    const r = needGoToCourt(fm);
    expect(r.need).toBe(false);
    expect(r.reason).toContain('tribunal');
  });
});