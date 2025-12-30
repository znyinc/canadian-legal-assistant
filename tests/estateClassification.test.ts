import { describe, it, expect } from 'vitest';
import { MatterClassifier } from '../src/core/triage/MatterClassifier';
import { AuthorityRegistry } from '../src/core/authority/AuthorityRegistry';
import { initialAuthorities } from '../src/data/authorities';
import { ForumRouter } from '../src/core/triage/ForumRouter';

const seedRegistry = () => {
  const registry = new AuthorityRegistry();
  initialAuthorities.forEach((a) => registry.add(a));
  return registry;
};

describe('Estate & Succession classification and routing', () => {
  it('classifies probate and will-challenge hints as estateSuccession', () => {
    const classifier = new MatterClassifier();
    const result = classifier.classify({ domainHint: 'probate application estate succession will challenge' });
    expect(result.domain).toBe('estateSuccession');
  });

  it('classifies dependant support tag as estateSuccession', () => {
    const classifier = new MatterClassifier();
    const result = classifier.classify({ domainHint: 'dependant_support_claim' });
    expect(result.domain).toBe('estateSuccession');
  });

  it('routes estate matters to Ontario probate (Superior Court estates)', () => {
    const registry = seedRegistry();
    const router = new ForumRouter(registry);
    const forumMap = router.route({
      domain: 'estateSuccession',
      jurisdiction: 'Ontario'
    });

    expect(forumMap.primaryForum.id).toBe('ON-SC-Probate');
    expect(forumMap.primaryForum.name).toContain('Probate');
  });
});
