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

  it('classifies criminal assault cases', () => {
    const mc = new MatterClassifier();
    const result = mc.classify({ domainHint: 'assault', jurisdictionHint: 'Ontario' });
    expect(result.domain).toBe('criminal');
  });

  it('classifies criminal uttering threats cases', () => {
    const mc = new MatterClassifier();
    const result = mc.classify({ domainHint: 'uttering threats', jurisdictionHint: 'Ontario' });
    expect(result.domain).toBe('criminal');
  });

  it('classifies police-involved cases as criminal', () => {
    const mc = new MatterClassifier();
    const result = mc.classify({ domainHint: 'police arrested charged', jurisdictionHint: 'Ontario' });
    expect(result.domain).toBe('criminal');
  });

  it('classifies violence cases as criminal', () => {
    const mc = new MatterClassifier();
    const result = mc.classify({ domainHint: 'violence criminal', jurisdictionHint: 'Ontario' });
    expect(result.domain).toBe('criminal');
  });

  it('classifies civil negligence with tree damage', () => {
    const mc = new MatterClassifier();
    const result = mc.classify({ domainHint: 'tree damage negligence', jurisdictionHint: 'Ontario' });
    expect(result.domain).toBe('civil-negligence');
  });

  it('classifies municipal property damage', () => {
    const mc = new MatterClassifier();
    const result = mc.classify({ domainHint: 'municipal road damage notice', jurisdictionHint: 'Ontario' });
    expect(result.domain).toBe('municipalPropertyDamage');
  });
});
