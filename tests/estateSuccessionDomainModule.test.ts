import { describe, it, expect } from 'vitest';
import { EstateSuccessionDomainModule } from '../src/core/domains/EstateSuccessionDomainModule';
import { MatterClassification, ForumMap, EvidenceIndex, EvidenceManifest, SourceManifest } from '../src/core/models';

const mockManifest: SourceManifest = { entries: [], compiledAt: new Date().toISOString() };
const mockEvidenceManifest: EvidenceManifest = { items: [], compiledAt: new Date().toISOString() };

const mockEvidenceIndex: EvidenceIndex = {
  items: [],
  generatedAt: new Date().toISOString(),
  sourceManifest: mockManifest
};

const forumMap: ForumMap = {
  domain: 'estateSuccession',
  primaryForum: { id: 'ON-SC-Probate', name: 'Superior Court of Justice (Probate)', type: 'court', jurisdiction: 'Ontario' },
  alternatives: [],
  escalation: [],
  rationale: 'Estate matters proceed in Superior Court (probate).'
};

describe('EstateSuccessionDomainModule', () => {
  const module = new EstateSuccessionDomainModule();

  const classification: MatterClassification = {
    id: 'estate-1',
    domain: 'estateSuccession',
    jurisdiction: 'Ontario',
    parties: { claimantType: 'individual', respondentType: 'individual', names: ['Alex Applicant', 'Taylor Trustee'] },
    timeline: { start: '2025-01-05' },
    status: 'classified',
    notes: ['Court file 123/25', 'Estate dispute about accounting'],
  };

  it('generates four estate/succession drafts', () => {
    const result = module.generate({
      classification,
      forumMap,
      timeline: '[]',
      missingEvidence: '',
      evidenceIndex: mockEvidenceIndex,
      sourceManifest: mockManifest,
      evidenceManifest: mockEvidenceManifest,
      packageName: 'estate-package'
    });

    expect(result.drafts).toHaveLength(4);
    const titles = result.drafts.map((d) => d.title);
    expect(titles.some((t) => t.includes('Will Challenge'))).toBe(true);
    expect(titles.some((t) => t.includes('Probate'))).toBe(true);
    expect(titles.some((t) => t.includes('Estate Dispute'))).toBe(true);
    expect(titles.some((t) => t.includes('Dependant Support'))).toBe(true);
  });

  it('includes missing confirmation warnings for filing steps', () => {
    const result = module.generate({
      classification,
      forumMap,
      timeline: '[]',
      missingEvidence: '',
      evidenceIndex: mockEvidenceIndex,
      sourceManifest: mockManifest,
      evidenceManifest: mockEvidenceManifest,
      packageName: 'estate-package'
    });

    const warnings = result.warnings || [];
    expect(warnings.some((w) => w.toLowerCase().includes('confirm factual basis'))).toBe(true);
  });
});
