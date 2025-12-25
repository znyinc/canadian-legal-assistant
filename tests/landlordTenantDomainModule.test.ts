import { describe, it, expect } from 'vitest';
import { LandlordTenantDomainModule } from '../src/core/domains/LandlordTenantDomainModule';
import { EvidenceIndex, SourceManifest, MatterClassification } from '../src/core/models';

const classification: MatterClassification = {
  id: 'm2',
  domain: 'landlordTenant',
  jurisdiction: 'Ontario',
  parties: { claimantType: 'individual', respondentType: 'individual' }
};

const evidenceIndex: EvidenceIndex = {
  items: [
    {
      id: 'ev1',
      filename: 'rent_receipt.pdf',
      type: 'PDF',
      date: '2025-02-01',
      summary: 'Rent receipt',
      provenance: 'user-provided',
      hash: 'hash2',
      credibilityScore: 0.8
    }
  ],
  generatedAt: '2025-02-02',
  sourceManifest: { sources: [] }
};

const sourceManifest: SourceManifest = {
  entries: [
    {
      service: 'e-Laws',
      url: 'https://www.ontario.ca/laws/statute/06r17',
      retrievalDate: '2025-02-02'
    }
  ],
  compiledAt: '2025-02-02'
};

describe('LandlordTenantDomainModule', () => {
  it('generates drafts and package', () => {
    const module = new LandlordTenantDomainModule();
    const result = module.generate({
      classification,
      forumMap: 'Forum map content',
      timeline: 'Timeline content',
      missingEvidence: 'Missing evidence content',
      evidenceIndex,
      sourceManifest
    });

    expect(result.drafts.length).toBe(3);
    expect(result.package.files.some((f) => f.path.startsWith('drafts/'))).toBe(true);
    expect(result.package.sourceManifest.entries.length).toBeGreaterThan(0);
  });
});
