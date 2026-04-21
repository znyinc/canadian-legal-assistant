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

  it('classifies landlord-tenant ahead of generic damage signals', () => {
    const mc = new MatterClassifier();
    const result = mc.classify({
      domainHint: 'My landlord served an N4 notice and will not repair a leak causing damage in the unit',
      jurisdictionHint: 'Ontario',
    });
    expect(result.domain).toBe('landlordTenant');
  });

  it('keeps landlord-tenant as the primary confidence match when repair and damage both appear', () => {
    const mc = new MatterClassifier();
    const result = mc.classifyWithConfidence({
      domainHint: 'Tenant received an N4 for rent, asked the landlord for repairs, and the leak caused damage',
      jurisdictionHint: 'Ontario',
    });
    expect(result.domain).toBe('landlordTenant');
    expect(result.confidence.domainConfidence).toBeGreaterThanOrEqual(87);
  });

  it('does not misclassify neighbor tree damage as landlord-tenant when tenant is negated', () => {
    const mc = new MatterClassifier();
    const result = mc.classifyWithConfidence({
      domainHint: 'My neighbor\'s tree fell across the fence and damaged my gazebo. I am the neighbor not a tenant. Gazebo repair estimate is $12,500.',
      jurisdictionHint: 'Ottawa, Ontario',
    });

    expect(result.domain).toBe('civil-negligence');
    expect(result.alternativeDomains?.some((candidate) => candidate.domain === 'landlordTenant')).not.toBe(true);
  });

  it('does not treat generic repair language alone as landlord-tenant context', () => {
    const mc = new MatterClassifier();
    const result = mc.classify({
      domainHint: 'Tree damage to my fence and gazebo. Repair estimate is $18,200 and my neighbour ignored fungus warnings.',
      jurisdictionHint: 'Ontario',
    });

    expect(result.domain).toBe('civil-negligence');
  });
});
