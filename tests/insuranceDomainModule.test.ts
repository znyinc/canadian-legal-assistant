import { describe, it, expect } from 'vitest';
import { InsuranceDomainModule } from '../src/core/domains/InsuranceDomainModule';
import { EvidenceIndex, SourceManifest, MatterClassification } from '../src/core/models';

const classification: MatterClassification = {
  id: 'm1',
  domain: 'insurance',
  jurisdiction: 'Ontario',
  parties: { claimantType: 'individual', respondentType: 'business' }
};

const evidenceIndex: EvidenceIndex = {
  items: [
    {
      id: 'ev1',
      filename: 'claim_email.eml',
      type: 'EML',
      date: '2025-01-01',
      summary: 'Notice of claim',
      provenance: 'user-provided',
      hash: 'hash1',
      credibilityScore: 0.7
    }
  ],
  generatedAt: '2025-01-02',
  sourceManifest: { sources: [] }
};

const sourceManifest: SourceManifest = {
  entries: [
    {
      service: 'CanLII',
      url: 'https://www.canlii.org/en/on/laws/stat/insurance-act/',
      retrievalDate: '2025-01-02'
    }
  ],
  compiledAt: '2025-01-02'
};

describe('InsuranceDomainModule', () => {
  it('generates drafts and package', () => {
    const module = new InsuranceDomainModule();
    const result = module.generate({
      classification,
      forumMap: 'Forum map content',
      timeline: 'Timeline content',
      missingEvidence: 'Missing evidence content',
      evidenceIndex,
      sourceManifest
    });

    expect(result.drafts.length).toBe(4);
    expect(result.package.files.some((f) => f.path.startsWith('drafts/'))).toBe(true);
    expect(result.package.evidenceManifest.items.length).toBeGreaterThan(0);
  });
});
