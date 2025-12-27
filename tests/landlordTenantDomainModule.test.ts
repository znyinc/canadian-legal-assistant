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

    expect(result.drafts.length).toBe(6); // Checklist, Notice, Evidence Pack + T1, T2, T6
    expect(result.package.files.some((f) => f.path.startsWith('drafts/'))).toBe(true);
    expect(result.package.sourceManifest.entries.length).toBeGreaterThan(0);
  });

  it('generates enhanced T1 application with filing guidance', () => {
    const module = new LandlordTenantDomainModule();
    const result = module.generate({
      classification,
      forumMap: 'Forum map content',
      timeline: 'Timeline content',
      missingEvidence: 'Missing evidence content',
      evidenceIndex,
      sourceManifest
    });

    const t1Draft = result.drafts.find((d) => d.title.includes('T1'));
    expect(t1Draft).toBeDefined();
    expect(t1Draft!.sections.some((s) => s.heading === 'When to Use Form T1')).toBe(true);
    expect(t1Draft!.sections.some((s) => s.heading === 'Service Requirements')).toBe(true);
    expect(t1Draft!.sections.some((s) => s.content.includes('Filing Deadline'))).toBe(true);
  });

  it('generates enhanced T2 application with harassment guidance', () => {
    const module = new LandlordTenantDomainModule();
    const result = module.generate({
      classification,
      forumMap: 'Forum map content',
      timeline: 'Timeline content',
      missingEvidence: 'Missing evidence content',
      evidenceIndex,
      sourceManifest
    });

    const t2Draft = result.drafts.find((d) => d.title.includes('T2'));
    expect(t2Draft).toBeDefined();
    expect(t2Draft!.sections.some((s) => s.content.includes('harassment'))).toBe(true);
    expect(t2Draft!.sections.some((s) => s.content.includes('Medical records'))).toBe(true);
    expect(t2Draft!.sections.some((s) => s.content.includes('Pattern of behavior'))).toBe(true);
  });

  it('generates enhanced T6 application with maintenance guidance', () => {
    const module = new LandlordTenantDomainModule();
    const result = module.generate({
      classification,
      forumMap: 'Forum map content',
      timeline: 'Timeline content',
      missingEvidence: 'Missing evidence content',
      evidenceIndex,
      sourceManifest
    });

    const t6Draft = result.drafts.find((d) => d.title.includes('T6'));
    expect(t6Draft).toBeDefined();
    expect(t6Draft!.sections.some((s) => s.heading === 'BEFORE Filing T6')).toBe(true);
    expect(t6Draft!.sections.some((s) => s.content.includes('Municipal inspection'))).toBe(true);
    expect(t6Draft!.sections.some((s) => s.heading === 'Remedies You Can Request')).toBe(true);
    expect(t6Draft!.sections.some((s) => s.content.includes('rent abatement'))).toBe(true);
  });
});
