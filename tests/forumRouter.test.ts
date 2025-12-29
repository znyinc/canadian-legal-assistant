import { describe, it, expect } from 'vitest';
import { ForumRouter } from '../src/core/triage/ForumRouter';
import { AuthorityRegistry } from '../src/core/authority/AuthorityRegistry';
import { initialAuthorities } from '../src/data/authorities';

describe('ForumRouter', () => {
  const registry = new AuthorityRegistry();
  initialAuthorities.forEach((a) => registry.add(a));

  it('routes landlord/tenant to LTB with Divisional Court alternative', () => {
    const router = new ForumRouter(registry);
    const map = router.route({ domain: 'landlordTenant', jurisdiction: 'Ontario' });
    expect(map.primaryForum.id).toBe('ON-LTB');
    expect(map.alternatives.map((a) => a.id)).toContain('ON-DivCt');
  });

  it('routes HRTO matters appropriately', () => {
    const router = new ForumRouter(registry);
    const map = router.route({ domain: 'humanRights', jurisdiction: 'Ontario' });
    expect(map.primaryForum.id).toBe('ON-HRTO');
  });

  it('routes appeals to higher courts', () => {
    const router = new ForumRouter(registry);
    const map = router.route({ domain: 'insurance', jurisdiction: 'Ontario', isAppeal: true });
    expect(map.primaryForum.id).toBe('ON-CA');
  });

  it('routes judicial review Ontario to Divisional Court', () => {
    const router = new ForumRouter(registry);
    const map = router.route({ domain: 'insurance', jurisdiction: 'Ontario', isJudicialReview: true });
    expect(map.primaryForum.id).toBe('ON-DivCt');
  });

  it('routes criminal cases to Ontario Court of Justice', () => {
    const router = new ForumRouter(registry);
    const map = router.route({ domain: 'criminal', jurisdiction: 'Ontario' });
    expect(map.primaryForum.id).toBe('ON-OCJ');
    expect(map.primaryForum.name).toContain('Ontario Court');
  });

  it('does NOT route criminal to Small Claims Court', () => {
    const router = new ForumRouter(registry);
    const map = router.route({ domain: 'criminal', jurisdiction: 'Ontario' });
    expect(map.primaryForum.id).not.toBe('ON-SMALL');
  });

  it('routes civil negligence with small amount to Small Claims Court', () => {
    const router = new ForumRouter(registry);
    const map = router.route({ domain: 'civil-negligence', jurisdiction: 'Ontario', disputeAmount: 25000 });
    expect(map.primaryForum.id).toBe('ON-SMALL');
  });

  it('routes civil negligence with large amount to Superior Court', () => {
    const router = new ForumRouter(registry);
    const map = router.route({ domain: 'civil-negligence', jurisdiction: 'Ontario', disputeAmount: 75000 });
    expect(map.primaryForum.id).toBe('ON-SC');
  });
});
