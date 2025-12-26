import { describe, it, expect } from 'vitest';
import { PillarExplainer } from '../src/core/triage/PillarExplainer';
import { Pillar } from '../src/core/triage/PillarClassifier';

describe('PillarExplainer', () => {
  const expl = new PillarExplainer();
  const pillars: Pillar[] = ['Criminal', 'Civil', 'Administrative', 'Quasi-Criminal', 'Unknown'];

  it('returns non-empty explanations for all pillars and domains', () => {
    pillars.forEach((p) => {
      const r = expl.explain(p);
      expect(r.burdenOfProof.length).toBeGreaterThan(0);
      expect(r.overview.length).toBeGreaterThan(0);
      expect(Array.isArray(r.nextSteps)).toBe(true);

      // domain augmentation
      const insurance = expl.explain(p, 'insurance');
      expect(insurance.nextSteps.length).toBeGreaterThanOrEqual(r.nextSteps.length);
    });
  });
});