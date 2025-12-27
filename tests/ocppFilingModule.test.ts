import { describe, it, expect } from 'vitest';
import { OCPPFilingModule } from '../src/core/domains/OCPPFilingModule';
import { EvidenceIndex, SourceManifest, MatterClassification } from '../src/core/models';

const classification: MatterClassification = {
  id: 'm3',
  domain: 'ocppFiling',
  jurisdiction: 'Ontario',
  parties: { claimantType: 'individual', respondentType: 'individual' }
};

const evidenceIndex: EvidenceIndex = {
  items: [
    {
      id: 'ev1',
      filename: 'court_documents.pdf',
      type: 'PDF',
      date: '2025-01-15',
      summary: 'Related court documents',
      provenance: 'user-provided',
      hash: 'hash1',
      credibilityScore: 0.9
    }
  ],
  generatedAt: '2025-01-16',
  sourceManifest: { entries: [] }
};

const sourceManifest: SourceManifest = {
  entries: [
    {
      service: 'Ontario Superior Court',
      url: 'https://www.ontariocourtofappeals.ca/',
      retrievalDate: '2025-01-16'
    }
  ],
  compiledAt: '2025-01-16'
};

describe('OCPPFilingModule', () => {
  it('detects OCPP-related classifications', () => {
    const module = new OCPPFilingModule();
    expect(module.domain).toBe('ocppFiling');
  });

  it('generates 5 OCPP-specific drafts', () => {
    const module = new OCPPFilingModule();
    const result = module.generate({
      classification,
      forumMap: 'Superior Court process',
      timeline: 'Consolidation timeline',
      missingEvidence: 'No missing evidence',
      evidenceIndex,
      sourceManifest
    });

    expect(result.drafts.length).toBe(5);
    expect(result.drafts[0].title).toContain('OCPP');
    expect(result.drafts[1].title).toContain('Consolidation/Amendment');
    expect(result.drafts[2].title).toContain('Expert Affidavit');
    expect(result.drafts[3].title).toContain('Cross-Examination');
    expect(result.drafts[4].title).toContain('Interlocutory');
  });

  it('includes Superior Court guidance in main draft', () => {
    const module = new OCPPFilingModule();
    const result = module.generate({
      classification,
      forumMap: 'Superior Court process',
      timeline: 'Consolidation timeline',
      missingEvidence: 'No missing evidence',
      evidenceIndex,
      sourceManifest
    });

    const mainDraft = result.drafts[0];
    expect(mainDraft.sections.some((s) => s.heading === 'What is OCPP?')).toBe(true);
    expect(mainDraft.sections.some((s) => s.content.includes('Consolidation'))).toBe(true);
    expect(mainDraft.title).toContain('OCPP');
  });

  it('provides PDF/A format requirements in consolidation draft', () => {
    const module = new OCPPFilingModule();
    const result = module.generate({
      classification,
      forumMap: 'Superior Court process',
      timeline: 'Consolidation timeline',
      missingEvidence: 'No missing evidence',
      evidenceIndex,
      sourceManifest
    });

    const consolidationDraft = result.drafts[1];
    expect(consolidationDraft.sections.some((s) => s.heading === 'PDF/A Format Requirement')).toBe(true);
    expect(consolidationDraft.sections.some((s) => s.content.includes('PDF/A-1b'))).toBe(true);
  });

  it('includes expert affidavit qualification requirements', () => {
    const module = new OCPPFilingModule();
    const result = module.generate({
      classification,
      forumMap: 'Superior Court process',
      timeline: 'Consolidation timeline',
      missingEvidence: 'No missing evidence',
      evidenceIndex,
      sourceManifest
    });

    const expertDraft = result.drafts[2];
    expect(expertDraft.sections.some((s) => s.heading === 'Expert Qualification Requirements (R.53 Ontario Superior Court Civil Rules)')).toBe(true);
    expect(expertDraft.sections.some((s) => s.content.includes('5–10 years'))).toBe(true);
  });

  it('provides cross-examination preparation guidance', () => {
    const module = new OCPPFilingModule();
    const result = module.generate({
      classification,
      forumMap: 'Superior Court process',
      timeline: 'Consolidation timeline',
      missingEvidence: 'No missing evidence',
      evidenceIndex,
      sourceManifest
    });

    const crossExamDraft = result.drafts[3];
    expect(crossExamDraft.sections.some((s) => s.heading === 'Preparing Witnesses for Cross-Examination')).toBe(true);
    expect(crossExamDraft.sections.some((s) => s.content.includes('Mock Cross-Examination'))).toBe(true);
  });

  it('includes interlocutory motion procedures and timeline', () => {
    const module = new OCPPFilingModule();
    const result = module.generate({
      classification,
      forumMap: 'Superior Court process',
      timeline: 'Consolidation timeline',
      missingEvidence: 'No missing evidence',
      evidenceIndex,
      sourceManifest
    });

    const interlocDraft = result.drafts[4];
    expect(interlocDraft.title).toContain('Interlocutory');
    expect(interlocDraft.sections.some((s) => s.content.includes('Interlocutory'))).toBe(true);
    expect(interlocDraft.sections.some((s) => s.heading === 'What Are Interlocutory Motions?')).toBe(true);
  });

  it('assembles package with OCPP documents', () => {
    const module = new OCPPFilingModule();
    const result = module.generate({
      classification,
      forumMap: 'Superior Court process',
      timeline: 'Consolidation timeline',
      missingEvidence: 'No missing evidence',
      evidenceIndex,
      sourceManifest
    });

    expect(result.package.files.length).toBeGreaterThan(0);
    expect(result.drafts.length).toBe(5);
    expect(result.drafts.some((d) => d.title.includes('OCPP'))).toBe(true);
  });
});
