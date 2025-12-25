import { describe, it, expect } from 'vitest';
import { MatterClassifier } from '../src/core/triage/MatterClassifier';

describe('MatterClassifier', () => {
  it('classifies landlord/tenant domain by hint', () => {
    const mc = new MatterClassifier();
    const result = mc.classify({ domainHint: 'landlord tenant', jurisdictionHint: 'Ontario' });
    expect(result.domain).toBe('landlordTenant');
    expect(result.jurisdiction).toBe('Ontario');
  });

  it('classifies insurance domain by hint', () => {
    const mc = new MatterClassifier();
    const result = mc.classify({ domainHint: 'insurance claim', jurisdictionHint: 'Federal' });
    expect(result.domain).toBe('insurance');
    expect(result.jurisdiction).toBe('Federal');
  });

  it('sets default parties and urgency', () => {
    const mc = new MatterClassifier();
    const result = mc.classify({ domainHint: 'other' });
    expect(result.parties.claimantType).toBe('individual');
    expect(result.urgency).toBe('medium');
  });
});
