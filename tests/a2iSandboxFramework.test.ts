import { describe, it, expect } from 'vitest';
import { A2ISandboxFramework } from '../src/core/upl/A2ISandboxFramework';

describe('A2ISandboxFramework', () => {
  it('routes criminal matters to sandbox tier with human review', () => {
    const fw = new A2ISandboxFramework();
    const plan = fw.plan({ domain: 'criminal', jurisdiction: 'Ontario', urgency: 'high' });
    expect(plan.tier).toBe('a2i-sandbox');
    expect(plan.humanReview.required).toBe(true);
    expect(plan.controls.some((c) => c.includes('Block direct form recommendations'))).toBe(true);
  });

  it('uses paralegal-supervised tier for civil negligence', () => {
    const fw = new A2ISandboxFramework();
    const plan = fw.plan({ domain: 'civil-negligence', jurisdiction: 'Ontario' });
    expect(plan.tier).toBe('paralegal-supervised');
    expect(plan.actions.length).toBeGreaterThan(0);
  });

  it('defaults to public information tier for low-risk matters', () => {
    const fw = new A2ISandboxFramework();
    const plan = fw.plan({ domain: 'insurance', jurisdiction: 'Ontario', urgency: 'low' });
    expect(plan.tier).toBe('public-info');
    expect(plan.humanReview.required).toBe(false);
  });
});
